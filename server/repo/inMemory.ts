import type { Repo, Profile, Hospital, Emergency, NewEmergency, IncidentEvent, AmbulancePosition, EmergencyFilter } from './index';
import { randomUUID } from 'crypto';

export class InMemoryRepo implements Repo {
  private profiles = new Map<string, Profile>();
  private hospitals = new Map<string, Hospital>();
  private emergencies = new Map<string, Emergency>();
  private incidentEvents = new Map<string, IncidentEvent[]>();
  private ambulancePositions = new Map<string, AmbulancePosition[]>();

  constructor() {
    // Initialize with demo data
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Demo hospitals
    const demoHospitals: Hospital[] = [
      {
        id: 'hosp-001',
        name: 'City General Hospital',
        lat: 12.9716,
        lon: 77.5946,
        beds_available: 15,
        doctors_available: 8,
        capabilities: ['ICU', 'Ventilator', 'Cardio'],
        accepting_emergencies: true,
        created_at: new Date()
      },
      {
        id: 'hosp-002',
        name: 'Apollo Specialty Center',
        lat: 12.9352,
        lon: 77.6245,
        beds_available: 8,
        doctors_available: 12,
        capabilities: ['ICU', 'Ventilator', 'Peds', 'Neuro'],
        accepting_emergencies: true,
        created_at: new Date()
      },
      {
        id: 'hosp-003',
        name: 'Fortis Healthcare',
        lat: 12.9698,
        lon: 77.7500,
        beds_available: 20,
        doctors_available: 15,
        capabilities: ['ICU', 'Ventilator', 'Cardio', 'Peds', 'Neuro'],
        accepting_emergencies: true,
        created_at: new Date()
      }
    ];

    demoHospitals.forEach(hospital => {
      this.hospitals.set(hospital.id, hospital);
    });

    // Demo profiles
    const demoProfiles: Profile[] = [
      { id: 'demo-admin', role: 'admin', name: 'Demo Admin', phone: '+91-98765-43210' },
      { id: 'demo-patient', role: 'patient', name: 'Rahul Mehta', phone: '+91-90000-00000' },
      { id: 'demo-driver', role: 'driver', name: 'Ambulance Driver', phone: '+91-88888-88888' }
    ];

    demoProfiles.forEach(profile => {
      this.profiles.set(profile.id, profile);
    });
  }

  async getProfile(userId: string): Promise<Profile | null> {
    return this.profiles.get(userId) || null;
  }

  async upsertProfile(profile: Profile): Promise<void> {
    this.profiles.set(profile.id, { ...profile, created_at: profile.created_at || new Date() });
  }

  async listHospitals(): Promise<Hospital[]> {
    return Array.from(this.hospitals.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getHospital(id: string): Promise<Hospital | null> {
    return this.hospitals.get(id) || null;
  }

  async upsertHospital(hospital: Hospital): Promise<void> {
    this.hospitals.set(hospital.id, { ...hospital, created_at: hospital.created_at || new Date() });
  }

  async createEmergency(newEmergency: NewEmergency): Promise<Emergency> {
    const id = randomUUID();
    const now = new Date();

    // Check for duplicates (same patient_id within 5 minutes and 100m)
    const recentEmergencies = Array.from(this.emergencies.values())
      .filter(e => 
        e.patient_id === newEmergency.patient_id &&
        e.status !== 'completed' &&
        e.status !== 'cancelled' &&
        (now.getTime() - e.created_at.getTime()) < 5 * 60 * 1000 // 5 minutes
      );

    let duplicate_of: string | undefined;
    for (const existing of recentEmergencies) {
      const distance = this.calculateDistance(
        existing.lat, existing.lon,
        newEmergency.lat, newEmergency.lon
      );
      if (distance < 0.1) { // 100m = 0.1km
        duplicate_of = existing.id;
        break;
      }
    }

    const emergency: Emergency = {
      id,
      ...newEmergency,
      status: 'active',
      duplicate_of,
      created_at: now,
      updated_at: now
    };

    this.emergencies.set(id, emergency);

    // Add initial incident event
    await this.addIncidentEvent({
      id: randomUUID(),
      emergency_id: id,
      kind: 'created',
      data: { 
        triage_score: newEmergency.triage_score,
        type: newEmergency.type,
        needs: newEmergency.needs,
        duplicate_of 
      },
      ts: now
    });

    return emergency;
  }

  async listEmergencies(filter?: EmergencyFilter): Promise<Emergency[]> {
    let emergencies = Array.from(this.emergencies.values());

    if (filter?.status) {
      emergencies = emergencies.filter(e => filter.status!.includes(e.status));
    }

    // Sort by created_at descending (newest first)
    return emergencies.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  async getEmergency(id: string): Promise<Emergency | null> {
    return this.emergencies.get(id) || null;
  }

  async updateEmergency(id: string, patch: Partial<Emergency>): Promise<void> {
    const existing = this.emergencies.get(id);
    if (!existing) return;

    const updated = { ...existing, ...patch, updated_at: new Date() };
    this.emergencies.set(id, updated);
  }

  async addIncidentEvent(event: IncidentEvent): Promise<void> {
    const events = this.incidentEvents.get(event.emergency_id) || [];
    events.push(event);
    this.incidentEvents.set(event.emergency_id, events);
  }

  async listIncidentEvents(emergencyId: string): Promise<IncidentEvent[]> {
    const events = this.incidentEvents.get(emergencyId) || [];
    return events.sort((a, b) => a.ts.getTime() - b.ts.getTime());
  }

  async addAmbulancePosition(position: AmbulancePosition): Promise<void> {
    const positions = this.ambulancePositions.get(position.ambulance_id) || [];
    positions.push({ ...position, id: position.id || randomUUID() });
    
    // Keep only last 100 positions per ambulance
    if (positions.length > 100) {
      positions.splice(0, positions.length - 100);
    }
    
    this.ambulancePositions.set(position.ambulance_id, positions);
  }

  async listAmbulancePositions(ambulanceId: string, limit = 50): Promise<AmbulancePosition[]> {
    const positions = this.ambulancePositions.get(ambulanceId) || [];
    return positions
      .sort((a, b) => b.ts.getTime() - a.ts.getTime())
      .slice(0, limit);
  }

  async archiveCompleted(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let archivedCount = 0;
    const emergencyEntries = Array.from(this.emergencies.entries());
    
    for (const [id, emergency] of emergencyEntries) {
      if (emergency.status === 'completed' && emergency.updated_at < cutoffDate) {
        this.emergencies.delete(id);
        this.incidentEvents.delete(id);
        archivedCount++;
      }
    }

    return archivedCount;
  }

  // Helper method to calculate distance between two points (Haversine formula)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}