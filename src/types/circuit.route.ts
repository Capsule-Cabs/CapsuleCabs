// types/route.ts - Generated from circuit.model.js [file:18]
// Save this file and import as: import { Route, RouteOperator, ... } from '../types/route';

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type SeatType = 'window' | 'aisle' | 'middle' | 'back-seats';
export type SeatLevel = 'lower' | 'upper';
export type VehicleType = 'ertiga-cab';
export type SeatingLayout = '1x1' | '1x2' | '2x1' | '2x2' | '2x3';
export type DiscountType = 'early-bird' | 'student' | 'senior-citizen' | 'group' | 'loyalty';
export type RouteStatus = 'active' | 'inactive' | 'suspended' | 'under-maintenance';
export type Frequency = 'daily' | 'weekdays' | 'weekends' | 'specific-dates';
export type Currency = 'INR' | 'USD';
export type Amenity = 'wifi' | 'ac' | 'charging' | 'meals' | 'blanket' | 'pillow' | 'entertainment' | 'water';

export interface PickupDropPoint {
  name: string;
  address: string;
  coordinates?: number[]; // [lng, lat]
  landmark?: string;
  contactNumber?: string;
}

export interface OriginDestination {
  city: string;
  location: string;
  coordinates: number[]; // [longitude, latitude]
  pickupPoints?: PickupDropPoint[]; // origin only
  dropPoints?: PickupDropPoint[];   // destination only
}

export interface SeatPrice {
  base: number;
  premium?: number;
}

export interface SeatPosition {
  row: number;
  column: number;
  level?: SeatLevel;
}

export interface SeatMap {
  seatNumber: string;
  type: SeatType;
  position: SeatPosition;
  price: SeatPrice;
  isAccessible?: boolean;
  isBlocked?: boolean;
}

export interface VehicleSeating {
  layout: SeatingLayout;
  totalSeats: number;
  seatMap: SeatMap[];
}

export interface Vehicle {
  vehicleType: VehicleType;
  vehicleNumber: string;
  model: string;
  year: number;
  amenities: Amenity[];
  images: string[]; // URLs
  capacity: number;
}

export interface ScheduleItem {
  departureTime: string; // HH:MM
  arrivalTime: string;   // HH:MM
  duration: number;      // minutes
  frequency: Frequency;
  activeDays?: DayOfWeek[]; // for specific-dates
  validFrom: Date;
  validUntil: Date;
  isActive?: boolean;
}

export interface Tax {
  name: string;
  percentage: number;
  isApplicable?: boolean;
}

export interface DynamicPricing {
  enabled?: boolean;
  peakMultiplier?: number;
  lowDemandMultiplier?: number;
}

export interface Discount {
  type: DiscountType;
  percentage: number;
  isActive?: boolean;
}

export interface Pricing {
  baseFare: number;
  currency?: Currency;
  taxes: Tax[];
  dynamicPricing: DynamicPricing;
  discounts: Discount[];
}

export interface CancellationRule {
  timeBeforeDeparture: number; // hours
  refundPercentage: number;
}

export interface CancellationPolicy {
  allowCancellation?: boolean;
  cancellationRules: CancellationRule[];
}

export interface ModificationPolicy {
  allowModification?: boolean;
  modificationFee?: number;
}

export interface BaggagePolicy {
  allowance?: string;
  extraBaggageFee?: number;
}

export interface Policies {
  cancellation: CancellationPolicy;
  modification: ModificationPolicy;
  baggage: BaggagePolicy;
}

export interface Analytics {
  totalTrips?: number;
  totalRevenue?: number;
  occupancyRate?: number;
}

export interface Rating {
  average?: number;
  totalReviews?: number;
}

export interface RouteOperator {
  operatorId: string; // ObjectId as string
  name: string;
  contactNumber: string;
  licenseNumber: string;
  rating?: number;
}

export interface Route {
  _id?: string;
  routeCode: string;
  operator: RouteOperator;
  origin: OriginDestination;
  destination: OriginDestination;
  vehicle: Vehicle;
  seating: any;
  schedule: ScheduleItem[];
  pricing: Pricing;
  policies: Policies;
  status: RouteStatus;
  rating?: Rating;
  analytics?: Analytics;
  
  // Virtual (populated by mongoose)
  routeName?: string; // `${origin.city} to ${destination.city}`

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;

  // Methods (use as functions if needed)
  isAvailableOnDate?(date: Date): boolean;
  getAvailableSeats?(date: Date): SeatMap[];
  calculateFare?(seatNumbers: string[], date: Date): {
    baseFare: number;
    taxAmount: number;
    totalFare: number;
  };
}

// Partial for forms (required fields only)
export type NewRoute = Omit<Route, '_id' | 'rating' | 'analytics' | 'createdAt' | 'updatedAt'>;

// Usage in AdminDashboard.tsx:
// import { Route } from '../types/route';
// const [routes, setRoutes] = useState<Route[]>([]);
