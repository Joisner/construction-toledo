import { IItem } from './item.model';

export interface IBudget {
  id: string;
  number: string;
  date: string;
  clientName: string;
  clientAddress: string;
  clientDNI: string;
  clientPhone: string;
  clientEmail: string;
  items: IItem[];
  taxRate: number;
  validUntil: string;
  conditions: string;
  iban: string;
  created_at: string;
}
