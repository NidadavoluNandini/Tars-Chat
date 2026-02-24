import { format, isThisYear, isToday } from "date-fns";

export function formatChatTimestamp(timestamp: number) {
  const date = new Date(timestamp);

  if (isToday(date)) {
    return format(date, "p");
  }

  if (isThisYear(date)) {
    return format(date, "MMM d, p");
  }

  return format(date, "MMM d, yyyy, p");
}
