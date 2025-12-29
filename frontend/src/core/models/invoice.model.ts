import { IItem } from './item.model';

export interface IInvoice {
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
  iban: string;
  created_at: string;
}
