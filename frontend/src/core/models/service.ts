export interface IService {
  id?: number;
  title: string;
  description: string;
  details: string;
  image_url: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}