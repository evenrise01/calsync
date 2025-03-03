"use server";

import prisma from "./lib/db";
import { requireUser } from "./lib/hooks";
import { parseWithZod } from "@conform-to/zod";
import { aboutSettingsSchema, onboardingSchema, onboardingSchemaValidation } from "./lib/zodSchemas";
import { redirect } from "next/navigation";

export async function OnboardingAction(prevState: any, FormData: FormData) {
  const session = await requireUser();
  const submission = await parseWithZod(FormData, {
    schema: onboardingSchemaValidation({
      async isUsernameUnique() {
        const existingUsername = await prisma.user.findUnique({
          where: {
            userName: FormData.get("username") as string,
          },
        });
        return !existingUsername;
      },
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }
  const data = await prisma.user.update({
    where: {
      id: session.user?.id,
    },
    data: {
      userName: submission.value.username,
      name: submission.value.fullName,
    },
  });

  //After the user has registered a username, redirect to nylas onboarding
  return redirect("/onboarding/grant-id")
}


export async function SettingsAction(prevState: any, formData: FormData) {
  const session = await requireUser();

  const submission = parseWithZod(formData, {
    schema: aboutSettingsSchema,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const user = await prisma.user.update({
    where: {
      id: session.user?.id as string,
    },
    data: {
      name: submission.value.fullName,
      image: submission.value.profileImage,
    },
  });

  return redirect("/dashboard");
}