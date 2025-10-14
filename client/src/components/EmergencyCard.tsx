import { Clock, MapPin, User, AlertTriangle, Hospital, Activity } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EnhancedEmergency } from "../store/multi-emergency-store";
import { formatDistanceToNow } from "date-fns";

interface EmergencyCardProps {
  emergency: EnhancedEmergency;
  onSelect?: () => void;
  onAcknowledge?: () => void;
  onEnroute?: () => void;
  onArrived?: () => void;
  onPrepare?: () => void;
  showActions?: boolean;
  isSelected?: boolean;
}

const statusConfig = {
  active: { label: 'Active', color: 'bg-red-500 text-white', icon: AlertTriangle },
  assigned: { label: 'Assigned', color: 'bg-orange-500 text-white', icon: Clock },
  enroute: { label: 'En Route', color: 'bg-blue-500 text-white', icon: Activity },
  arrived: { label: 'Arrived', color: 'bg-green-500 text-white', icon: MapPin },
  completed: { label: 'Completed', color: 'bg-gray-500 text-white', icon: Hospital },
  cancelled: { label: 'Cancelled', color: 'bg-gray-400 text-white', icon: AlertTriangle },
};

const triageConfig = {
  red: { label: 'Critical', color: 'bg-red-100 text-red-800 border-red-200' },
  yellow: { label: 'Urgent', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  green: { label: 'Stable', color: 'bg-green-100 text-green-800 border-green-200' },
};

export function EmergencyCard({ 
  emergency, 
  onSelect, 
  onAcknowledge, 
  onEnroute, 
  onArrived, 
  onPrepare,
  showActions = false,
  isSelected = false 
}: EmergencyCardProps) {
  const StatusIcon = statusConfig[emergency.status].icon;
  const timeAgo = formatDistanceToNow(new Date(emergency.createdAt), { addSuffix: true });
  
  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-lg cursor-pointer ${
        isSelected ? 'ring-2 ring-blue-500 shadow-md' : ''
      } ${emergency.duplicateOf ? 'border-orange-200 bg-orange-50' : ''}`}
      onClick={onSelect}
      data-testid={`emergency-card-${emergency.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <StatusIcon className="w-5 h-5 text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-sm" data-testid="emergency-type">
                {emergency.type}
              </h3>
              <p className="text-xs text-muted-foreground" data-testid="emergency-time">
                {timeAgo}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-1">
            <Badge 
              className={`text-xs ${statusConfig[emergency.status].color}`}
              data-testid="emergency-status"
            >
              {statusConfig[emergency.status].label}
            </Badge>
            <Badge 
              variant="outline" 
              className={`text-xs ${triageConfig[emergency.triageLevel].color}`}
              data-testid="triage-level"
            >
              {triageConfig[emergency.triageLevel].label} ({emergency.triageScore})
            </Badge>
          </div>
        </div>
        
        {emergency.duplicateOf && (
          <div className="mt-2 p-2 bg-orange-100 border border-orange-200 rounded text-xs text-orange-800">
            ⚠️ Potential duplicate of existing emergency
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Patient Info */}
          <div className="flex items-center space-x-2 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <span data-testid="patient-info">
              {emergency.patient.name} ({emergency.patient.age}y, {emergency.patient.blood})
            </span>
          </div>
          
          {/* Location */}
          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="truncate" data-testid="emergency-location">
              {emergency.location.address || `${emergency.location.lat}, ${emergency.location.lon}`}
            </span>
          </div>
          
          {/* Assigned Hospital */}
          {emergency.assignedHospital && (
            <div className="flex items-center space-x-2 text-sm">
              <Hospital className="w-4 h-4 text-muted-foreground" />
              <span data-testid="assigned-hospital">
                {emergency.assignedHospital.name} (ETA: {emergency.assignedHospital.eta}m)
              </span>
            </div>
          )}
          
          {/* Needs */}
          {emergency.needs.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {emergency.needs.slice(0, 3).map((need) => (
                <Badge 
                  key={need} 
                  variant="secondary" 
                  className="text-xs"
                  data-testid={`need-${need.toLowerCase()}`}
                >
                  {need}
                </Badge>
              ))}
              {emergency.needs.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{emergency.needs.length - 3} more
                </Badge>
              )}
            </div>
          )}
          
          {/* Vitals Summary */}
          {emergency.vitals && (
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Activity className="w-3 h-3" />
              <span>
                {emergency.vitals.hr && `HR: ${emergency.vitals.hr}`}
                {emergency.vitals.spo2 && ` | SpO2: ${emergency.vitals.spo2}%`}
                {emergency.vitals.sbp && ` | BP: ${emergency.vitals.sbp}`}
              </span>
            </div>
          )}
          
          {/* Actions */}
          {showActions && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {emergency.status === 'active' && onAcknowledge && (
                <Button 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); onAcknowledge(); }}
                  data-testid="button-acknowledge"
                >
                  Acknowledge
                </Button>
              )}
              {emergency.status === 'assigned' && onEnroute && (
                <Button 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); onEnroute(); }}
                  data-testid="button-enroute"
                >
                  En Route
                </Button>
              )}
              {emergency.status === 'enroute' && onArrived && (
                <Button 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); onArrived(); }}
                  data-testid="button-arrived"
                >
                  Mark Arrived
                </Button>
              )}
              {emergency.status === 'assigned' && onPrepare && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => { e.stopPropagation(); onPrepare(); }}
                  data-testid="button-prepare"
                >
                  Start Prep
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}