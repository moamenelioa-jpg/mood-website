// Cart Item Type (used in frontend)
export interface CartItem {
  id: number;
  name: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
}

// ==========================================
// ENUMS - Matching database schema
// ==========================================

export const PaymentMethods = {
  COD: "cod",
  PAYMOB: "paymob",
  BANK_TRANSFER: "bank_transfer",
  WALLET: "wallet",
  INSTAPAY: "instapay",
} as const;
export type PaymentMethod = (typeof PaymentMethods)[keyof typeof PaymentMethods];

export const PaymentStatuses = {
  UNPAID: "unpaid",
  RECEIPT_UPLOADED: "receipt_uploaded", // optional intermediate state
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  CASH_ON_DELIVERY: "cash_on_delivery",
  // Back-compat (used by card/paymob or legacy):
  PAID: "paid",
  FAILED: "failed",
} as const;
export type PaymentStatus = (typeof PaymentStatuses)[keyof typeof PaymentStatuses];

export const OrderStatuses = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;
export type OrderStatus = (typeof OrderStatuses)[keyof typeof OrderStatuses];

export const ShippingStatuses = {
  PENDING: "pending",
  PICKED_UP: "picked_up",
  IN_TRANSIT: "in_transit",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
} as const;
export type ShippingStatus = (typeof ShippingStatuses)[keyof typeof ShippingStatuses];

// ==========================================
// ORDER TYPES
// ==========================================

export interface OrderItem {
  id: string;
  orderId: string;
  productId: number;
  name: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  
  // Customer Information
  customerName: string;
  phone: string;
  email?: string | null;
  
  // Address Information
  address: string;
  city: string;
  governorate?: string | null;
  postalCode?: string | null;
  
  // Order Details
  notes?: string | null;
  subtotal: number;
  shippingFee: number;
  total: number;
  
  // Payment
  paymentMethod: string;
  paymentStatus: string;

  // Receipt (bank transfer / wallet / instapay)
  receiptImageUrl?: string | null;
  receiptImagePath?: string | null;
  receiptUploadedAt?: string | null;
  receiptReviewStatus?: "approved" | "rejected" | null;
  receiptReviewNote?: string | null;
  receiptReviewedBy?: string | null;
  receiptReviewedAt?: string | null;

  // Flags
  hasProof?: boolean;

  // Snapshot of payment account details (stored at order creation for display on success page)
  bankName?: string | null;
  accountName?: string | null;
  iban?: string | null;
  walletNumber?: string | null;
  walletAccountName?: string | null;
  instapayIdentifier?: string | null;
  instapayAccountName?: string | null;

  // Order Status
  orderStatus: string;
  
  // Shipping
  shippingCompany?: string | null;
  trackingNumber?: string | null;
  shippingStatus?: string | null;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  items: OrderItem[];
}

// ==========================================
// CHECKOUT TYPES
// ==========================================

export interface CheckoutFormData {
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  governorate?: string;
  notes?: string;
  paymentMethod: PaymentMethod;
}

export interface CreateOrderInput {
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  governorate?: string;
  notes?: string;
  paymentMethod: PaymentMethod;
  items: CartItem[];
  shippingFee?: number;
}

// ==========================================
// API RESPONSE TYPES
// ==========================================

export interface CreateOrderResponse {
  success: boolean;
  order?: Order;
  redirectUrl?: string;
  error?: string;
}

export interface OrderListResponse {
  success: boolean;
  orders?: Order[];
  total?: number;
  page?: number;
  pageSize?: number;
  error?: string;
}

export interface OrderUpdateInput {
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  shippingCompany?: string;
  trackingNumber?: string;
  shippingStatus?: ShippingStatus;
  notes?: string;
}

// ==========================================
// EGYPTIAN GOVERNORATES
// ==========================================

export const EGYPTIAN_GOVERNORATES = [
  "Cairo",
  "Giza",
  "Alexandria",
  "Dakahlia",
  "Sharqia",
  "Qalyubia",
  "Port Said",
  "Suez",
  "Ismailia",
  "Gharbia",
  "Monufia",
  "Beheira",
  "Kafr El Sheikh",
  "Damietta",
  "Fayoum",
  "Beni Suef",
  "Minya",
  "Assiut",
  "Sohag",
  "Qena",
  "Luxor",
  "Aswan",
  "Red Sea",
  "New Valley",
  "Matrouh",
  "North Sinai",
  "South Sinai",
] as const;

export type EgyptianGovernorate = (typeof EGYPTIAN_GOVERNORATES)[number];

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

export function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MOOD-${dateStr}-${random}`;
}

export function formatPrice(price: number): string {
  return `${price.toLocaleString("en-EG")} EGP`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-purple-100 text-purple-800",
    shipped: "bg-indigo-100 text-indigo-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    unpaid: "bg-gray-100 text-gray-800",
    paid: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}
