import { NextRequest, NextResponse } from 'next/server';

// Mock current user - in production, get from Neon Auth session
const MOCK_CURRENT_USER = {
  id: '22222222-2222-2222-2222-222222222222', // Alex Thompson (patient)
  role: 'patient',
};

// Mock messages data - in production, fetch from database
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

// GET /api/messages - List conversations (for patients, just their PT; for PTs, all patients)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    // Note: unreadOnly filter available via searchParams.get('unreadOnly')

    // For patient view - return conversation with PT
    if (MOCK_CURRENT_USER.role === 'patient') {
      const userMessages = MOCK_MESSAGES.filter(
        (m) => m.senderId === MOCK_CURRENT_USER.id || m.recipientId === MOCK_CURRENT_USER.id
      );

      const unreadCount = userMessages.filter(
        (m) => m.recipientId === MOCK_CURRENT_USER.id && !m.readAt
      ).length;

      return NextResponse.json({
        data: userMessages.slice(offset, offset + limit),
        pagination: {
          total: userMessages.length,
          unreadCount,
          hasMore: offset + limit < userMessages.length,
        },
      });
    }

    // For PT view - return conversation list
    // Group messages by patient
    const conversations = [
      {
        otherId: '22222222-2222-2222-2222-222222222222',
        otherName: 'Alex Thompson',
        otherRole: 'patient',
        otherAvatarUrl: null,
        lastMessage: MOCK_MESSAGES[3],
        unreadCount: 1,
      },
    ];

    return NextResponse.json({
      data: conversations,
      unreadTotal: 1,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/messages - Send a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Message content exceeds 2000 characters' },
        { status: 400 }
      );
    }

    // In production: Insert into database and create notification
    const newMessage = {
      id: `msg-${Date.now()}`,
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
