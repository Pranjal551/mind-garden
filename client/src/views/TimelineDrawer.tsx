import { useState } from "react";
import { X, Clock, MapPin, Hospital, User, AlertTriangle, Activity, MessageSquare, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMultiEmergencyStore, type EnhancedEmergency, type EmergencyEvent } from "../store/multi-emergency-store";
import { formatDistanceToNow, format } from "date-fns";

interface TimelineDrawerProps {
  emergency: EnhancedEmergency | null;
  open: boolean;
  onClose: () => void;
}

const eventIcons = {
  created: AlertTriangle,
  assigned: Hospital,
  acknowledged: User,
  enroute: ArrowRight,
  arrived: MapPin,
  completed: Activity,
  rerouted: ArrowRight,
  note: MessageSquare,
} as const;

const eventColors = {
  created: "text-red-500",
  assigned: "text-blue-500", 
  acknowledged: "text-orange-500",
  enroute: "text-purple-500",
  arrived: "text-green-500",
  completed: "text-gray-500",
  rerouted: "text-yellow-500",
  note: "text-gray-400",
} as const;

const statusConfig = {
  active: { label: 'Active', color: 'bg-red-100 text-red-800' },
  assigned: { label: 'Assigned', color: 'bg-orange-100 text-orange-800' },
  enroute: { label: 'En Route', color: 'bg-blue-100 text-blue-800' },
  arrived: { label: 'Arrived', color: 'bg-green-100 text-green-800' },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-800' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
};

const triageConfig = {
  red: { label: 'Critical', color: 'bg-red-500 text-white' },
  yellow: { label: 'Urgent', color: 'bg-yellow-500 text-white' },
  green: { label: 'Stable', color: 'bg-green-500 text-white' },
};

export function TimelineDrawer({ emergency, open, onClose }: TimelineDrawerProps) {
  const { addTimelineEvent } = useMultiEmergencyStore();
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  if (!emergency) return null;

  const handleAddNote = () => {
    if (!newNote.trim() || !emergency) return;
    
    addTimelineEvent(emergency.id, {
      ts: new Date().toISOString(),
      actor: 'SYSTEM',
      type: 'note',
      message: newNote.trim(),
      data: { added_by: 'admin' }
    });
    
    setNewNote("");
    setIsAddingNote(false);
  };

  const timeAgo = formatDistanceToNow(new Date(emergency.createdAt), { addSuffix: true });

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto" data-testid="timeline-drawer">
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-start justify-between">
            <div>
              <div className="text-lg font-semibold" data-testid="emergency-title">
                {emergency.type}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Emergency ID: {emergency.id.slice(-8)}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="button-close-drawer"
            >
              <X className="w-4 h-4" />
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Emergency Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Emergency Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={statusConfig[emergency.status].color} data-testid="emergency-status">
                  {statusConfig[emergency.status].label}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Triage Level</span>
                <Badge className={triageConfig[emergency.triageLevel].color} data-testid="emergency-triage">
                  {triageConfig[emergency.triageLevel].label} ({emergency.triageScore})
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm font-medium" data-testid="emergency-created">
                  {timeAgo}
                </span>
              </div>

              {emergency.duplicateOf && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    ⚠️ This emergency may be a duplicate of {emergency.duplicateOf.slice(-8)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Patient Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Patient Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium" data-testid="patient-name">
                    {emergency.patient.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Age: {emergency.patient.age}, Blood Type: {emergency.patient.blood}
                  </p>
                </div>
              </div>

              {emergency.patient.conditions.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Medical Conditions:</p>
                  <div className="flex flex-wrap gap-1">
                    {emergency.patient.conditions.map((condition, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {emergency.patient.allergies.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Allergies:</p>
                  <div className="flex flex-wrap gap-1">
                    {emergency.patient.allergies.map((allergy, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm" data-testid="emergency-location">
                    {emergency.location.address || 
                     `${emergency.location.lat}, ${emergency.location.lon}`}
                  </p>
                  {emergency.location.lat && emergency.location.lon && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {emergency.location.lat}, {emergency.location.lon}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hospital Assignment */}
          {emergency.assignedHospital && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Assigned Hospital</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-3">
                  <Hospital className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium" data-testid="assigned-hospital">
                      {emergency.assignedHospital.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ETA: {emergency.assignedHospital.eta} minutes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Vitals */}
          {emergency.vitals && Object.keys(emergency.vitals).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Vital Signs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {emergency.vitals.hr && (
                    <div>
                      <span className="text-muted-foreground">Heart Rate</span>
                      <p className="font-medium" data-testid="vital-hr">{emergency.vitals.hr} bpm</p>
                    </div>
                  )}
                  {emergency.vitals.spo2 && (
                    <div>
                      <span className="text-muted-foreground">SpO2</span>
                      <p className="font-medium" data-testid="vital-spo2">{emergency.vitals.spo2}%</p>
                    </div>
                  )}
                  {emergency.vitals.sbp && (
                    <div>
                      <span className="text-muted-foreground">Blood Pressure</span>
                      <p className="font-medium" data-testid="vital-bp">{emergency.vitals.sbp} mmHg</p>
                    </div>
                  )}
                  {emergency.vitals.gcs && (
                    <div>
                      <span className="text-muted-foreground">GCS</span>
                      <p className="font-medium" data-testid="vital-gcs">{emergency.vitals.gcs}/15</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Timeline</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingNote(!isAddingNote)}
                  data-testid="button-add-note"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Note
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4" data-testid="timeline-events">
              {/* Add Note Form */}
              {isAddingNote && (
                <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Textarea
                    placeholder="Add a note to this emergency timeline..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="min-h-[80px]"
                    data-testid="textarea-note"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAddingNote(false);
                        setNewNote("");
                      }}
                      data-testid="button-cancel-note"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      data-testid="button-save-note"
                    >
                      Add Note
                    </Button>
                  </div>
                </div>
              )}

              {/* Timeline Events */}
              <div className="space-y-4">
                {emergency.timeline
                  .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
                  .map((event, index) => {
                    const Icon = eventIcons[event.type] || Activity;
                    const iconColor = eventColors[event.type] || "text-gray-400";
                    
                    return (
                      <div key={event.id} className="flex space-x-3" data-testid={`timeline-event-${event.type}`}>
                        <div className="flex flex-col items-center">
                          <div className={`p-1 rounded-full bg-white shadow-sm ${iconColor}`}>
                            <Icon className="w-3 h-3" />
                          </div>
                          {index < emergency.timeline.length - 1 && (
                            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pb-4">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {event.actor.toLowerCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(event.ts), 'MMM d, HH:mm:ss')}
                            </span>
                          </div>
                          <p className="text-sm" data-testid={`event-message-${event.type}`}>
                            {event.message}
                          </p>
                          {event.data && Object.keys(event.data).length > 0 && (
                            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                              <pre className="text-muted-foreground overflow-x-auto">
                                {JSON.stringify(event.data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {emergency.timeline.length === 0 && (
                <p className="text-center py-4 text-sm text-muted-foreground">
                  No timeline events yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}