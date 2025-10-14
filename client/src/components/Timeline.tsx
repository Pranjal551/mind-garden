import { formatIST } from "../utils/time";
import type { HistoryItem } from "../types";

interface TimelineProps {
  history: HistoryItem[];
  limit?: number;
}

const eventIcons = {
  SOS_NEW: "fas fa-exclamation-triangle",
  AMB_ACK: "fas fa-check",
  AMB_ENROUTE: "fas fa-route",
  AMB_ARRIVED: "fas fa-map-marker-alt",
  HOSP_PREP: "fas fa-hospital",
};

const eventColors = {
  SOS_NEW: "bg-red-100 text-red-600",
  AMB_ACK: "bg-amber-100 text-amber-600",
  AMB_ENROUTE: "bg-sky-100 text-sky-600",
  AMB_ARRIVED: "bg-green-100 text-green-600",
  HOSP_PREP: "bg-purple-100 text-purple-600",
};

const eventTitles = {
  SOS_NEW: "Emergency Alert Sent",
  AMB_ACK: "Emergency Acknowledged",
  AMB_ENROUTE: "Ambulance En Route",
  AMB_ARRIVED: "Ambulance Arrived",
  HOSP_PREP: "Hospital Prep Started",
};

export function Timeline({ history, limit }: TimelineProps) {
  const items = limit ? history.slice(-limit) : history;

  if (items.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-sm py-8">
        <i className="fas fa-clock mr-1"></i>
        No activity yet
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="timeline">
      {items.map((item, index) => (
        <div 
          key={`${item.ts}-${index}`} 
          className="timeline-item relative pl-10 pb-4 last:pb-0"
          data-testid={`timeline-item-${item.type.toLowerCase()}`}
        >
          <div className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center ${eventColors[item.type]}`}>
            <i className={`${eventIcons[item.type]} text-sm`}></i>
          </div>
          <div>
            <p className="font-medium text-foreground" data-testid={`timeline-title-${index}`}>
              {eventTitles[item.type]}
            </p>
            <p className="text-sm text-muted-foreground" data-testid={`timeline-time-${index}`}>
              {formatIST(item.ts)} - {item.note || ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
