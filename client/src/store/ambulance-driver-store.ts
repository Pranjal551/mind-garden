import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EnhancedEmergency } from "./multi-emergency-store";

export interface AmbulancePosition {
  id?: number;
  ambulanceId: string;
  lat: number;
  lon: number;
  ts: string;
}

export interface ShiftData {
  shiftId: string;
  ambulanceId: string;
  driverId: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'ended';
}

export interface AssignmentRequest {
  emergencyId: string;
  patientName: string;
  location: string;
  triageLevel: 'red' | 'yellow' | 'green';
  estimatedDistance: number;
  requestedAt: string;
  expiresAt: string;
}

export interface NavigationSession {
  emergencyId: string;
  destination: { lat: number; lon: number; address: string };
  startedAt: string;
  estimatedArrival?: string;
  status: 'navigating' | 'arrived' | 'rerouted';
}

interface AmbulanceDriverState {
  // Shift Management
  currentShift: ShiftData | null;
  shiftHistory: ShiftData[];
  
  // Assignment Management  
  availableAssignments: AssignmentRequest[];
  acceptedAssignments: string[]; // Emergency IDs
  rejectedAssignments: string[]; // Emergency IDs
  
  // Position Tracking
  currentPosition: { lat: number; lon: number } | null;
  positionHistory: AmbulancePosition[];
  offlinePositionQueue: Omit<AmbulancePosition, 'id'>[];
  isTrackingEnabled: boolean;
  
  // Navigation
  activeNavigation: NavigationSession | null;
  
  // Driver Info
  driverId: string;
  ambulanceId: string;
  isOnline: boolean;
}

interface AmbulanceDriverStore extends AmbulanceDriverState {
  // Shift Actions
  startShift: (driverId: string, ambulanceId: string) => void;
  endShift: () => void;
  
  // Assignment Actions
  acceptAssignment: (emergencyId: string) => void;
  rejectAssignment: (emergencyId: string) => void;
  addAssignmentRequest: (assignment: AssignmentRequest) => void;
  removeAssignmentRequest: (emergencyId: string) => void;
  
  // Position Actions
  updatePosition: (lat: number, lon: number) => void;
  togglePositionTracking: () => void;
  syncOfflinePositions: () => Promise<void>;
  
  // Navigation Actions
  startNavigation: (emergency: EnhancedEmergency) => void;
  endNavigation: () => void;
  handleReroute: (newDestination: { lat: number; lon: number; address: string }) => void;
  
  // Utility Actions
  setOnlineStatus: (online: boolean) => void;
  initializeDriver: (driverId: string, ambulanceId: string) => void;
}

const initialState: AmbulanceDriverState = {
  currentShift: null,
  shiftHistory: [],
  availableAssignments: [],
  acceptedAssignments: [],
  rejectedAssignments: [],
  currentPosition: null,
  positionHistory: [],
  offlinePositionQueue: [],
  isTrackingEnabled: false,
  activeNavigation: null,
  driverId: "",
  ambulanceId: "",
  isOnline: false,
};

export const useAmbulanceDriverStore = create<AmbulanceDriverStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      startShift: (driverId: string, ambulanceId: string) => {
        const now = new Date().toISOString();
        const shiftId = `shift_${Date.now()}`;
        
        const newShift: ShiftData = {
          shiftId,
          ambulanceId,
          driverId,
          startTime: now,
          status: 'active'
        };

        set((state) => ({
          currentShift: newShift,
          shiftHistory: [...state.shiftHistory, newShift],
          driverId,
          ambulanceId,
          isOnline: true,
          isTrackingEnabled: true
        }));

        // Start position tracking
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            if (latitude !== undefined && longitude !== undefined) {
              get().updatePosition(latitude, longitude);
            }
          });
        }
      },

      endShift: () => {
        const currentShift = get().currentShift;
        if (!currentShift) return;

        const endedShift = {
          ...currentShift,
          endTime: new Date().toISOString(),
          status: 'ended' as const
        };

        set((state) => ({
          currentShift: null,
          shiftHistory: state.shiftHistory.map(shift => 
            shift.shiftId === currentShift.shiftId ? endedShift : shift
          ),
          isOnline: false,
          isTrackingEnabled: false,
          activeNavigation: null,
          acceptedAssignments: [],
          availableAssignments: []
        }));
      },

      acceptAssignment: (emergencyId: string) => {
        set((state) => ({
          acceptedAssignments: [...state.acceptedAssignments, emergencyId],
          availableAssignments: state.availableAssignments.filter(
            assignment => assignment.emergencyId !== emergencyId
          )
        }));
      },

      rejectAssignment: (emergencyId: string) => {
        set((state) => ({
          rejectedAssignments: [...state.rejectedAssignments, emergencyId],
          availableAssignments: state.availableAssignments.filter(
            assignment => assignment.emergencyId !== emergencyId
          )
        }));
      },

      addAssignmentRequest: (assignment: AssignmentRequest) => {
        const state = get();
        
        // Don't add if already accepted/rejected or expired
        if (state.acceptedAssignments.includes(assignment.emergencyId) ||
            state.rejectedAssignments.includes(assignment.emergencyId) ||
            new Date(assignment.expiresAt) < new Date()) {
          return;
        }

        set((state) => ({
          availableAssignments: [...state.availableAssignments.filter(
            a => a.emergencyId !== assignment.emergencyId
          ), assignment]
        }));
      },

      removeAssignmentRequest: (emergencyId: string) => {
        set((state) => ({
          availableAssignments: state.availableAssignments.filter(
            assignment => assignment.emergencyId !== emergencyId
          )
        }));
      },

      updatePosition: (lat: number, lon: number) => {
        const state = get();
        if (!state.isTrackingEnabled || !state.currentShift) return;

        const now = new Date().toISOString();
        const newPosition: Omit<AmbulancePosition, 'id'> = {
          ambulanceId: state.ambulanceId,
          lat,
          lon,
          ts: now
        };

        set((state) => ({
          currentPosition: { lat, lon },
          positionHistory: [...state.positionHistory.slice(-50), { ...newPosition, id: Date.now() } as AmbulancePosition],
          offlinePositionQueue: [...state.offlinePositionQueue, newPosition]
        }));

        // Try to sync positions if online
        if (navigator.onLine) {
          get().syncOfflinePositions();
        }
      },

      togglePositionTracking: () => {
        set((state) => ({
          isTrackingEnabled: !state.isTrackingEnabled
        }));
      },

      syncOfflinePositions: async () => {
        const state = get();
        if (state.offlinePositionQueue.length === 0) return;

        try {
          // Send positions to backend
          const response = await fetch('/api/ambulance/positions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ positions: state.offlinePositionQueue })
          });

          if (response.ok) {
            // Clear offline queue on successful sync
            set((state) => ({
              offlinePositionQueue: []
            }));
          }
        } catch (error) {
          console.log('Failed to sync positions, will retry later:', error);
        }
      },

      startNavigation: (emergency: EnhancedEmergency) => {
        if (!emergency.location) return;

        const navigationSession: NavigationSession = {
          emergencyId: emergency.id,
          destination: {
            lat: emergency.location.lat,
            lon: emergency.location.lon,
            address: emergency.location.address || 'Emergency Location'
          },
          startedAt: new Date().toISOString(),
          status: 'navigating'
        };

        set({ activeNavigation: navigationSession });

        // Try to open navigation app
        const { lat, lon } = emergency.location;
        const destination = `${lat},${lon}`;
        
        // Try different navigation apps
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
        const appleUrl = `maps://maps.apple.com/?daddr=${lat},${lon}`;
        
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
          window.open(appleUrl);
        } else {
          window.open(mapsUrl);
        }
      },

      endNavigation: () => {
        const state = get();
        if (!state.activeNavigation) return;

        set({
          activeNavigation: {
            ...state.activeNavigation,
            status: 'arrived'
          }
        });

        // Clear navigation after a delay
        setTimeout(() => {
          set({ activeNavigation: null });
        }, 5000);
      },

      handleReroute: (newDestination: { lat: number; lon: number; address: string }) => {
        const state = get();
        if (!state.activeNavigation) return;

        set({
          activeNavigation: {
            ...state.activeNavigation,
            destination: newDestination,
            status: 'rerouted'
          }
        });
      },

      setOnlineStatus: (online: boolean) => {
        set({ isOnline: online });
        
        if (online) {
          // Sync offline positions when coming back online
          get().syncOfflinePositions();
        }
      },

      initializeDriver: (driverId: string, ambulanceId: string) => {
        set({
          driverId,
          ambulanceId
        });
      }
    }),
    {
      name: "ambulance-driver-store",
      partialize: (state) => ({
        shiftHistory: state.shiftHistory,
        positionHistory: state.positionHistory.slice(-100), // Keep last 100 positions
        driverId: state.driverId,
        ambulanceId: state.ambulanceId,
        offlinePositionQueue: state.offlinePositionQueue
      })
    }
  )
);

// Position tracking utility
let positionWatcher: number | null = null;

export const startPositionTracking = () => {
  if (!navigator.geolocation || positionWatcher) return;

  const updatePosition = useAmbulanceDriverStore.getState().updatePosition;
  
  positionWatcher = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      if (latitude !== undefined && longitude !== undefined) {
        updatePosition(latitude, longitude);
      }
    },
    (error) => {
      console.log('Position tracking error:', error);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 30000, // 30 seconds
      timeout: 10000 // 10 seconds
    }
  );
};

export const stopPositionTracking = () => {
  if (positionWatcher) {
    navigator.geolocation.clearWatch(positionWatcher);
    positionWatcher = null;
  }
};

// Online/offline status monitoring
if (typeof window !== 'undefined') {
  const setOnlineStatus = useAmbulanceDriverStore.getState().setOnlineStatus;
  
  window.addEventListener('online', () => setOnlineStatus(true));
  window.addEventListener('offline', () => setOnlineStatus(false));
}