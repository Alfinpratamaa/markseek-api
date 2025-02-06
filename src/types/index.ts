export type ShippingAddress = {
  fullName: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  country: string;
  lat?: number;
  lng?: number;
};

export type CartItem = {
  productId: string;
  name: string;
  slug: string;
  qty: number;
  image: string;
  price: number;
};

export type PaymentResult = {
  id: string;
  status: string;
  email_address: string;
  pricePaid: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  password: string | null;
  emailVerified?: Date;
  avatar?: string;
  address?: ShippingAddress;
  paymentMethod?: string;
  createdAt: Date;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  images: string[];
  brand: string;
  description: string;
  stock: number;
  price: number;
  rating: number;
  numReviews: number;
  isFeatured: boolean;
  banner?: string;
  createdBy: string;
  createdAt: Date;
};
