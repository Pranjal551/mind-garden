import { useState } from "react";
import { AlertTriangle, Plus, Activity, BarChart3, Wrench, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { EmergencyQueue } from "../components/EmergencyQueue";
import { TimelineDrawer } from "./TimelineDrawer";
import { CreateEmergencyDialog } from "./CreateEmergencyDialog";
import { useMultiEmergencyStore, type EnhancedEmergency } from "../store/multi-emergency-store";

export function AdminDashboard() {
  const {
    getAllEmergencies,
    getEmergenciesByStatus,
    clearAllEmergencies,
    setActiveEmergency,
    activeEmergencyId
  } = useMultiEmergencyStore();

  const [showClearDialog, setShowClearDialog] = useState(false);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState<EnhancedEmergency | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);

  // Get statistics
  const allEmergencies = getAllEmergencies();
  const activeCount = getEmergenciesByStatus(['active']).length;
  const assignedCount = getEmergenciesByStatus(['assigned']).length;
  const enrouteCount = getEmergenciesByStatus(['enroute']).length;
  const arrivedCount = getEmergenciesByStatus(['arrived']).length;

  // Triage statistics
  const criticalCount = allEmergencies.filter(e => e.triageLevel === 'red').length;
  const urgentCount = allEmergencies.filter(e => e.triageLevel === 'yellow').length;
  const stableCount = allEmergencies.filter(e => e.triageLevel === 'green').length;

  // Recent activity (last 10 events from all emergencies)
  const recentActivity = allEmergencies
    .flatMap(emergency => 
      emergency.timeline.map(event => ({
        ...event,
        emergencyId: emergency.id,
        emergencyType: emergency.type
      }))
    )
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .slice(0, 10);

  const handleEmergencySelect = (emergency: EnhancedEmergency) => {
    setSelectedEmergency(emergency);
    setActiveEmergency(emergency.id);
    setShowTimeline(true);
  };

  const handleCreateEmergency = () => {
    setShowCreateDialog(true);
  };

  const handleClearAllEmergencies = () => {
    clearAllEmergencies();
    setShowClearDialog(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" data-testid="admin-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Wrench className="w-8 h-8 text-blue-600" />
                Emergency Control Center
              </h1>
              <p className="text-muted-foreground mt-1">
                Monitor and manage all emergency responses in real-time
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleCreateEmergency}
                className="bg-red-600 hover:bg-red-700 text-white"
                data-testid="button-create-emergency"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Emergency
              </Button>
              <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    data-testid="button-clear-logs"
                  >
                    Clear All Logs
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent data-testid="clear-logs-dialog">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear All Emergency Logs</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all emergency records, 
                      patient data, timeline events, and system logs from the current session.
                      <br /><br />
                      <strong>All active emergencies will be lost.</strong>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="button-cancel-clear">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleClearAllEmergencies}
                      className="bg-red-600 hover:bg-red-700"
                      data-testid="button-confirm-clear"
                    >
                      Clear All Logs
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Emergencies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total">
                {allEmergencies.length}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className="bg-red-100 text-red-800" data-testid="stat-critical">
                  Critical: {criticalCount}
                </Badge>
                <Badge className="bg-yellow-100 text-yellow-800" data-testid="stat-urgent">
                  Urgent: {urgentCount}
                </Badge>
                <Badge className="bg-green-100 text-green-800" data-testid="stat-stable">
                  Stable: {stableCount}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Response</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600" data-testid="stat-active">
                {activeCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting ambulance response
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Transit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600" data-testid="stat-transit">
                {assignedCount + enrouteCount}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                <span data-testid="assigned-count">{assignedCount} assigned</span>
                {assignedCount > 0 && enrouteCount > 0 && <span> • </span>}
                <span data-testid="enroute-count">{enrouteCount} en route</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">On Scene</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="stat-arrived">
                {arrivedCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Response teams arrived
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="queue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="queue" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Emergency Queue
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Recent Activity
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <EmergencyQueue
                  onCreateNew={handleCreateEmergency}
                  onEmergencySelect={handleEmergencySelect}
                  showActions={true}
                  userRole="admin"
                />
              </div>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={handleCreateEmergency}
                      data-testid="quick-new-emergency"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Emergency
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {
                        const criticalEmergencies = allEmergencies.filter(e => e.triageLevel === 'red');
                        if (criticalEmergencies.length > 0) {
                          handleEmergencySelect(criticalEmergencies[0]);
                        }
                      }}
                      disabled={criticalCount === 0}
                      data-testid="quick-view-critical"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
                      View Critical Cases
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          data-testid="quick-clear-all"
                        >
                          <Activity className="w-4 h-4 mr-2" />
                          Clear All Logs
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent data-testid="quick-clear-dialog">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Clear All Emergency Logs</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete all emergency records, 
                            patient data, timeline events, and system logs from the current session.
                            <br /><br />
                            <strong>All active emergencies will be lost.</strong>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid="button-cancel-quick-clear">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleClearAllEmergencies}
                            className="bg-red-600 hover:bg-red-700"
                            data-testid="button-confirm-quick-clear"
                          >
                            Clear All Logs
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>

                {/* System Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">System Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Repository</span>
                      <Badge variant="outline" className="text-green-700 border-green-200">
                        InMemory Active
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cross-Tab Sync</span>
                      <Badge variant="outline" className="text-green-700 border-green-200">
                        BroadcastChannel
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Hospital Data</span>
                      <Badge variant="outline" className="text-blue-700 border-blue-200">
                        3 Hospitals
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Latest events across all emergencies
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4" data-testid="recent-activity">
                  {recentActivity.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">
                      No activity yet. Create an emergency to get started.
                    </p>
                  ) : (
                    recentActivity.map((event) => (
                      <div key={event.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {event.emergencyType}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.ts).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{event.message}</p>
                          <p className="text-xs text-muted-foreground">
                            Emergency {event.emergencyId.slice(-8)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Response Times</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Average Response</span>
                      <span className="text-sm font-medium">~6.5 min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Critical Cases</span>
                      <span className="text-sm font-medium">~4.2 min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Standard Cases</span>
                      <span className="text-sm font-medium">~8.1 min</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hospital Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">City General</span>
                      <span className="text-sm font-medium">15 beds</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Apollo Specialty</span>
                      <span className="text-sm font-medium">8 beds</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Fortis Healthcare</span>
                      <span className="text-sm font-medium">20 beds</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialogs and Drawers */}
        <CreateEmergencyDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
        />
        
        <TimelineDrawer
          emergency={selectedEmergency}
          open={showTimeline}
          onClose={() => {
            setShowTimeline(false);
            setSelectedEmergency(null);
          }}
        />
      </div>
    </div>
  );
}