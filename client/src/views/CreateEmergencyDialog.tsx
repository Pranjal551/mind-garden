import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMultiEmergencyStore, type CreateEmergencyData } from "../store/multi-emergency-store";
import { demoPatient } from "../types";
import { toast } from "../utils/notify";

interface CreateEmergencyDialogProps {
  open: boolean;
  onClose: () => void;
}

const emergencyTypes = [
  { value: "cardiac-arrest", label: "Cardiac Arrest", severity: "critical" },
  { value: "heart-attack", label: "Heart Attack", severity: "critical" },
  { value: "stroke", label: "Stroke", severity: "critical" },
  { value: "respiratory-failure", label: "Respiratory Failure", severity: "critical" },
  { value: "severe-trauma", label: "Severe Trauma", severity: "critical" },
  { value: "chest-pain", label: "Chest Pain", severity: "urgent" },
  { value: "difficulty-breathing", label: "Difficulty Breathing", severity: "urgent" },
  { value: "severe-bleeding", label: "Severe Bleeding", severity: "urgent" },
  { value: "head-injury", label: "Head Injury", severity: "urgent" },
  { value: "seizure", label: "Seizure", severity: "urgent" },
  { value: "allergic-reaction", label: "Severe Allergic Reaction", severity: "urgent" },
  { value: "overdose", label: "Drug Overdose", severity: "urgent" },
  { value: "burn", label: "Severe Burn", severity: "standard" },
  { value: "fracture", label: "Fracture", severity: "standard" },
  { value: "fall", label: "Fall Injury", severity: "standard" },
  { value: "accident", label: "Motor Vehicle Accident", severity: "standard" },
  { value: "other", label: "Other Emergency", severity: "standard" }
];

const locations = [
  { label: "Koramangala, Bangalore", lat: 12.9279, lon: 77.6271 },
  { label: "MG Road, Bangalore", lat: 12.9716, lon: 77.5946 },
  { label: "Electronic City, Bangalore", lat: 12.8456, lon: 77.6603 },
  { label: "Whitefield, Bangalore", lat: 12.9698, lon: 77.7500 },
  { label: "Indiranagar, Bangalore", lat: 12.9719, lon: 77.6412 },
  { label: "Custom Location", lat: 0, lon: 0 }
];

export function CreateEmergencyDialog({ open, onClose }: CreateEmergencyDialogProps) {
  const { createEmergency } = useMultiEmergencyStore();
  
  const [formData, setFormData] = useState({
    type: "",
    locationIndex: 0,
    customLat: "",
    customLon: "",
    customAddress: "",
    vitals: {
      hr: "",
      spo2: "",
      sbp: "",
      rr: "",
      gcs: ""
    }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVitals, setShowVitals] = useState(false);

  const selectedEmergencyType = emergencyTypes.find(t => t.value === formData.type);
  const selectedLocation = locations[formData.locationIndex];
  const isCustomLocation = formData.locationIndex === locations.length - 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type) return;
    
    setIsSubmitting(true);
    
    try {
      // Prepare location data
      let locationData;
      if (isCustomLocation) {
        locationData = {
          lat: parseFloat(formData.customLat) || 12.9716,
          lon: parseFloat(formData.customLon) || 77.5946,
          address: formData.customAddress || "Custom Location"
        };
      } else {
        locationData = {
          lat: selectedLocation.lat,
          lon: selectedLocation.lon,
          address: selectedLocation.label
        };
      }

      // Prepare vitals data
      const vitals = Object.entries(formData.vitals)
        .reduce((acc, [key, value]) => {
          if (value && !isNaN(parseFloat(value))) {
            acc[key as keyof typeof formData.vitals] = parseFloat(value);
          }
          return acc;
        }, {} as any);

      const emergencyData: CreateEmergencyData = {
        patientId: `patient-${Date.now()}`,
        patient: { 
          ...demoPatient, 
          id: `patient-${Date.now()}`,
          name: `${demoPatient.name} #${Math.floor(Math.random() * 1000)}`
        },
        type: selectedEmergencyType?.label || formData.type,
        location: locationData,
        vitals: Object.keys(vitals).length > 0 ? vitals : undefined
      };

      const emergencyId = await createEmergency(emergencyData);
      
      toast("Emergency Created", "success");
      onClose();
      resetForm();
      
    } catch (error) {
      console.error("Failed to create emergency:", error);
      toast("Failed to create emergency", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: "",
      locationIndex: 0,
      customLat: "",
      customLon: "",
      customAddress: "",
      vitals: {
        hr: "",
        spo2: "",
        sbp: "",
        rr: "",
        gcs: ""
      }
    });
    setShowVitals(false);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="create-emergency-dialog">
        <DialogHeader>
          <DialogTitle>Create New Emergency</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Emergency Type */}
          <div className="space-y-3">
            <Label htmlFor="emergency-type">Emergency Type *</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger data-testid="select-emergency-type">
                <SelectValue placeholder="Select emergency type..." />
              </SelectTrigger>
              <SelectContent>
                {emergencyTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{type.label}</span>
                      <Badge 
                        variant="outline" 
                        className={`ml-2 text-xs ${
                          type.severity === 'critical' ? 'border-red-200 text-red-800' :
                          type.severity === 'urgent' ? 'border-yellow-200 text-yellow-800' :
                          'border-gray-200 text-gray-800'
                        }`}
                      >
                        {type.severity}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedEmergencyType && (
              <div className="text-sm text-muted-foreground">
                Severity: <Badge 
                  variant="outline" 
                  className={`${
                    selectedEmergencyType.severity === 'critical' ? 'border-red-200 text-red-800' :
                    selectedEmergencyType.severity === 'urgent' ? 'border-yellow-200 text-yellow-800' :
                    'border-gray-200 text-gray-800'
                  }`}
                >
                  {selectedEmergencyType.severity}
                </Badge>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="space-y-3">
            <Label htmlFor="location">Location *</Label>
            <Select 
              value={formData.locationIndex.toString()} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, locationIndex: parseInt(value) }))}
            >
              <SelectTrigger data-testid="select-location">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {location.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {isCustomLocation && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="custom-lat" className="text-sm">Latitude</Label>
                  <Input
                    id="custom-lat"
                    type="number"
                    step="any"
                    placeholder="12.9716"
                    value={formData.customLat}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      customLat: e.target.value 
                    }))}
                    data-testid="input-custom-lat"
                  />
                </div>
                <div>
                  <Label htmlFor="custom-lon" className="text-sm">Longitude</Label>
                  <Input
                    id="custom-lon"
                    type="number"
                    step="any"
                    placeholder="77.5946"
                    value={formData.customLon}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      customLon: e.target.value 
                    }))}
                    data-testid="input-custom-lon"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="custom-address" className="text-sm">Address</Label>
                  <Input
                    id="custom-address"
                    placeholder="Street address..."
                    value={formData.customAddress}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      customAddress: e.target.value 
                    }))}
                    data-testid="input-custom-address"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Vitals (Optional) */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Vital Signs (Optional)</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVitals(!showVitals)}
                  data-testid="toggle-vitals"
                >
                  {showVitals ? "Hide" : "Add"} Vitals
                </Button>
              </div>
            </CardHeader>
            {showVitals && (
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hr" className="text-sm">Heart Rate (bpm)</Label>
                    <Input
                      id="hr"
                      type="number"
                      placeholder="80"
                      value={formData.vitals.hr}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        vitals: { ...prev.vitals, hr: e.target.value }
                      }))}
                      data-testid="input-hr"
                    />
                  </div>
                  <div>
                    <Label htmlFor="spo2" className="text-sm">SpO2 (%)</Label>
                    <Input
                      id="spo2"
                      type="number"
                      placeholder="98"
                      value={formData.vitals.spo2}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        vitals: { ...prev.vitals, spo2: e.target.value }
                      }))}
                      data-testid="input-spo2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sbp" className="text-sm">Blood Pressure (mmHg)</Label>
                    <Input
                      id="sbp"
                      type="number"
                      placeholder="120"
                      value={formData.vitals.sbp}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        vitals: { ...prev.vitals, sbp: e.target.value }
                      }))}
                      data-testid="input-sbp"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gcs" className="text-sm">Glasgow Coma Scale</Label>
                    <Input
                      id="gcs"
                      type="number"
                      min="3"
                      max="15"
                      placeholder="15"
                      value={formData.vitals.gcs}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        vitals: { ...prev.vitals, gcs: e.target.value }
                      }))}
                      data-testid="input-gcs"
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.type || isSubmitting}
              data-testid="button-create"
            >
              {isSubmitting ? "Creating..." : "Create Emergency"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}