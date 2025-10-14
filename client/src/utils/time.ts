import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

export function formatIST(ts: string | Date): string {
  return dayjs(ts).tz("Asia/Kolkata").format("h:mm A");
}

export function formatISTFull(ts: string | Date): string {
  return dayjs(ts).tz("Asia/Kolkata").format("MMM D, h:mm A");
}

export function nowISO(): string {
  return dayjs().toISOString();
}
