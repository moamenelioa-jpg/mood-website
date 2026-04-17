import prisma from "./prisma";
import {
  Order,
  OrderItem,
  CreateOrderInput,
  OrderUpdateInput,
  generateOrderNumber,
  PaymentStatuses,
  OrderStatuses,
} from "./types";

// ==========================================
// ORDER CREATION
// ==========================================

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const orderNumber = generateOrderNumber();
  const subtotal = input.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingFee = input.shippingFee || 0;
  const total = subtotal + shippingFee;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerName: input.customerName,
      phone: input.phone,
      email: input.email || null,
      address: input.address,
      city: input.city,
      governorate: input.governorate || null,
      notes: input.notes || null,
      subtotal,
      shippingFee,
      total,
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentMethod === "cod" ? PaymentStatuses.PENDING : PaymentStatuses.UNPAID,
      orderStatus: OrderStatuses.PENDING,
      items: {
        create: input.items.map((item) => ({
          productId: item.id,
          name: item.name,
          size: item.size,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
      },
    },
    include: {
      items: true,
    },
  });

  return order as Order;
}

// ==========================================
// ORDER RETRIEVAL
// ==========================================

export async function getOrderById(id: string): Promise<Order | null> {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  return order as Order | null;
}

export async function getOrderByOrderNumber(orderNumber: string): Promise<Order | null> {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  return order as Order | null;
}

export async function getOrderByStripeSession(sessionId: string): Promise<Order | null> {
  const order = await prisma.order.findFirst({
    where: { stripeSessionId: sessionId },
    include: { items: true },
  });
  return order as Order | null;
}

export async function getOrdersByPhone(phone: string): Promise<Order[]> {
  const orders = await prisma.order.findMany({
    where: { phone: { contains: phone } },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return orders as Order[];
}

// ==========================================
// ORDER LISTING (Admin)
// ==========================================

export interface OrderListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  paymentStatus?: string;
  search?: string; // Search by order number or phone
  sortBy?: "createdAt" | "total" | "orderNumber";
  sortOrder?: "asc" | "desc";
}

export interface OrderListResult {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getOrders(params: OrderListParams = {}): Promise<OrderListResult> {
  const {
    page = 1,
    pageSize = 20,
    status,
    paymentStatus,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  const where: any = {};

  if (status) {
    where.orderStatus = status;
  }

  if (paymentStatus) {
    where.paymentStatus = paymentStatus;
  }

  if (search) {
    where.OR = [
      { orderNumber: { contains: search } },
      { phone: { contains: search } },
      { customerName: { contains: search } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: orders as Order[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ==========================================
// ORDER UPDATES
// ==========================================

export async function updateOrder(
  id: string,
  updates: OrderUpdateInput
): Promise<Order | null> {
  const data: any = { ...updates };

  // Set shipped timestamp when status changes to shipped
  if (updates.orderStatus === OrderStatuses.SHIPPED && !updates.shippingStatus) {
    data.shippedAt = new Date();
    data.shippingStatus = "in_transit";
  }

  // Set delivered timestamp when status changes to delivered
  if (updates.orderStatus === OrderStatuses.DELIVERED) {
    data.deliveredAt = new Date();
    data.shippingStatus = "delivered";
  }

  const order = await prisma.order.update({
    where: { id },
    data,
    include: { items: true },
  });

  return order as Order;
}

export async function updateOrderByStripeSession(
  sessionId: string,
  updates: Partial<Order>
): Promise<Order | null> {
  const order = await prisma.order.findFirst({
    where: { stripeSessionId: sessionId },
  });

  if (!order) return null;

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: updates as any,
    include: { items: true },
  });

  return updated as Order;
}

export async function setStripeSession(
  orderId: string,
  stripeSessionId: string
): Promise<Order | null> {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { stripeSessionId },
    include: { items: true },
  });
  return order as Order;
}

export async function markOrderPaid(
  orderId: string,
  stripePaymentId?: string
): Promise<Order | null> {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: PaymentStatuses.PAID,
      stripePaymentId: stripePaymentId || null,
      orderStatus: OrderStatuses.CONFIRMED,
    },
    include: { items: true },
  });
  return order as Order;
}

export async function cancelOrder(orderId: string): Promise<Order | null> {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      orderStatus: OrderStatuses.CANCELLED,
    },
    include: { items: true },
  });
  return order as Order;
}

// ==========================================
// ORDER STATISTICS (Admin Dashboard)
// ==========================================

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
}

export async function getOrderStats(): Promise<OrderStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    revenueResult,
    todayOrders,
    todayRevenueResult,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { orderStatus: OrderStatuses.PENDING } }),
    prisma.order.count({ where: { orderStatus: OrderStatuses.DELIVERED } }),
    prisma.order.count({ where: { orderStatus: OrderStatuses.CANCELLED } }),
    prisma.order.aggregate({
      where: { paymentStatus: PaymentStatuses.PAID },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.aggregate({
      where: {
        paymentStatus: PaymentStatuses.PAID,
        createdAt: { gte: today },
      },
      _sum: { total: true },
    }),
  ]);

  return {
    totalOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    totalRevenue: revenueResult._sum.total || 0,
    todayOrders,
    todayRevenue: todayRevenueResult._sum.total || 0,
  };
}

// ==========================================
// NOTIFICATION LOGGING
// ==========================================

export async function logNotification(
  orderId: string,
  type: "sms" | "email" | "whatsapp",
  recipient: string,
  message: string,
  status: "sent" | "failed" | "pending" = "pending"
): Promise<void> {
  await prisma.notificationLog.create({
    data: {
      orderId,
      type,
      recipient,
      message,
      status,
    },
  });
}
