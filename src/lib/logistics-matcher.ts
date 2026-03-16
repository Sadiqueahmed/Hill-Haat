/**
 * Hill-Haat Logistics Matcher Service
 * Matches orders with available riders based on:
 * - Terrain expertise
 * - Vehicle suitability
 * - Current location
 * - Serviceable districts
 */

import { db } from '@/lib/db';
import { TerrainType, VehicleType, VEHICLE_INFO } from '@/types';

// ============================================
// Interfaces
// ============================================

export interface LogisticsMatch {
  riderId: string;
  partnerId?: string;
  score: number;
  estimatedArrival: number;
  isAvailable: boolean;
  matchReasons: string[];
  vehicleType: VehicleType;
  terrainMatch: boolean;
  districtMatch: boolean;
}

export interface OrderDetails {
  pickupDistrict: string;
  pickupState: string;
  dropDistrict: string;
  dropState: string;
  terrainType: TerrainType;
  weight: number;
  isUrgent: boolean;
}

// ============================================
// Main Matching Functions
// ============================================

/**
 * Find the best available rider for an order
 */
export async function findBestRider(order: OrderDetails): Promise<LogisticsMatch | null> {
  // Get all available riders with their details
  const riders = await db.rider.findMany({
    where: {
      isAvailable: true,
      isVerified: true,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          rating: true,
        },
      },
      logisticsPartner: {
        select: {
          id: true,
          businessName: true,
          isAvailable: true,
        },
      },
    },
  });

  if (riders.length === 0) {
    return null;
  }

  // Score each rider
  const scoredRiders = riders
    .map(rider => scoreRider(rider, order))
    .filter(match => match.score > 0)
    .sort((a, b) => b.score - a.score);

  return scoredRiders[0] || null;
}

/**
 * Score a rider based on order requirements
 */
function scoreRider(
  rider: {
    id: string;
    userId: string;
    name: string;
    phone: string;
    vehicleType: VehicleType;
    currentDistrict: string | null;
    currentState: string | null;
    serviceableDistricts: string | null;
    terrainExpertise: string | null;
    rating: number;
    totalDeliveries: number;
    logisticsPartnerId: string | null;
    logisticsPartner?: { id: string; businessName: string; isAvailable: boolean } | null;
    user: { id: string; name: string; rating: number };
  },
  order: OrderDetails
): LogisticsMatch {
  let score = 50; // Base score
  const matchReasons: string[] = [];
  let terrainMatch = false;
  let districtMatch = false;

  // 1. Check terrain expertise
  const terrainExpertise = rider.terrainExpertise 
    ? JSON.parse(rider.terrainExpertise) as TerrainType[]
    : [];
  
  if (terrainExpertise.includes(order.terrainType)) {
    score += 25;
    terrainMatch = true;
    matchReasons.push(`Experienced in ${order.terrainType.toLowerCase()} terrain`);
  }

  // 2. Check vehicle suitability
  const vehicleInfo = VEHICLE_INFO[rider.vehicleType];
  if (vehicleInfo.suitableTerrains.includes(order.terrainType)) {
    score += 15;
    matchReasons.push(`${vehicleInfo.name} suitable for this route`);
  } else {
    score -= 10;
    matchReasons.push(`Vehicle may struggle on this terrain`);
  }

  // 3. Check weight capacity
  if (order.weight > vehicleInfo.capacity) {
    score = 0; // Not suitable at all
    return {
      riderId: rider.userId,
      partnerId: rider.logisticsPartnerId || undefined,
      score: 0,
      estimatedArrival: 0,
      isAvailable: false,
      matchReasons: ['Vehicle capacity exceeded'],
      vehicleType: rider.vehicleType,
      terrainMatch: false,
      districtMatch: false,
    };
  }

  // 4. Check serviceable districts
  const serviceableDistricts = rider.serviceableDistricts
    ? JSON.parse(rider.serviceableDistricts) as string[]
    : [];
  
  if (serviceableDistricts.includes(order.pickupDistrict) && 
      serviceableDistricts.includes(order.dropDistrict)) {
    score += 20;
    districtMatch = true;
    matchReasons.push('Serves both pickup and delivery areas');
  } else if (serviceableDistricts.includes(order.pickupDistrict) || 
             serviceableDistricts.includes(order.dropDistrict)) {
    score += 10;
    matchReasons.push('Serves one of the areas');
  }

  // 5. Current location proximity
  if (rider.currentDistrict === order.pickupDistrict) {
    score += 15;
    matchReasons.push('Currently near pickup location');
  } else if (rider.currentState === order.pickupState) {
    score += 8;
    matchReasons.push('In the same state as pickup');
  }

  // 6. Rating bonus
  if (rider.rating >= 4.5) {
    score += 10;
    matchReasons.push('Highly rated rider');
  } else if (rider.rating >= 4.0) {
    score += 5;
  }

  // 7. Experience bonus
  if (rider.totalDeliveries >= 100) {
    score += 10;
    matchReasons.push('Experienced rider');
  } else if (rider.totalDeliveries >= 50) {
    score += 5;
  }

  // 8. Partner availability check
  if (rider.logisticsPartner && !rider.logisticsPartner.isAvailable) {
    score -= 20;
    matchReasons.push('Partner currently unavailable');
  }

  // 9. Urgent delivery adjustment
  if (order.isUrgent && rider.vehicleType === 'BIKE') {
    score += 10;
    matchReasons.push('Bike ideal for urgent delivery');
  }

  // Calculate estimated arrival time (in minutes)
  const estimatedArrival = calculateArrivalTime(
    rider.currentDistrict || '',
    order.pickupDistrict,
    order.terrainType
  );

  // Prefer closer riders for urgent orders
  if (order.isUrgent && estimatedArrival < 30) {
    score += 15;
  }

  return {
    riderId: rider.userId,
    partnerId: rider.logisticsPartnerId || undefined,
    score,
    estimatedArrival,
    isAvailable: true,
    matchReasons,
    vehicleType: rider.vehicleType,
    terrainMatch,
    districtMatch,
  };
}

/**
 * Calculate estimated arrival time for rider to reach pickup
 */
function calculateArrivalTime(
  currentDistrict: string,
  pickupDistrict: string,
  terrainType: TerrainType
): number {
  // Same district
  if (currentDistrict === pickupDistrict) {
    return 15;
  }

  // Estimate based on terrain
  const terrainSpeeds: Record<TerrainType, number> = {
    PLAIN: 40,
    VALLEY: 30,
    MIXED: 25,
    HILLY: 20,
    RIVERINE: 18,
    MOUNTAINOUS: 15,
  };

  const speed = terrainSpeeds[terrainType] || 25;
  const estimatedDistance = 30; // km (average inter-district distance)
  
  return Math.round((estimatedDistance / speed) * 60 + 15); // in minutes
}

/**
 * Get all available riders in a district
 */
export async function getAvailableRidersInDistrict(
  district: string,
  state: string
): Promise<Array<{
  id: string;
  name: string;
  vehicleType: VehicleType;
  rating: number;
  isAvailable: boolean;
}>> {
  const riders = await db.rider.findMany({
    where: {
      OR: [
        { currentDistrict: district },
        { 
          serviceableDistricts: { contains: district },
        },
      ],
      isAvailable: true,
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
    take: 10,
  });

  return riders.map(rider => ({
    id: rider.userId,
    name: rider.name,
    vehicleType: rider.vehicleType,
    rating: rider.rating,
    isAvailable: rider.isAvailable,
  }));
}

/**
 * Assign an order to a rider
 */
export async function assignOrderToRider(
  orderId: string,
  riderId: string,
  routeDetails: {
    pickupLocation: string;
    dropLocation: string;
    estimatedDistance: number;
    estimatedTime: number;
    terrainType: TerrainType;
    baseFare: number;
    terrainBonus: number;
  }
): Promise<{ success: boolean; deliveryId?: string; error?: string }> {
  try {
    // Check if rider is still available
    const rider = await db.rider.findUnique({
      where: { userId: riderId },
    });

    if (!rider || !rider.isAvailable) {
      return { success: false, error: 'Rider not available' };
    }

    // Create delivery record
    const delivery = await db.delivery.create({
      data: {
        orderId,
        riderId,
        pickupLocation: routeDetails.pickupLocation,
        dropLocation: routeDetails.dropLocation,
        estimatedDistance: routeDetails.estimatedDistance,
        estimatedTime: routeDetails.estimatedTime,
        terrainType: routeDetails.terrainType,
        baseFare: routeDetails.baseFare,
        terrainBonus: routeDetails.terrainBonus,
        totalEarnings: routeDetails.baseFare + routeDetails.terrainBonus,
        status: 'ASSIGNED',
        assignedAt: new Date(),
        difficultyLevel: 1,
      },
    });

    // Update order with rider and estimated time
    await db.order.update({
      where: { id: orderId },
      data: {
        riderId,
        estimatedDeliveryTime: routeDetails.estimatedTime,
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });

    // Mark rider as unavailable
    await db.rider.update({
      where: { userId: riderId },
      data: { isAvailable: false },
    });

    // Create tracking event
    await db.trackingEvent.create({
      data: {
        orderId,
        status: 'RIDER_ASSIGNED',
        description: `Order assigned to ${rider.name}. Expected pickup in ${Math.round(routeDetails.estimatedTime / 2)} minutes.`,
      },
    });

    return { success: true, deliveryId: delivery.id };
  } catch (error) {
    console.error('Error assigning order to rider:', error);
    return { success: false, error: 'Failed to assign order' };
  }
}

/**
 * Get terrain type from two locations
 */
export function determineTerrainType(
  pickupState: string,
  dropState: string,
  pickupDistrict: string,
  dropDistrict: string
): TerrainType {
  // High altitude states
  const mountainousStates = ['Arunachal Pradesh', 'Sikkim'];
  const hillyStates = ['Nagaland', 'Mizoram', 'Manipur', 'Meghalaya'];
  
  if (mountainousStates.includes(pickupState) || mountainousStates.includes(dropState)) {
    return 'MOUNTAINOUS';
  }
  
  if (hillyStates.includes(pickupState) || hillyStates.includes(dropState)) {
    return 'HILLY';
  }
  
  // If both are plain states
  if (pickupState === 'Assam' && dropState === 'Assam') {
    return 'PLAIN';
  }
  
  // Cross-state often involves mixed terrain
  if (pickupState !== dropState) {
    return 'MIXED';
  }
  
  return 'MIXED';
}

/**
 * Calculate delivery difficulty for rider payment
 */
export function calculateDeliveryDifficulty(
  terrainType: TerrainType,
  distance: number,
  elevationGain: number,
  hazardZones: number
): number {
  const terrainScores: Record<TerrainType, number> = {
    PLAIN: 1,
    VALLEY: 2,
    MIXED: 3,
    HILLY: 4,
    RIVERINE: 5,
    MOUNTAINOUS: 6,
  };

  let difficulty = terrainScores[terrainType];

  // Distance factor
  if (distance > 100) difficulty += 2;
  else if (distance > 50) difficulty += 1;

  // Elevation factor
  if (elevationGain > 1000) difficulty += 2;
  else if (elevationGain > 500) difficulty += 1;

  // Hazard factor
  difficulty += Math.min(hazardZones, 2);

  return Math.min(difficulty, 10);
}

/**
 * Auto-assign a rider to an order
 * This is the main function called by the orders API
 */
export async function autoAssignRider(
  orderId: string
): Promise<{
  success: boolean;
  riderId?: string;
  riderName?: string;
  deliveryId?: string;
  error?: string;
}> {
  try {
    // Get order details
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        listing: {
          select: {
            district: true,
            state: true,
            title: true,
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    // Prepare order details for matching
    const orderDetails: OrderDetails = {
      pickupDistrict: order.listing.district,
      pickupState: order.listing.state,
      dropDistrict: order.deliveryDistrict || '',
      dropState: order.deliveryState || '',
      terrainType: (order.terrainType as TerrainType) || 'MIXED',
      weight: order.quantity,
      isUrgent: false,
    };

    // Find the best rider
    const bestMatch = await findBestRider(orderDetails);

    if (!bestMatch) {
      return { success: false, error: 'No available riders found' };
    }

    // Get rider details
    const rider = await db.rider.findUnique({
      where: { userId: bestMatch.riderId },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    if (!rider) {
      return { success: false, error: 'Rider not found' };
    }

    // Assign the rider to the order
    const result = await assignOrderToRider(orderId, bestMatch.riderId, {
      pickupLocation: orderDetails.pickupDistrict,
      dropLocation: orderDetails.dropDistrict,
      estimatedDistance: 50, // Default estimate
      estimatedTime: bestMatch.estimatedArrival,
      terrainType: orderDetails.terrainType,
      baseFare: 50,
      terrainBonus: 20,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      riderId: bestMatch.riderId,
      riderName: rider.name || rider.user.name,
      deliveryId: result.deliveryId,
    };
  } catch (error) {
    console.error('Error in autoAssignRider:', error);
    return { success: false, error: 'Failed to assign rider' };
  }
}
