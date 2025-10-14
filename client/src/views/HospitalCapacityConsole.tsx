import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  Users, 
  Bed, 
  Stethoscope, 
  Upload, 
  Download, 
  Save, 
  RefreshCw,
  MapPin,
  CheckCircle,
  XCircle,
  Plus,
  Trash2
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";

interface Hospital {
  id: string;
  name: string;
  lat: number;
  lon: number;
  bedsAvailable: number;
  doctorsAvailable: number;
  capabilities: string[];
  acceptingEmergencies: boolean;
}

interface HospitalCapacityUpdate {
  bedsAvailable: number;
  doctorsAvailable: number;
  capabilities: string[];
  acceptingEmergencies: boolean;
}

const HOSPITAL_CAPABILITIES = [
  'Emergency Care',
  'Trauma Center',
  'Cardiac Care',
  'Stroke Center',
  'Pediatric Emergency',
  'Burn Center',
  'Poison Control',
  'ICU',
  'Surgery',
  'Neurology',
  'Orthopedics',
  'Radiology',
  'Blood Bank',
  'Pharmacy',
  'Laboratory'
];

// Dummy data for Emergency Section
const DUMMY_EMERGENCY_PATIENTS = [
  { id: 1, name: "John Doe", age: 45, condition: "Heart Attack", blood: "O+", severity: "Critical", location: "Downtown" },
  { id: 2, name: "Jane Smith", age: 32, condition: "Severe Asthma", blood: "A-", severity: "High", location: "Suburb" },
  { id: 3, name: "Bob Wilson", age: 58, condition: "Stroke", blood: "B+", severity: "Critical", location: "City Center" },
];

const CONDITION_REQUIREMENTS: Record<string, { blood: number; medicines: string[]; equipment: string[] }> = {
  "Heart Attack": {
    blood: 4,
    medicines: ["Aspirin", "Nitroglycerin", "Morphine", "Beta-blockers"],
    equipment: ["ECG Monitor", "Defibrillator", "Oxygen Tank", "IV Setup"]
  },
  "Severe Asthma": {
    blood: 0,
    medicines: ["Albuterol", "Corticosteroids", "Epinephrine", "Oxygen"],
    equipment: ["Nebulizer", "Oxygen Mask", "Pulse Oximeter", "Ventilator"]
  },
  "Stroke": {
    blood: 2,
    medicines: ["tPA", "Anticoagulants", "Blood Thinners", "Aspirin"],
    equipment: ["CT Scanner", "IV Setup", "Blood Pressure Monitor", "Oxygen Tank"]
  }
};

const HOSPITAL_INVENTORY = {
  blood: { "O+": 8, "A-": 3, "B+": 5, "AB+": 2, "O-": 1, "A+": 10, "B-": 2, "AB-": 1 },
  medicines: ["Aspirin", "Nitroglycerin", "Albuterol", "Corticosteroids", "tPA", "Oxygen"],
  equipment: ["ECG Monitor", "Defibrillator", "Nebulizer", "Oxygen Tank", "IV Setup", "Pulse Oximeter", "CT Scanner"]
};

const ALTERNATE_HOSPITALS = [
  { name: "City General Hospital", distance: "2.5 km", hasResource: true },
  { name: "Memorial Medical Center", distance: "4.1 km", hasResource: true },
  { name: "St. Mary's Hospital", distance: "5.8 km", hasResource: false }
];

export function HospitalCapacityConsole() {
  const [currentHospital, setCurrentHospital] = useState<Hospital | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCSVDialog, setShowCSVDialog] = useState(false);
  const [csvData, setCsvData] = useState("");
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>("");
  const [selectedEmergencyPatient, setSelectedEmergencyPatient] = useState(DUMMY_EMERGENCY_PATIENTS[0]);
  
  // Form state for capacity updates
  const [capacityForm, setCapacityForm] = useState<HospitalCapacityUpdate>({
    bedsAvailable: 0,
    doctorsAvailable: 0,
    capabilities: [],
    acceptingEmergencies: true
  });

  const { toast } = useToast();

  // Helper function to check resource availability
  const checkAvailability = (type: 'blood' | 'medicine' | 'equipment', item: string, quantity?: number) => {
    if (type === 'blood') {
      const available = HOSPITAL_INVENTORY.blood[item as keyof typeof HOSPITAL_INVENTORY.blood] || 0;
      return available >= (quantity || 1);
    }
    if (type === 'medicine') {
      return HOSPITAL_INVENTORY.medicines.includes(item);
    }
    if (type === 'equipment') {
      return HOSPITAL_INVENTORY.equipment.includes(item);
    }
    return false;
  };

  // Analytics data for Complete Analysis section
  const bedOccupancyData = [
    { name: 'Occupied', value: 35, color: '#ef4444' },
    { name: 'Available', value: 15, color: '#10b981' },
  ];

  const resourceUsageData = [
    { name: 'Blood Units', usage: 65, available: 35 },
    { name: 'Ventilators', usage: 80, available: 20 },
    { name: 'ICU Beds', usage: 70, available: 30 },
    { name: 'ER Beds', usage: 55, available: 45 },
  ];

  const aiInsights = [
    { icon: "🚨", message: "ICU occupancy predicted to reach 90% in 6 hours.", priority: "high" },
    { icon: "🩸", message: "O- blood low — restock soon.", priority: "medium" },
    { icon: "📊", message: "Peak admission hours expected 6-9 PM today.", priority: "low" },
    { icon: "⚕️", message: "Additional staff required for night shift.", priority: "medium" },
  ];

  // Get requirements for selected emergency patient
  const requirements = CONDITION_REQUIREMENTS[selectedEmergencyPatient.condition] || { blood: 0, medicines: [], equipment: [] };

  // Load hospitals and select current one
  useEffect(() => {
    loadHospitals();
  }, []);

  const loadHospitals = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hospitals');
      if (response.ok) {
        const hospitalsData = await response.json();
        setHospitals(hospitalsData);
        
        // Auto-select first hospital if none selected
        if (hospitalsData.length > 0 && !selectedHospitalId) {
          selectHospital(hospitalsData[0].id);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load hospitals",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectHospital = (hospitalId: string) => {
    const hospital = hospitals.find(h => h.id === hospitalId);
    if (hospital) {
      setCurrentHospital(hospital);
      setSelectedHospitalId(hospitalId);
      setCapacityForm({
        bedsAvailable: hospital.bedsAvailable || 0,
        doctorsAvailable: hospital.doctorsAvailable || 0,
        capabilities: hospital.capabilities || [],
        acceptingEmergencies: hospital.acceptingEmergencies
      });
    }
  };

  const updateCapacity = async () => {
    if (!currentHospital) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/hospitals/${currentHospital.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(capacityForm)
      });

      if (response.ok) {
        const updatedHospital = await response.json();
        setCurrentHospital(updatedHospital);
        
        // Update in hospitals list
        setHospitals(prev => prev.map(h => 
          h.id === currentHospital.id ? updatedHospital : h
        ));

        toast({
          title: "Success",
          description: "Hospital capacity updated successfully"
        });
      } else {
        throw new Error("Failed to update capacity");
      }
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to update hospital capacity",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCapabilityToggle = (capability: string) => {
    setCapacityForm(prev => ({
      ...prev,
      capabilities: prev.capabilities.includes(capability)
        ? prev.capabilities.filter(c => c !== capability)
        : [...prev.capabilities, capability]
    }));
  };

  const exportCSV = () => {
    const csvContent = [
      // CSV Header
      'name,lat,lon,beds_available,doctors_available,capabilities,accepting_emergencies',
      // Hospital data rows
      ...hospitals.map(h => 
        `"${h.name}",${h.lat},${h.lon},${h.bedsAvailable},${h.doctorsAvailable},"${h.capabilities.join(';')}",${h.acceptingEmergencies}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hospitals_capacity_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Hospital data exported to CSV"
    });
  };

  const importCSV = async () => {
    if (!csvData.trim()) {
      toast({
        title: "Error",
        description: "Please paste CSV data first",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/hospitals/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success", 
          description: `Imported ${result.imported} hospitals successfully`
        });
        setShowCSVDialog(false);
        setCsvData("");
        loadHospitals();
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      toast({
        title: "Import Error",
        description: `Failed to import CSV: ${error}`,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="hospital-console">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading hospitals...</span>
        </div>
      </main>
    );
  }

  if (hospitals.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="hospital-console">
        <Card className="shadow-lg">
          <CardContent className="p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-4">No Hospitals Found</h2>
            <p className="text-muted-foreground mb-6">
              No hospitals are registered in the system. Import hospital data to get started.
            </p>
            <Dialog open={showCSVDialog} onOpenChange={setShowCSVDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-import-csv">
                  <Upload className="w-4 h-4 mr-2" />
                  Import Hospital Data
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Hospital CSV Data</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>CSV Format: name,lat,lon,beds_available,doctors_available,capabilities,accepting_emergencies</Label>
                    <Textarea
                      placeholder="Hospital Name,40.7128,-74.0060,50,25,Emergency Care;ICU;Surgery,true"
                      value={csvData}
                      onChange={(e) => setCsvData(e.target.value)}
                      className="mt-2 min-h-32"
                      data-testid="textarea-csv-data"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCSVDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={importCSV} data-testid="button-confirm-import">
                      Import Data
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="hospital-console">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Hospital Capacity Console</h1>
          <p className="text-muted-foreground">Manage hospital resources and availability</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Hospital Selector */}
          <Select value={selectedHospitalId} onValueChange={selectHospital} data-testid="select-hospital">
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select Hospital" />
            </SelectTrigger>
            <SelectContent>
              {hospitals.map(hospital => (
                <SelectItem key={hospital.id} value={hospital.id}>
                  {hospital.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={exportCSV} data-testid="button-export-csv">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          
          <Dialog open={showCSVDialog} onOpenChange={setShowCSVDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-import-csv">
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Hospital CSV Data</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>CSV Format: name,lat,lon,beds_available,doctors_available,capabilities,accepting_emergencies</Label>
                  <Textarea
                    placeholder="Hospital Name,40.7128,-74.0060,50,25,Emergency Care;ICU;Surgery,true"
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    className="mt-2 min-h-32"
                    data-testid="textarea-csv-data"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCSVDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={importCSV} data-testid="button-confirm-import">
                    Import Data
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button onClick={loadHospitals} variant="outline" size="sm" data-testid="button-refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {currentHospital && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Capacity Management */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="capacity" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="capacity" data-testid="tab-capacity">
                  📋 Capacity
                </TabsTrigger>
                <TabsTrigger value="capabilities" data-testid="tab-capabilities">
                  ⚕️ Capabilities
                </TabsTrigger>
                <TabsTrigger value="emergency" data-testid="tab-emergency">
                  🚨 Emergency
                </TabsTrigger>
                <TabsTrigger value="analysis" data-testid="tab-analysis">
                  📊 Analysis
                </TabsTrigger>
              </TabsList>

              {/* Capacity Tab */}
              <TabsContent value="capacity" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Bed className="w-5 h-5 mr-2" />
                      Bed & Staff Capacity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="beds-available">Beds Available</Label>
                        <Input
                          id="beds-available"
                          type="number"
                          min="0"
                          value={capacityForm.bedsAvailable}
                          onChange={(e) => setCapacityForm(prev => ({ 
                            ...prev, 
                            bedsAvailable: parseInt(e.target.value) || 0 
                          }))}
                          className="mt-1"
                          data-testid="input-beds-available"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="doctors-available">Doctors Available</Label>
                        <Input
                          id="doctors-available"
                          type="number"
                          min="0"
                          value={capacityForm.doctorsAvailable}
                          onChange={(e) => setCapacityForm(prev => ({ 
                            ...prev, 
                            doctorsAvailable: parseInt(e.target.value) || 0 
                          }))}
                          className="mt-1"
                          data-testid="input-doctors-available"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="accepting-emergencies"
                        checked={capacityForm.acceptingEmergencies}
                        onCheckedChange={(checked) => setCapacityForm(prev => ({ 
                          ...prev, 
                          acceptingEmergencies: checked 
                        }))}
                        data-testid="switch-accepting-emergencies"
                      />
                      <Label htmlFor="accepting-emergencies" className="font-medium">
                        Currently Accepting Emergency Patients
                      </Label>
                    </div>

                    <Button 
                      onClick={updateCapacity} 
                      disabled={saving}
                      className="w-full"
                      data-testid="button-update-capacity"
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Update Capacity
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Capabilities Tab */}
              <TabsContent value="capabilities" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Stethoscope className="w-5 h-5 mr-2" />
                      Medical Capabilities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {HOSPITAL_CAPABILITIES.map(capability => (
                        <div key={capability} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`capability-${capability}`}
                            checked={capacityForm.capabilities.includes(capability)}
                            onChange={() => handleCapabilityToggle(capability)}
                            className="rounded"
                            data-testid={`checkbox-${capability.toLowerCase().replace(/\s+/g, '-')}`}
                          />
                          <Label htmlFor={`capability-${capability}`} className="text-sm">
                            {capability}
                          </Label>
                        </div>
                      ))}
                    </div>

                    <Button 
                      onClick={updateCapacity} 
                      disabled={saving}
                      className="w-full mt-6"
                      data-testid="button-update-capabilities"
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Update Capabilities
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* EMERGENCY TAB */}
              <TabsContent value="emergency" className="space-y-6">
                {/* Patient Selection */}
                <Card className="border-orange-200 border-2">
                  <CardHeader>
                    <CardTitle>Select Emergency Patient</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {DUMMY_EMERGENCY_PATIENTS.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedEmergencyPatient(p)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            selectedEmergencyPatient.id === p.id
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-orange-300'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold">{p.name}</span>
                            <Badge className={p.severity === "Critical" ? "bg-red-500" : "bg-orange-500"}>
                              {p.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{p.age} yrs • {p.condition}</p>
                          <p className="text-sm text-red-600 font-medium">{p.blood}</p>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Selected Patient & Pre-Arrangement */}
                <Card className="bg-red-50 border-2 border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-800">🚨 EMERGENCY PATIENT</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <p className="font-semibold text-lg">{selectedEmergencyPatient.name}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Age:</span>
                        <p className="font-semibold text-lg">{selectedEmergencyPatient.age} years</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Condition:</span>
                        <p className="font-semibold text-lg text-red-700">{selectedEmergencyPatient.condition}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Blood Type:</span>
                        <p className="font-semibold text-lg text-red-600">{selectedEmergencyPatient.blood}</p>
                      </div>
                    </div>

                    {/* AI Pre-Arrangement List */}
                    <div className="bg-white rounded-lg p-4 border border-red-200">
                      <h3 className="font-semibold text-lg mb-4">🤖 AI-Generated Pre-Arrangement List</h3>
                      
                      {/* Blood Requirements */}
                      {requirements.blood > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-700 mb-2">Blood Requirements</h4>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <span>{selectedEmergencyPatient.blood} - {requirements.blood} units</span>
                            {checkAvailability('blood', selectedEmergencyPatient.blood, requirements.blood) ? (
                              <Badge className="bg-green-500">✅ Available</Badge>
                            ) : (
                              <Badge className="bg-red-500">❌ Unavailable</Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Medicines */}
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-700 mb-2">Required Medicines</h4>
                        <div className="space-y-2">
                          {requirements.medicines.map((med, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span>{med}</span>
                              {checkAvailability('medicine', med) ? (
                                <Badge className="bg-green-500">✅ Available</Badge>
                              ) : (
                                <Badge className="bg-red-500">❌ Unavailable</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Equipment */}
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-700 mb-2">Required Equipment</h4>
                        <div className="space-y-2">
                          {requirements.equipment.map((eq, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span>{eq}</span>
                              {checkAvailability('equipment', eq) ? (
                                <Badge className="bg-green-500">✅ Available</Badge>
                              ) : (
                                <Badge className="bg-red-500">❌ Unavailable</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 mt-6">
                        <Button className="flex-1 bg-green-600 hover:bg-green-700">
                          ⚡ Auto-Arrange
                        </Button>
                        <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                          📢 Notify Staff
                        </Button>
                      </div>
                    </div>

                    {/* Alternate Hospitals */}
                    <div className="mt-6 bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold mb-3">Nearby Hospitals</h4>
                      <div className="space-y-2">
                        {ALTERNATE_HOSPITALS.map((hosp, idx) => (
                          <div key={idx} className="p-3 border rounded-lg">
                            <p className="font-medium">{hosp.name}</p>
                            <p className="text-sm text-gray-600">{hosp.distance}</p>
                            <Badge className={hosp.hasResource ? "bg-green-500 mt-2" : "bg-gray-400 mt-2"}>
                              {hosp.hasResource ? "Has Resources" : "Limited"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* COMPLETE ANALYSIS TAB */}
              <TabsContent value="analysis" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Key Statistics */}
                  <Card>
                    <CardHeader>
                      <CardTitle>📈 Key Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-600">Total Patients Today</p>
                          <p className="text-3xl font-bold text-blue-600">42</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-lg">
                          <p className="text-sm text-gray-600">Bed Occupancy</p>
                          <p className="text-3xl font-bold text-orange-600">70%</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <p className="text-sm text-gray-600">Resource Usage</p>
                          <p className="text-3xl font-bold text-purple-600">68%</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-gray-600">Staff on Duty</p>
                          <p className="text-3xl font-bold text-green-600">24</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bed Occupancy Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Bed Occupancy</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={bedOccupancyData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label
                          >
                            {bedOccupancyData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Resource Usage Chart */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Resource Usage Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={resourceUsageData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Bar dataKey="usage" fill="#ef4444" name="In Use %" />
                          <Bar dataKey="available" fill="#10b981" name="Available %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* AI Insights */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>🤖 AI Insights & Predictions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {aiInsights.map((insight, idx) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-lg border-l-4 ${
                              insight.priority === 'high'
                                ? 'bg-red-50 border-red-500'
                                : insight.priority === 'medium'
                                ? 'bg-orange-50 border-orange-500'
                                : 'bg-blue-50 border-blue-500'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">{insight.icon}</span>
                              <div className="flex-1">
                                <p className="text-gray-800">{insight.message}</p>
                                <Badge
                                  className={`mt-2 ${
                                    insight.priority === 'high'
                                      ? 'bg-red-500'
                                      : insight.priority === 'medium'
                                      ? 'bg-orange-500'
                                      : 'bg-blue-500'
                                  }`}
                                >
                                  {insight.priority.toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Hospital Status Panel */}
          <div className="space-y-6">
            {/* Current Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Hospital Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg" data-testid="hospital-name">
                    {currentHospital.name}
                  </h3>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span data-testid="hospital-location">
                      {currentHospital.lat.toFixed(4)}, {currentHospital.lon.toFixed(4)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {currentHospital.acceptingEmergencies ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <Badge className="bg-green-100 text-green-800" data-testid="status-accepting">
                        Accepting Patients
                      </Badge>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-600" />
                      <Badge variant="destructive" data-testid="status-not-accepting">
                        Not Accepting
                      </Badge>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available Beds:</span>
                    <span className="font-semibold" data-testid="current-beds">
                      {currentHospital.bedsAvailable}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available Doctors:</span>
                    <span className="font-semibold" data-testid="current-doctors">
                      {currentHospital.doctorsAvailable}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Capabilities Card */}
            <Card>
              <CardHeader>
                <CardTitle>Current Capabilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {currentHospital.capabilities.map(capability => (
                    <Badge key={capability} variant="secondary" data-testid={`capability-${capability.toLowerCase().replace(/\s+/g, '-')}`}>
                      {capability}
                    </Badge>
                  ))}
                  {currentHospital.capabilities.length === 0 && (
                    <p className="text-muted-foreground text-sm">No capabilities configured</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Hospitals:</span>
                  <span className="font-semibold" data-testid="total-hospitals">
                    {hospitals.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Accepting Patients:</span>
                  <span className="font-semibold" data-testid="accepting-hospitals">
                    {hospitals.filter(h => h.acceptingEmergencies).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Beds:</span>
                  <span className="font-semibold" data-testid="total-beds">
                    {hospitals.reduce((sum, h) => sum + (h.bedsAvailable || 0), 0)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </main>
  );
}