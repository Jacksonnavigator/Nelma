export type Category = {
  id: string;
  name: string;
  icon: string;
};

export type Product = {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  image: string;
  rating: number;
  reviewCount: number;
  sizes?: string[];
  description: string;
  isPure?: boolean;
};

export type CartItem = {
  productId: string;
  quantity: number;
  size?: string;
};

export type Cart = {
  items: CartItem[];
  total: number;
};
