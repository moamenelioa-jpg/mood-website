"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

export interface Comment {
  id: string;
  blogSlug: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

interface CommentsContextType {
  getComments: (blogSlug: string) => Comment[];
  addComment: (blogSlug: string, userId: string, userName: string, text: string) => void;
  deleteComment: (commentId: string, userId: string) => void;
}

const CommentsContext = createContext<CommentsContextType | undefined>(undefined);

const COMMENTS_KEY = "mood_blog_comments";

export function CommentsProvider({ children }: { children: ReactNode }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(COMMENTS_KEY);
    if (saved) {
      try {
        setComments(JSON.parse(saved));
      } catch {
        localStorage.removeItem(COMMENTS_KEY);
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
    }
  }, [comments, mounted]);

  const getComments = useCallback(
    (blogSlug: string) => comments.filter((c) => c.blogSlug === blogSlug),
    [comments]
  );

  const addComment = useCallback(
    (blogSlug: string, userId: string, userName: string, text: string) => {
      const newComment: Comment = {
        id: crypto.randomUUID(),
        blogSlug,
        userId,
        userName,
        text: text.trim(),
        createdAt: new Date().toISOString(),
      };
      setComments((prev) => [...prev, newComment]);
    },
    []
  );

  const deleteComment = useCallback((commentId: string, userId: string) => {
    setComments((prev) =>
      prev.filter((c) => !(c.id === commentId && c.userId === userId))
    );
  }, []);

  return (
    <CommentsContext.Provider value={{ getComments, addComment, deleteComment }}>
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
