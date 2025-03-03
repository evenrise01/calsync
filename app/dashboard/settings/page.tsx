import { SettingsForm } from "@/app/components/SettingsForms";
import prisma from "@/app/lib/db";
import { requireUser } from "@/app/lib/hooks";
import { notFound } from "next/navigation";

async function getData(id: string) {
  const data = await prisma.user.findUnique({
    where: {
      id: id,
    },
    select: {
      name: true,
      email: true,
      image: true,
    },
  });

  if (!data) {
    return notFound();
  }

  return data;
}

export default async function Settingsroute() {
  const session = await requireUser();
  const data = await getData(session.user?.id as string);

  return (
    <SettingsForm
      fullName={data.name as string}
      email={data.email}
      profileImage={data.image as string}
    />
  );
}
