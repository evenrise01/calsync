"use server"; // Mark this file as a Server Component that can contain server-side actions

import prisma from "./lib/db";
import { requireUser } from "./lib/hooks";
import { parseWithZod } from "@conform-to/zod";
import {
  aboutSettingsSchema,
  eventTypeSchema,
  onboardingSchema,
  onboardingSchemaValidation,
} from "./lib/zodSchemas";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { nylas } from "./lib/nylas";

/**
 * Handles the onboarding form submission
 * Validates user input and creates default availability settings
 * @param prevState Previous form state
 * @param FormData Form data from the submission
 * @returns Validation errors or redirects to next onboarding step
 */
export async function OnboardingAction(prevState: any, FormData: FormData) {
  // Get current user session
  const session = await requireUser();

  // Validate form data using Zod schema with custom username uniqueness check
  const submission = await parseWithZod(FormData, {
    schema: onboardingSchemaValidation({
      async isUsernameUnique() {
        // Check if username already exists in database
        const existingUsername = await prisma.user.findUnique({
          where: {
            userName: FormData.get("username") as string,
          },
        });
        return !existingUsername; // Return true if username is unique
      },
    }),
    async: true,
  });

  // Return validation errors if submission failed
  if (submission.status !== "success") {
    return submission.reply();
  }

  // Update user record with form data and create default availability
  const data = await prisma.user.update({
    where: {
      id: session.user?.id,
    },
    data: {
      userName: submission.value.username,
      name: submission.value.fullName,
      // Create default availability for all days of the week
      Availability: {
        createMany: {
          data: [
            {
              day: "Monday",
              fromTime: "08:00",
              tillTime: "18:00",
            },
            {
              day: "Tuesday",
              fromTime: "08:00",
              tillTime: "18:00",
            },
            {
              day: "Wednesday",
              fromTime: "08:00",
              tillTime: "18:00",
            },
            {
              day: "Thursday",
              fromTime: "08:00",
              tillTime: "18:00",
            },
            {
              day: "Friday",
              fromTime: "08:00",
              tillTime: "18:00",
            },
            {
              day: "Saturday",
              fromTime: "08:00",
              tillTime: "18:00",
            },
            {
              day: "Sunday",
              fromTime: "08:00",
              tillTime: "18:00",
            },
          ],
        },
      },
    },
  });

  // After successful onboarding, redirect to the next step
  return redirect("/onboarding/grant-id");
}

/**
 * Handles user profile settings updates
 * @param prevState Previous form state
 * @param formData Form data from the submission
 * @returns Validation errors or redirects to dashboard
 */
export async function SettingsAction(prevState: any, formData: FormData) {
  // Get current user session
  const session = await requireUser();

  // Validate form data
  const submission = parseWithZod(formData, {
    schema: aboutSettingsSchema,
  });

  // Return validation errors if submission failed
  if (submission.status !== "success") {
    return submission.reply();
  }

  // Update user profile information
  const user = await prisma.user.update({
    where: {
      id: session.user?.id as string,
    },
    data: {
      name: submission.value.fullName,
      image: submission.value.profileImage,
    },
  });

  // Redirect to dashboard after successful update
  return redirect("/dashboard");
}

/**
 * Updates user availability settings
 * @param formData Form data containing availability information
 */
export async function updateAvailabilityAction(
  formData: FormData
): Promise<void> {
  // Get current user session
  const session = await requireUser();

  // Convert form data into a plain JavaScript object
  const rawData = Object.fromEntries(formData.entries());

  // Parse availability data from form
  // Each availability record has id, isActive status, and time range
  const availabilityData = Object.keys(rawData)
    .filter((key) => key.startsWith("id-")) // Find all keys that start with "id-"
    .map((key) => {
      const id = key.replace("id-", ""); // Extract the ID

      // Create availability object with all related fields
      return {
        id,
        isActive: rawData[`isActive-${id}`] === "on", // Convert checkbox value to boolean
        fromTime: rawData[`fromTime-${id}`] as string,
        tillTime: rawData[`tillTime-${id}`] as string,
      };
    });

  try {
    await prisma.$transaction(
      availabilityData.map((item) =>
        prisma.availability.update({
          where: {
            id: item.id,
          },
          data: {
            isActive: item.isActive,
            fromTime: item.fromTime,
            tillTime: item.tillTime,
          },
        })
      )
    );

    revalidatePath("/dashboard/availability");
  } catch (error) {
    console.error("Error updating availability:", error);
  }
}

export async function CreateEventTypeAction(
  prevState: any,
  formData: FormData
) {
  const session = await requireUser();

  const submission = parseWithZod(formData, {
    schema: eventTypeSchema,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  await prisma.eventType.create({
    data: {
      title: submission.value.title,
      duration: submission.value.duration,
      url: submission.value.url,
      description: submission.value.description,
      videoCallSoftware: submission.value.videoCallSoftware,
      userId: session.user?.id as string,
    },
  });

  return redirect("/dashboard");
}

export async function createMeetingAction(formData: FormData) {
  const getUserData = await prisma.user.findUnique({
    where: {
      userName: formData.get("username") as string,
    },
    select: {
      grantEmail: true,
      grantId: true,
    },
  });

  if (!getUserData) {
    throw new Error("User not found");
  }

  const eventTypeData = await prisma.eventType.findUnique({
    where: {
      id: formData.get("eventTypeId") as string,
    },
    select: {
      title: true,
      description: true,
    },
  });

  const fromTime = formData.get("fromTime") as string;
  const eventDate = formData.get("eventDate") as string;
  const meetingLength = Number(formData.get("meetingLength"));

  const startDateTime = new Date(`${eventDate}T${fromTime}:00`);
  const endDateTime = new Date(startDateTime.getTime() + meetingLength * 60000);

  const provider = formData.get("provider") as string;

  await nylas.events.create({
    identifier: getUserData.grantId as string,
    requestBody: {
      title: eventTypeData?.title,
      description: eventTypeData?.description,
      when: {
        startTime: Math.floor(startDateTime.getTime() / 1000),
        endTime: Math.floor(endDateTime.getTime() / 1000),
      },
      conferencing: {
        autocreate: {},
        provider: provider as any,
      },
      participants: [
        {
          name: formData.get("name") as string,
          email: formData.get("email") as string,
          status: "yes",
        },
      ],
    },
    queryParams: {
      calendarId: getUserData.grantEmail as string,
      notifyParticipants: true,
    },
  });

  return redirect("/success")
}

export async function cancelMeetingAction(fomrData: FormData){
  const session  = await requireUser()

  const userData = await prisma.user.findUnique({
    where: {
      id: session.user?.id,
    },
    select: {
      grantEmail: true,
      grantId: true,
    },
  });

  if(!userData){
    throw new Error("User not found");
  }

  const data = await nylas.events.destroy({
    eventId: fomrData.get("eventId") as string,
    identifier: userData.grantId as string,
    queryParams: {
      calendarId: userData.grantEmail as string
    }
  })

  revalidatePath("/dashboard/meetings");
}