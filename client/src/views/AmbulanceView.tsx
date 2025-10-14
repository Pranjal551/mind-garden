import { useAI4HStore, startETACountdown, stopETACountdown } from "../store/ai4h-store";
import { Timeline } from "../components/Timeline";
import { StatusChip } from "../components/StatusChip";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useEffect } from "react";

export function AmbulanceView() {
  const { 
    status, 
    patient, 
    geo, 
    etaMin, 
    history, 
    acknowledgeEmergency, 
    startEnroute, 
    markArrived 
  } = useAI4HStore();

  useEffect(() => {
    if (status === "ENROUTE") {
      startETACountdown();
    } else {
      stopETACountdown();
    }

    return () => stopETACountdown();
  }, [status]);

  if (!patient || !status) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="ambulance-view">
        <Card className="shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">🚑</div>
            <h2 className="text-2xl font-semibold mb-4">Waiting for Emergency Alerts</h2>
            <p className="text-muted-foreground">
              Emergency notifications will appear here when triggered
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const progressValue = status === "NEW" ? 25 : status === "ACK" ? 50 : status === "ENROUTE" ? 75 : 100;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="ambulance-view">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Emergency Alert Card */}
        <div className="lg:col-span-2">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-red-800">🚨 INCOMING EMERGENCY</h2>
              <StatusChip status={status} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Patient Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium" data-testid="patient-name">{patient.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age:</span>
                    <span className="font-medium" data-testid="patient-age">{patient.age} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Blood Type:</span>
                    <span className="font-medium text-red-600" data-testid="patient-blood">{patient.blood}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conditions:</span>
                    <span className="font-medium" data-testid="patient-conditions">
                      {patient.conditions.join(", ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Allergies:</span>
                    <span className="font-medium text-red-600" data-testid="patient-allergies">
                      {patient.allergies.join(", ")}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Location & Contact</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-600">Location:</span>
                    <p className="font-medium" data-testid="patient-location">
                      {geo?.address || "Location not available"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Emergency Contact:</span>
                    <p className="font-medium" data-testid="guardian-name">{patient.guardian.name}</p>
                    <p className="text-blue-600" data-testid="guardian-phone">{patient.guardian.phone}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">ETA:</span>
                    <p className="font-bold text-lg text-red-600" data-testid="eta-minutes">
                      {etaMin ? `${etaMin} minutes` : "Calculating..."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Response Progress</span>
                <span data-testid="progress-percentage">{progressValue}%</span>
              </div>
              <Progress value={progressValue} className="h-2" />
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={acknowledgeEmergency}
              disabled={status !== "NEW"}
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3"
              data-testid="button-acknowledge"
            >
              <i className="fas fa-check mr-2"></i>
              Acknowledge
            </Button>
            <Button
              onClick={startEnroute}
              disabled={status !== "ACK"}
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3"
              data-testid="button-enroute"
            >
              <i className="fas fa-route mr-2"></i>
              Start En-Route
            </Button>
            <Button
              onClick={markArrived}
              disabled={status !== "ENROUTE"}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
              data-testid="button-arrived"
            >
              <i className="fas fa-map-marker-alt mr-2"></i>
              Mark Arrived
            </Button>
          </div>
        </div>
        
        {/* Status Panel */}
        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Current Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Alert Received</span>
                  <i className="fas fa-check-circle text-green-600" data-testid="status-received"></i>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Acknowledged</span>
                  <i className={`fas ${status === "NEW" ? "fa-clock text-gray-400" : "fa-check-circle text-green-600"}`} 
                     data-testid="status-acknowledged"></i>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">En Route</span>
                  <i className={`fas ${["NEW", "ACK"].includes(status) ? "fa-clock text-gray-400" : "fa-check-circle text-green-600"}`}
                     data-testid="status-enroute"></i>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Arrived</span>
                  <i className={`fas ${status !== "ARRIVED" ? "fa-clock text-gray-400" : "fa-check-circle text-green-600"}`}
                     data-testid="status-arrived"></i>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Actions */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100"
                  data-testid="button-call-patient"
                >
                  <i className="fas fa-phone mr-2"></i>
                  Call Patient
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100"
                  data-testid="button-contact-hospital"
                >
                  <i className="fas fa-hospital mr-2"></i>
                  Contact Hospital
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-green-50 border-green-200 text-green-800 hover:bg-green-100"
                  data-testid="button-navigation"
                >
                  <i className="fas fa-map mr-2"></i>
                  Open Navigation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Timeline */}
      <div className="mt-8">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Response Timeline</h2>
            <Timeline history={history} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
