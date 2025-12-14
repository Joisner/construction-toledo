export interface Service {
  id?: number;
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
  features: string[];
  starting_price?: number;
}