import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Patient, GeoLocation } from "../types";
import { demoPatient } from "../types";
import { nowISO } from "../utils/time";
import { safeNotify } from "../utils/notify";

// Enhanced emergency state for multiple emergencies
export interface EnhancedEmergency {
  id: string;
  patientId: string;
  patient: Patient;
  type: string;
  status: 'active' | 'assigned' | 'enroute' | 'arrived' | 'completed' | 'cancelled';
  needs: string[];
  triageScore: number;
  triageLevel: 'red' | 'yellow' | 'green';
  location: GeoLocation;
  vitals?: {
    hr?: number;
    spo2?: number; 
    sbp?: number;
    rr?: number;
    gcs?: number;
  };
  assignedHospital?: {
    id: string;
    name: string;
    eta: number;
  };
  timeline: EmergencyEvent[];
  createdAt: string;
  updatedAt: string;
  duplicateOf?: string;
}

export interface EmergencyEvent {
  id: string;
  ts: string;
  actor: 'USER' | 'AMBULANCE' | 'HOSPITAL' | 'SYSTEM';
  type: 'created' | 'assigned' | 'acknowledged' | 'enroute' | 'arrived' | 'completed' | 'rerouted' | 'note';
  message: string;
  data?: Record<string, any>;
}

interface MultiEmergencyStore {
  // State
  emergencies: Map<string, EnhancedEmergency>;
  activeEmergencyId: string | null;
  
  // Actions
  createEmergency: (data: CreateEmergencyData) => Promise<string>;
  updateEmergency: (id: string, updates: Partial<EnhancedEmergency>) => void;
  addTimelineEvent: (emergencyId: string, event: Omit<EmergencyEvent, 'id'>) => void;
  setActiveEmergency: (id: string | null) => void;
  
  // Ambulance actions
  acknowledgeEmergency: (id: string) => void;
  startEnroute: (id: string) => void;
  markArrived: (id: string) => void;
  
  // Hospital actions
  startPreparation: (id: string) => void;
  completeEmergency: (id: string) => void;
  
  // Utility
  getActiveEmergency: () => EnhancedEmergency | null;
  getEmergencyById: (id: string) => EnhancedEmergency | null;
  getAllEmergencies: () => EnhancedEmergency[];
  getEmergenciesByStatus: (status: string[]) => EnhancedEmergency[];
  checkForDuplicate: (patientId: string, location: GeoLocation) => string | null;
  clearAllEmergencies: () => void;
}

export interface CreateEmergencyData {
  patientId?: string;
  patient?: Patient;
  type: string;
  location: GeoLocation;
  vitals?: {
    hr?: number;
    spo2?: number;
    sbp?: number;
    rr?: number;
    gcs?: number;
  };
  needs?: string[];
}

// Helper to calculate triage score (simplified version)
function calculateTriageScore(vitals: any, emergencyType: string): { score: number; level: 'red' | 'yellow' | 'green'; needs: string[] } {
  let score = 0;
  const needs: string[] = [];

  // Vitals scoring
  if (vitals?.hr) {
    if (vitals.hr > 120 || vitals.hr < 50) score += 15;
    if (vitals.hr > 140 || vitals.hr < 40) score += 25;
  }

  if (vitals?.spo2) {
    if (vitals.spo2 < 92) score += 20;
    if (vitals.spo2 < 85) score += 30;
  }

  if (vitals?.gcs && vitals.gcs < 13) {
    score += 20;
    needs.push('Neuro');
  }

  // Emergency type scoring
  const type = emergencyType.toLowerCase();
  if (type.includes('cardiac') || type.includes('heart')) {
    score += 25;
    needs.push('Cardio', 'ICU');
  }
  if (type.includes('trauma') || type.includes('accident')) {
    score += 20;
    needs.push('ICU');
  }
  if (type.includes('respiratory') || type.includes('breathing')) {
    score += 15;
    needs.push('Ventilator');
  }

  // Determine level
  let level: 'red' | 'yellow' | 'green' = 'green';
  if (score >= 70) level = 'red';
  else if (score >= 30) level = 'yellow';

  return { score: Math.min(score, 100), level, needs };
}

// Helper to calculate distance between two points
function calculateDistance(loc1: GeoLocation, loc2: GeoLocation): number {
  if (!loc1.lat || !loc1.lon || !loc2.lat || !loc2.lon) return Infinity;
  
  const R = 6371; // Earth's radius in km
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLon = (loc2.lon - loc1.lon) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

// Helper functions for Map serialization
const serializeEmergencies = (emergencies: Map<string, EnhancedEmergency>) => {
  return Array.from(emergencies.entries());
};

const deserializeEmergencies = (data: any): Map<string, EnhancedEmergency> => {
  if (!data) return new Map();
  if (Array.isArray(data)) {
    return new Map(data);
  }
  if (typeof data === 'object') {
    return new Map(Object.entries(data));
  }
  return new Map();
};

export const useMultiEmergencyStore = create<MultiEmergencyStore>()(
  persist(
    (set, get) => ({
      emergencies: new Map(),
      activeEmergencyId: null,

      createEmergency: async (data: CreateEmergencyData): Promise<string> => {
        const now = nowISO();
        const patientId = data.patientId || `patient-${Date.now()}`;
        const patient = data.patient || { ...demoPatient, id: patientId };
        
        // Check for duplicates (same patient within 5 minutes and 100m)
        const duplicateId = get().checkForDuplicate(patientId, data.location);
        
        const triage = calculateTriageScore(data.vitals || {}, data.type);
        
        const emergency: EnhancedEmergency = {
          id: `emr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          patientId,
          patient,
          type: data.type,
          status: 'active',
          needs: data.needs || triage.needs,
          triageScore: triage.score,
          triageLevel: triage.level,
          location: data.location,
          vitals: data.vitals,
          timeline: [{
            id: `evt-${Date.now()}`,
            ts: now,
            actor: 'USER',
            type: 'created',
            message: `Emergency created: ${data.type}`,
            data: { 
              triage_score: triage.score,
              triage_level: triage.level,
              needs: triage.needs,
              duplicate_of: duplicateId
            }
          }],
          createdAt: now,
          updatedAt: now,
          duplicateOf: duplicateId || undefined
        };

        // Send to backend if available
        try {
          const response = await fetch('/api/emergencies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              enhanced: true,
              patient_id: patientId,
              lat: data.location.lat,
              lon: data.location.lon,
              type: data.type,
              vitals: data.vitals,
              // Legacy fields for compatibility
              patientId,
              status: 'active',
              history: emergency.timeline.map(t => ({
                ts: t.ts,
                actor: t.actor,
                type: 'SOS_NEW',
                note: t.message
              })),
              location: data.location
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('Emergency created on server:', result);
          }
        } catch (error) {
          console.warn('Failed to sync with server:', error);
        }

        set(state => ({
          emergencies: new Map(state.emergencies).set(emergency.id, emergency),
          activeEmergencyId: emergency.id
        }));

        // Broadcast to other tabs
        window.dispatchEvent(new CustomEvent('emergency-created', { 
          detail: { emergency } 
        }));

        safeNotify(
          duplicateId ? "Duplicate Emergency Detected" : "Emergency Alert Created",
          duplicateId 
            ? `Similar emergency exists. Created anyway with triage level: ${triage.level.toUpperCase()}`
            : `Triage level: ${triage.level.toUpperCase()} (Score: ${triage.score})`
        );

        return emergency.id;
      },

      updateEmergency: (id: string, updates: Partial<EnhancedEmergency>) => {
        set(state => {
          const emergency = state.emergencies.get(id);
          if (!emergency) return state;
          
          const updated = { ...emergency, ...updates, updatedAt: nowISO() };
          const newEmergencies = new Map(state.emergencies);
          newEmergencies.set(id, updated);
          
          return { emergencies: newEmergencies };
        });
      },

      addTimelineEvent: (emergencyId: string, event: Omit<EmergencyEvent, 'id'>) => {
        set(state => {
          const emergency = state.emergencies.get(emergencyId);
          if (!emergency) return state;
          
          const newEvent: EmergencyEvent = {
            ...event,
            id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
          };
          
          const updated = {
            ...emergency,
            timeline: [...emergency.timeline, newEvent],
            updatedAt: nowISO()
          };
          
          const newEmergencies = new Map(state.emergencies);
          newEmergencies.set(emergencyId, updated);
          
          return { emergencies: newEmergencies };
        });
      },

      setActiveEmergency: (id: string | null) => {
        set({ activeEmergencyId: id });
      },

      acknowledgeEmergency: (id: string) => {
        const emergency = get().emergencies.get(id);
        if (!emergency) return;

        get().updateEmergency(id, { status: 'assigned' });
        get().addTimelineEvent(id, {
          ts: nowISO(),
          actor: 'AMBULANCE',
          type: 'acknowledged',
          message: 'Emergency acknowledged by ambulance crew',
        });

        safeNotify("Emergency Acknowledged", `Ambulance responding to ${emergency.type}`);
      },

      startEnroute: (id: string) => {
        const emergency = get().emergencies.get(id);
        if (!emergency) return;

        get().updateEmergency(id, { status: 'enroute' });
        get().addTimelineEvent(id, {
          ts: nowISO(),
          actor: 'AMBULANCE',
          type: 'enroute',
          message: 'Ambulance en route to patient location',
          data: { eta: emergency.assignedHospital?.eta }
        });

        safeNotify("Ambulance En Route", `ETA: ${emergency.assignedHospital?.eta || 'Unknown'} minutes`);
      },

      markArrived: (id: string) => {
        const emergency = get().emergencies.get(id);
        if (!emergency) return;

        get().updateEmergency(id, { status: 'arrived' });
        get().addTimelineEvent(id, {
          ts: nowISO(),
          actor: 'AMBULANCE',
          type: 'arrived',
          message: 'Ambulance arrived at patient location',
        });

        safeNotify("Ambulance Arrived", "Emergency response team is on scene");
      },

      startPreparation: (id: string) => {
        const emergency = get().emergencies.get(id);
        if (!emergency) return;

        get().addTimelineEvent(id, {
          ts: nowISO(),
          actor: 'HOSPITAL',
          type: 'note',
          message: 'Hospital preparation started',
          data: { hospital: emergency.assignedHospital?.name }
        });

        safeNotify("Hospital Prep Started", "Emergency room is being prepared");
      },

      completeEmergency: (id: string) => {
        const emergency = get().emergencies.get(id);
        if (!emergency) return;

        get().updateEmergency(id, { status: 'completed' });
        get().addTimelineEvent(id, {
          ts: nowISO(),
          actor: 'HOSPITAL',
          type: 'completed',
          message: 'Emergency care completed',
        });

        safeNotify("Emergency Completed", "Patient care has been completed");
      },

      getActiveEmergency: () => {
        const { emergencies, activeEmergencyId } = get();
        return activeEmergencyId ? emergencies.get(activeEmergencyId) || null : null;
      },

      getEmergencyById: (id: string) => {
        return get().emergencies.get(id) || null;
      },

      getAllEmergencies: () => {
        return Array.from(get().emergencies.values())
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      getEmergenciesByStatus: (statuses: string[]) => {
        return get().getAllEmergencies().filter(e => statuses.includes(e.status));
      },

      checkForDuplicate: (patientId: string, location: GeoLocation): string | null => {
        const emergencies = get().getAllEmergencies();
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        for (const emergency of emergencies) {
          // Skip completed/cancelled emergencies
          if (emergency.status === 'completed' || emergency.status === 'cancelled') continue;
          
          // Check same patient
          if (emergency.patientId === patientId) {
            // Check time window (5 minutes)
            const emergencyTime = new Date(emergency.createdAt);
            if (emergencyTime >= fiveMinutesAgo) {
              // Check distance (100 meters = 0.1 km)
              const distance = calculateDistance(emergency.location, location);
              if (distance < 0.1) {
                return emergency.id;
              }
            }
          }
        }

        return null;
      },

      clearAllEmergencies: () => {
        set({
          emergencies: new Map(),
          activeEmergencyId: null
        });
        safeNotify("All Emergencies Cleared", "Ready for new alerts");
      },

    }),
    {
      name: "multi-emergency-store",
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            if (!str) return null;
            
            const parsed = JSON.parse(str);
            // Properly deserialize emergencies Map
            if (parsed.state?.emergencies) {
              parsed.state.emergencies = deserializeEmergencies(parsed.state.emergencies);
            }
            return parsed;
          } catch (error) {
            console.warn('Failed to load persisted state:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            // Convert Map to serializable array
            const toSave = { ...value };
            if (toSave.state?.emergencies instanceof Map) {
              toSave.state.emergencies = serializeEmergencies(toSave.state.emergencies);
            }
            localStorage.setItem(name, JSON.stringify(toSave));
          } catch (error) {
            console.warn('Failed to persist state:', error);
          }
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);