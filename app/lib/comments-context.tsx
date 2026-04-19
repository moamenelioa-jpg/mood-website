"use client";

import {
  createContext,
  useContext,
  useCallback,
  ReactNode,
} from "react";
import {
  subscribeApprovedComments,
  createComment,
  removeComment,
} from "./firestore-comments";

export interface Comment {
  id: string;
  targetId: string;
  targetType: "blog" | "product";
  userId: string;
  userName: string;
  text: string;
  rating?: number;
  status: "pending" | "approved";
  createdAt: string;
}

interface CommentsContextType {
  /**
   * Subscribe to live approved comments for a target.
   * Call the returned unsubscribe function on cleanup.
   */
  subscribeComments: (
    targetId: string,
    onChange: (comments: Comment[]) => void
  ) => () => void;
  /**
   * Add a new comment (status starts as "pending", awaiting moderation).
   * Returns the new document ID, or throws on validation failure.
   */
  addComment: (
    targetId: string,
    targetType: "blog" | "product",
    userId: string,
    userName: string,
    text: string,
    rating?: number
  ) => Promise<string>;
  /** Delete own comment by ID. */
  deleteComment: (commentId: string) => Promise<void>;
}

const CommentsContext = createContext<CommentsContextType | undefined>(undefined);

export function CommentsProvider({ children }: { children: ReactNode }) {
  const subscribeComments = useCallback(
    (targetId: string, onChange: (comments: Comment[]) => void) =>
      subscribeApprovedComments(targetId, onChange),
    []
  );

  const addComment = useCallback(
    async (
      targetId: string,
      targetType: "blog" | "product",
      userId: string,
      userName: string,
      text: string,
      rating?: number
    ): Promise<string> => {
      const trimmed = text.trim();
      if (!trimmed) throw new Error("Comment text cannot be empty.");
      if (trimmed.length > 2000) throw new Error("Comment is too long (max 2000 characters).");
      if (!userId) throw new Error("Must be signed in to comment.");
      if (rating !== undefined && (rating < 1 || rating > 5))
        throw new Error("Rating must be between 1 and 5.");
      return createComment({ targetId, targetType, userId, userName, text: trimmed, rating });
    },
    []
  );

  const deleteComment = useCallback(
    async (commentId: string) => removeComment(commentId),
    []
  );

  return (
    <CommentsContext.Provider value={{ subscribeComments, addComment, deleteComment }}>
      {children}
    </CommentsContext.Provider>
  );
}

export function useComments() {
  const context = useContext(CommentsContext);
  if (!context) {
    throw new Error("useComments must be used within a CommentsProvider");
  }
  return context;
}

