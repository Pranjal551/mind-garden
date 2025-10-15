import { useEffect, useCallback, useState } from 'react';
import { subscribeToWebSocket } from '../utils/websocket';
import { toast } from '../utils/notify';
import { useAI4HStore } from '../store/ai4h-store';

export function useEmergencySync() {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [newEmergencyCount, setNewEmergencyCount] = useState(0);
  const loadEmergencyFromWebSocket = useAI4HStore((state) => state.loadEmergencyFromWebSocket);

  const handleEmergencyCreated = useCallback(async (data: any) => {
    console.log('Emergency created via WebSocket:', data);
    
    // Show toast notification
    toast('New Emergency Alert!', 'error');
    
    // Request browser notification permission if not granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('New Emergency Alert', {
        body: `Emergency reported - ${data.legacy?.type || 'Unknown'}`,
        icon: '/favicon.ico',
        tag: `emergency-${data.legacy?.id}`
      });
    }
    
    // Load emergency into the ai4h-store so Hospital and Ambulance views can see it
    if (data.legacy) {
      loadEmergencyFromWebSocket(data.legacy);
    }
    
    setLastUpdate(new Date());
    setNewEmergencyCount(prev => prev + 1);
    
    // Dispatch a custom event that views can listen to
    window.dispatchEvent(new CustomEvent('ws:emergency_created', { detail: data }));
  }, [loadEmergencyFromWebSocket]);

  const handleEmergencyUpdated = useCallback((data: any) => {
    console.log('Emergency updated via WebSocket:', data);
    setLastUpdate(new Date());
    
    // Dispatch a custom event that views can listen to
    window.dispatchEvent(new CustomEvent('ws:emergency_updated', { detail: data }));
  }, []);

  useEffect(() => {
    // Subscribe to WebSocket emergency events
    const unsubscribeCreated = subscribeToWebSocket('emergency_created', handleEmergencyCreated);
    const unsubscribeUpdated = subscribeToWebSocket('emergency_updated', handleEmergencyUpdated);

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
    };
  }, [handleEmergencyCreated, handleEmergencyUpdated]);

  return { lastUpdate, newEmergencyCount };
}
