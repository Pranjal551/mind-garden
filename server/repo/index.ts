import type { Profile, Hospital, Emergency, NewEmergency, IncidentEvent, AmbulancePosition, EmergencyFilter } from './types';

export interface Repo {
  // auth / profiles
  getProfile(userId: string): Promise<Profile | null>;
  upsertProfile(profile: Profile): Promise<void>;

  // hospitals
  listHospitals(): Promise<Hospital[]>;
  getHospital(id: string): Promise<Hospital | null>;
  upsertHospital(hospital: Hospital): Promise<void>;

  // emergencies
  createEmergency(emergency: NewEmergency): Promise<Emergency>;
  listEmergencies(filter?: EmergencyFilter): Promise<Emergency[]>;
  getEmergency(id: string): Promise<Emergency | null>;
  updateEmergency(id: string, patch: Partial<Emergency>): Promise<void>;

  // incident events (timeline)
  addIncidentEvent(event: IncidentEvent): Promise<void>;
  listIncidentEvents(emergencyId: string): Promise<IncidentEvent[]>;

  // ambulance positions
  addAmbulancePosition(position: AmbulancePosition): Promise<void>;
  listAmbulancePositions(ambulanceId: string, limit?: number): Promise<AmbulancePosition[]>;

  // archival
  archiveCompleted(olderThanDays: number): Promise<number>;
}

export * from './types';