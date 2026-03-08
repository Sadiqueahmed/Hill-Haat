// Terrain-Aware Routing for Northeast India's Hilly Regions
// Handles elevation penalties, terrain difficulty, and weather impacts

// Terrain type definitions with characteristics
export const TERRAIN_TYPES = {
  PLAIN: {
    name: 'Plain',
    baseSpeed: 40, // km/h average
    elevationRange: [0, 300] as [number, number],
    difficultyMultiplier: 1.0,
    description: 'Flat terrain with good road connectivity',
  },
  HILLY: {
    name: 'Hilly',
    baseSpeed: 25, // km/h average
    elevationRange: [300, 1500] as [number, number],
    difficultyMultiplier: 1.5,
    description: 'Moderate elevation with winding roads',
  },
  MOUNTAINOUS: {
    name: 'Mountainous',
    baseSpeed: 15, // km/h average
    elevationRange: [1500, 4000] as [number, number],
    difficultyMultiplier: 2.0,
    description: 'High altitude with steep gradients and switchbacks',
  },
  VALLEY: {
    name: 'Valley',
    baseSpeed: 30, // km/h average
    elevationRange: [100, 1000] as [number, number],
    difficultyMultiplier: 1.3,
    description: 'Low-lying areas between hills, prone to flooding',
  },
  MIXED: {
    name: 'Mixed Terrain',
    baseSpeed: 28, // km/h average
    elevationRange: [0, 3000] as [number, number],
    difficultyMultiplier: 1.6,
    description: 'Combination of terrain types along the route',
  },
} as const;

export type TerrainType = keyof typeof TERRAIN_TYPES;

// Weather seasons in Northeast India
export type Season = 'DRY' | 'PRE_MONSOON' | 'MONSOON' | 'POST_MONSOON' | 'WINTER';

export const WEATHER_MULTIPLIERS: Record<Season, number> = {
  DRY: 1.0,           // October-November: Best conditions
  PRE_MONSOON: 1.2,   // March-May: Heat and early storms
  MONSOON: 1.8,       // June-September: Heavy rains, landslides
  POST_MONSOON: 1.1,  // October: Receding rains
  WINTER: 1.15,       // December-February: Fog, cold conditions
};

// Hazard types common in Northeast India
export interface HazardZone {
  type: 'LANDSLIDE' | 'FLOOD' | 'FOG' | 'POOR_ROAD' | 'NO_CONNECTIVITY' | 'POLITICAL_UNREST';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  seasonal: boolean;
  months?: number[]; // Months when hazard is active (1-12)
  description: string;
}

// Route segment with terrain info
export interface RouteSegment {
  from: string;
  to: string;
  distanceKm: number;
  terrainType: TerrainType;
  averageElevation: number;
  maxElevation: number;
  connectivityScore: number; // 1-10
  hazards: HazardZone[];
  roadCondition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'VERY_POOR';
}

// Delivery estimate result
export interface DeliveryEstimate {
  totalDistance: number;
  estimatedTimeMinutes: number;
  terrainType: TerrainType;
  difficultyScore: number; // 1-10
  baseCost: number;
  terrainMultiplier: number;
  weatherMultiplier: number;
  totalCost: number;
  elevationPenalty: number;
  hazardsDetected: HazardZone[];
  routeSegments: RouteSegment[];
  recommendations: string[];
}

/**
 * Calculate elevation penalty based on elevation gain
 * Higher elevations significantly increase delivery time and cost
 */
export function calculateElevationPenalty(
  startElevation: number,
  endElevation: number,
  maxElevation: number
): number {
  const elevationGain = Math.max(0, endElevation - startElevation);
  const maxElevPenalty = maxElevation > 1500 ? (maxElevation - 1500) / 500 : 0;
  
  // Base penalty for elevation gain
  let penalty = 0;
  
  // Every 100m of elevation gain adds time
  if (elevationGain > 0) {
    penalty += elevationGain / 100 * 0.1; // 10% extra time per 100m gain
  }
  
  // High altitude penalty (above 1500m)
  penalty += maxElevPenalty * 0.3; // 30% extra for each 500m above 1500m
  
  return Math.min(penalty, 2.0); // Cap at 200% penalty
}

/**
 * Determine terrain type based on elevation profile
 */
export function determineTerrainType(
  averageElevation: number,
  elevationVariance: number = 0
): TerrainType {
  if (averageElevation < 300 && elevationVariance < 200) {
    return 'PLAIN';
  } else if (averageElevation < 300 && elevationVariance >= 200) {
    return 'VALLEY';
  } else if (averageElevation >= 300 && averageElevation < 1500) {
    return 'HILLY';
  } else if (averageElevation >= 1500) {
    return 'MOUNTAINOUS';
  }
  return 'MIXED';
}

/**
 * Calculate difficulty score (1-10) based on multiple factors
 */
export function calculateDifficultyScore(
  terrainType: TerrainType,
  averageElevation: number,
  connectivityScore: number,
  roadCondition: string,
  hasHazardZones: boolean
): number {
  let score = 1;
  
  // Terrain type contribution (1-4 points)
  const terrainScores: Record<TerrainType, number> = {
    PLAIN: 1,
    VALLEY: 2,
    HILLY: 3,
    MOUNTAINOUS: 4,
    MIXED: 3,
  };
  score += terrainScores[terrainType];
  
  // Elevation contribution (0-2 points)
  if (averageElevation > 2000) score += 2;
  else if (averageElevation > 1000) score += 1;
  
  // Connectivity contribution (0-2 points)
  if (connectivityScore <= 3) score += 2;
  else if (connectivityScore <= 5) score += 1;
  
  // Road condition contribution (0-1 points)
  if (roadCondition === 'VERY_POOR' || roadCondition === 'POOR') score += 1;
  
  // Hazard zones (0-1 points)
  if (hasHazardZones) score += 1;
  
  return Math.min(score, 10);
}

/**
 * Estimate delivery time based on terrain and distance
 */
export function estimateDeliveryTime(
  distanceKm: number,
  terrainType: TerrainType,
  elevationPenalty: number,
  weatherMultiplier: number,
  stopsCount: number = 0
): number {
  const baseSpeed = TERRAIN_TYPES[terrainType].baseSpeed;
  
  // Base time in minutes
  let baseTime = (distanceKm / baseSpeed) * 60;
  
  // Apply elevation penalty
  baseTime *= (1 + elevationPenalty);
  
  // Apply weather multiplier
  baseTime *= weatherMultiplier;
  
  // Add time for stops (average 10 min per stop)
  baseTime += stopsCount * 10;
  
  // Add buffer for hilly terrain (unpredictable conditions)
  if (terrainType === 'HILLY' || terrainType === 'MOUNTAINOUS') {
    baseTime *= 1.15; // 15% buffer
  }
  
  return Math.round(baseTime);
}

/**
 * Get current season based on month
 */
export function getCurrentSeason(date: Date = new Date()): Season {
  const month = date.getMonth() + 1; // 1-12
  
  if (month >= 6 && month <= 9) return 'MONSOON';
  if (month >= 3 && month <= 5) return 'PRE_MONSOON';
  if (month === 10) return 'POST_MONSOON';
  if (month >= 11 || month <= 2) return 'DRY';
  return 'DRY';
}

/**
 * Get weather impact multiplier for a specific season
 */
export function getWeatherImpactMultiplier(season?: Season): number {
  const currentSeason = season || getCurrentSeason();
  return WEATHER_MULTIPLIERS[currentSeason];
}

/**
 * Calculate delivery cost with terrain and weather considerations
 */
export function calculateDeliveryCost(
  distanceKm: number,
  terrainType: TerrainType,
  difficultyScore: number,
  weatherMultiplier: number,
  weightKg: number = 1
): { baseCost: number; terrainMultiplier: number; totalCost: number } {
  // Base rate: ₹8 per km for first 10km, ₹6 per km thereafter
  let baseCost = 0;
  if (distanceKm <= 10) {
    baseCost = distanceKm * 8;
  } else {
    baseCost = 10 * 8 + (distanceKm - 10) * 6;
  }
  
  // Minimum charge
  baseCost = Math.max(baseCost, 30);
  
  // Weight charge for heavy items
  if (weightKg > 5) {
    baseCost += (weightKg - 5) * 2; // ₹2 per kg above 5kg
  }
  
  // Terrain multiplier
  const terrainMultiplier = TERRAIN_TYPES[terrainType].difficultyMultiplier;
  
  // Difficulty bonus (additional charge for difficult routes)
  const difficultyBonus = difficultyScore > 5 ? (difficultyScore - 5) * 0.1 : 0;
  
  // Calculate total
  let totalCost = baseCost * terrainMultiplier * (1 + difficultyBonus) * weatherMultiplier;
  
  // Round to nearest 5
  totalCost = Math.round(totalCost / 5) * 5;
  
  return {
    baseCost: Math.round(baseCost),
    terrainMultiplier,
    totalCost: Math.round(totalCost),
  };
}

/**
 * Generate route recommendations based on terrain and conditions
 */
export function generateRecommendations(
  terrainType: TerrainType,
  difficultyScore: number,
  hazards: HazardZone[],
  season: Season
): string[] {
  const recommendations: string[] = [];
  
  // Terrain-based recommendations
  if (terrainType === 'MOUNTAINOUS') {
    recommendations.push('Use vehicles with high ground clearance and 4WD capability');
    recommendations.push('Plan for potential delays due to road conditions');
  } else if (terrainType === 'HILLY') {
    recommendations.push('Experienced drivers recommended for winding roads');
  }
  
  // Difficulty-based recommendations
  if (difficultyScore >= 7) {
    recommendations.push('Consider splitting delivery into smaller packages');
    recommendations.push('Schedule delivery during daylight hours');
  }
  
  // Hazard-based recommendations
  hazards.forEach(hazard => {
    if (hazard.type === 'LANDSLIDE' && hazard.severity !== 'LOW') {
      recommendations.push(`Landslide risk: Check road status before dispatch during monsoon season`);
    }
    if (hazard.type === 'NO_CONNECTIVITY') {
      recommendations.push('Offline navigation required - download maps in advance');
    }
    if (hazard.type === 'FOG') {
      recommendations.push('Fog expected - allow extra time for safe driving');
    }
  });
  
  // Season-based recommendations
  if (season === 'MONSOON') {
    recommendations.push('Monsoon season: Expect 30-50% longer delivery times');
    recommendations.push('Waterproof packaging recommended for all items');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Route conditions are favorable for delivery');
  }
  
  return recommendations;
}

/**
 * Calculate comprehensive delivery estimate for a route
 */
export function calculateDeliveryEstimate(
  segments: RouteSegment[],
  weightKg: number = 1,
  customSeason?: Season
): DeliveryEstimate {
  // Aggregate segment data
  let totalDistance = 0;
  let totalElevationPenalty = 0;
  let dominantTerrain: TerrainType = 'PLAIN';
  let maxDifficulty = 1;
  let minConnectivity = 10;
  const allHazards: HazardZone[] = [];
  let worstRoadCondition: RouteSegment['roadCondition'] = 'GOOD';
  
  const roadConditionRank = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'VERY_POOR'];
  
  segments.forEach(segment => {
    totalDistance += segment.distanceKm;
    
    const elevationPenalty = calculateElevationPenalty(
      0, // Assume start at base
      segment.averageElevation,
      segment.maxElevation
    );
    totalElevationPenalty += elevationPenalty * (segment.distanceKm / segments.reduce((a, b) => a + b.distanceKm, 0));
    
    // Track dominant terrain (by distance)
    if (TERRAIN_TYPES[segment.terrainType].difficultyMultiplier > 
        TERRAIN_TYPES[dominantTerrain].difficultyMultiplier) {
      dominantTerrain = segment.terrainType;
    }
    
    // Track maximum difficulty
    const segmentDifficulty = calculateDifficultyScore(
      segment.terrainType,
      segment.averageElevation,
      segment.connectivityScore,
      segment.roadCondition,
      segment.hazards.length > 0
    );
    maxDifficulty = Math.max(maxDifficulty, segmentDifficulty);
    
    // Track minimum connectivity
    minConnectivity = Math.min(minConnectivity, segment.connectivityScore);
    
    // Collect hazards
    allHazards.push(...segment.hazards);
    
    // Track worst road condition
    if (roadConditionRank.indexOf(segment.roadCondition) > roadConditionRank.indexOf(worstRoadCondition)) {
      worstRoadCondition = segment.roadCondition;
    }
  });
  
  // Get weather multiplier
  const season = customSeason || getCurrentSeason();
  const weatherMultiplier = getWeatherImpactMultiplier(season);
  
  // Calculate time estimate
  const estimatedTime = estimateDeliveryTime(
    totalDistance,
    dominantTerrain,
    totalElevationPenalty,
    weatherMultiplier,
    segments.length // Number of stops/waypoints
  );
  
  // Calculate cost
  const costResult = calculateDeliveryCost(
    totalDistance,
    dominantTerrain,
    maxDifficulty,
    weatherMultiplier,
    weightKg
  );
  
  // Generate recommendations
  const recommendations = generateRecommendations(
    dominantTerrain,
    maxDifficulty,
    allHazards,
    season
  );
  
  return {
    totalDistance: Math.round(totalDistance * 10) / 10,
    estimatedTimeMinutes: estimatedTime,
    terrainType: dominantTerrain,
    difficultyScore: maxDifficulty,
    baseCost: costResult.baseCost,
    terrainMultiplier: costResult.terrainMultiplier,
    weatherMultiplier,
    totalCost: costResult.totalCost,
    elevationPenalty: Math.round(totalElevationPenalty * 100) / 100,
    hazardsDetected: allHazards,
    routeSegments: segments,
    recommendations,
  };
}

/**
 * Check if a district is in a "shadow zone" (low connectivity area)
 */
export function isShadowZone(connectivityScore: number): boolean {
  return connectivityScore <= 3;
}

/**
 * Get estimated time range (min-max) considering uncertainties
 */
export function getTimeRange(baseMinutes: number, terrainType: TerrainType): { min: number; max: number; average: number } {
  const variance = terrainType === 'MOUNTAINOUS' ? 0.4 : 
                   terrainType === 'HILLY' ? 0.3 : 
                   terrainType === 'VALLEY' ? 0.25 : 0.15;
  
  return {
    min: Math.round(baseMinutes * (1 - variance)),
    max: Math.round(baseMinutes * (1 + variance)),
    average: baseMinutes,
  };
}

/**
 * Format delivery time for display
 */
export function formatDeliveryTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${mins} min`;
}

/**
 * Get terrain icon name for UI display
 */
export function getTerrainIcon(terrainType: TerrainType): string {
  const icons: Record<TerrainType, string> = {
    PLAIN: '🌾',
    HILLY: '⛰️',
    MOUNTAINOUS: '🏔️',
    VALLEY: '🏞️',
    MIXED: '🛤️',
  };
  return icons[terrainType];
}
