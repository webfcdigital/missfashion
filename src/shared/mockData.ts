import type { Product, Order } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Vestido Floral Brisa de Verão',
    description: 'Vestido longo floral com decote em V, confeccionado em tecido leve e fluido. Perfeito para passeios à tarde ou eventos casuais em dias quentes. Caimento acinturado com fenda lateral sutil.',
    price: 189.90,
    originalPrice: 249.90,
    images: ['/images/vestido_floral.png'],
    sizes: ['P', 'M', 'G'],
    colors: ['Azul Floral', 'Rosa Pastel'],
    category: 'Vestidos',
    stock: 15,
    shopeeItemId: 'shopee-item-983742',
    shopeeStatus: 'synced',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod-2',
    name: 'Conjunto Alfaiataria Elegance',
    description: 'Conjunto feminino composto por blazer acinturado e calça pantacourt de cintura alta. Uma peça moderna, sofisticada e ideal para compor um visual de trabalho elegante ou eventos corporativos.',
    price: 320.00,
    images: ['/images/conjunto_alfaiataria.png'],
    sizes: ['M', 'G', 'GG'],
    colors: ['Rosa Pastel', 'Off-White'],
    category: 'Conjuntos',
    stock: 8,
    shopeeItemId: 'shopee-item-129482',
    shopeeStatus: 'synced',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod-3',
    name: 'Blusa Tricot Cozy Soft',
    description: 'Blusa de tricot de mangas longas e toque extremamente macio. Confortável e quentinha, apresenta tramas trabalhadas e acabamento impecável na gola e nos punhos.',
    price: 119.90,
    originalPrice: 149.90,
    images: ['/images/blusa_tricot.png'],
    sizes: ['P', 'M', 'G', 'GG'],
    colors: ['Branco Neve', 'Rosa Quartzo', 'Bege'],
    category: 'Blusas',
    stock: 22,
    shopeeItemId: undefined,
    shopeeStatus: 'unsynced',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod-4',
    name: 'Calça Wide Leg Denim Clássica',
    description: 'Calça wide leg em jeans premium de lavagem clássica, cintura alta e pernas amplas. Estilosa, confortável e extremamente versátil para compor qualquer look casual moderno.',
    price: 159.90,
    images: ['/images/calca_jeans.png'],
    sizes: ['36', '38', '40', '42', '44'],
    colors: ['Azul Jeans'],
    category: 'Calças',
    stock: 12,
    shopeeItemId: 'shopee-item-774839',
    shopeeStatus: 'synced',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ped-1001',
    customerName: 'Mariana Souza',
    customerPhone: '11999998888',
    customerAddress: 'Av. Paulista, 1000 - Apto 52, São Paulo - SP',
    items: [
      {
        productId: 'prod-1',
        name: 'Vestido Floral Brisa de Verão',
        size: 'M',
        color: 'Azul Floral',
        quantity: 1,
        price: 189.90,
        image: '/images/vestido_floral.png'
      }
    ],
    total: 189.90,
    status: 'delivered',
    source: 'vitrine',
    nfeNumber: 'NFe-000104',
    nfeStatus: 'issued',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ped-1002',
    customerName: 'Beatriz Costa (Shopee)',
    customerPhone: '21988887777',
    customerAddress: 'Rua das Flores, 123, Rio de Janeiro - RJ',
    items: [
      {
        productId: 'prod-2',
        name: 'Conjunto Alfaiataria Elegance',
        size: 'M',
        color: 'Rosa Pastel',
        quantity: 1,
        price: 320.00,
        image: '/images/conjunto_alfaiataria.png'
      }
    ],
    total: 320.00,
    status: 'preparing',
    source: 'shopee',
    shopeeOrderId: 'SHP-983748293',
    nfeStatus: 'draft',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ped-1003',
    customerName: 'Clara Mendes',
    customerPhone: '31977776666',
    customerAddress: 'Rua Bahia, 450, Belo Horizonte - MG',
    items: [
      {
        productId: 'prod-3',
        name: 'Blusa Tricot Cozy Soft',
        size: 'P',
        color: 'Branco Neve',
        quantity: 2,
        price: 119.90,
        image: '/images/blusa_tricot.png'
      }
    ],
    total: 239.80,
    status: 'pending',
    source: 'vitrine',
    nfeStatus: 'draft',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  }
];

// Helper functions for LocalStorage persistence
export const getStoredProducts = (): Product[] => {
  const data = localStorage.getItem('mf_products');
  if (!data) {
    localStorage.setItem('mf_products', JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
  return JSON.parse(data);
};

export const saveStoredProducts = (products: Product[]) => {
  localStorage.setItem('mf_products', JSON.stringify(products));
};

export const getStoredOrders = (): Order[] => {
  const data = localStorage.getItem('mf_orders');
  if (!data) {
    localStorage.setItem('mf_orders', JSON.stringify(INITIAL_ORDERS));
    return INITIAL_ORDERS;
  }
  return JSON.parse(data);
};

export const saveStoredOrders = (orders: Order[]) => {
  localStorage.setItem('mf_orders', JSON.stringify(orders));
};

export const getStoredShopeeConfig = () => {
  const data = localStorage.getItem('mf_shopee_config');
  if (!data) {
    const config = { partnerId: '', shopId: '', isConnected: false };
    localStorage.setItem('mf_shopee_config', JSON.stringify(config));
    return config;
  }
  return JSON.parse(data);
};

export const saveStoredShopeeConfig = (config: any) => {
  localStorage.setItem('mf_shopee_config', JSON.stringify(config));
};
