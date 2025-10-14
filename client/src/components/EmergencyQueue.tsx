import { useState } from "react";
import { Filter, Search, RefreshCw, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useMultiEmergencyStore, type EnhancedEmergency } from "../store/multi-emergency-store";
import { EmergencyCard } from "./EmergencyCard";

interface EmergencyQueueProps {
  onCreateNew?: () => void;
  onEmergencySelect?: (emergency: EnhancedEmergency) => void;
  showActions?: boolean;
  userRole?: 'user' | 'ambulance' | 'hospital' | 'admin';
}

export function EmergencyQueue({ 
  onCreateNew, 
  onEmergencySelect,
  showActions = false,
  userRole = 'admin'
}: EmergencyQueueProps) {
  const {
    getAllEmergencies,
    getEmergenciesByStatus,
    activeEmergencyId,
    setActiveEmergency,
    acknowledgeEmergency,
    startEnroute,
    markArrived,
    startPreparation,
    clearAllEmergencies
  } = useMultiEmergencyStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [triageFilter, setTriageFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Get emergencies based on filters
  const getFilteredEmergencies = () => {
    let emergencies = statusFilter === "all" 
      ? getAllEmergencies() 
      : getEmergenciesByStatus([statusFilter]);

    // Apply triage filter
    if (triageFilter !== "all") {
      emergencies = emergencies.filter(e => e.triageLevel === triageFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      emergencies = emergencies.filter(e =>
        e.type.toLowerCase().includes(search) ||
        e.patient.name.toLowerCase().includes(search) ||
        e.location.address?.toLowerCase().includes(search) ||
        e.id.toLowerCase().includes(search)
      );
    }

    return emergencies;
  };

  const emergencies = getFilteredEmergencies();

  const handleEmergencySelect = (emergency: EnhancedEmergency) => {
    setActiveEmergency(emergency.id);
    onEmergencySelect?.(emergency);
  };

  const getStatusCounts = () => {
    const all = getAllEmergencies();
    return {
      all: all.length,
      active: all.filter(e => e.status === 'active').length,
      assigned: all.filter(e => e.status === 'assigned').length,
      enroute: all.filter(e => e.status === 'enroute').length,
      arrived: all.filter(e => e.status === 'arrived').length,
      completed: all.filter(e => e.status === 'completed').length,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <Card className="h-full" data-testid="emergency-queue">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Emergency Queue</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              data-testid="button-toggle-filters"
            >
              <Filter className="w-4 h-4" />
            </Button>
            {onCreateNew && (
              <Button
                size="sm"
                onClick={onCreateNew}
                data-testid="button-create-emergency"
              >
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  data-testid="button-clear-all"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent data-testid="queue-clear-dialog">
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Emergencies</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all emergency records 
                    and timeline data from the current session.
                    <br /><br />
                    Are you sure you want to clear all emergencies?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-cancel-queue-clear">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={clearAllEmergencies}
                    className="bg-red-600 hover:bg-red-700"
                    data-testid="button-confirm-queue-clear"
                  >
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Status Summary */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" data-testid="count-all">
            All: {statusCounts.all}
          </Badge>
          <Badge className="bg-red-100 text-red-800" data-testid="count-active">
            Active: {statusCounts.active}
          </Badge>
          <Badge className="bg-orange-100 text-orange-800" data-testid="count-assigned">
            Assigned: {statusCounts.assigned}
          </Badge>
          <Badge className="bg-blue-100 text-blue-800" data-testid="count-enroute">
            En Route: {statusCounts.enroute}
          </Badge>
          <Badge className="bg-green-100 text-green-800" data-testid="count-arrived">
            Arrived: {statusCounts.arrived}
          </Badge>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="space-y-3 pt-3 border-t">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search emergencies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="enroute">En Route</SelectItem>
                  <SelectItem value="arrived">Arrived</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={triageFilter} onValueChange={setTriageFilter}>
                <SelectTrigger className="w-[120px]" data-testid="select-triage">
                  <SelectValue placeholder="Triage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="red">Critical</SelectItem>
                  <SelectItem value="yellow">Urgent</SelectItem>
                  <SelectItem value="green">Stable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {emergencies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="no-emergencies">
              <p>No emergencies found.</p>
              {onCreateNew && (
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={onCreateNew}
                  data-testid="button-create-first"
                >
                  Create First Emergency
                </Button>
              )}
            </div>
          ) : (
            emergencies.map((emergency) => (
              <EmergencyCard
                key={emergency.id}
                emergency={emergency}
                onSelect={() => handleEmergencySelect(emergency)}
                onAcknowledge={() => acknowledgeEmergency(emergency.id)}
                onEnroute={() => startEnroute(emergency.id)}
                onArrived={() => markArrived(emergency.id)}
                onPrepare={() => startPreparation(emergency.id)}
                showActions={showActions}
                isSelected={activeEmergencyId === emergency.id}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}