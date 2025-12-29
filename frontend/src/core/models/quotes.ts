export interface IQuote {
  id?: number;
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  status: 'pending' | 'contacted' | 'accepted' | 'rejected';
  created_at?: string;
  updated_at?: string;
}