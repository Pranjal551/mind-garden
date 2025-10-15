import { create } from "zustand";
import type { AI4HState, HistoryItem, Patient, GeoLocation, Status } from "../types";
import { demoPatient } from "../types";
import { broadcastState, loadStoredState, onStateUpdate } from "../utils/bus";
import { nowISO } from "../utils/time";
import { safeNotify } from "../utils/notify";

interface AI4HStore extends AI4HState {
  // Actions
  triggerSOS: () => void;
  acknowledgeEmergency: () => void;
  startEnroute: () => void;
  markArrived: () => void;
  startHospitalPrep: () => void;
  updateLocation: (geo: GeoLocation) => void;
  decrementETA: () => void;
  resetEmergency: () => void;
  loadEmergencyFromWebSocket: (emergency: any) => void;
  // State management
  initializeStore: () => void;
  setFromBroadcast: (state: AI4HState) => void;
}

const initialState: AI4HState = {
  status: null,
  etaMin: null,
  patient: null,
  geo: { address: "Koramangala, Bangalore, Karnataka" },
  history: [],
  lastEventTs: undefined,
};

export const useAI4HStore = create<AI4HStore>((set, get) => ({
  ...initialState,

  triggerSOS: () => {
    const currentState = get();
    const now = nowISO();
    const historyItem: HistoryItem = {
      ts: now,
      actor: "USER",
      type: "SOS_NEW",
      note: "Emergency alert sent",
    };

    const newState: AI4HState = {
      status: "NEW",
      etaMin: 7,
      patient: demoPatient,
      geo: currentState.geo,
      history: [...currentState.history, historyItem],
      lastEventTs: now,
    };

    set(newState);
    broadcastState(newState);
    
    // Notify other tabs
    safeNotify("Emergency Alert Sent", "Ambulance and hospital have been notified");
  },

  acknowledgeEmergency: () => {
    const currentState = get();
    const now = nowISO();
    const historyItem: HistoryItem = {
      ts: now,
      actor: "AMBULANCE",
      type: "AMB_ACK",
      note: "Emergency acknowledged",
    };

    const newState: AI4HState = {
      status: "ACK",
      etaMin: 6,
      patient: currentState.patient,
      geo: currentState.geo,
      history: [...currentState.history, historyItem],
      lastEventTs: now,
    };

    set(newState);
    broadcastState(newState);
    
    safeNotify("Emergency Acknowledged", "Ambulance is preparing to respond");
  },

  startEnroute: () => {
    const currentState = get();
    const now = nowISO();
    const historyItem: HistoryItem = {
      ts: now,
      actor: "AMBULANCE",
      type: "AMB_ENROUTE",
      note: "Ambulance en route to patient",
    };

    const newState: AI4HState = {
      status: "ENROUTE",
      etaMin: currentState.etaMin,
      patient: currentState.patient,
      geo: currentState.geo,
      history: [...currentState.history, historyItem],
      lastEventTs: now,
    };

    set(newState);
    broadcastState(newState);
    
    safeNotify("Ambulance En Route", "ETA countdown started");
  },

  markArrived: () => {
    const currentState = get();
    const now = nowISO();
    const historyItem: HistoryItem = {
      ts: now,
      actor: "AMBULANCE",
      type: "AMB_ARRIVED",
      note: "Ambulance arrived at location",
    };

    const newState: AI4HState = {
      status: "ARRIVED",
      etaMin: 0,
      patient: currentState.patient,
      geo: currentState.geo,
      history: [...currentState.history, historyItem],
      lastEventTs: now,
    };

    set(newState);
    broadcastState(newState);
    
    safeNotify("Ambulance Arrived", "Emergency response team is on scene");
  },

  startHospitalPrep: () => {
    const currentState = get();
    const now = nowISO();
    const historyItem: HistoryItem = {
      ts: now,
      actor: "HOSPITAL",
      type: "HOSP_PREP",
      note: "Hospital preparation started",
    };

    const newState: AI4HState = {
      status: currentState.status,
      etaMin: currentState.etaMin,
      patient: currentState.patient,
      geo: currentState.geo,
      history: [...currentState.history, historyItem],
      lastEventTs: now,
    };

    set(newState);
    broadcastState(newState);
    
    safeNotify("Hospital Prep Started", "Emergency room is being prepared");
  },

  updateLocation: (geo: GeoLocation) => {
    const currentState = get();
    const newState: AI4HState = {
      status: currentState.status,
      etaMin: currentState.etaMin,
      patient: currentState.patient,
      geo,
      history: currentState.history,
      lastEventTs: currentState.lastEventTs,
    };

    set(newState);
    broadcastState(newState);
  },

  decrementETA: () => {
    const currentState = get();
    const currentETA = currentState.etaMin;
    if (currentETA && currentETA > 0) {
      const newState: AI4HState = {
        status: currentState.status,
        etaMin: currentETA - 1,
        patient: currentState.patient,
        geo: currentState.geo,
        history: currentState.history,
        lastEventTs: currentState.lastEventTs,
      };

      set(newState);
      broadcastState(newState);
    }
  },

  resetEmergency: () => {
    const currentState = get();
    const now = nowISO();
    const historyItem: HistoryItem = {
      ts: now,
      actor: "USER", 
      type: "SOS_NEW", // Will use existing type for now to maintain compatibility
      note: "Emergency reset - ready for new alert",
    };

    const newState: AI4HState = {
      status: null,
      etaMin: null,
      patient: null,
      geo: currentState.geo, // Keep current location
      history: [...currentState.history, historyItem],
      lastEventTs: now,
    };

    set(newState);
    broadcastState(newState);
    
    // Stop any running countdown
    stopETACountdown();
    
    safeNotify("Emergency Reset", "Ready to send new alert");
  },

  initializeStore: () => {
    const stored = loadStoredState();
    if (stored) {
      set(stored);
    }

    // Listen for updates from other tabs
    onStateUpdate((state) => {
      get().setFromBroadcast(state);
    });
  },

  setFromBroadcast: (state: AI4HState) => {
    set(state);
  },

  loadEmergencyFromWebSocket: (emergency: any) => {
    const now = nowISO();
    const historyItem: HistoryItem = {
      ts: now,
      actor: "USER",
      type: "SOS_NEW",
      note: "Emergency alert received",
    };

    const newState: AI4HState = {
      status: emergency.status || "NEW",
      etaMin: 7,
      patient: emergency.patient || emergency.patientInfo || demoPatient,
      geo: emergency.location || emergency.geo || { address: "Location not specified" },
      history: [historyItem],
      lastEventTs: now,
    };

    set(newState);
    broadcastState(newState);
  },
}));

// ETA countdown interval
let etaInterval: NodeJS.Timeout | null = null;

export function startETACountdown() {
  if (etaInterval) clearInterval(etaInterval);
  
  etaInterval = setInterval(() => {
    const store = useAI4HStore.getState();
    if (store.status === "ENROUTE" && store.etaMin && store.etaMin > 0) {
      store.decrementETA();
    } else if (store.etaMin === 0) {
      clearInterval(etaInterval!);
      etaInterval = null;
    }
  }, 30000); // Every 30 seconds for demo purposes
}

export function stopETACountdown() {
  if (etaInterval) {
    clearInterval(etaInterval);
    etaInterval = null;
  }
}
