"use server"; // Mark this file as a Server Component that can contain server-side actions

import prisma from "./lib/db";
import { requireUser } from "./lib/hooks";
import { parseWithZod } from "@conform-to/zod";
import {
  aboutSettingsSchema,
  onboardingSchema,
  onboardingSchemaValidation,
} from "./lib/zodSchemas";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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
export async function SettingsAction(prevState: any, formData: FormData)  {
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
export async function updateAvailabilityAction(formData: FormData) : Promise<void> {
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
