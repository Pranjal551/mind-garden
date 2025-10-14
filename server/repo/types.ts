export interface Profile {
  id: string;
  role: 'patient' | 'driver' | 'hospital' | 'admin';
  name?: string;
  phone?: string;
  created_at?: Date;
}

export interface Hospital {
  id: string;
  name: string;
  lat: number;
  lon: number;
  beds_available: number;
  doctors_available: number;
  capabilities: string[];
  accepting_emergencies: boolean;
  created_at?: Date;
}

export interface NewEmergency {
  patient_id: string;
  lat: number;
  lon: number;
  type: string;
  needs: string[];
  triage_score: number;
  vitals?: {
    hr?: number; // heart rate
    spo2?: number; // oxygen saturation
    sbp?: number; // systolic blood pressure
    rr?: number; // respiratory rate
    gcs?: number; // glasgow coma scale
  };
}

export interface Emergency {
  id: string;
  patient_id: string;
  lat: number;
  lon: number;
  type: string;
  needs: string[];
  triage_score: number;
  status: 'active' | 'assigned' | 'enroute' | 'arrived' | 'completed' | 'cancelled';
  assigned_hospital_id?: string;
  rerouted_to_id?: string;
  assigned_eta_min?: number;
  duplicate_of?: string;
  vitals?: {
    hr?: number;
    spo2?: number;
    sbp?: number;
    rr?: number;
    gcs?: number;
  };
  created_at: Date;
  updated_at: Date;
}

export interface IncidentEvent {
  id: string;
  emergency_id: string;
  kind: 'created' | 'triage' | 'assigned' | 'reroute' | 'enroute' | 'arrived' | 'completed' | 'notified' | 'note';
  data: Record<string, any>;
  ts: Date;
}

export interface AmbulancePosition {
  id?: string;
  ambulance_id: string;
  lat: number;
  lon: number;
  ts: Date;
}

export interface EmergencyFilter {
  status?: string[];
  triage_level?: string[];
  needs?: string[];
}