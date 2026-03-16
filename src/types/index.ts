// Hill-Haat Type Definitions
// Northeast India Farm-to-Highway Marketplace

export type UserRole = 'FARMER' | 'BUYER' | 'LOGISTICS' | 'ADMIN';

export type Category = 
  | 'VEGETABLES' 
  | 'FRUITS' 
  | 'SPICES' 
  | 'GRAINS' 
  | 'DAIRY' 
  | 'HERBS' 
  | 'BAMBOO_PRODUCTS' 
  | 'HANDICRAFTS' 
  | 'TEA' 
  | 'HONEY' 
  | 'OTHER';

export type QualityGrade = 'A_PLUS' | 'A' | 'B' | 'C';

export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'SOLD_OUT' | 'EXPIRED' | 'SUSPENDED';

export type OrderStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'PROCESSING' 
  | 'SHIPPED' 
  | 'IN_TRANSIT' 
  | 'OUT_FOR_DELIVERY' 
  | 'DELIVERED' 
  | 'CANCELLED' 
  | 'RETURNED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

export type DeliveryStatus = 
  | 'ASSIGNED' 
  | 'ACCEPTED' 
  | 'PICKED_UP' 
  | 'IN_TRANSIT' 
  | 'NEAR_DESTINATION' 
  | 'DELIVERED' 
  | 'FAILED' 
  | 'CANCELLED';

// Terrain types specific to Northeast India geography
export type TerrainType = 'PLAIN' | 'HILLY' | 'MOUNTAINOUS' | 'VALLEY' | 'MIXED' | 'RIVERINE';

// Elevation zones for NE India
export type ElevationZone = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

// Vehicle types for logistics
export type VehicleType = 'BIKE' | 'AUTO' | 'SMALL_TRUCK' | 'LARGE_TRUCK' | 'PICKUP' | 'TRACTOR';

// Hazard types common in Northeast India
export type HazardType = 'LANDSLIDE' | 'FLOOD' | 'FOG' | 'POOR_ROAD' | 'NO_CONNECTIVITY' | 'POLITICAL_UNREST';

// Season types for NE India
export type Season = 'DRY' | 'PRE_MONSOON' | 'MONSOON' | 'POST_MONSOON' | 'WINTER';

// ============================================
// User Interfaces
// ============================================
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  district?: string;
  state?: string;
  address?: string;
  pincode?: string;
  isVerified: boolean;
  totalSales: number;
  totalPurchases: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  // Verification status for NE India farmers
  aadhaarVerified?: boolean;
  panVerified?: boolean;
  bankAccountVerified?: boolean;
}

// ============================================
// Listing Interface
// ============================================
export interface Listing {
  id: string;
  title: string;
  description: string;
  category: Category;
  subcategory?: string;
  price: number;
  unit: string;
  minOrder: number;
  maxQuantity?: number;
  quality: QualityGrade;
  isOrganic: boolean;
  organicCertHash?: string;
  isVerified: boolean;
  district: string;
  state: string;
  coordinates?: string;
  status: ListingStatus;
  availableFrom?: string;
  availableUntil?: string;
  harvestDate?: string;
  images?: string[];
  viewCount: number;
  orderCount: number;
  createdAt: string;
  seller: User;
  // NE India specific location data
  latitude?: number;
  longitude?: number;
  elevation?: number;
  elevationZone?: ElevationZone;
  terrainType?: TerrainType;
  nearestHighway?: string;
  nearestMarket?: string;
  connectivityScore?: number;
}

// ============================================
// Order Interface
// ============================================
export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryAddress: string;
  deliveryDistrict: string;
  deliveryState: string;
  notes?: string;
  createdAt: string;
  listing: Listing;
  buyer: User;
  seller: User;
  delivery?: Delivery;
  tracking: TrackingEvent[];
  // NE India specific delivery data
  terrainType?: TerrainType;
  elevationGain?: number;
  deliveryRouteId?: string;
  riderId?: string;
  estimatedDeliveryTime?: number;
  deliveryDifficulty?: number;
}

export interface Delivery {
  id: string;
  orderId: string;
  riderId: string;
  pickupLocation: string;
  dropLocation: string;
  estimatedDistance?: number;
  estimatedTime?: number;
  terrainType: TerrainType;
  difficultyLevel: number;
  status: DeliveryStatus;
  currentLocation?: string;
  baseFare: number;
  terrainBonus: number;
  totalEarnings: number;
  rider: User;
  // NE India specific route data
  elevationGain?: number;
  deliveryRouteId?: string;
  weatherMultiplier?: number;
  hazardZones?: HazardType[];
}

// ============================================
// Delivery Route Interface (NE India Terrain-Aware)
// ============================================
export interface DeliveryRoute {
  id: string;
  name: string;
  pickupLocation: string;
  pickupDistrict: string;
  pickupState: string;
  dropLocation: string;
  dropDistrict: string;
  dropState: string;
  terrainType: TerrainType;
  distance: number;
  estimatedTime: number;
  baseCost: number;
  elevationGain: number;
  maxElevation: number;
  connectivityScore: number;
  hazardZones: HazardType[];
  isActive: boolean;
  createdAt: string;
}

// ============================================
// Logistics Partner Interface
// ============================================
export interface LogisticsPartner {
  id: string;
  userId: string;
  businessName: string;
  vehicleType: VehicleType;
  serviceableDistricts: string[];
  serviceableStates: string[];
  currentLocation?: string;
  currentDistrict?: string;
  currentState?: string;
  isAvailable: boolean;
  rating: number;
  totalDeliveries: number;
  terrainExpertise: TerrainType[];
  baseRate: number;
  perKmRate: number;
  terrainMultiplier: number;
}

// ============================================
// Rider Interface
// ============================================
export interface Rider {
  id: string;
  userId: string;
  logisticsPartnerId?: string;
  name: string;
  phone: string;
  vehicleType: VehicleType;
  vehicleNumber?: string;
  currentLocation?: string;
  currentDistrict?: string;
  currentState?: string;
  isAvailable: boolean;
  rating: number;
  totalDeliveries: number;
  terrainExpertise: TerrainType[];
  serviceableDistricts: string[];
  aadhaarVerified: boolean;
  drivingLicenseVerified: boolean;
}

// ============================================
// NE India Location Data Interfaces
// ============================================
export interface DistrictInfo {
  name: string;
  state: string;
  terrainType: TerrainType;
  elevation: number;
  elevationZone: ElevationZone;
  connectivityScore: number;
  majorMarkets: string[];
  specialProduce: string[];
  hazardTypes: HazardType[];
  nearestHighway: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface StateInfo {
  name: string;
  capital: string;
  districts: string[];
  averageElevation: number;
  primaryTerrain: TerrainType;
  majorHighways: string[];
  borderCrossings?: string[];
  specialProducts: string[];
}

export interface MarketLocation {
  name: string;
  district: string;
  state: string;
  type: 'HAAT' | 'WEEKLY_MARKET' | 'PERMANENT_MARKET' | 'WHOLESALE';
  marketDays?: string[];
  majorProducts: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface TrackingEvent {
  id: string;
  orderId: string;
  status: string;
  location?: string;
  description: string;
  timestamp: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  listingId: string;
  reviewerId: string;
  isVerified: boolean;
  createdAt: string;
  reviewer: User;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ============================================
// Verification Types for NE India Farmers
// ============================================
export type VerificationType = 'AADHAAR' | 'PAN' | 'BANK_ACCOUNT' | 'ORGANIC_CERT' | 'LAND_RECORDS' | 'FARMER_ID';

export type VerificationStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface Verification {
  id: string;
  userId: string;
  type: VerificationType;
  status: VerificationStatus;
  documentUrl?: string;
  documentNumber?: string;
  documentName?: string;
  documentExpiry?: string;
  remarks?: string;
  rejectionReason?: string;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  submittedAt: string;
  updatedAt: string;
}

// Category Labels
export const CATEGORY_LABELS: Record<Category, string> = {
  VEGETABLES: 'Vegetables',
  FRUITS: 'Fruits',
  SPICES: 'Spices',
  GRAINS: 'Grains & Cereals',
  DAIRY: 'Dairy Products',
  HERBS: 'Medicinal Herbs',
  BAMBOO_PRODUCTS: 'Bamboo Products',
  HANDICRAFTS: 'Handicrafts',
  TEA: 'Tea & Beverages',
  HONEY: 'Honey & Bee Products',
  OTHER: 'Other Products',
};

// Quality Grade Labels
export const QUALITY_LABELS: Record<QualityGrade, string> = {
  A_PLUS: 'Premium (A+)',
  A: 'Grade A',
  B: 'Grade B',
  C: 'Standard',
};

// Order Status Labels
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  IN_TRANSIT: 'In Transit',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
};

// ============================================
// Northeast Indian States - Complete List
// ============================================
export const NE_STATES = [
  'Arunachal Pradesh',
  'Assam',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Sikkim',
  'Tripura',
] as const;

// ============================================
// Northeast Indian Districts - Complete List
// All 8 states with all districts
// ============================================
export const NE_DISTRICTS: Record<string, string[]> = {
  'Arunachal Pradesh': [
    'Tawang', 'West Kameng', 'East Kameng', 'Papum Pare', 'Kurung Kumey',
    'Kra Daadi', 'Lower Subansiri', 'Upper Subansiri', 'West Siang',
    'East Siang', 'Upper Siang', 'Siang', 'Lower Siang', 'Dibang Valley',
    'Lower Dibang Valley', 'Lohit', 'Namsai', 'Changlang', 'Tirap',
    'Longding', 'Pakke Kessang', 'Lepa Rada', 'Kamle'
  ],
  'Assam': [
    'Baksa', 'Barpeta', 'Biswanath', 'Bongaigaon', 'Cachar', 'Charaideo',
    'Chirang', 'Darrang', 'Dhemaji', 'Dhubri', 'Dibrugarh', 'Dima Hasao',
    'Goalpara', 'Golaghat', 'Hailakandi', 'Hojai', 'Jorhat', 'Kamrup',
    'Kamrup Metropolitan', 'Karbi Anglong', 'Karimganj', 'Kokrajhar',
    'Lakhimpur', 'Majuli', 'Morigaon', 'Nagaon', 'Nalbari', 'Sivasagar',
    'Sonitpur', 'South Salmara', 'Tinsukia', 'Udalguri', 'West Karbi Anglong',
    'Tamulpur', 'Bajali'
  ],
  'Manipur': [
    'Bishnupur', 'Chandel', 'Churachandpur', 'Imphal East', 'Imphal West',
    'Jiribam', 'Kakching', 'Kamjong', 'Kangpokpi', 'Noney', 'Pherzawl',
    'Senapati', 'Tamenglong', 'Tengnoupal', 'Thoubal', 'Ukhrul'
  ],
  'Meghalaya': [
    'East Garo Hills', 'East Jaintia Hills', 'East Khasi Hills',
    'North Garo Hills', 'Ri Bhoi', 'South Garo Hills', 'South West Garo Hills',
    'South West Khasi Hills', 'West Garo Hills', 'West Jaintia Hills',
    'West Khasi Hills'
  ],
  'Mizoram': [
    'Aizawl', 'Champhai', 'Hnahthial', 'Khawzawl', 'Kolasib', 'Lawngtlai',
    'Lunglei', 'Mamit', 'Saiha', 'Saitual', 'Serchhip'
  ],
  'Nagaland': [
    'Chumoukedima', 'Dimapur', 'Kiphire', 'Kohima', 'Longleng', 'Mokokchung',
    'Mon', 'Niuland', 'Noklak', 'Peren', 'Phek', 'Shamator', 'Tseminyu',
    'Tuensang', 'Wokha', 'Zunheboto'
  ],
  'Sikkim': [
    'East Sikkim', 'North Sikkim', 'South Sikkim', 'West Sikkim',
    'Pakyong', 'Soreng'
  ],
  'Tripura': [
    'Dhalai', 'Gomati', 'Khowai', 'North Tripura', 'Sepahijala',
    'South Tripura', 'Unakoti', 'West Tripura'
  ],
};

// ============================================
// State Information with Capitals
// ============================================
export const NE_STATE_INFO: StateInfo[] = [
  {
    name: 'Arunachal Pradesh',
    capital: 'Itanagar',
    districts: NE_DISTRICTS['Arunachal Pradesh'],
    averageElevation: 1250,
    primaryTerrain: 'MOUNTAINOUS',
    majorHighways: ['NH-13', 'NH-15', 'NH-229', 'Trans-Arunachal Highway'],
    borderCrossings: ['Bum La Pass', 'Kibithu', 'Nampong (Pangsau Pass)'],
    specialProducts: ['Kiwi', 'Large Cardamom', 'Orange', 'Bamboo Shoots', 'Apple', 'Yak Cheese'],
  },
  {
    name: 'Assam',
    capital: 'Dispur',
    districts: NE_DISTRICTS['Assam'],
    averageElevation: 80,
    primaryTerrain: 'PLAIN',
    majorHighways: ['NH-15', 'NH-17', 'NH-27', 'NH-37', 'NH-36'],
    borderCrossings: ['Sutarkandi', 'Mankachar', 'Dawki'],
    specialProducts: ['Tea', 'Rice', 'Muga Silk', 'Eri Silk', 'Ginger', 'Bamboo', 'Lakadong Turmeric'],
  },
  {
    name: 'Manipur',
    capital: 'Imphal',
    districts: NE_DISTRICTS['Manipur'],
    averageElevation: 950,
    primaryTerrain: 'HILLY',
    majorHighways: ['NH-2', 'NH-37', 'NH-102'],
    borderCrossings: ['Moreh (Indo-Myanmar)'],
    specialProducts: ['Pineapple', 'Passion Fruit', 'Black Rice (Chakhao)', 'Shiitake Mushroom', 'Naga Chilli'],
  },
  {
    name: 'Meghalaya',
    capital: 'Shillong',
    districts: NE_DISTRICTS['Meghalaya'],
    averageElevation: 1050,
    primaryTerrain: 'HILLY',
    majorHighways: ['NH-6', 'NH-106', 'NH-217'],
    borderCrossings: ['Dawki', 'Mahendraganj', 'Ghasuapara'],
    specialProducts: ['Lakadong Turmeric', 'Honey', 'Betel Leaf', 'Sohiong', 'Potato', 'Ginger'],
  },
  {
    name: 'Mizoram',
    capital: 'Aizawl',
    districts: NE_DISTRICTS['Mizoram'],
    averageElevation: 1000,
    primaryTerrain: 'HILLY',
    majorHighways: ['NH-54', 'NH-6', 'NH-102A'],
    borderCrossings: ['Zokhawthar', 'Champhai', 'Lawngtlai'],
    specialProducts: ['Ginger', 'Turmeric', 'Passion Fruit', 'Avocado', 'Anthurium', 'Bird Eye Chilli'],
  },
  {
    name: 'Nagaland',
    capital: 'Kohima',
    districts: NE_DISTRICTS['Nagaland'],
    averageElevation: 1100,
    primaryTerrain: 'HILLY',
    majorHighways: ['NH-29', 'NH-36', 'NH-702'],
    borderCrossings: ['Avakhung', 'Pungro'],
    specialProducts: ['Naga Chilli (Ghost Pepper)', 'Bamboo Shoot', 'Akhuni (Fermented Soybean)', 'Kiwi', 'Plum'],
  },
  {
    name: 'Sikkim',
    capital: 'Gangtok',
    districts: NE_DISTRICTS['Sikkim'],
    averageElevation: 1800,
    primaryTerrain: 'MOUNTAINOUS',
    majorHighways: ['NH-10', 'NH-310', 'NH-510'],
    borderCrossings: ['Nathu La', 'Jelep La'],
    specialProducts: ['Large Cardamom', 'Ginger', 'Buckwheat', 'Temi Tea', 'Kiwi', 'Medicinal Herbs'],
  },
  {
    name: 'Tripura',
    capital: 'Agartala',
    districts: NE_DISTRICTS['Tripura'],
    averageElevation: 30,
    primaryTerrain: 'PLAIN',
    majorHighways: ['NH-8', 'NH-108', 'NH-208'],
    borderCrossings: ['Akhaura', 'Srimantapur', 'Belonia'],
    specialProducts: ['Pineapple', 'Jackfruit', 'Ginger', 'Jampui Orange', 'Rubber', 'Handloom'],
  },
];

// ============================================
// Popular Markets and Haats in NE India
// ============================================
export const NE_MARKETS: MarketLocation[] = [
  // Arunachal Pradesh
  { name: 'Itanagar Market', district: 'Papum Pare', state: 'Arunachal Pradesh', type: 'PERMANENT_MARKET', majorProducts: ['Vegetables', 'Fruits', 'Handicrafts'] },
  { name: 'Tawang Market', district: 'Tawang', state: 'Arunachal Pradesh', type: 'HAAT', marketDays: ['Sunday'], majorProducts: ['Apple', 'Kiwi', 'Yak Products'] },
  { name: 'Pasighat Market', district: 'East Siang', state: 'Arunachal Pradesh', type: 'WEEKLY_MARKET', marketDays: ['Wednesday', 'Saturday'], majorProducts: ['Rice', 'Fish', 'Ginger'] },
  
  // Assam
  { name: 'Fancy Bazaar', district: 'Kamrup Metropolitan', state: 'Assam', type: 'WHOLESALE', majorProducts: ['Tea', 'Spices', 'Rice', 'Fish'] },
  { name: 'Paltan Bazaar', district: 'Kamrup Metropolitan', state: 'Assam', type: 'PERMANENT_MARKET', majorProducts: ['Vegetables', 'Fruits', 'Textiles'] },
  { name: 'Jorhat Market', district: 'Jorhat', state: 'Assam', type: 'WHOLESALE', majorProducts: ['Tea', 'Rice', 'Mustard'] },
  { name: 'Dibrugarh Market', district: 'Dibrugarh', state: 'Assam', type: 'WHOLESALE', majorProducts: ['Tea', 'Bamboo Products', 'Silk'] },
  { name: 'Silchar Market', district: 'Cachar', state: 'Assam', type: 'PERMANENT_MARKET', majorProducts: ['Pineapple', 'Lemon', 'Tea', 'Fish'] },
  
  // Manipur
  { name: 'Ima Keithel (Mothers Market)', district: 'Imphal West', state: 'Manipur', type: 'PERMANENT_MARKET', majorProducts: ['Vegetables', 'Fish', 'Handloom', 'Rice'] },
  { name: 'Moreh Market', district: 'Tengnoupal', state: 'Manipur', type: 'WEEKLY_MARKET', marketDays: ['Tuesday', 'Friday'], majorProducts: ['Border Trade Items', 'Spices', 'Textiles'] },
  
  // Meghalaya
  { name: 'Bara Bazaar (Shillong)', district: 'East Khasi Hills', state: 'Meghalaya', type: 'PERMANENT_MARKET', majorProducts: ['Potato', 'Ginger', 'Honey', 'Betel Leaf'] },
  { name: 'Tura Market', district: 'West Garo Hills', state: 'Meghalaya', type: 'WEEKLY_MARKET', marketDays: ['Monday', 'Thursday'], majorProducts: ['Ginger', 'Turmeric', 'Areca Nut', 'Cashew'] },
  
  // Mizoram
  { name: 'Bara Bazaar (Aizawl)', district: 'Aizawl', state: 'Mizoram', type: 'PERMANENT_MARKET', majorProducts: ['Ginger', 'Turmeric', 'Orange', 'Handicrafts'] },
  { name: 'Champhai Market', district: 'Champhai', state: 'Mizoram', type: 'HAAT', marketDays: ['Sunday'], majorProducts: ['Rice', 'Ginger', 'Grapes'] },
  
  // Nagaland
  { name: 'Dimapur Super Market', district: 'Dimapur', state: 'Nagaland', type: 'WHOLESALE', majorProducts: ['Rice', 'Naga Chilli', 'Ginger', 'Vegetables'] },
  { name: 'Kohima Main Market', district: 'Kohima', state: 'Nagaland', type: 'PERMANENT_MARKET', majorProducts: ['Naga Chilli', 'Bamboo Shoot', 'Plum', 'Handicrafts'] },
  
  // Sikkim
  { name: 'Lal Bazaar (Gangtok)', district: 'East Sikkim', state: 'Sikkim', type: 'PERMANENT_MARKET', majorProducts: ['Cardamom', 'Ginger', 'Vegetables', 'Cheese'] },
  { name: 'MG Marg Market', district: 'East Sikkim', state: 'Sikkim', type: 'PERMANENT_MARKET', majorProducts: ['Tea', 'Cardamom', 'Handicrafts'] },
  
  // Tripura
  { name: 'Maharaja Ganj Market', district: 'West Tripura', state: 'Tripura', type: 'WHOLESALE', majorProducts: ['Pineapple', 'Jackfruit', 'Rubber', 'Handloom'] },
  { name: 'Jampui Market', district: 'North Tripura', state: 'Tripura', type: 'HAAT', marketDays: ['Sunday'], majorProducts: ['Orange', 'Pineapple', 'Coffee'] },
];

// ============================================
// Terrain Types with Characteristics
// ============================================
export const TERRAIN_INFO: Record<TerrainType, { name: string; speed: number; multiplier: number; description: string }> = {
  PLAIN: { name: 'Plain', speed: 40, multiplier: 1.0, description: 'Flat terrain with good road connectivity' },
  HILLY: { name: 'Hilly', speed: 25, multiplier: 1.5, description: 'Moderate elevation with winding roads' },
  MOUNTAINOUS: { name: 'Mountainous', speed: 15, multiplier: 2.0, description: 'High altitude with steep gradients' },
  VALLEY: { name: 'Valley', speed: 30, multiplier: 1.3, description: 'Low-lying areas between hills, flood-prone' },
  MIXED: { name: 'Mixed', speed: 28, multiplier: 1.6, description: 'Combination of terrain types' },
  RIVERINE: { name: 'Riverine', speed: 20, multiplier: 1.8, description: 'River valleys and floodplains' },
};

// ============================================
// Elevation Zone Definitions
// ============================================
export const ELEVATION_ZONES: Record<ElevationZone, { range: [number, number]; description: string }> = {
  LOW: { range: [0, 300], description: 'Low-lying plains and valleys' },
  MEDIUM: { range: [300, 1000], description: 'Moderate elevation hills' },
  HIGH: { range: [1000, 2000], description: 'High altitude areas' },
  VERY_HIGH: { range: [2000, 5000], description: 'Very high mountain regions' },
};

// ============================================
// Vehicle Types for NE India Logistics
// ============================================
export const VEHICLE_INFO: Record<VehicleType, { name: string; capacity: number; suitableTerrains: TerrainType[] }> = {
  BIKE: { name: 'Motorcycle', capacity: 50, suitableTerrains: ['PLAIN', 'HILLY', 'VALLEY'] },
  AUTO: { name: 'Auto Rickshaw', capacity: 200, suitableTerrains: ['PLAIN', 'VALLEY'] },
  SMALL_TRUCK: { name: 'Small Truck', capacity: 2000, suitableTerrains: ['PLAIN', 'HILLY', 'VALLEY', 'MIXED'] },
  LARGE_TRUCK: { name: 'Large Truck', capacity: 10000, suitableTerrains: ['PLAIN'] },
  PICKUP: { name: 'Pickup Vehicle', capacity: 1000, suitableTerrains: ['PLAIN', 'HILLY', 'MIXED'] },
  TRACTOR: { name: 'Tractor', capacity: 3000, suitableTerrains: ['PLAIN', 'HILLY', 'MIXED'] },
};

// ============================================
// Region-Specific Products
// ============================================
export const REGION_PRODUCTS: Record<string, { products: string[]; seasonality: Record<string, string[]> }> = {
  'Arunachal Pradesh': {
    products: ['Kiwi', 'Large Cardamom', 'Orange', 'Bamboo Shoots', 'Apple', 'Yak Cheese', 'Buckwheat'],
    seasonality: { 'Kiwi': ['Nov-Feb'], 'Apple': ['Aug-Oct'], 'Orange': ['Nov-Jan'], 'Large Cardamom': ['Sep-Nov'] },
  },
  'Assam': {
    products: ['Tea', 'Rice', 'Muga Silk', 'Eri Silk', 'Ginger', 'Bamboo', 'Lakadong Turmeric', 'Jute', 'Mustard'],
    seasonality: { 'Tea': ['Mar-Dec'], 'Ginger': ['Nov-Mar'], 'Turmeric': ['Jan-Apr'] },
  },
  'Manipur': {
    products: ['Pineapple', 'Passion Fruit', 'Black Rice (Chakhao)', 'Shiitake Mushroom', 'Naga Chilli', 'Handloom'],
    seasonality: { 'Pineapple': ['Jun-Sep'], 'Black Rice': ['Nov-Jan'], 'Passion Fruit': ['Jul-Oct'] },
  },
  'Meghalaya': {
    products: ['Lakadong Turmeric', 'Honey', 'Betel Leaf', 'Sohiong', 'Potato', 'Ginger', 'Broom Grass'],
    seasonality: { 'Turmeric': ['Jan-Apr'], 'Honey': ['Mar-May', 'Oct-Dec'], 'Sohiong': ['Jun-Aug'] },
  },
  'Mizoram': {
    products: ['Ginger', 'Turmeric', 'Passion Fruit', 'Avocado', 'Anthurium', 'Bird Eye Chilli', 'Bamboo'],
    seasonality: { 'Ginger': ['Nov-Mar'], 'Passion Fruit': ['Jul-Oct'], 'Avocado': ['May-Aug'] },
  },
  'Nagaland': {
    products: ['Naga Chilli (Ghost Pepper)', 'Bamboo Shoot', 'Akhuni (Fermented Soybean)', 'Kiwi', 'Plum', 'Wild Herbs'],
    seasonality: { 'Naga Chilli': ['Aug-Dec'], 'Kiwi': ['Nov-Feb'], 'Plum': ['May-Jul'] },
  },
  'Sikkim': {
    products: ['Large Cardamom', 'Ginger', 'Buckwheat', 'Temi Tea', 'Kiwi', 'Medicinal Herbs', 'Sikkim Mandarin'],
    seasonality: { 'Large Cardamom': ['Sep-Nov'], 'Temi Tea': ['Mar-Dec'], 'Kiwi': ['Nov-Feb'] },
  },
  'Tripura': {
    products: ['Pineapple', 'Jackfruit', 'Ginger', 'Jampui Orange', 'Rubber', 'Handloom', 'Coffee'],
    seasonality: { 'Pineapple': ['Jun-Sep'], 'Jackfruit': ['Mar-Jun'], 'Jampui Orange': ['Nov-Jan'] },
  },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get elevation zone from elevation value
 */
export function getElevationZone(elevation: number): ElevationZone {
  if (elevation < 300) return 'LOW';
  if (elevation < 1000) return 'MEDIUM';
  if (elevation < 2000) return 'HIGH';
  return 'VERY_HIGH';
}

/**
 * Get districts for a specific state
 */
export function getDistrictsForState(state: string): string[] {
  return NE_DISTRICTS[state] || [];
}

/**
 * Get state info by name
 */
export function getStateInfo(stateName: string): StateInfo | undefined {
  return NE_STATE_INFO.find(s => s.name === stateName);
}

/**
 * Get markets for a district
 */
export function getMarketsForDistrict(district: string, state: string): MarketLocation[] {
  return NE_MARKETS.filter(m => m.district === district && m.state === state);
}

/**
 * Get products for a state
 */
export function getProductsForState(state: string): string[] {
  return REGION_PRODUCTS[state]?.products || [];
}
