import { create } from 'zustand';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'patient' | 'pt';
  recipientId: string;
  content: string;
  imageUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface Conversation {
  otherId: string;
  otherName: string;
  otherRole: 'patient' | 'pt';
  otherAvatarUrl: string | null;
  lastMessage: Message | null;
  unreadCount: number;
}

interface MessageState {
  // State
  conversations: Conversation[];
  activeConversation: string | null;
  messages: Message[];
  unreadCount: number;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;

  // Actions
  fetchConversations: () => Promise<void>;
  fetchMessages: (otherId: string) => Promise<void>;
  sendMessage: (recipientId: string, content: string, imageUrl?: string) => Promise<void>;
  markThreadRead: (otherId: string) => Promise<void>;
  setActiveConversation: (otherId: string | null) => void;
  addOptimisticMessage: (message: Message) => void;
  clearError: () => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  // Initial state
  conversations: [],
  activeConversation: null,
  messages: [],
  unreadCount: 0,
  isLoading: false,
  isSending: false,
  error: null,

  // Actions
  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/messages');
      if (!res.ok) throw new Error('Failed to fetch conversations');
      const data = await res.json();
      set({
        conversations: data.data || [],
        unreadCount: data.unreadTotal || 0,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },

  fetchMessages: async (otherId: string) => {
    set({ isLoading: true, error: null, activeConversation: otherId });
    try {
      const res = await fetch(`/api/messages/${otherId}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      set({
        messages: data.data?.messages || [],
        isLoading: false,
      });
      // Mark as read
      get().markThreadRead(otherId);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },

  sendMessage: async (recipientId: string, content: string, imageUrl?: string) => {
    set({ isSending: true, error: null });

    // Create optimistic message
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      senderId: 'current-user',
      senderName: 'You',
      senderRole: 'patient', // Will be overwritten by actual role
      recipientId,
      content,
      imageUrl: imageUrl || null,
      readAt: null,
      createdAt: new Date().toISOString(),
    };

    get().addOptimisticMessage(optimisticMessage);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, content, imageUrl }),
      });

      if (!res.ok) throw new Error('Failed to send message');

      const data = await res.json();

      // Replace optimistic message with real one
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === optimisticMessage.id ? { ...optimisticMessage, id: data.data.id } : m
        ),
        isSending: false,
      }));
    } catch (error) {
      // Remove optimistic message on error
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== optimisticMessage.id),
        error: error instanceof Error ? error.message : 'Unknown error',
        isSending: false,
      }));
    }
  },

  markThreadRead: async (otherId: string) => {
    try {
      await fetch(`/api/messages/${otherId}/read`, { method: 'PUT' });
      // Update local unread count
      set((state) => {
        const conversation = state.conversations.find((c) => c.otherId === otherId);
        const unreadDelta = conversation?.unreadCount || 0;
        return {
          conversations: state.conversations.map((c) =>
            c.otherId === otherId ? { ...c, unreadCount: 0 } : c
          ),
          unreadCount: Math.max(0, state.unreadCount - unreadDelta),
        };
      });
    } catch {
      // Silent fail - not critical
    }
  },

  setActiveConversation: (otherId: string | null) => {
    set({ activeConversation: otherId });
    if (otherId) {
      get().fetchMessages(otherId);
    } else {
      set({ messages: [] });
    }
  },

  addOptimisticMessage: (message: Message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  clearError: () => set({ error: null }),
}));
