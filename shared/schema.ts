import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, integer, doublePrecision, boolean, bigserial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Keep existing tables with same ID types (varchar)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Profiles for user roles and info
export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  role: text("role").notNull(),
  name: text("name"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Hospitals with capabilities and capacity
export const hospitals = pgTable("hospitals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  lat: doublePrecision("lat").notNull(),
  lon: doublePrecision("lon").notNull(),
  bedsAvailable: integer("beds_available").default(0),
  doctorsAvailable: integer("doctors_available").default(0),
  capabilities: text("capabilities").array().default(sql`'{}'::text[]`),
  acceptingEmergencies: boolean("accepting_emergencies").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced emergencies table (keep existing varchar ID, add new fields)
export const emergencies = pgTable("emergencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: text("patient_id").notNull(),
  lat: doublePrecision("lat"),
  lon: doublePrecision("lon"),
  type: text("type"),
  needs: text("needs").array().default(sql`'{}'::text[]`),
  triageScore: integer("triage_score").default(0),
  status: text("status").default('active'),
  assignedHospitalId: varchar("assigned_hospital_id"),
  reroutedToId: varchar("rerouted_to_id"), 
  assignedEtaMin: integer("assigned_eta_min"),
  duplicateOf: varchar("duplicate_of"),
  vitals: json("vitals"),
  
  // Keep existing fields for compatibility
  etaMin: integer("eta_min"),
  location: json("location"),
  history: json("history").notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Incident events for timeline tracking
export const incidentEvents = pgTable("incident_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  emergencyId: varchar("emergency_id").notNull(),
  kind: text("kind").notNull(),
  data: json("data"),
  ts: timestamp("ts").defaultNow(),
});

// Ambulance position tracking
export const ambulancePositions = pgTable("ambulance_positions", {
  id: bigserial("id", { mode: 'number' }).primaryKey(),
  ambulanceId: varchar("ambulance_id").notNull(),
  lat: doublePrecision("lat").notNull(),
  lon: doublePrecision("lon").notNull(),
  ts: timestamp("ts").defaultNow(),
});

// Keep existing schemas for compatibility
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertEmergencySchema = createInsertSchema(emergencies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// New schemas for enhanced features
export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
});

export const insertHospitalSchema = createInsertSchema(hospitals).omit({
  id: true,
  createdAt: true,
});

export const insertIncidentEventSchema = createInsertSchema(incidentEvents).omit({
  id: true,
  ts: true,
});

export const insertAmbulancePositionSchema = createInsertSchema(ambulancePositions).omit({
  id: true,
  ts: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertEmergency = z.infer<typeof insertEmergencySchema>;
export type Emergency = typeof emergencies.$inferSelect;

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertHospital = z.infer<typeof insertHospitalSchema>;
export type Hospital = typeof hospitals.$inferSelect;
export type InsertIncidentEvent = z.infer<typeof insertIncidentEventSchema>;
export type IncidentEvent = typeof incidentEvents.$inferSelect;
export type InsertAmbulancePosition = z.infer<typeof insertAmbulancePositionSchema>;
export type AmbulancePosition = typeof ambulancePositions.$inferSelect;

// Keep existing frontend types for compatibility
export type Status = "NEW" | "ACK" | "ENROUTE" | "ARRIVED" | null;

export type HistoryItem = {
  ts: string;
  actor: "USER" | "AMBULANCE" | "HOSPITAL";
  type: "SOS_NEW" | "AMB_ACK" | "AMB_ENROUTE" | "AMB_ARRIVED" | "HOSP_PREP";
  note?: string;
};

export type Patient = {
  id: string;
  name: string;
  age: number;
  blood: string;
  conditions: string[];
  allergies: string[];
  guardian: {
    name: string;
    phone: string;
  };
};

export type GeoLocation = {
  lat?: number;
  lon?: number;
  address?: string;
};

export type AI4HState = {
  status: Status;
  etaMin: number | null;
  patient: Patient | null;
  geo?: GeoLocation;
  history: HistoryItem[];
  lastEventTs?: string;
};

// New types for enhanced features
export type TriageLevel = 'red' | 'yellow' | 'green';

export type EmergencyStatus = 'active' | 'assigned' | 'enroute' | 'arrived' | 'completed' | 'cancelled';

export type HospitalCapability = 'ICU' | 'Ventilator' | 'Cardio' | 'Peds' | 'Neuro';

export type UserRole = 'patient' | 'driver' | 'hospital' | 'admin';