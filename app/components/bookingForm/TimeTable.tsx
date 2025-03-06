import prisma from "@/app/lib/db";
import { nylas } from "@/app/lib/nylas";
import { Button } from "@/components/ui/button";
import { Prisma } from "@prisma/client";
import {
  addMinutes,
  endOfDay,
  format,
  fromUnixTime,
  isAfter,
  isBefore,
  parse,
  startOfDay,
} from "date-fns";
import Link from "next/link";
import { GetFreeBusyResponse, NylasResponse } from "nylas";

interface timeTableProps {
  selectedDate: Date;
  userName: string;
}

function calculateAvailableTimeSlots(
    dbAvailability: {
      fromTime: string | undefined;
      tillTime: string | undefined;
    },
    nylasData: NylasResponse<GetFreeBusyResponse[]>,
    date: string,
    duration: number
  ) {
    const now = new Date(); // Get the current time
  
    // Convert DB availability to Date objects
    const availableFrom = parse(
      `${date} ${dbAvailability.fromTime}`,
      "yyyy-MM-dd HH:mm",
      new Date()
    );
    const availableTill = parse(
      `${date} ${dbAvailability.tillTime}`,
      "yyyy-MM-dd HH:mm",
      new Date()
    );
  
    // Extract busy slots from Nylas data
    const busySlots = nylasData.data[0].timeSlots.map((slot: any) => ({
      start: fromUnixTime(slot.startTime),
      end: fromUnixTime(slot.endTime),
    }));
  
    // Generate all possible 30-minute slots within the available time
    const allSlots = [];
    let currentSlot = availableFrom;
    while (isBefore(currentSlot, availableTill)) {
      allSlots.push(currentSlot);
      currentSlot = addMinutes(currentSlot, duration);
    }
  
    // Filter out busy slots and slots before the current time
    const freeSlots = allSlots.filter((slot) => {
      const slotEnd = addMinutes(slot, duration);
      return (
        isAfter(slot, now) && // Ensure the slot is after the current time
        !busySlots.some(
          (busy: { start: any; end: any }) =>
            (!isBefore(slot, busy.start) && isBefore(slot, busy.end)) ||
            (isAfter(slotEnd, busy.start) && !isAfter(slotEnd, busy.end)) ||
            (isBefore(slot, busy.start) && isAfter(slotEnd, busy.end))
        )
      );
    });
  
    // Format the free slots
    return freeSlots.map((slot) => format(slot, "HH:mm"));
  }

async function getData(userName: string, selectedDate: Date) {
  const currentDay = format(selectedDate, "EEEE");
  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const data = await prisma.availability.findFirst({
    where: {
      day: currentDay as Prisma.EnumDayFilter,
      User: {
        userName: userName,
      },
    },
    select: {
      fromTime: true,
      tillTime: true,
      id: true,
      User: {
        select: {
          grantEmail: true,
          grantId: true,
        },
      },
    },
  });

  const nylasCalendarData = await nylas.calendars.getFreeBusy({
    identifier: data?.User.grantId as string,
    requestBody: {
      startTime: Math.floor(startOfDay.getTime() / 1000),
      endTime: Math.floor(endOfDay.getTime() / 1000),
      emails: [data?.User?.grantEmail as string],
    },
  });

  return { data, nylasCalendarData };
}

export async function TimeTable({ selectedDate, userName }: timeTableProps) {
  const { data, nylasCalendarData } = await getData(userName, selectedDate);

  const formattedDate = format(selectedDate, "yyyy-MM-dd");
  const dbAvailability = {
    fromTime: data?.fromTime,
    tillTime: data?.tillTime,
  };

  const availableSlots = calculateAvailableTimeSlots(
    dbAvailability,
    nylasCalendarData,
    formattedDate,
    30
  );

//   console.log("Date:", formattedDate);
//   console.log("DB Availability:", dbAvailability);
//   console.log("Nylas data:", nylasCalendarData.data[0].timeSlots);
//   console.log("Available slots:", availableSlots);

return (
    <div>
      <p className="text-base font-semibold">
        {format(selectedDate, "EEE")}.{" "} 
        <span className="text-sm text-muted-foreground">
          {format(selectedDate, "MMM. d")}
        </span>
      </p>

      <div className="mt-3 max-h-[350px] overflow-y-auto">
        {availableSlots.length > 0 ? (
          availableSlots.map((slot, index) => (
            <Link
              key={index}
              href={`?date=${format(selectedDate, "yyyy-MM-dd")}&time=${slot}`}
            >
              <Button variant="outline" className="w-full mb-2">
                {slot}
              </Button>
            </Link>
          ))
        ) : (
          <p>No available time slots for this date.</p>
        )}
      </div>
    </div>
  );
}
