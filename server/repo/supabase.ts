import type { Repo, Profile, Hospital, Emergency, NewEmergency, IncidentEvent, AmbulancePosition, EmergencyFilter } from './index';

// Stub implementation for Supabase - will be fully implemented when USE_SUPABASE=1
export class SupabaseRepo implements Repo {
  constructor() {
    console.log('⚠️  SupabaseRepo is a stub implementation. Please implement when USE_SUPABASE=1');
  }

  async getProfile(userId: string): Promise<Profile | null> {
    throw new Error('SupabaseRepo not implemented yet. Set USE_SUPABASE=0 to use InMemoryRepo');
  }

  async upsertProfile(profile: Profile): Promise<void> {
    throw new Error('SupabaseRepo not implemented yet. Set USE_SUPABASE=0 to use InMemoryRepo');
  }

  async listHospitals(): Promise<Hospital[]> {
    throw new Error('SupabaseRepo not implemented yet. Set USE_SUPABASE=0 to use InMemoryRepo');
  }

  async getHospital(id: string): Promise<Hospital | null> {
    throw new Error('SupabaseRepo not implemented yet. Set USE_SUPABASE=0 to use InMemoryRepo');
  }

  async upsertHospital(hospital: Hospital): Promise<void> {
    throw new Error('SupabaseRepo not implemented yet. Set USE_SUPABASE=0 to use InMemoryRepo');
  }

  async createEmergency(emergency: NewEmergency): Promise<Emergency> {
    throw new Error('SupabaseRepo not implemented yet. Set USE_SUPABASE=0 to use InMemoryRepo');
  }

  async listEmergencies(filter?: EmergencyFilter): Promise<Emergency[]> {
    throw new Error('SupabaseRepo not implemented yet. Set USE_SUPABASE=0 to use InMemoryRepo');
  }

  async getEmergency(id: string): Promise<Emergency | null> {
    throw new Error('SupabaseRepo not implemented yet. Set USE_SUPABASE=0 to use InMemoryRepo');
  }

  async updateEmergency(id: string, patch: Partial<Emergency>): Promise<void> {
    throw new Error('SupabaseRepo not implemented yet. Set USE_SUPABASE=0 to use InMemoryRepo');
  }

  async addIncidentEvent(event: IncidentEvent): Promise<void> {
    throw new Error('SupabaseRepo not implemented yet. Set USE_SUPABASE=0 to use InMemoryRepo');
  }

  async listIncidentEvents(emergencyId: string): Promise<IncidentEvent[]> {
    throw new Error('SupabaseRepo not implemented yet. Set USE_SUPABASE=0 to use InMemoryRepo');
  }

  async addAmbulancePosition(position: AmbulancePosition): Promise<void> {
    throw new Error('SupabaseRepo not implemented yet. Set USE_SUPABASE=0 to use InMemoryRepo');
  }

  async listAmbulancePositions(ambulanceId: string, limit?: number): Promise<AmbulancePosition[]> {
    throw new Error('SupabaseRepo not implemented yet. Set USE_SUPABASE=0 to use InMemoryRepo');
  }

  async archiveCompleted(olderThanDays: number): Promise<number> {
    throw new Error('SupabaseRepo not implemented yet. Set USE_SUPABASE=0 to use InMemoryRepo');
  }
}