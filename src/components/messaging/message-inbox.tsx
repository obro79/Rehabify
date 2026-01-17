'use client';

import { cn } from '@/lib/utils';
import { Conversation } from '@/stores/message-store';

interface MessageInboxProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  isLoading?: boolean;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function ConversationCard({
  conversation,
  isActive,
  onClick,
}: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  const hasUnread = conversation.unreadCount > 0;
  const preview = conversation.lastMessage?.content || 'No messages yet';
  const isFromOther = conversation.lastMessage?.senderRole !== 'pt';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 text-left transition-all duration-200 border-b border-stone-100',
        isActive
          ? 'bg-teal-50/80'
          : 'bg-white hover:bg-stone-50/80',
        'focus:outline-none focus:ring-2 focus:ring-teal-500/20'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Unread indicator */}
        <div className="flex-shrink-0 mt-1.5">
          {hasUnread ? (
            <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
          ) : (
            <div className="w-2.5 h-2.5" />
          )}
        </div>

        {/* Avatar */}
        <div className="flex-shrink-0">
          {conversation.otherAvatarUrl ? (
            <img
              src={conversation.otherAvatarUrl}
              alt={conversation.otherName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center">
              <span className="text-sm font-semibold text-teal-700">
                {conversation.otherName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span
              className={cn(
                'text-sm truncate',
                hasUnread ? 'font-semibold text-stone-900' : 'font-medium text-stone-700'
              )}
            >
              {conversation.otherName}
            </span>
            {conversation.lastMessage && (
              <span className="text-xs text-stone-400 flex-shrink-0 ml-2">
                {formatRelativeTime(conversation.lastMessage.createdAt)}
              </span>
            )}
          </div>
          <p
            className={cn(
              'text-sm truncate',
              hasUnread ? 'text-stone-700' : 'text-stone-500'
            )}
          >
            {!isFromOther && <span className="text-stone-400">You: </span>}
            {preview}
          </p>
        </div>
      </div>
    </button>
  );
}

function InboxSkeleton() {
  return (
    <div className="divide-y divide-stone-100">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 flex items-start gap-3 animate-pulse">
          <div className="w-2.5 h-2.5 mt-1.5" />
          <div className="w-10 h-10 rounded-full bg-stone-200" />
          <div className="flex-1">
            <div className="h-4 bg-stone-200 rounded w-32 mb-2" />
            <div className="h-3 bg-stone-100 rounded w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyInbox() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center px-4">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-stone-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-stone-800 mb-2">No conversations</h3>
      <p className="text-sm text-stone-500">
        Messages from your patients will appear here.
      </p>
    </div>
  );
}

export function MessageInbox({
  conversations,
  activeConversationId,
  onSelectConversation,
  isLoading,
}: MessageInboxProps) {
  if (isLoading) {
    return <InboxSkeleton />;
  }

  if (conversations.length === 0) {
    return <EmptyInbox />;
  }

  return (
    <div className="divide-y divide-stone-100 overflow-y-auto">
      {conversations.map((conversation) => (
        <ConversationCard
          key={conversation.otherId}
          conversation={conversation}
          isActive={conversation.otherId === activeConversationId}
          onClick={() => onSelectConversation(conversation.otherId)}
        />
      ))}
    </div>
  );
}
