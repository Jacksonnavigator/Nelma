import type { Category, Product } from "../types/product";

export const categories: Category[] = [
  { id: "nelma-water", name: "NELMA Water", icon: "droplets" }
];

export const products: Product[] = [
  {
    id: "nelma-first-purchase",
    name: "NELMA 20L Water + New Container",
    categoryId: "nelma-water",
    price: 18000,
    image: "https://www.jotform.com/uploads/stock-images/pixabay/g7f653d24ac6a78383f6887e3ed92201ed2a588c5fd679800466771f0b15697a62b7776ac260826c56dde4e0a44a9695e15689d0e69ded7e7b442911e786d4a9c_640.jpg?ufs=jufs&width=450",
    rating: 4.8,
    reviewCount: 64,
    description: "First-time setup with 20L NELMA drinking water and a new reusable container.",
    isPure: true
  },
  {
    id: "nelma-refill",
    name: "NELMA 20L Drinking Water Refill",
    categoryId: "nelma-water",
    price: 4000,
    image: "https://images.unsplash.com/photo-1638688569176-5b6db19f9d2a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNzg4OTl8MHwxfHNlYXJjaHwxfHxtaW5lcmFsJTIwd2F0ZXIlMjBib3R0bGV8ZW58MHx8fHwxNzcwNDMxNjk0fDA&ixlib=rb-4.1.0&q=80&w=1080&width=450",
    rating: 4.7,
    reviewCount: 91,
    description: "Fresh 20L drinking water refill for customers who already have a NELMA container.",
    isPure: true
  }
];

export const getProductsByCategory = (categoryId: string): Product[] => {
  return products.filter((product) => product.categoryId === categoryId);
};

export const getProductById = (productId: string): Product | undefined => {
  return products.find((product) => product.id === productId);
};

export const searchProducts = (query: string): Product[] => {
  const lowerQuery = query.toLowerCase();
  return products.filter((product) =>
    product.name.toLowerCase().includes(lowerQuery) ||
    product.description.toLowerCase().includes(lowerQuery)
  );
};
