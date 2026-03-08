// Hill-Haat Type Definitions

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

export type TerrainType = 'PLAIN' | 'HILLY' | 'MOUNTAINOUS' | 'MIXED';

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
}

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
}

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

// Northeast Indian States
export const NE_STATES = [
  'Arunachal Pradesh',
  'Assam',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Sikkim',
  'Tripura',
];

// Northeast Indian Districts (sample)
export const NE_DISTRICTS: Record<string, string[]> = {
  'Arunachal Pradesh': ['Tawang', 'West Kameng', 'East Kameng', 'Papum Pare', 'Kurung Kumey', 'Lower Subansiri', 'Upper Subansiri', 'West Siang', 'East Siang', 'Upper Siang', 'Dibang Valley', 'Lohit', 'Changlang', 'Tirap'],
  'Assam': ['Baksa', 'Barpeta', 'Biswanath', 'Bongaigaon', 'Cachar', 'Charaideo', 'Chirang', 'Darrang', 'Dhemaji', 'Dhubri', 'Dibrugarh', 'Dima Hasao', 'Goalpara', 'Golaghat', 'Hailakandi', 'Hojai', 'Jorhat', 'Kamrup', 'Kamrup Metropolitan', 'Karbi Anglong', 'Karimganj', 'Kokrajhar', 'Lakhimpur', 'Majuli', 'Morigaon', 'Nagaon', 'Nalbari', 'Sivasagar', 'Sonitpur', 'South Salmara', 'Tinsukia', 'Udalguri', 'West Karbi Anglong'],
  'Manipur': ['Bishnupur', 'Chandel', 'Churachandpur', 'Imphal East', 'Imphal West', 'Jiribam', 'Kakching', 'Kamjong', 'Kangpokpi', 'Noney', 'Pherzawl', 'Senapati', 'Tamenglong', 'Tengnoupal', 'Thoubal', 'Ukhrul'],
  'Meghalaya': ['East Garo Hills', 'East Jaintia Hills', 'East Khasi Hills', 'North Garo Hills', 'Ri Bhoi', 'South Garo Hills', 'South West Garo Hills', 'South West Khasi Hills', 'West Garo Hills', 'West Jaintia Hills', 'West Khasi Hills'],
  'Mizoram': ['Aizawl', 'Champhai', 'Hnahthial', 'Khawzawl', 'Kolasib', 'Lawngtlai', 'Lunglei', 'Mamit', 'Saiha', 'Saitual', 'Serchhip'],
  'Nagaland': ['Chumoukedima', 'Dimapur', 'Kiphire', 'Kohima', 'Longleng', 'Mokokchung', 'Mon', 'Niuland', 'Noklak', 'Peren', 'Phek', 'Shamator', 'Tseminyu', 'Tuensang', 'Wokha', 'Zunheboto'],
  'Sikkim': ['East Sikkim', 'North Sikkim', 'South Sikkim', 'West Sikkim', 'Pakyong', 'Soreng'],
  'Tripura': ['Dhalai', 'Gomati', 'Khowai', 'North Tripura', 'Sepahijala', 'South Tripura', 'Unakoti', 'West Tripura'],
};
