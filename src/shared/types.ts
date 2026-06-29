export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  sizes: string[];
  colors: string[];
  category: string;
  stock: number;
  shopeeItemId?: string;
  shopeeStatus?: 'synced' | 'unsynced' | 'linked';
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  image: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  source: 'vitrine' | 'shopee';
  shopeeOrderId?: string;
  nfeNumber?: string;
  nfeStatus?: 'draft' | 'issued' | 'failed';
  createdAt: string;
}

export interface ShopeeConfig {
  partnerId: string;
  shopId: string;
  isConnected: boolean;
  accessToken?: string;
  refreshToken?: string;
  expireTime?: number;
}
