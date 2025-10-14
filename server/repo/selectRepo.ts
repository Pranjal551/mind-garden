import { InMemoryRepo } from './inMemory';
import { SupabaseRepo } from './supabase';
import type { Repo } from './index';

let repoInstance: Repo | null = null;

export function selectRepo(): Repo {
  if (!repoInstance) {
    const useSupabase = process.env.USE_SUPABASE === '1';
    
    if (useSupabase) {
      console.log('🗄️  Using SupabaseRepo for data persistence');
      repoInstance = new SupabaseRepo();
    } else {
      console.log('💾 Using InMemoryRepo for data persistence');
      repoInstance = new InMemoryRepo();
    }
  }
  
  return repoInstance;
}

// Helper to reset repo instance (useful for testing or config changes)
export function resetRepo(): void {
  repoInstance = null;
}