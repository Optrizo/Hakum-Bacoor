export type CarSize = 'small' | 'medium' | 'large' | 'extra_large';

export type ServiceStatus = 'waiting' | 'in-progress' | 'payment-pending' | 'completed' | 'cancelled';

export interface SizePricing {
  small: number;
  medium: number;
  large: number;
  extra_large: number;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  description?: string;
  pricing?: SizePricing;
  created_at?: string;
  updated_at?: string;
}

export interface ServicePackage {
  id: string;
  name: string;
  description?: string;
  service_ids: string[];
  pricing: SizePricing;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CrewMember {
  id: string;
  name: string;
  phone?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Car {
  id: string;
  plate: string;
  model: string;
  size: CarSize;
  service: string;
  services: string[];
  status: ServiceStatus;
  phone: string;
  crew?: string[];
  total_cost: number;
  created_at: string;
  updated_at: string;
}

export const CAR_SIZES: { label: string; value: CarSize }[] = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
  { label: 'Extra Large', value: 'extra_large' },
];

export const SERVICE_STATUSES: { label: string; value: ServiceStatus }[] = [
  { label: 'Waiting', value: 'waiting' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Ready for Payment', value: 'payment-pending' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export const DATE_FILTERS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This Month', value: 'month' },
  { label: 'All Time', value: 'all' },
];