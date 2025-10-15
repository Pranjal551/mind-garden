import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { subscribeToWebSocket } from "@/utils/websocket";
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Phone, 
  Heart, 
  Users, 
  Route,
  CheckCircle,
  XCircle,
  PlayCircle,
  StopCircle,
  AlertTriangle,
  Wifi,
  WifiOff
} from "lucide-react";
import { useAmbulanceDriverStore, startPositionTracking, stopPositionTracking } from "../store/ambulance-driver-store";
import { useMultiEmergencyStore } from "../store/multi-emergency-store";
import { Timeline } from "../components/Timeline";

export function EnhancedAmbulanceView() {
  const {
    currentShift,
    availableAssignments,
    acceptedAssignments,
    currentPosition,
    activeNavigation,
    isOnline,
    isTrackingEnabled,
    driverId,
    ambulanceId,
    startShift,
    endShift,
    acceptAssignment,
    rejectAssignment,
    startNavigation,
    endNavigation,
    togglePositionTracking,
    initializeDriver
  } = useAmbulanceDriverStore();

  const { 
    getAllEmergencies,
    getEmergencyById,
    updateEmergency
  } = useMultiEmergencyStore();

  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [newDriverId, setNewDriverId] = useState("");
  const [newAmbulanceId, setNewAmbulanceId] = useState("");

  // Initialize driver if not set
  useEffect(() => {
    if (!driverId || !ambulanceId) {
      initializeDriver("AMB_001", "Vehicle_001");
    }
  }, [driverId, ambulanceId, initializeDriver]);

  // Start/stop position tracking based on shift and settings
  useEffect(() => {
    if (currentShift && isTrackingEnabled) {
      startPositionTracking();
    } else {
      stopPositionTracking();
    }

    return () => stopPositionTracking();
  }, [currentShift, isTrackingEnabled]);

  // Listen for WebSocket emergency events and refresh emergency list
  useEffect(() => {
    const handleEmergencyEvent = (data: any) => {
      // Refresh available assignments by checking for new emergencies
      // The stores will automatically update with new data
      console.log("Emergency event received in ambulance view:", data);
    };

    const unsubscribe1 = subscribeToWebSocket('emergency_created', handleEmergencyEvent);
    const unsubscribe2 = subscribeToWebSocket('emergency_updated', handleEmergencyEvent);

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, []);

  // Get accepted emergencies with full details
  const acceptedEmergencies = acceptedAssignments
    .map(id => getEmergencyById(id))
    .filter(Boolean);

  const handleStartShift = () => {
    startShift(newDriverId || "AMB_001", newAmbulanceId || "Vehicle_001");
    setShowShiftDialog(false);
  };

  const handleAcceptAssignment = (emergencyId: string) => {
    acceptAssignment(emergencyId);
    // Update emergency status to acknowledged
    const emergency = getEmergencyById(emergencyId);
    if (emergency) {
      updateEmergency(emergencyId, { status: "acknowledged" });
    }
  };

  const handleRejectAssignment = (emergencyId: string) => {
    rejectAssignment(emergencyId);
  };

  const handleStartNavigation = (emergencyId: string) => {
    const emergency = getEmergencyById(emergencyId);
    if (emergency) {
      startNavigation(emergency);
      updateEmergency(emergencyId, { status: "enroute" });
    }
  };

  const handleArrived = (emergencyId: string) => {
    updateEmergency(emergencyId, { status: "arrived" });
    endNavigation();
  };

  const getTriageColor = (level: string) => {
    switch (level) {
      case 'red': return 'bg-red-500';
      case 'yellow': return 'bg-yellow-500';  
      case 'green': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTriageLabel = (score: number) => {
    if (score >= 70) return { level: 'red', label: 'Critical' };
    if (score >= 40) return { level: 'yellow', label: 'Urgent' };
    return { level: 'green', label: 'Stable' };
  };

  if (!currentShift) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="ambulance-driver-view">
        <Card className="shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">🚑</div>
            <h2 className="text-2xl font-semibold mb-4">Start Your Shift</h2>
            <p className="text-muted-foreground mb-6">
              Begin your ambulance driver shift to receive emergency assignments
            </p>
            
            <Dialog open={showShiftDialog} onOpenChange={setShowShiftDialog}>
              <DialogTrigger asChild>
                <Button size="lg" data-testid="button-start-shift">
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Start Shift
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="shift-dialog">
                <DialogHeader>
                  <DialogTitle>Start Shift</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Driver ID</label>
                    <input
                      type="text"
                      value={newDriverId}
                      onChange={(e) => setNewDriverId(e.target.value)}
                      placeholder="Enter your driver ID"
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                      data-testid="input-driver-id"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Ambulance ID</label>
                    <input
                      type="text"
                      value={newAmbulanceId}
                      onChange={(e) => setNewAmbulanceId(e.target.value)}
                      placeholder="Enter ambulance vehicle ID"
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                      data-testid="input-ambulance-id"
                    />
                  </div>
                  <Button onClick={handleStartShift} className="w-full" data-testid="button-confirm-start-shift">
                    Start Shift
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="ambulance-driver-view">
      {/* Shift Status Header */}
      <Card className="mb-6 border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="font-semibold">Shift Active</span>
              </div>
              <Badge variant="secondary" data-testid="shift-info">
                {ambulanceId} - {driverId}
              </Badge>
              <div className="flex items-center space-x-1">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-green-600" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm">GPS Tracking</label>
                <Switch
                  checked={isTrackingEnabled}
                  onCheckedChange={togglePositionTracking}
                  data-testid="gps-toggle"
                />
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="button-end-shift">
                    <StopCircle className="w-4 h-4 mr-1" />
                    End Shift
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>End Shift</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to end your shift? You will stop receiving new emergency assignments.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={endShift} data-testid="button-confirm-end-shift">
                      End Shift
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="assignments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assignments" data-testid="tab-assignments">
            Assignments ({availableAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="active" data-testid="tab-active">
            Active ({acceptedEmergencies.length})
          </TabsTrigger>
          <TabsTrigger value="navigation" data-testid="tab-navigation">
            Navigation
          </TabsTrigger>
        </TabsList>

        {/* Available Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Emergency Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {availableAssignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No new emergency assignments</p>
                  <p className="text-sm">New emergencies will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableAssignments.map((assignment) => (
                    <Card key={assignment.emergencyId} className="border-red-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className={getTriageColor(assignment.triageLevel)}>
                                {assignment.triageLevel.toUpperCase()}
                              </Badge>
                              <span className="font-semibold">{assignment.patientName}</span>
                            </div>
                            
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{assignment.location}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Route className="w-4 h-4" />
                                <span>{assignment.estimatedDistance}km away</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>Expires: {new Date(assignment.expiresAt).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectAssignment(assignment.emergencyId)}
                              data-testid={`button-reject-${assignment.emergencyId}`}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAcceptAssignment(assignment.emergencyId)}
                              data-testid={`button-accept-${assignment.emergencyId}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Emergencies Tab */}
        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Emergencies</CardTitle>
            </CardHeader>
            <CardContent>
              {acceptedEmergencies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No active emergencies</p>
                  <p className="text-sm">Accepted assignments will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {acceptedEmergencies.map((emergency) => {
                    if (!emergency) return null;
                    const triage = getTriageLabel(emergency.triageScore || 0);
                    return (
                      <Card key={emergency.id} className="border-blue-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge className={getTriageColor(triage.level)}>
                                  {triage.label}
                                </Badge>
                                <span className="font-semibold">{emergency.patientId || 'Unknown Patient'}</span>
                                <Badge variant="outline">{emergency.status}</Badge>
                              </div>
                              
                              {emergency.location && (
                                <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-2">
                                  <MapPin className="w-4 h-4" />
                                  <span>{emergency.location.address}</span>
                                </div>
                              )}
                              
                              {emergency.vitals && (
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>HR: {emergency.vitals.hr || 'N/A'} bpm</div>
                                  <div>SpO2: {emergency.vitals.spo2 || 'N/A'}%</div>
                                  <div>BP: {emergency.vitals.sbp || 'N/A'}/{emergency.vitals.dbp || 'N/A'}</div>
                                  <div>RR: {emergency.vitals.rr || 'N/A'}/min</div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              data-testid={`button-call-${emergency.id}`}
                            >
                              <Phone className="w-4 h-4 mr-1" />
                              Call
                            </Button>
                            
                            {emergency.status !== "arrived" && (
                              <Button
                                size="sm"
                                onClick={() => handleStartNavigation(emergency.id)}
                                data-testid={`button-navigate-${emergency.id}`}
                              >
                                <Navigation className="w-4 h-4 mr-1" />
                                Navigate
                              </Button>
                            )}
                            
                            {emergency.status === "enroute" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleArrived(emergency.id)}
                                className="bg-green-50"
                                data-testid={`button-arrived-${emergency.id}`}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Arrived
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Navigation Tab */}
        <TabsContent value="navigation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Navigation & GPS</CardTitle>
            </CardHeader>
            <CardContent>
              {activeNavigation ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold">Active Navigation</h3>
                      <p className="text-sm text-muted-foreground">
                        To: {activeNavigation.destination.address}
                      </p>
                      <Badge variant="outline">{activeNavigation.status}</Badge>
                    </div>
                    <Navigation className="w-8 h-8 text-blue-600" />
                  </div>

                  <Button
                    variant="outline"
                    onClick={endNavigation}
                    data-testid="button-end-navigation"
                  >
                    End Navigation
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Navigation className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No active navigation</p>
                  <p className="text-sm">Navigation will appear when you start routing to an emergency</p>
                </div>
              )}

              {/* GPS Status */}
              <div className="mt-6 p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">GPS Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Tracking:</span>
                    <Badge variant={isTrackingEnabled ? "default" : "secondary"}>
                      {isTrackingEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Connection:</span>
                    <Badge variant={isOnline ? "default" : "destructive"}>
                      {isOnline ? "Online" : "Offline"}
                    </Badge>
                  </div>
                  {currentPosition && (
                    <div className="flex justify-between">
                      <span>Last Position:</span>
                      <span className="text-xs font-mono">
                        {currentPosition.lat.toFixed(6)}, {currentPosition.lon.toFixed(6)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}