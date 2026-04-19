import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import type { Comment } from "@/app/lib/comments-context";

export interface NewComment {
  targetId: string;
  targetType: "blog" | "product";
  userId: string;
  userName: string;
  text: string;
  rating?: number;
}

/**
 * Subscribe to approved comments for a given target in real-time.
 * Returns an unsubscribe function.
 *
 * Requires a composite Firestore index on:
 *   comments: targetId ASC, status ASC, createdAt DESC
 * (Firebase will surface an index-creation link in the console on first use)
 */
export function subscribeApprovedComments(
  targetId: string,
  onChange: (comments: Comment[]) => void
): () => void {
  const q = query(
    collection(db, "comments"),
    where("targetId", "==", targetId),
    where("status", "==", "approved"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snap) => {
      const items: Comment[] = snap.docs.map((d) => {
        const data = d.data();
        const createdAt =
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString();
        return {
          id: d.id,
          targetId: data.targetId,
          targetType: data.targetType,
          userId: data.userId,
          userName: data.userName,
          text: data.text,
          rating: data.rating ?? undefined,
          status: data.status as "pending" | "approved",
          createdAt,
        };
      });
      onChange(items);
    },
    () => {} // suppress permission errors on unmount
  );
}

/**
 * Write a new comment to Firestore with status "pending".
 * Returns the new document ID.
 */
export async function createComment(comment: NewComment): Promise<string> {
  const payload: Record<string, unknown> = {
    targetId: comment.targetId,
    targetType: comment.targetType,
    userId: comment.userId,
    userName: comment.userName,
    text: comment.text,
    status: "pending",
    createdAt: serverTimestamp(),
  };
  if (comment.rating !== undefined) {
    payload.rating = comment.rating;
  }
  const ref = await addDoc(collection(db, "comments"), payload);
  return ref.id;
}

/**
 * Delete a comment by ID.
 * Firestore rules enforce that only the owner or an admin can delete.
 */
export async function removeComment(commentId: string): Promise<void> {
  await deleteDoc(doc(db, "comments", commentId));
}
