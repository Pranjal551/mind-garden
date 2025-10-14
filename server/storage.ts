import { type User, type InsertUser, type Emergency, type InsertEmergency } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getEmergency(id: string): Promise<Emergency | undefined>;
  createEmergency(emergency: InsertEmergency): Promise<Emergency>;
  updateEmergency(id: string, emergency: Partial<InsertEmergency>): Promise<Emergency | undefined>;
  getAllEmergencies(): Promise<Emergency[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private emergencies: Map<string, Emergency>;

  constructor() {
    this.users = new Map();
    this.emergencies = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getEmergency(id: string): Promise<Emergency | undefined> {
    return this.emergencies.get(id);
  }

  async createEmergency(insertEmergency: InsertEmergency): Promise<Emergency> {
    const id = randomUUID();
    const now = new Date();
    const emergency: Emergency = {
      ...insertEmergency,
      id,
      location: insertEmergency.location || null,
      etaMin: insertEmergency.etaMin || null,
      // Ensure new fields have proper defaults
      lat: insertEmergency.lat || null,
      lon: insertEmergency.lon || null,
      type: insertEmergency.type || null,
      needs: insertEmergency.needs || null,
      triageScore: insertEmergency.triageScore || null,
      status: insertEmergency.status || 'active',
      assignedHospitalId: insertEmergency.assignedHospitalId || null,
      reroutedToId: insertEmergency.reroutedToId || null,
      assignedEtaMin: insertEmergency.assignedEtaMin || null,
      duplicateOf: insertEmergency.duplicateOf || null,
      vitals: insertEmergency.vitals || null,
      createdAt: now,
      updatedAt: now,
    };
    this.emergencies.set(id, emergency);
    return emergency;
  }

  async updateEmergency(id: string, updateData: Partial<InsertEmergency>): Promise<Emergency | undefined> {
    const emergency = this.emergencies.get(id);
    if (!emergency) return undefined;

    const updated: Emergency = {
      ...emergency,
      ...updateData,
      updatedAt: new Date(),
    };
    this.emergencies.set(id, updated);
    return updated;
  }

  async getAllEmergencies(): Promise<Emergency[]> {
    return Array.from(this.emergencies.values());
  }
}

export const storage = new MemStorage();
