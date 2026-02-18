export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_url: string | null;
  image_urls: string[] | null;
  features: string[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // Additional product details
  size?: string;
  color?: string;
  material?: string;
  brand?: string;
  ply_rating?: string;
  about?: string[];
}
