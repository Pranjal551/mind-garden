import type { TriageLevel, HospitalCapability } from '@shared/schema';

export interface Vitals {
  hr?: number;    // Heart rate
  spo2?: number;  // Oxygen saturation
  sbp?: number;   // Systolic blood pressure  
  rr?: number;    // Respiratory rate
  gcs?: number;   // Glasgow Coma Scale
}

export interface TriageResult {
  score: number;        // 0-100
  level: TriageLevel;   // red/yellow/green
  reason: string;
  needs: HospitalCapability[];
}

/**
 * Calculate triage score based on vital signs using rule-based algorithm
 * Returns score 0-100 with higher scores indicating more critical conditions
 */
export function triageScore(vitals: Vitals, emergencyType?: string): TriageResult {
  let score = 0;
  let reasons: string[] = [];
  let needs: Set<HospitalCapability> = new Set();

  // Heart Rate scoring (normal: 60-100)
  if (vitals.hr !== undefined) {
    if (vitals.hr > 140 || vitals.hr < 40) {
      score += 25;
      reasons.push('Critical heart rate');
      needs.add('ICU');
      needs.add('Cardio');
    } else if (vitals.hr > 120 || vitals.hr < 50) {
      score += 15;
      reasons.push('Abnormal heart rate');
      needs.add('Cardio');
    } else if (vitals.hr > 100 || vitals.hr < 60) {
      score += 5;
      reasons.push('Elevated heart rate');
    }
  }

  // Oxygen Saturation scoring (normal: >95%)
  if (vitals.spo2 !== undefined) {
    if (vitals.spo2 < 85) {
      score += 30;
      reasons.push('Critical oxygen levels');
      needs.add('ICU');
      needs.add('Ventilator');
    } else if (vitals.spo2 < 92) {
      score += 20;
      reasons.push('Low oxygen saturation');
      needs.add('Ventilator');
    } else if (vitals.spo2 < 95) {
      score += 10;
      reasons.push('Mild oxygen desaturation');
    }
  }

  // Blood Pressure scoring (normal systolic: 90-140)
  if (vitals.sbp !== undefined) {
    if (vitals.sbp > 180 || vitals.sbp < 70) {
      score += 20;
      reasons.push('Critical blood pressure');
      needs.add('ICU');
      needs.add('Cardio');
    } else if (vitals.sbp > 160 || vitals.sbp < 90) {
      score += 10;
      reasons.push('Abnormal blood pressure');
      needs.add('Cardio');
    }
  }

  // Respiratory Rate scoring (normal: 12-20)
  if (vitals.rr !== undefined) {
    if (vitals.rr > 35 || vitals.rr < 8) {
      score += 25;
      reasons.push('Critical respiratory distress');
      needs.add('ICU');
      needs.add('Ventilator');
    } else if (vitals.rr > 25 || vitals.rr < 10) {
      score += 15;
      reasons.push('Respiratory distress');
      needs.add('Ventilator');
    } else if (vitals.rr > 20 || vitals.rr < 12) {
      score += 5;
      reasons.push('Mild respiratory changes');
    }
  }

  // Glasgow Coma Scale scoring (normal: 15)
  if (vitals.gcs !== undefined) {
    if (vitals.gcs < 9) {
      score += 30;
      reasons.push('Severe neurological impairment');
      needs.add('ICU');
      needs.add('Neuro');
      needs.add('Ventilator');
    } else if (vitals.gcs < 13) {
      score += 20;
      reasons.push('Moderate neurological impairment');
      needs.add('Neuro');
    } else if (vitals.gcs < 15) {
      score += 10;
      reasons.push('Mild neurological changes');
      needs.add('Neuro');
    }
  }

  // Emergency type-based needs inference
  if (emergencyType) {
    const typeNeeds = inferNeedsFromType(emergencyType);
    typeNeeds.forEach(need => needs.add(need));
    
    // Add additional score based on emergency type severity
    const typeSeverity = getTypeSeverity(emergencyType);
    score += typeSeverity;
    
    if (typeSeverity > 0) {
      reasons.push(`${emergencyType} emergency`);
    }
  }

  // Cap score at 100
  score = Math.min(score, 100);

  // Determine triage level
  let level: TriageLevel;
  if (score >= 70) {
    level = 'red';    // Critical
  } else if (score >= 30) {
    level = 'yellow'; // Urgent
  } else {
    level = 'green';  // Stable
  }

  return {
    score,
    level,
    reason: reasons.length > 0 ? reasons.join('; ') : 'Normal vitals',
    needs: Array.from(needs)
  };
}

/**
 * Infer hospital capabilities needed based on emergency type
 */
function inferNeedsFromType(emergencyType: string): HospitalCapability[] {
  const type = emergencyType.toLowerCase();
  const needs: HospitalCapability[] = [];

  // Cardiac emergencies
  if (type.includes('cardiac') || type.includes('heart') || type.includes('chest pain')) {
    needs.push('Cardio', 'ICU');
  }

  // Respiratory emergencies
  if (type.includes('respiratory') || type.includes('asthma') || type.includes('breathing')) {
    needs.push('Ventilator');
  }

  // Neurological emergencies
  if (type.includes('stroke') || type.includes('seizure') || type.includes('head') || type.includes('neurological')) {
    needs.push('Neuro', 'ICU');
  }

  // Pediatric cases
  if (type.includes('pediatric') || type.includes('child') || type.includes('infant')) {
    needs.push('Peds');
  }

  // Trauma cases
  if (type.includes('trauma') || type.includes('accident') || type.includes('injury')) {
    needs.push('ICU');
  }

  // Severe/critical keywords
  if (type.includes('critical') || type.includes('severe') || type.includes('emergency')) {
    needs.push('ICU');
  }

  return needs;
}

/**
 * Get severity score based on emergency type (0-30 points)
 */
function getTypeSeverity(emergencyType: string): number {
  const type = emergencyType.toLowerCase();

  // Critical conditions (20-30 points)
  if (type.includes('cardiac arrest') || type.includes('stroke') || type.includes('severe trauma')) {
    return 30;
  }
  
  if (type.includes('heart attack') || type.includes('respiratory failure') || type.includes('severe bleeding')) {
    return 25;
  }

  if (type.includes('chest pain') || type.includes('difficulty breathing') || type.includes('head injury')) {
    return 20;
  }

  // Urgent conditions (10-19 points)
  if (type.includes('asthma') || type.includes('seizure') || type.includes('severe pain')) {
    return 15;
  }

  if (type.includes('allergic reaction') || type.includes('overdose') || type.includes('burn')) {
    return 10;
  }

  // Standard emergencies (0-9 points)
  if (type.includes('injury') || type.includes('fall') || type.includes('accident')) {
    return 5;
  }

  return 0;
}

/**
 * Placeholder for future ML-based scoring
 * Currently returns rule-based score
 */
export function mlScore(vitals: Vitals, emergencyType?: string): TriageResult {
  // TODO: Implement machine learning model integration
  // For now, return rule-based score
  return triageScore(vitals, emergencyType);
}