import { EditEventForm } from "@/app/components/EditEventTypeForm";
import prisma from "@/app/lib/db";
import { notFound } from "next/navigation";

async function getData(eventTypeId: string) {
  const data = await prisma.eventType.findUnique({
    where: {
      id: eventTypeId,
    },
    select: {
      title: true,
      url: true,
      id: true,
      videoCallSoftware: true,
      duration: true,
      description: true,
    },
  });

  if (!data) {
    return notFound();
  }

  return data;
}

export default async function editRoute({
  params,
}: {
  params: { eventTypeId: string };
}) {
  const data = await getData(params.eventTypeId);

  return (
    <EditEventForm
      callProvider={data.videoCallSoftware}
      description={data.description}
      url={data.url}
      title={data.title}
      duration={data.duration}
      id = {data.id}
    />
  );
}
