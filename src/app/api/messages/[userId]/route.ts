import { NextRequest, NextResponse } from 'next/server';

// Mock current user - in production, get from Neon Auth session
const MOCK_CURRENT_USER = {
  id: '11111111-1111-1111-1111-111111111111', // Dr. Sarah Chen (PT)
  role: 'pt',
};

// Mock messages data
const MOCK_MESSAGES = [
  {
    id: '1',
    senderId: '11111111-1111-1111-1111-111111111111',
    senderName: 'Dr. Sarah Chen, DPT',
    senderRole: 'pt',
    recipientId: '22222222-2222-2222-2222-222222222222',
    content: 'Hi Alex! Welcome to Rehabify. I\'ve reviewed your assessment and created a personalized 12-week program for your lower back.',
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
    content: 'Great question! You should feel a gentle stretch, but no sharp pain. Think of it as exploring your range of motion rather than pushing limits.',
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
    content: 'Had a rough day yesterday - pain was higher than usual. I think I sat too long in a meeting.',
    imageUrl: null,
    readAt: null,
    createdAt: '2026-01-06T10:30:00Z',
  },
];

// GET /api/messages/[userId] - Get conversation with specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Filter messages for this conversation
    const conversationMessages = MOCK_MESSAGES.filter(
      (m) =>
        (m.senderId === userId && m.recipientId === MOCK_CURRENT_USER.id) ||
        (m.senderId === MOCK_CURRENT_USER.id && m.recipientId === userId)
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Get other user info
    const otherUserName = conversationMessages[0]?.senderRole === 'patient'
      ? conversationMessages.find((m) => m.senderRole === 'patient')?.senderName
      : conversationMessages.find((m) => m.senderRole === 'pt')?.senderName;

    return NextResponse.json({
      data: {
        otherId: userId,
        otherName: otherUserName || 'Unknown',
        messages: conversationMessages,
      },
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

// POST /api/messages/[userId] - Send message to specific user (PT route)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // In production: Insert into database and create notification
    const newMessage = {
      id: `msg-${Date.now()}`,
      recipientId: userId,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ data: newMessage }, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
