import { useState } from "react";
import { useAI4HStore } from "../store/ai4h-store";
import { Timeline } from "../components/Timeline";
import { StatusChip } from "../components/StatusChip";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Dummy data for Emergency Section
const DUMMY_PATIENTS = [
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

export function HospitalView() {
  const { status, patient, geo, etaMin, history, startHospitalPrep } = useAI4HStore();
  const [prepChecklist, setPrepChecklist] = useState({
    erBed: false,
    bloodReady: false,
    ventilator: false,
    nebulizer: false,
  });
  const [prepStarted, setPrepStarted] = useState(false);
  const [selectedEmergencyPatient, setSelectedEmergencyPatient] = useState(DUMMY_PATIENTS[0]);

  const handlePrepStarted = () => {
    startHospitalPrep();
    setPrepStarted(true);
  };

  const handleChecklistChange = (item: keyof typeof prepChecklist, checked: boolean) => {
    setPrepChecklist(prev => ({ ...prev, [item]: checked }));
  };

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

  if (!patient || !status) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="hospital-view">
        <Card className="shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">🏥</div>
            <h2 className="text-2xl font-semibold mb-4">Waiting for Emergency Alerts</h2>
            <p className="text-muted-foreground">
              Patient notifications will appear here when emergencies are reported
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Mock data for today's alerts
  const todayAlerts = [
    { id: "1", name: patient.name, status, time: "2:34 PM", condition: patient.conditions[0], blood: patient.blood }
  ];

  // Get requirements for selected emergency patient
  const requirements = CONDITION_REQUIREMENTS[selectedEmergencyPatient.condition] || { blood: 0, medicines: [], equipment: [] };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="hospital-view">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="overview">📋 Overview</TabsTrigger>
          <TabsTrigger value="emergency">🚨 Emergency</TabsTrigger>
          <TabsTrigger value="analysis">📊 Complete Analysis</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB - Existing Content */}
        <TabsContent value="overview">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incoming Patient Card */}
        <div className="lg:col-span-2">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-blue-800">📋 INCOMING PATIENT</h2>
              <StatusChip status={status} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Patient Details</h3>
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
                    <span className="text-gray-600">Medical History:</span>
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
                <h3 className="font-semibold text-gray-900 mb-3">Arrival Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-600">Current Status:</span>
                    <p className="font-medium" data-testid="ambulance-status">
                      {status === "NEW" ? "Emergency Reported" :
                       status === "ACK" ? "Ambulance Acknowledged" :
                       status === "ENROUTE" ? "Ambulance En Route" :
                       "Ambulance Arrived"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Estimated Arrival:</span>
                    <p className="font-bold text-lg text-blue-600" data-testid="eta-minutes">
                      {etaMin ? `${etaMin} minutes` : "Calculating..."}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Emergency Contact:</span>
                    <p className="font-medium" data-testid="guardian-name">{patient.guardian.name}</p>
                    <p className="text-blue-600" data-testid="guardian-phone">{patient.guardian.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Preparation Checklist */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Emergency Preparation Checklist</h3>
                <Button
                  onClick={handlePrepStarted}
                  disabled={prepStarted}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                  data-testid="button-prep-started"
                >
                  <i className="fas fa-check mr-2"></i>
                  {prepStarted ? "Prep Complete" : "Prep Started"}
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="er-bed"
                      checked={prepChecklist.erBed}
                      onCheckedChange={(checked) => handleChecklistChange('erBed', checked as boolean)}
                      data-testid="checkbox-er-bed"
                    />
                    <label htmlFor="er-bed" className="text-foreground cursor-pointer">
                      ER Bed Available
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="blood-ready"
                      checked={prepChecklist.bloodReady}
                      onCheckedChange={(checked) => handleChecklistChange('bloodReady', checked as boolean)}
                      data-testid="checkbox-blood-ready"
                    />
                    <label htmlFor="blood-ready" className="text-foreground cursor-pointer">
                      {patient.blood} Blood Ready
                    </label>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="ventilator"
                      checked={prepChecklist.ventilator}
                      onCheckedChange={(checked) => handleChecklistChange('ventilator', checked as boolean)}
                      data-testid="checkbox-ventilator"
                    />
                    <label htmlFor="ventilator" className="text-foreground cursor-pointer">
                      Ventilator Ready
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="nebulizer"
                      checked={prepChecklist.nebulizer}
                      onCheckedChange={(checked) => handleChecklistChange('nebulizer', checked as boolean)}
                      data-testid="checkbox-nebulizer"
                    />
                    <label htmlFor="nebulizer" className="text-foreground cursor-pointer">
                      Asthma Nebulizer
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Today's Alerts Panel */}
        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Today's Emergency Alerts</h3>
              <div className="space-y-3" data-testid="today-alerts">
                {todayAlerts.map((alert) => (
                  <div key={alert.id} className="border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm" data-testid={`alert-name-${alert.id}`}>
                        {alert.name}
                      </span>
                      <StatusChip status={alert.status} />
                    </div>
                    <p className="text-xs text-muted-foreground" data-testid={`alert-details-${alert.id}`}>
                      {alert.time} - {alert.condition}, {alert.blood}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Hospital Resources */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Resource Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">ER Beds</span>
                  <span className="text-green-600 font-medium" data-testid="resource-er-beds">3 Available</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">ICU Beds</span>
                  <span className="text-amber-600 font-medium" data-testid="resource-icu-beds">1 Available</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{patient.blood} Blood</span>
                  <span className="text-green-600 font-medium" data-testid="resource-blood">12 Units</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Staff on Duty</span>
                  <span className="text-green-600 font-medium" data-testid="resource-staff">8 Doctors</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Timeline */}
      <div className="mt-8">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Patient Timeline</h2>
            <Timeline history={history} />
          </CardContent>
        </Card>
      </div>
        </TabsContent>

        {/* EMERGENCY TAB */}
        <TabsContent value="emergency">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Patient Selection */}
            <div className="lg:col-span-3">
              <Card className="shadow-lg border-orange-200 border-2">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Select Emergency Patient</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {DUMMY_PATIENTS.map((p) => (
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
            </div>

            {/* Selected Patient Details */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg bg-red-50 border-2 border-red-200">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-red-800 mb-4">🚨 EMERGENCY PATIENT</h2>
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
                    <div>
                      <span className="text-gray-600">Severity:</span>
                      <Badge className={selectedEmergencyPatient.severity === "Critical" ? "bg-red-600" : "bg-orange-500"}>
                        {selectedEmergencyPatient.severity}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <p className="font-semibold">{selectedEmergencyPatient.location}</p>
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
                        {!checkAvailability('blood', selectedEmergencyPatient.blood, requirements.blood) && (
                          <div className="mt-2 flex gap-2">
                            <Button size="sm" variant="outline" className="text-orange-600 border-orange-600">
                              Suggest Alternate Hospital
                            </Button>
                            <Button size="sm" variant="outline" className="text-blue-600 border-blue-600">
                              Request Support
                            </Button>
                          </div>
                        )}
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
                </CardContent>
              </Card>
            </div>

            {/* Alternate Hospitals */}
            <div>
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Nearby Hospitals</h3>
                  <div className="space-y-3">
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
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* COMPLETE ANALYSIS TAB */}
        <TabsContent value="analysis">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Statistics */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">📈 Key Statistics</h3>
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
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Bed Occupancy</h3>
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
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Resource Usage Chart */}
            <Card className="shadow-lg lg:col-span-2">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Resource Usage Analysis</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={resourceUsageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="usage" fill="#ef4444" name="In Use %" />
                    <Bar dataKey="available" fill="#10b981" name="Available %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card className="shadow-lg lg:col-span-2">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">🤖 AI Insights & Predictions</h3>
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
    </main>
  );
}
