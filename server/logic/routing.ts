import type { Hospital, Emergency, HospitalCapability } from '@shared/schema';

export interface RoutingOptions {
  maxDistanceKm?: number;
  speedKmh?: number;
  requireAllCapabilities?: boolean;
}

export interface HospitalMatch {
  hospital: Hospital;
  distance: number;
  eta: number;
  capabilityMatch: number; // 0-1 (percentage of needs met)
  available: boolean;
  reason?: string;
}

export interface RoutingResult {
  primary: HospitalMatch | null;
  alternatives: HospitalMatch[];
  reason: string;
}

/**
 * Pick the best hospital for an emergency based on capabilities, capacity, and location
 */
export function pickHospital(
  emergency: Emergency, 
  hospitals: Hospital[], 
  options: RoutingOptions = {}
): RoutingResult {
  const {
    maxDistanceKm = 50,
    speedKmh = 30,
    requireAllCapabilities = true
  } = options;

  if (!emergency.lat || !emergency.lon) {
    return {
      primary: null,
      alternatives: [],
      reason: 'Emergency location not available'
    };
  }

  if (hospitals.length === 0) {
    return {
      primary: null,
      alternatives: [],
      reason: 'No hospitals available'
    };
  }

  const needs = emergency.needs || [];
  const matches: HospitalMatch[] = [];

  for (const hospital of hospitals) {
    // Calculate distance and ETA
    const distance = calculateHaversineDistance(
      emergency.lat!, emergency.lon!,
      hospital.lat, hospital.lon
    );

    if (distance > maxDistanceKm) {
      continue; // Skip hospitals too far away
    }

    const eta = Math.ceil((distance / speedKmh) * 60); // Convert to minutes

    // Check capability matching
    const capabilityMatch = calculateCapabilityMatch(needs, hospital.capabilities || []);
    
    // Determine if hospital meets requirements
    const meetsCapabilities = requireAllCapabilities 
      ? capabilityMatch === 1.0 || needs.length === 0
      : capabilityMatch > 0.5;

    // Check availability (handle null values)
    const hasCapacity = (hospital.bedsAvailable ?? 0) > 0;
    const isAccepting = hospital.acceptingEmergencies ?? true;
    const available = hasCapacity && isAccepting && meetsCapabilities;

    let reason = '';
    if (!hasCapacity) reason = 'No available beds';
    else if (!isAccepting) reason = 'Not accepting emergencies';
    else if (!meetsCapabilities) reason = 'Insufficient capabilities';

    matches.push({
      hospital,
      distance,
      eta,
      capabilityMatch,
      available,
      reason: reason || undefined
    });
  }

  // Sort by priority: available first, then by capability match, then by distance
  matches.sort((a, b) => {
    // Available hospitals first
    if (a.available && !b.available) return -1;
    if (!a.available && b.available) return 1;

    // Then by capability match (higher is better)
    if (Math.abs(a.capabilityMatch - b.capabilityMatch) > 0.1) {
      return b.capabilityMatch - a.capabilityMatch;
    }

    // Finally by distance (shorter is better)
    return a.distance - b.distance;
  });

  const primary = matches.length > 0 ? matches[0] : null;
  const alternatives = matches.slice(1, 6); // Top 5 alternatives

  let reason = '';
  if (!primary) {
    reason = 'No suitable hospitals found within range';
  } else if (primary.available) {
    reason = `Assigned to ${primary.hospital.name} (${primary.eta} min ETA)`;
  } else {
    reason = `Best match ${primary.hospital.name} unavailable: ${primary.reason}. Auto-routing to alternatives.`;
  }

  return {
    primary,
    alternatives,
    reason
  };
}

/**
 * Calculate capability match score (0.0 to 1.0)
 */
function calculateCapabilityMatch(needs: string[], capabilities: string[]): number {
  if (needs.length === 0) return 1.0; // No specific needs

  const matchingCapabilities = needs.filter(need => 
    capabilities.includes(need as HospitalCapability)
  );

  return matchingCapabilities.length / needs.length;
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateHaversineDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate ETA in minutes based on distance and speed
 */
export function calculateETA(distanceKm: number, speedKmh = 30): number {
  return Math.ceil((distanceKm / speedKmh) * 60);
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Find alternative route when primary hospital cannot accept
 */
export function findAlternativeRoute(
  emergency: Emergency,
  hospitals: Hospital[],
  excludeHospitalIds: string[] = []
): RoutingResult {
  // Filter out excluded hospitals
  const availableHospitals = hospitals.filter(h => 
    !excludeHospitalIds.includes(h.id)
  );

  // Try with relaxed capability requirements first
  let result = pickHospital(emergency, availableHospitals, {
    requireAllCapabilities: false,
    maxDistanceKm: 75, // Expand search radius
    speedKmh: 35 // Assume faster response for rerouting
  });

  if (!result.primary || !result.primary.available) {
    // If still no match, try any hospital within extended range
    result = pickHospital(emergency, availableHospitals, {
      requireAllCapabilities: false,
      maxDistanceKm: 100,
      speedKmh: 40
    });
  }

  return result;
}