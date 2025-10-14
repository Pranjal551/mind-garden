import { cn } from "@/lib/utils";
import type { Status } from "../types";

interface StatusChipProps {
  status: Status;
  className?: string;
}

const statusConfig = {
  NEW: { label: "NEW", className: "bg-red-600 text-white" },
  ACK: { label: "ACK", className: "bg-amber-500 text-white" },
  ENROUTE: { label: "EN ROUTE", className: "bg-sky-600 text-white" },
  ARRIVED: { label: "ARRIVED", className: "bg-green-600 text-white" },
};

export function StatusChip({ status, className }: StatusChipProps) {
  if (!status) return null;

  const config = statusConfig[status];
  
  return (
    <span 
      className={cn("px-3 py-1 rounded-full text-sm font-medium", config.className, className)}
      data-testid={`status-${status.toLowerCase()}`}
    >
      {config.label}
    </span>
  );
}
