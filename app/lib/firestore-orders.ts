import { db } from "./firebase";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

// ==========================================
// TYPES
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
  paymentMethod: "cod" | "stripe" | "paymob" | "bank_transfer";
}

export interface FirestoreOrder extends FirestoreOrderInput {
  id: string;
  orderNumber: string;
  orderStatus: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "unpaid" | "pending" | "paid" | "failed";
  stripeSessionId?: string;
  stripePaymentId?: string;
  paymobOrderId?: string;
  paymobTransactionId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Generate a unique order number
 */
function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MOOD-${dateStr}-${random}`;
}

// ==========================================
// FIRESTORE OPERATIONS
// ==========================================

const ORDERS_COLLECTION = "orders";

/**
 * Create a new order in Firestore
 */
export async function createFirestoreOrder(
  orderData: FirestoreOrderInput
): Promise<FirestoreOrder> {
  console.log("[Firestore] createFirestoreOrder called with:", JSON.stringify(orderData, null, 2));
  
  try {
    const orderNumber = generateOrderNumber();
    console.log("[Firestore] Generated order number:", orderNumber);

    // Build order object, excluding undefined values (Firestore doesn't accept undefined)
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
      orderStatus: "pending",
      paymentStatus: "unpaid",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Only add optional fields if they have values (not undefined or empty)
    if (orderData.email) newOrder.email = orderData.email;
    if (orderData.governorate) newOrder.governorate = orderData.governorate;
    if (orderData.notes) newOrder.notes = orderData.notes;

    console.log("[Firestore] Attempting to write to collection:", ORDERS_COLLECTION);
    console.log("[Firestore] db instance:", db ? "initialized" : "NOT INITIALIZED!");
    
    if (!db) {
      throw new Error("Firestore db is not initialized!");
    }

    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), newOrder);
    console.log("[Firestore] SUCCESS! Document written with ID:", docRef.id);

    return {
      ...orderData,
      id: docRef.id,
      orderNumber,
      orderStatus: "pending",
      paymentStatus: "unpaid",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    console.error("[Firestore] ERROR creating order!");
    console.error("[Firestore] Error code:", firebaseError.code);
    console.error("[Firestore] Error message:", firebaseError.message);
    console.error("[Firestore] Full error:", error);
    throw error;
  }
}

/**
 * Get an order by its Firestore document ID
 */
export async function getFirestoreOrderById(
  orderId: string
): Promise<FirestoreOrder | null> {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as FirestoreOrder;
}

/**
 * Get an order by its order number (e.g., MOOD-20260416-XXXX)
 */
export async function getFirestoreOrderByNumber(
  orderNumber: string
): Promise<FirestoreOrder | null> {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where("orderNumber", "==", orderNumber)
  );

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as FirestoreOrder;
}

/**
 * Get orders by phone number
 */
export async function getFirestoreOrdersByPhone(
  phone: string
): Promise<FirestoreOrder[]> {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where("phone", "==", phone),
    orderBy("createdAt", "desc")
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
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
  let q;

  if (status) {
    q = query(
      collection(db, ORDERS_COLLECTION),
      where("orderStatus", "==", status),
      orderBy("createdAt", "desc")
    );
  } else {
    q = query(
      collection(db, ORDERS_COLLECTION),
      orderBy("createdAt", "desc")
    );
  }

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
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
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  await updateDoc(docRef, {
    orderStatus,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update payment status
 */
export async function updateFirestorePaymentStatus(
  orderId: string,
  paymentStatus: FirestoreOrder["paymentStatus"]
): Promise<void> {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  await updateDoc(docRef, {
    paymentStatus,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update order (generic)
 */
export async function updateFirestoreOrder(
  orderId: string,
  updates: Partial<Omit<FirestoreOrder, "id" | "createdAt">>
): Promise<void> {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}
