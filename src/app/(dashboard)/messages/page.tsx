'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { MessageThread, MessageComposer } from '@/components/messaging';
import type { Message } from '@/stores/message-store';

// Mock PT info - in production, fetch from user's profile
const MOCK_PT = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Dr. Sarah Chen, DPT',
  role: 'Physical Therapist',
};

// Mock current user - in production, get from auth
const MOCK_CURRENT_USER_ID = '22222222-2222-2222-2222-222222222222';

// Mock messages for demo
const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    senderId: '11111111-1111-1111-1111-111111111111',
    senderName: 'Dr. Sarah Chen, DPT',
    senderRole: 'pt',
    recipientId: '22222222-2222-2222-2222-222222222222',
    content: 'Hi Alex! Welcome to Rehabify. I\'ve reviewed your assessment and created a personalized 12-week program for your lower back. The first two weeks will focus on gentle mobility to reduce pain. Feel free to message me anytime if you have questions!',
    imageUrl: null,
    readAt: '2026-01-05T14:30:00Z',
    createdAt: '2026-01-05T14:00:00Z',
  },
  {
    id: '2',
    senderId: '22222222-2222-2222-2222-222222222222',
    senderName: 'Alex Thompson',
    senderRole: 'patient',
    recipientId: '11111111-1111-1111-1111-111111111111',
    content: 'Thanks Dr. Chen! Quick question - should I feel a stretch during the cat-camel exercise or should it be completely pain-free?',
    imageUrl: null,
    readAt: '2026-01-05T16:00:00Z',
    createdAt: '2026-01-05T15:15:00Z',
  },
  {
    id: '3',
    senderId: '11111111-1111-1111-1111-111111111111',
    senderName: 'Dr. Sarah Chen, DPT',
    senderRole: 'pt',
    recipientId: '22222222-2222-2222-2222-222222222222',
    content: 'Great question! You should feel a gentle stretch, but no sharp pain. The movement should feel comfortable - think of it as "exploring your range of motion" rather than pushing limits. If you feel any sharp pain, reduce the range. Let me know how your next session goes!',
    imageUrl: null,
    readAt: '2026-01-05T18:00:00Z',
    createdAt: '2026-01-05T17:00:00Z',
  },
  {
    id: '4',
    senderId: '22222222-2222-2222-2222-222222222222',
    senderName: 'Alex Thompson',
    senderRole: 'patient',
    recipientId: '11111111-1111-1111-1111-111111111111',
    content: 'Had a rough day yesterday - pain was higher than usual. I think I sat too long in a meeting. The session today was harder.',
    imageUrl: null,
    readAt: null,
    createdAt: '2026-01-06T10:30:00Z',
  },
  {
    id: '5',
    senderId: '11111111-1111-1111-1111-111111111111',
    senderName: 'Dr. Sarah Chen, DPT',
    senderRole: 'pt',
    recipientId: '22222222-2222-2222-2222-222222222222',
    content: 'I saw the alert and your session notes. Flare-ups are normal during recovery, especially after prolonged sitting. Try to take micro-breaks every 30 minutes at work - even just standing and doing a few gentle back extensions. You made the right call taking it easy. Let me know if the pain doesn\'t settle in a day or two.',
    imageUrl: null,
    readAt: null,
    createdAt: '2026-01-06T12:00:00Z',
  },
];

export default function PatientMessagesPage() {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async (content: string, imageUrl?: string) => {
    setIsSending(true);

    // Create optimistic message
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: MOCK_CURRENT_USER_ID,
      senderName: 'You',
      senderRole: 'patient',
      recipientId: MOCK_PT.id,
      content,
      imageUrl: imageUrl || null,
      readAt: null,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSending(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-orange-50/30 to-teal-50/20">
      <div className="max-w-2xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-stone-200/60 px-4 py-4"
        >
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 -ml-2 rounded-full hover:bg-stone-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center">
                <span className="text-sm font-semibold text-teal-700">
                  {MOCK_PT.name.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="font-semibold text-stone-800">{MOCK_PT.name}</h1>
                <p className="text-xs text-stone-500">{MOCK_PT.role}</p>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Messages */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <MessageThread
            messages={messages}
            currentUserId={MOCK_CURRENT_USER_ID}
            isLoading={false}
          />
        </motion.div>

        {/* Composer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <MessageComposer
            onSend={handleSendMessage}
            isSending={isSending}
            placeholder="Message Dr. Chen..."
          />
        </motion.div>
      </div>
    </div>
  );
}
