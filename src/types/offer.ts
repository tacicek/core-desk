export interface Offer {
  id: string;
  offer_no: string;
  customer_id: string;
  issue_date: string;
  valid_until?: string;
  status: 'draft' | 'sent' | 'rejected' | 'accepted';
  subtotal: number;
  tax_total: number;
  total: number;
  currency: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    name: string;
    email?: string;
    address?: string;
  };
  items?: OfferItem[];
}

export interface OfferItem {
  id: string;
  offer_id: string;
  description: string;
  qty: number;
  unit_price: number;
  tax_rate: number;
  line_total: number;
  created_by: string;
}