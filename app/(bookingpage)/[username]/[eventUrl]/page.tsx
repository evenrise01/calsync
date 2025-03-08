import { createMeetingAction } from "@/app/actions";
import { SubmitButton } from "@/app/components/SubmitButtons";
import { RenderCalendar } from "@/app/components/bookingForm/RenderCalendar";
import { TimeTable } from "@/app/components/bookingForm/TimeTable";
import prisma from "@/app/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CalendarX2, Clock, VideoIcon } from "lucide-react";
import { notFound } from "next/navigation";

async function getData(eventUrl: string, userName: string) {
  const data = await prisma.eventType.findFirst({
    where: {
      url: eventUrl,
      user: {
        userName: userName,
      },
      active: true,
    },
    select: {
      id: true,
      description: true,
      title: true,
      duration: true,
      videoCallSoftware: true,
      user: {
        select: {
          image: true,
          name: true,
          Availability: {
            select: {
              day: true,
              isActive: true,
            },
          },
        },
      },
    },
  });

  if (!data) {
    return notFound();
  }

  return data;
}

export default async function BookingFormRoute({
  params,
  searchParams,
}: {
  params: Promise<{ username: string; eventUrl: string }>;
  searchParams: Promise<{ date?: string; time?: string }>; // Updated to Promise
}) {
  // Await both params and searchParams
  const { username, eventUrl } = await params;
  const resolvedSearchParams = await searchParams;
  const data = await getData(eventUrl, username);

  const selectedDate = resolvedSearchParams.date
    ? new Date(resolvedSearchParams.date)
    : new Date();

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(selectedDate);

  const showForm = !!(await searchParams).date && !!(await searchParams).time;

  return (
    <div className="min-h-screen w-screen flex items-center justify-center">
      {showForm ? (
        <Card className="max-w-[600px] w-full mx-auto">
          <CardContent className="p-5 md:grid md:grid-cols-[1fr,auto,1fr] gap-4">
            <div>
              <img
                src={data.user?.image as string}
                alt="User profile image"
                className="size-10 rounded-full"
              />
              <p className="text-sm font-medium text-muted-foreground mt-1">
                {data.user?.name}
              </p>
              <h1 className="text-xl font-semibold mt-2">{data.title}</h1>
              <p className="text-sm font-medium text-muted-foreground">
                {data.description}
              </p>
              <div className="mt-5 flex flex-col gap-y-3">
                <p className="flex items-center">
                  <CalendarX2 className="mr-2 text-primary size-4" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {formattedDate.toString()}
                  </span>
                </p>
                <p className="flex items-center">
                  <Clock className="mr-2 text-primary size-4" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {data.duration} Minutes
                  </span>
                </p>
                <p className="flex items-center">
                  <VideoIcon className="mr-2 text-primary size-4" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {data.videoCallSoftware}
                  </span>
                </p>
              </div>
            </div>
            <Separator orientation="vertical" className="h-full w-[1px] mx-2" />

            <form
              className="flex flex-col gap-y-4"
              action={createMeetingAction}
            >
              <input
                type="hidden"
                name="fromTime"
                value={(await searchParams).time}
              />
              <input
                type="hidden"
                name="eventDate"
                value={(await searchParams).date}
              />
              <input type="hidden" name="meetingLength" value={data.duration} />
              <input
                type="hidden"
                name="provider"
                value={data.videoCallSoftware}
              />

              <input
                type="hidden"
                name="username"
                value={(await params).username}
              />

              <input type="hidden" name="eventTypeId" value={data.id} />

              <div className="flex flex-col gap-y-2">
                <Label>Your Name</Label>
                <Input name="name" placeholder="Your name" />
              </div>
              <div className="flex flex-col gap-y-2">
                <Label>Your email</Label>
                <Input name="email" placeholder="johndoe@example.com" />
              </div>
              <SubmitButton className="w-full mt-5" text="Book Meeting" />
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-[1000px] w-full mx-auto">
          <CardContent className="p-5 md:grid md:grid-cols-[1fr,auto,1fr,auto,1fr] gap-4">
            <div>
              <img
                src={data.user?.image as string}
                alt="User profile image"
                className="size-10 rounded-full"
              />
              <p className="text-sm font-medium text-muted-foreground mt-1">
                {data.user?.name}
              </p>
              <h1 className="text-xl font-semibold mt-2">{data.title}</h1>
              <p className="text-sm font-medium text-muted-foreground">
                {data.description}
              </p>
              <div className="mt-5 flex flex-col gap-y-3">
                <p className="flex items-center">
                  <CalendarX2 className="mr-2 text-primary size-4" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {formattedDate.toString()}
                  </span>
                </p>
                <p className="flex items-center">
                  <Clock className="mr-2 text-primary size-4" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {data.duration} Minutes
                  </span>
                </p>
                <p className="flex items-center">
                  <VideoIcon className="mr-2 text-primary size-4" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {data.videoCallSoftware}
                  </span>
                </p>
              </div>
            </div>
            <Separator orientation="vertical" className="h-full w-[1px] mx-2" />
            <RenderCalendar daysofWeek={data.user?.Availability as any} />
            <Separator orientation="vertical" className="h-full w-[1px] mx-2" />
            <TimeTable
              selectedDate={selectedDate}
              userName={(await params).username}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
