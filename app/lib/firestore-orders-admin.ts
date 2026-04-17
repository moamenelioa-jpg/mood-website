import { adminDb } from "./firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

// ==========================================
// TYPES (shared with firestore-orders.ts)
// ==========================================

export interface FirestoreOrderItem {
  id: number;
  name: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
}

export interface FirestoreOrderInput {
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  governorate?: string;
  notes?: string;
  items: FirestoreOrderItem[];
  total: number;
  subtotal: number;
  shippingFee: number;
  paymentMethod: "cod" | "paymob" | "bank_transfer";
}

export interface FirestoreOrder extends FirestoreOrderInput {
  id: string;
  orderNumber: string;
  orderStatus: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "unpaid" | "pending" | "paid" | "failed" | "pending_verification";
  paymobOrderId?: string;
  paymobTransactionId?: string;
  bankTransferProof?: string; // legacy — kept for backward compat
  receiptImageUrl?: string;
  receiptImagePath?: string;
  receiptUploadedAt?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==========================================
// HELPERS
// ==========================================

const ORDERS_COLLECTION = "orders";
const COUNTERS_COLLECTION = "counters";

/**
 * Get today's date string in YYYYMMDD format.
 */
function getTodayDateStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

/**
 * Atomically get the next daily sequence number using a Firestore transaction.
 *
 * Uses a counter document at `counters/orders-YYYYMMDD`. The transaction
 * reads the current count, increments it, and writes it back — guaranteeing
 * no two orders can get the same sequence number even under concurrency.
 */
async function getNextDailySequence(dateStr: string): Promise<number> {
  const counterRef = adminDb.collection(COUNTERS_COLLECTION).doc(`orders-${dateStr}`);

  const newSequence = await adminDb.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);

    let sequence: number;
    if (counterDoc.exists) {
      sequence = (counterDoc.data()?.count ?? 0) + 1;
    } else {
      sequence = 1;
    }

    transaction.set(counterRef, {
      count: sequence,
      date: dateStr,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return sequence;
  });

  return newSequence;
}

/**
 * Generate a sequential, human-readable order number.
 * Format: MOOD-YYYYMMDD-001, MOOD-YYYYMMDD-002, etc.
 * Resets to 001 each new day. Race-condition safe via Firestore transaction.
 */
async function generateOrderNumber(): Promise<string> {
  const dateStr = getTodayDateStr();
  const sequence = await getNextDailySequence(dateStr);
  const seqStr = String(sequence).padStart(3, "0");
  return `MOOD-${dateStr}-${seqStr}`;
}

// ==========================================
// FIRESTORE ADMIN OPERATIONS
// ==========================================

/**
 * Create a new order in Firestore using Admin SDK (bypasses security rules)
 */
export async function createFirestoreOrder(
  orderData: FirestoreOrderInput
): Promise<FirestoreOrder> {
  const orderNumber = await generateOrderNumber();
  const dateStr = getTodayDateStr();

  const newOrder: Record<string, unknown> = {
    customerName: orderData.customerName,
    phone: orderData.phone,
    address: orderData.address,
    city: orderData.city,
    items: orderData.items,
    total: orderData.total,
    subtotal: orderData.subtotal ?? orderData.total,
    shippingFee: orderData.shippingFee ?? 0,
    paymentMethod: orderData.paymentMethod ?? "cod",
    orderNumber,
    orderDate: dateStr,
    orderStatus: "pending",
    paymentStatus: "unpaid",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (orderData.email) newOrder.email = orderData.email;
  if (orderData.governorate) newOrder.governorate = orderData.governorate;
  if (orderData.notes) newOrder.notes = orderData.notes;

  const docRef = await adminDb.collection(ORDERS_COLLECTION).add(newOrder);

  return {
    ...orderData,
    id: docRef.id,
    orderNumber,
    orderStatus: "pending",
    paymentStatus: "unpaid",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}

/**
 * Get an order by its Firestore document ID
 */
export async function getFirestoreOrderById(
  orderId: string
): Promise<FirestoreOrder | null> {
  const docSnap = await adminDb.collection(ORDERS_COLLECTION).doc(orderId).get();

  if (!docSnap.exists) {
    return null;
  }

  return { id: docSnap.id, ...docSnap.data() } as FirestoreOrder;
}

/**
 * Get an order by its order number
 */
export async function getFirestoreOrderByNumber(
  orderNumber: string
): Promise<FirestoreOrder | null> {
  const snapshot = await adminDb
    .collection(ORDERS_COLLECTION)
    .where("orderNumber", "==", orderNumber)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as FirestoreOrder;
}

/**
 * Get orders by phone number
 */
export async function getFirestoreOrdersByPhone(
  phone: string
): Promise<FirestoreOrder[]> {
  const snapshot = await adminDb
    .collection(ORDERS_COLLECTION)
    .where("phone", "==", phone)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FirestoreOrder[];
}

/**
 * Get all orders (with optional status filter)
 */
export async function getFirestoreOrders(
  status?: string
): Promise<FirestoreOrder[]> {
  let q = adminDb.collection(ORDERS_COLLECTION).orderBy("createdAt", "desc");

  if (status) {
    q = q.where("orderStatus", "==", status) as typeof q;
  }

  const snapshot = await q.get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FirestoreOrder[];
}

/**
 * Update order status
 */
export async function updateFirestoreOrderStatus(
  orderId: string,
  orderStatus: FirestoreOrder["orderStatus"]
): Promise<void> {
  await adminDb.collection(ORDERS_COLLECTION).doc(orderId).update({
    orderStatus,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Update payment status
 */
export async function updateFirestorePaymentStatus(
  orderId: string,
  paymentStatus: FirestoreOrder["paymentStatus"]
): Promise<void> {
  await adminDb.collection(ORDERS_COLLECTION).doc(orderId).update({
    paymentStatus,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Update order (generic)
 */
export async function updateFirestoreOrder(
  orderId: string,
  updates: Partial<Omit<FirestoreOrder, "id" | "createdAt">>
): Promise<void> {
  await adminDb.collection(ORDERS_COLLECTION).doc(orderId).update({
    ...updates,
    updatedAt: FieldValue.serverTimestamp(),
  });
}
