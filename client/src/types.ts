export type {
  Status,
  HistoryItem,
  Patient,
  GeoLocation,
  AI4HState
} from "@shared/schema";

export const demoPatient = {
  id: "PT-001",
  name: "Rahul Mehta",
  age: 24,
  blood: "O+",
  conditions: ["Asthma"],
  allergies: ["Penicillin"],
  guardian: { name: "Asha Mehta", phone: "+91-90000-00000" },
};

export type TabType = "user" | "ambulance" | "hospital" | "admin";
