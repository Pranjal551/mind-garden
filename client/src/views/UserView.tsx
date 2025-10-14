import { useState } from "react";
import { useAI4HStore } from "../store/ai4h-store";
import { Timeline } from "../components/Timeline";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "../utils/notify";
import { demoPatient } from "../types";

export function UserView() {
  const { triggerSOS, updateLocation, resetEmergency, history, status, geo } = useAI4HStore();
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const handleSOS = () => {
    triggerSOS();
    toast("Emergency Alert Sent", "success");
  };

  const handleReset = () => {
    resetEmergency();
    toast("Emergency Reset", "success");
  };

  const handleUpdateLocation = async () => {
    setIsLoadingLocation(true);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            address: "Current GPS Location",
          });
          toast("Location Updated", "success");
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast("Failed to get location", "error");
          setIsLoadingLocation(false);
        }
      );
    } else {
      toast("Geolocation not supported", "error");
      setIsLoadingLocation(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="user-view">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emergency Profile Card */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Emergency Profile</h2>
              <span className="text-sm px-3 py-1 bg-green-100 text-green-800 rounded-full">
                Verified
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <i className="fas fa-user text-gray-500 text-xl"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground" data-testid="patient-name">
                    {demoPatient.name}
                  </h3>
                  <p className="text-muted-foreground" data-testid="patient-details">
                    Age: {demoPatient.age}, Blood Type: {demoPatient.blood}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Medical Conditions</label>
                  <div className="mt-1">
                    {demoPatient.conditions.map((condition) => (
                      <span 
                        key={condition}
                        className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full mr-1"
                        data-testid={`condition-${condition.toLowerCase()}`}
                      >
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Allergies</label>
                  <div className="mt-1">
                    {demoPatient.allergies.map((allergy) => (
                      <span 
                        key={allergy}
                        className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full mr-1"
                        data-testid={`allergy-${allergy.toLowerCase()}`}
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="border-t border-border pt-4">
                <label className="text-sm font-medium text-muted-foreground">Emergency Contact</label>
                <div className="mt-2">
                  <p className="font-medium" data-testid="guardian-name">{demoPatient.guardian.name}</p>
                  <p className="text-muted-foreground" data-testid="guardian-phone">{demoPatient.guardian.phone}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location & Emergency Action */}
        <div className="space-y-6">
          {/* Location Card */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Current Location</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-map-marker-alt text-blue-600"></i>
                  <span className="text-muted-foreground" data-testid="current-location">
                    {geo?.address || "Location not set"}
                  </span>
                </div>
                <Button 
                  onClick={handleUpdateLocation}
                  disabled={isLoadingLocation}
                  className="w-full bg-blue-100 text-blue-800 hover:bg-blue-200"
                  data-testid="button-update-location"
                >
                  <i className="fas fa-location-crosshairs mr-2"></i>
                  {isLoadingLocation ? "Updating..." : "Update Location"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Emergency SOS Button */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-foreground mb-4">Emergency Response</h2>
                <div className="space-y-3">
                  <Button
                    onClick={handleSOS}
                    disabled={status !== null}
                    className={`w-full font-bold py-6 px-8 text-xl transition-all duration-200 transform hover:scale-105 ${
                      status !== null 
                        ? "bg-green-600 text-white" 
                        : "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                    }`}
                    data-testid="button-emergency-sos"
                  >
                    <i className="fas fa-exclamation-triangle mr-3"></i>
                    {status !== null ? "🚨 ALERT SENT" : "🚨 EMERGENCY SOS"}
                  </Button>
                  
                  {status !== null && (
                    <Button
                      onClick={handleReset}
                      className="w-full font-medium py-3 px-6 text-base bg-gray-500 hover:bg-gray-600 text-white transition-all duration-200"
                      data-testid="button-reset-emergency"
                    >
                      <i className="fas fa-refresh mr-2"></i>
                      Reset Emergency
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  {status !== null 
                    ? "Click Reset to clear the alert and send another" 
                    : "This will alert ambulance and hospital services immediately"
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="mt-8">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
            <Timeline history={history} limit={10} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
