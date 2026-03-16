/**
 * Hill-Haat Terrain-Aware Delivery Cost Calculator
 * Designed for Northeast India's unique geography
 * 
 * Features:
 * - Distance-based cost calculation
 * - Terrain multipliers (Hilly, Mountainous, Valley, etc.)
 * - Elevation gain penalties
 * - Vehicle type adjustments
 * - Weather/hazard adjustments
 * - Shadow zone (low connectivity) premiums
 */

import { TerrainType, HazardType, TERRAIN_INFO } from '@/types';

// Local vehicle type to avoid circular import issues
type VehicleType = 'BIKE' | 'AUTO' | 'SMALL_TRUCK' | 'LARGE_TRUCK' | 'PICKUP' | 'TRACTOR';

// ============================================
// Constants for Delivery Calculation
// ============================================

// Base rates in INR
const BASE_RATES = {
  PICKUP: 15,         // Base pickup charge
  DROP: 10,           // Base drop charge
  PER_KM: 8,          // Per kilometer rate
  MINIMUM_FARE: 30,   // Minimum delivery charge
  HANDLING: 5,        // Handling charge
};

// Terrain multipliers (affects both time and cost)
const TERRAIN_MULTIPLIERS: Record<TerrainType, number> = {
  PLAIN: 1.0,
  HILLY: 1.5,
  MOUNTAINOUS: 2.0,
  VALLEY: 1.3,
  MIXED: 1.6,
  RIVERINE: 1.8,
};

// Elevation penalties (per 100m elevation gain)
const ELEVATION_RATES = {
  BASE: 0.5,          // Base rate per 100m
  HIGH_ALTITUDE: 1.0, // Rate above 1500m
  THRESHOLD: 1500,    // High altitude threshold in meters
};

// Vehicle capacity and terrain suitability
const VEHICLE_TERRAIN_BONUS: Record<VehicleType, Record<TerrainType, number>> = {
  BIKE: { PLAIN: 1.0, HILLY: 1.2, MOUNTAINOUS: 1.5, VALLEY: 1.1, MIXED: 1.3, RIVERINE: 1.4 },
  AUTO: { PLAIN: 1.0, HILLY: 1.4, MOUNTAINOUS: 2.0, VALLEY: 1.2, MIXED: 1.5, RIVERINE: 1.6 },
  SMALL_TRUCK: { PLAIN: 1.0, HILLY: 1.3, MOUNTAINOUS: 1.8, VALLEY: 1.1, MIXED: 1.4, RIVERINE: 1.5 },
  LARGE_TRUCK: { PLAIN: 1.0, HILLY: 1.6, MOUNTAINOUS: 2.5, VALLEY: 1.3, MIXED: 1.7, RIVERINE: 1.8 },
  PICKUP: { PLAIN: 1.0, HILLY: 1.25, MOUNTAINOUS: 1.6, VALLEY: 1.1, MIXED: 1.35, RIVERINE: 1.45 },
  TRACTOR: { PLAIN: 1.0, HILLY: 1.2, MOUNTAINOUS: 1.4, VALLEY: 1.1, MIXED: 1.25, RIVERINE: 1.3 },
};

// Hazard multipliers
const HAZARD_MULTIPLIERS: Record<HazardType, number> = {
  LANDSLIDE: 1.3,
  FLOOD: 1.4,
  FOG: 1.15,
  POOR_ROAD: 1.2,
  NO_CONNECTIVITY: 1.25,
  POLITICAL_UNREST: 1.5,
};

// Shadow zone premium (areas with poor connectivity)
const SHADOW_ZONE_PREMIUM = 1.2;

// Season multipliers
const SEASON_MULTIPLIERS = {
  DRY: 1.0,
  PRE_MONSOON: 1.1,
  MONSOON: 1.3,
  POST_MONSOON: 1.1,
  WINTER: 1.15,
};

// ============================================
// Interfaces
// ============================================

export interface DeliveryCalculation {
  distance: number;              // in km
  baseCost: number;              // base delivery cost
  terrainCost: number;           // terrain adjustment
  elevationCost: number;         // elevation gain cost
  vehicleCost: number;           // vehicle type adjustment
  hazardCost: number;            // hazard zone adjustments
  totalCost: number;             // final delivery cost
  estimatedTime: number;         // in minutes
  difficultyLevel: number;       // 1-10 scale
  breakdown: {
    baseFare: number;
    distanceFare: number;
    terrainMultiplier: number;
    elevationCharge: number;
    vehicleAdjustment: number;
    hazardCharge: number;
    seasonAdjustment: number;
  };
}

export interface RouteInfo {
  pickupDistrict: string;
  pickupState: string;
  pickupElevation: number;
  dropDistrict: string;
  dropState: string;
  dropElevation: number;
  distance: number;
  terrainType: TerrainType;
  maxElevation: number;
  hazardZones: HazardType[];
  isShadowZone: boolean;
}

export interface DeliveryOptions {
  vehicleType: VehicleType;
  weight: number;               // in kg
  isUrgent: boolean;
  season?: 'DRY' | 'PRE_MONSOON' | 'MONSOON' | 'POST_MONSOON' | 'WINTER';
}

// ============================================
// Main Calculation Functions
// ============================================

/**
 * Calculate the delivery cost for a route
 */
export function calculateDeliveryCost(
  route: RouteInfo,
  options: DeliveryOptions
): DeliveryCalculation {
  const { distance, terrainType, maxElevation, hazardZones, isShadowZone } = route;
  const { vehicleType, weight, isUrgent, season = 'DRY' } = options;

  // 1. Base fare
  const baseFare = BASE_RATES.PICKUP + BASE_RATES.DROP;
  
  // 2. Distance fare
  const distanceFare = distance * BASE_RATES.PER_KM;
  
  // 3. Terrain multiplier
  const terrainMultiplier = TERRAIN_MULTIPLIERS[terrainType];
  
  // 4. Elevation charge
  const elevationGain = Math.max(0, maxElevation - route.pickupElevation);
  const elevationCharge = calculateElevationCharge(elevationGain, maxElevation);
  
  // 5. Vehicle adjustment
  const vehicleAdjustment = VEHICLE_TERRAIN_BONUS[vehicleType][terrainType] - 1;
  
  // 6. Hazard charge
  const hazardCharge = calculateHazardCharge(hazardZones);
  
  // 7. Season adjustment
  const seasonAdjustment = SEASON_MULTIPLIERS[season] - 1;
  
  // 8. Weight surcharge (for heavy loads)
  const weightSurcharge = weight > 50 ? Math.floor(weight / 50) * 10 : 0;
  
  // Calculate costs
  const baseCost = baseFare + distanceFare + BASE_RATES.HANDLING;
  const terrainCost = baseCost * (terrainMultiplier - 1);
  const elevationCost = baseCost * elevationCharge;
  const vehicleCost = baseCost * vehicleAdjustment;
  const hazardCost = baseCost * hazardCharge;
  
  // Apply shadow zone premium if applicable
  const shadowPremium = isShadowZone ? (baseCost + terrainCost + elevationCost) * (SHADOW_ZONE_PREMIUM - 1) : 0;
  
  // Season adjustment on total
  const seasonCost = (baseCost + terrainCost + elevationCost + vehicleCost + hazardCost + shadowPremium) * seasonAdjustment;
  
  // Urgent delivery premium (50% extra)
  const urgentPremium = isUrgent ? (baseCost + terrainCost + elevationCost + vehicleCost + hazardCost) * 0.5 : 0;
  
  // Calculate total
  let totalCost = baseCost + terrainCost + elevationCost + vehicleCost + hazardCost + shadowPremium + seasonCost + urgentPremium + weightSurcharge;
  
  // Apply minimum fare
  totalCost = Math.max(totalCost, BASE_RATES.MINIMUM_FARE);
  
  // Round to nearest 5 rupees
  totalCost = Math.ceil(totalCost / 5) * 5;
  
  // Calculate estimated time
  const estimatedTime = calculateEstimatedTime(distance, terrainType, hazardZones, isUrgent);
  
  // Calculate difficulty level (1-10)
  const difficultyLevel = calculateDifficultyLevel(
    terrainType,
    maxElevation,
    hazardZones.length,
    distance,
    isShadowZone
  );
  
  return {
    distance,
    baseCost: Math.round(baseCost),
    terrainCost: Math.round(terrainCost),
    elevationCost: Math.round(elevationCost),
    vehicleCost: Math.round(vehicleCost),
    hazardCost: Math.round(hazardCost),
    totalCost: Math.round(totalCost),
    estimatedTime,
    difficultyLevel,
    breakdown: {
      baseFare: Math.round(baseFare),
      distanceFare: Math.round(distanceFare),
      terrainMultiplier,
      elevationCharge: Math.round(elevationCharge * 100) / 100,
      vehicleAdjustment: Math.round(vehicleAdjustment * 100) / 100,
      hazardCharge: Math.round(hazardCharge * 100) / 100,
      seasonAdjustment: Math.round(seasonAdjustment * 100) / 100,
    },
  };
}

/**
 * Calculate elevation charge based on elevation gain
 */
function calculateElevationCharge(elevationGain: number, maxElevation: number): number {
  if (elevationGain <= 0) return 0;
  
  let charge = 0;
  const hundredMeterGains = elevationGain / 100;
  
  if (maxElevation > ELEVATION_RATES.THRESHOLD) {
    // High altitude pricing
    const normalGains = Math.min(hundredMeterGains, (ELEVATION_RATES.THRESHOLD - 1000) / 100);
    const highAltGains = hundredMeterGains - normalGains;
    charge = normalGains * ELEVATION_RATES.BASE + highAltGains * ELEVATION_RATES.HIGH_ALTITUDE;
  } else {
    charge = hundredMeterGains * ELEVATION_RATES.BASE;
  }
  
  // Cap at 30% of base
  return Math.min(charge / 100, 0.3);
}

/**
 * Calculate hazard charge based on hazard zones
 */
function calculateHazardCharge(hazardZones: HazardType[]): number {
  if (hazardZones.length === 0) return 0;
  
  let totalCharge = 0;
  for (const hazard of hazardZones) {
    totalCharge += HAZARD_MULTIPLIERS[hazard] - 1;
  }
  
  // Cap at 50% of base
  return Math.min(totalCharge, 0.5);
}

/**
 * Calculate estimated delivery time in minutes
 */
function calculateEstimatedTime(
  distance: number,
  terrainType: TerrainType,
  hazardZones: HazardType[],
  isUrgent: boolean
): number {
  // Base speed depends on terrain
  const baseSpeed = TERRAIN_INFO[terrainType]?.speed || 30;
  
  // Calculate base time
  let baseTime = (distance / baseSpeed) * 60; // in minutes
  
  // Add hazard delays
  const hazardDelay = hazardZones.length * 10; // 10 min per hazard
  
  // Add pickup/drop time
  const handlingTime = 15; // 15 minutes for pickup and drop
  
  // Calculate total
  let totalTime = baseTime + hazardDelay + handlingTime;
  
  // Urgent delivery reduces time by 20% (rushed delivery)
  if (isUrgent) {
    totalTime *= 0.8;
  }
  
  // Minimum 30 minutes
  return Math.max(Math.round(totalTime), 30);
}

/**
 * Calculate difficulty level (1-10 scale)
 */
function calculateDifficultyLevel(
  terrainType: TerrainType,
  maxElevation: number,
  hazardCount: number,
  distance: number,
  isShadowZone: boolean
): number {
  let difficulty = 1;
  
  // Terrain difficulty
  const terrainScores: Record<TerrainType, number> = {
    PLAIN: 1,
    VALLEY: 2,
    MIXED: 4,
    HILLY: 5,
    RIVERINE: 6,
    MOUNTAINOUS: 7,
  };
  difficulty += terrainScores[terrainType];
  
  // Elevation difficulty
  if (maxElevation > 2000) difficulty += 2;
  else if (maxElevation > 1000) difficulty += 1;
  
  // Hazard difficulty
  difficulty += Math.min(hazardCount, 2);
  
  // Distance difficulty
  if (distance > 100) difficulty += 2;
  else if (distance > 50) difficulty += 1;
  
  // Shadow zone difficulty
  if (isShadowZone) difficulty += 1;
  
  // Cap at 10
  return Math.min(difficulty, 10);
}

/**
 * Get terrain type based on district information
 */
export function getTerrainForDistrict(district: string, state: string): TerrainType {
  // High altitude/mountainous districts
  const mountainousDistricts = [
    'Tawang', 'West Kameng', 'East Kameng', 'Upper Subansiri', 'Upper Siang',
    'Dibang Valley', 'Lower Dibang Valley', 'Lohit', 'North Sikkim', 'East Sikkim',
    'West Sikkim', 'Kohima', 'Phek', 'Tuensang', 'Zunheboto',
  ];
  
  // Hilly districts
  const hillyDistricts = [
    'Papum Pare', 'Kurung Kumey', 'Lower Subansiri', 'West Siang', 'East Siang',
    'Changlang', 'Tirap', 'Senapati', 'Tamenglong', 'Ukhrul', 'Chandel',
    'East Khasi Hills', 'West Khasi Hills', 'Ri Bhoi', 'Aizawl', 'Champhai',
    'Lunglei', 'Wokha', 'Mokokchung', 'Mon', 'Longleng',
  ];
  
  // Valley districts
  const valleyDistricts = [
    'Dhemaji', 'Lakhimpur', 'Dibrugarh', 'Tinsukia', 'Sivasagar', 'Jorhat',
    'Golaghat', 'Cachar', 'Hailakandi', 'Karimganj', 'Imphal East', 'Imphal West',
    'Thoubal', 'Bishnupur', 'West Tripura', 'Sepahijala',
  ];
  
  // Riverine districts
  const riverineDistricts = [
    'Dhubri', 'Barpeta', 'Bongaigaon', 'Goalpara', 'Kamrup', 'Morigaon',
    'Nagaon', 'Darrang', 'Udalguri', 'Baksa', 'Chirang', 'Kokrajhar',
    'South Salmara', 'Dhalai', 'Gomati',
  ];
  
  const districtName = district.toLowerCase();
  
  if (mountainousDistricts.some(d => d.toLowerCase().includes(districtName))) {
    return 'MOUNTAINOUS';
  }
  if (hillyDistricts.some(d => d.toLowerCase().includes(districtName))) {
    return 'HILLY';
  }
  if (valleyDistricts.some(d => d.toLowerCase().includes(districtName))) {
    return 'VALLEY';
  }
  if (riverineDistricts.some(d => d.toLowerCase().includes(districtName))) {
    return 'RIVERINE';
  }
  
  // Default based on state
  const stateTerrain: Record<string, TerrainType> = {
    'Arunachal Pradesh': 'MOUNTAINOUS',
    'Sikkim': 'MOUNTAINOUS',
    'Nagaland': 'HILLY',
    'Mizoram': 'HILLY',
    'Manipur': 'HILLY',
    'Meghalaya': 'HILLY',
    'Assam': 'PLAIN',
    'Tripura': 'PLAIN',
  };
  
  return stateTerrain[state] || 'MIXED';
}

/**
 * Get estimated distance between two districts
 */
export function estimateDistance(
  pickupDistrict: string,
  pickupState: string,
  dropDistrict: string,
  dropState: string
): number {
  // Same district
  if (pickupDistrict === dropDistrict && pickupState === dropState) {
    return 10;
  }
  
  // Same state
  if (pickupState === dropState) {
    // Hill states have longer intra-state distances
    const hillStates = ['Arunachal Pradesh', 'Sikkim', 'Nagaland', 'Mizoram', 'Manipur', 'Meghalaya'];
    return hillStates.includes(pickupState) ? 80 : 50;
  }
  
  // Neighboring states
  const neighbors: Record<string, string[]> = {
    'Arunachal Pradesh': ['Assam', 'Nagaland'],
    'Assam': ['Arunachal Pradesh', 'Nagaland', 'Manipur', 'Mizoram', 'Meghalaya', 'Tripura'],
    'Manipur': ['Assam', 'Nagaland', 'Mizoram'],
    'Meghalaya': ['Assam'],
    'Mizoram': ['Assam', 'Manipur', 'Tripura'],
    'Nagaland': ['Arunachal Pradesh', 'Assam', 'Manipur'],
    'Sikkim': [],
    'Tripura': ['Assam', 'Mizoram'],
  };
  
  const isNeighbor = neighbors[pickupState]?.includes(dropState) || false;
  
  if (isNeighbor) {
    return 150;
  }
  
  // Non-neighboring states
  // Sikkim is only connected through West Bengal
  if (pickupState === 'Sikkim' || dropState === 'Sikkim') {
    return 400;
  }
  
  // Farthest distance within NE India
  return 300;
}

/**
 * Get estimated elevation for a district
 */
export function estimateElevation(district: string, state: string): number {
  const stateElevations: Record<string, number> = {
    'Arunachal Pradesh': 1250,
    'Assam': 80,
    'Manipur': 950,
    'Meghalaya': 1050,
    'Mizoram': 1000,
    'Nagaland': 1100,
    'Sikkim': 1800,
    'Tripura': 30,
  };
  
  const highElevationDistricts: Record<string, number> = {
    'Tawang': 2669,
    'West Kameng': 1600,
    'Upper Siang': 1500,
    'Dibang Valley': 1800,
    'North Sikkim': 2500,
    'East Sikkim': 1800,
    'West Sikkim': 1600,
    'Kohima': 1444,
  };
  
  if (highElevationDistricts[district]) {
    return highElevationDistricts[district];
  }
  
  return stateElevations[state] || 500;
}

/**
 * Check if a district is a shadow zone (low connectivity)
 */
export function isShadowZone(district: string, state: string): boolean {
  const shadowZones = [
    // Arunachal - border areas
    'Tawang', 'Upper Siang', 'Dibang Valley', 'Anjaw', 'Changlang', 'Tirap', 'Longding',
    // Nagaland - remote districts
    'Tuensang', 'Mon', 'Kiphire', 'Noklak',
    // Manipur - hill districts
    'Ukhrul', 'Tamenglong', 'Chandel', 'Kamjong', 'Noney', 'Pherzawl',
    // Mizoram - southern districts
    'Lawngtlai', 'Saiha',
    // Meghalaya - interior districts
    'South Garo Hills', 'West Khasi Hills', 'East Jaintia Hills',
  ];
  
  return shadowZones.some(sz => district.toLowerCase().includes(sz.toLowerCase()));
}

/**
 * Get common hazards for a route
 */
export function getCommonHazards(
  pickupDistrict: string,
  pickupState: string,
  dropDistrict: string,
  dropState: string,
  season: string
): HazardType[] {
  const hazards: HazardType[] = [];
  
  // Landslide-prone areas
  const landslideProne = [
    'Tawang', 'West Kameng', 'East Kameng', 'Upper Subansiri', 'West Siang', 'East Siang',
    'North Sikkim', 'East Sikkim', 'West Sikkim', 'Kohima', 'Phek', 'Senapati', 'Tamenglong',
    'East Khasi Hills', 'West Khasi Hills', 'Ri Bhoi',
  ];
  
  if ([pickupDistrict, dropDistrict].some(d => 
    landslideProne.some(lp => d.toLowerCase().includes(lp.toLowerCase())))) {
    if (season === 'MONSOON') {
      hazards.push('LANDSLIDE');
    }
  }
  
  // Flood-prone areas
  const floodProne = [
    'Dhemaji', 'Lakhimpur', 'Dhubri', 'Barpeta', 'Goalpara', 'Morigaon', 'Nagaon',
    'Darrang', 'Baksa', 'Chirang', 'Kokrajhar', 'South Salmara', 'Cachar',
  ];
  
  if ([pickupDistrict, dropDistrict].some(d => 
    floodProne.some(fp => d.toLowerCase().includes(fp.toLowerCase())))) {
    if (season === 'MONSOON' || season === 'PRE_MONSOON') {
      hazards.push('FLOOD');
    }
  }
  
  // Fog-prone areas (winter)
  const fogProne = ['East Khasi Hills', 'West Khasi Hills', 'Ri Bhoi', 'Golaghat', 'Jorhat'];
  
  if ([pickupDistrict, dropDistrict].some(d => 
    fogProne.some(fp => d.toLowerCase().includes(fp.toLowerCase())))) {
    if (season === 'WINTER') {
      hazards.push('FOG');
    }
  }
  
  // Shadow zones have connectivity issues
  if (isShadowZone(pickupDistrict, pickupState) || isShadowZone(dropDistrict, dropState)) {
    hazards.push('NO_CONNECTIVITY');
  }
  
  return hazards;
}

// ============================================
// Vehicle Adjustments for Terrain Compatibility
// ============================================
export const VEHICLE_ADJUSTMENTS: Record<VehicleType, {
  capacityKg: number;
  suitableTerrains: TerrainType[];
  baseSpeed: number;
  costMultiplier: number;
}> = {
  BIKE: {
    capacityKg: 50,
    suitableTerrains: ['PLAIN', 'HILLY', 'VALLEY'],
    baseSpeed: 35,
    costMultiplier: 1.0,
  },
  AUTO: {
    capacityKg: 200,
    suitableTerrains: ['PLAIN', 'VALLEY'],
    baseSpeed: 25,
    costMultiplier: 1.2,
  },
  SMALL_TRUCK: {
    capacityKg: 2000,
    suitableTerrains: ['PLAIN', 'HILLY', 'VALLEY', 'MIXED'],
    baseSpeed: 30,
    costMultiplier: 1.5,
  },
  LARGE_TRUCK: {
    capacityKg: 10000,
    suitableTerrains: ['PLAIN'],
    baseSpeed: 25,
    costMultiplier: 2.0,
  },
  PICKUP: {
    capacityKg: 1000,
    suitableTerrains: ['PLAIN', 'HILLY', 'MIXED'],
    baseSpeed: 32,
    costMultiplier: 1.3,
  },
  TRACTOR: {
    capacityKg: 3000,
    suitableTerrains: ['PLAIN', 'HILLY', 'MIXED'],
    baseSpeed: 15,
    costMultiplier: 1.1,
  },
};

// ============================================
// Delivery Estimate Interface for API
// ============================================
export interface DeliveryEstimateInput {
  distanceKm: number;
  terrainType: TerrainType;
  weightKg: number;
  pickupElevation: number;
  deliveryElevation: number;
  pickupConnectivity: number;
  deliveryConnectivity: number;
  hazards: HazardType[];
  vehicleType?: VehicleType;
  isUrgent?: boolean;
}

export interface DeliveryEstimateOutput {
  time: {
    baseTimeMinutes: number;
    elevationDelay: number;
    connectivityDelay: number;
    hazardDelay: number;
    totalTimeMinutes: number;
    timeRange: {
      min: number;
      max: number;
      average: number;
    };
  };
  cost: {
    baseCost: number;
    distanceCost: number;
    elevationPenalty: number;
    hazardCharge: number;
    terrainMultiplier: number;
    totalCost: number;
    breakdown: {
      baseFare: number;
      distanceFare: number;
      terrainMultiplier: number;
      elevationCharge: number;
      hazardCharge: number;
    };
  };
  difficulty: {
    score: number;
    level: 'EASY' | 'MODERATE' | 'DIFFICULT' | 'VERY_DIFFICULT';
    factors: string[];
  };
  recommendations: string[];
}

/**
 * Calculate comprehensive delivery estimate
 * Used by the orders API to calculate terrain-based delivery cost
 */
export function calculateDeliveryEstimate(input: DeliveryEstimateInput): DeliveryEstimateOutput {
  const {
    distanceKm,
    terrainType,
    weightKg,
    pickupElevation,
    deliveryElevation,
    pickupConnectivity,
    deliveryConnectivity,
    hazards,
    vehicleType: VehicleType = 'SMALL_TRUCK',
    isUrgent = false,
  } = input;

  // Calculate elevation gain
  const elevationGain = Math.max(0, deliveryElevation - pickupElevation);
  const maxElevation = Math.max(pickupElevation, deliveryElevation);
  
  // Get terrain multiplier
  const terrainMultiplier = TERRAIN_MULTIPLIERS[terrainType] || 1.0;
  
  // Calculate base time
  const baseSpeed = TERRAIN_INFO[terrainType]?.speed || 30;
  const baseTimeMinutes = Math.round((distanceKm / baseSpeed) * 60);
  
  // Elevation delay: 2 minutes per 100m elevation gain
  const elevationDelay = Math.round(elevationGain / 100 * 2);
  
  // Connectivity delay: if connectivity score is low, add delay
  const avgConnectivity = (pickupConnectivity + deliveryConnectivity) / 2;
  const connectivityDelay = avgConnectivity < 5 ? Math.round((5 - avgConnectivity) * 5) : 0;
  
  // Hazard delay: 15 minutes per hazard
  const hazardDelay = hazards.length * 15;
  
  // Total time
  let totalTimeMinutes = baseTimeMinutes + elevationDelay + connectivityDelay + hazardDelay + 30; // 30 min buffer
  
  // Urgent delivery reduces time
  if (isUrgent) {
    totalTimeMinutes = Math.round(totalTimeMinutes * 0.8);
  }
  
  // Minimum time
  totalTimeMinutes = Math.max(totalTimeMinutes, 30);
  
  // Time range calculation
  const variancePercent = terrainType === 'MOUNTAINOUS' ? 0.4 : 
                          terrainType === 'HILLY' ? 0.3 : 
                          terrainType === 'VALLEY' ? 0.25 : 0.15;
  
  // Calculate costs
  // Base fare
  const baseFare = BASE_RATES.PICKUP + BASE_RATES.DROP;
  
  // Distance fare
  let distanceFare = 0;
  if (distanceKm <= 10) {
    distanceFare = distanceKm * 8;
  } else {
    distanceFare = 10 * 8 + (distanceKm - 10) * 6;
  }
  
  // Weight surcharge
  const weightSurcharge = weightKg > 50 ? Math.floor(weightKg / 50) * 10 : 0;
  
  // Base cost
  const baseCost = baseFare + distanceFare + BASE_RATES.HANDLING + weightSurcharge;
  
  // Elevation penalty: extra cost per 500m elevation gain
  const elevationPenalty = Math.round((elevationGain / 500) * 0.05 * baseCost);
  
  // Hazard charge
  let hazardCharge = 0;
  for (const hazard of hazards) {
    hazardCharge += (HAZARD_MULTIPLIERS[hazard] || 1.1) - 1;
  }
  hazardCharge = Math.min(hazardCharge, 0.5) * baseCost;
  
  // Calculate total cost
  let totalCost = baseCost * terrainMultiplier + elevationPenalty + hazardCharge;
  
  // Shadow zone premium
  const isShadow = pickupConnectivity <= 3 || deliveryConnectivity <= 3;
  if (isShadow) {
    totalCost *= SHADOW_ZONE_PREMIUM;
  }
  
  // Season adjustment (default to current season)
  const month = new Date().getMonth() + 1;
  let seasonMultiplier = 1.0;
  if (month >= 6 && month <= 9) seasonMultiplier = SEASON_MULTIPLIERS.MONSOON;
  else if (month >= 3 && month <= 5) seasonMultiplier = SEASON_MULTIPLIERS.PRE_MONSOON;
  else if (month === 10) seasonMultiplier = SEASON_MULTIPLIERS.POST_MONSOON;
  else if (month >= 11 || month <= 2) seasonMultiplier = SEASON_MULTIPLIERS.WINTER;
  
  totalCost *= seasonMultiplier;
  
  // Urgent premium
  if (isUrgent) {
    totalCost *= 1.5;
  }
  
  // Round to nearest 5
  totalCost = Math.ceil(Math.max(totalCost, BASE_RATES.MINIMUM_FARE) / 5) * 5;
  
  // Calculate difficulty
  let difficultyScore = 1;
  const difficultyFactors: string[] = [];
  
  // Terrain factor
  const terrainDifficulty: Record<TerrainType, number> = {
    PLAIN: 1,
    VALLEY: 2,
    MIXED: 3,
    HILLY: 4,
    RIVERINE: 5,
    MOUNTAINOUS: 6,
  };
  difficultyScore += terrainDifficulty[terrainType] || 3;
  if (terrainType !== 'PLAIN') {
    difficultyFactors.push(`${terrainType.toLowerCase()} terrain`);
  }
  
  // Elevation factor
  if (maxElevation > 2000) {
    difficultyScore += 2;
    difficultyFactors.push('high altitude (>2000m)');
  } else if (maxElevation > 1000) {
    difficultyScore += 1;
    difficultyFactors.push('moderate elevation (>1000m)');
  }
  
  // Connectivity factor
  if (avgConnectivity <= 3) {
    difficultyScore += 2;
    difficultyFactors.push('low connectivity area');
  } else if (avgConnectivity <= 5) {
    difficultyScore += 1;
    difficultyFactors.push('moderate connectivity');
  }
  
  // Hazard factor
  if (hazards.length > 0) {
    difficultyScore += Math.min(hazards.length, 2);
    difficultyFactors.push(`${hazards.length} active hazard(s)`);
  }
  
  // Distance factor
  if (distanceKm > 100) {
    difficultyScore += 2;
    difficultyFactors.push('long distance (>100km)');
  } else if (distanceKm > 50) {
    difficultyScore += 1;
    difficultyFactors.push('moderate distance (>50km)');
  }
  
  // Cap at 10
  difficultyScore = Math.min(difficultyScore, 10);
  
  // Difficulty level
  let difficultyLevel: 'EASY' | 'MODERATE' | 'DIFFICULT' | 'VERY_DIFFICULT';
  if (difficultyScore <= 3) difficultyLevel = 'EASY';
  else if (difficultyScore <= 5) difficultyLevel = 'MODERATE';
  else if (difficultyScore <= 7) difficultyLevel = 'DIFFICULT';
  else difficultyLevel = 'VERY_DIFFICULT';
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (terrainType === 'MOUNTAINOUS' || terrainType === 'HILLY') {
    recommendations.push('Use vehicles suitable for hilly terrain with good ground clearance');
  }
  
  if (hazards.includes('LANDSLIDE')) {
    recommendations.push('Check road conditions before dispatch during monsoon season');
  }
  
  if (hazards.includes('NO_CONNECTIVITY')) {
    recommendations.push('Download offline maps - low connectivity zone');
  }
  
  if (hazards.includes('FLOOD')) {
    recommendations.push('Consider alternate routes - flood prone area');
  }
  
  if (isShadow) {
    recommendations.push('Expect communication delays in shadow zone');
  }
  
  if (elevationGain > 1000) {
    recommendations.push('High elevation gain - allow extra delivery time');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Route conditions are favorable for delivery');
  }
  
  return {
    time: {
      baseTimeMinutes,
      elevationDelay,
      connectivityDelay,
      hazardDelay,
      totalTimeMinutes,
      timeRange: {
        min: Math.round(totalTimeMinutes * (1 - variancePercent)),
        max: Math.round(totalTimeMinutes * (1 + variancePercent)),
        average: totalTimeMinutes,
      },
    },
    cost: {
      baseCost: Math.round(baseCost),
      distanceCost: Math.round(distanceFare),
      elevationPenalty: Math.round(elevationPenalty),
      hazardCharge: Math.round(hazardCharge),
      terrainMultiplier,
      totalCost: Math.round(totalCost),
      breakdown: {
        baseFare: Math.round(baseFare),
        distanceFare: Math.round(distanceFare),
        terrainMultiplier,
        elevationCharge: Math.round(elevationPenalty / baseCost * 100) / 100,
        hazardCharge: Math.round(hazardCharge / baseCost * 100) / 100,
      },
    },
    difficulty: {
      score: difficultyScore,
      level: difficultyLevel,
      factors: difficultyFactors,
    },
    recommendations,
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
