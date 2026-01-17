import { NextRequest, NextResponse } from 'next/server';

// PUT /api/messages/[userId]/read - Mark all messages in thread as read
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // In production: Update all unread messages in this conversation
    // UPDATE messages SET read_at = NOW()
    // WHERE sender_id = userId AND recipient_id = currentUserId AND read_at IS NULL

    return NextResponse.json({
      data: {
        otherId: userId,
        readAt: new Date().toISOString(),
        messagesMarkedRead: 1, // Number of messages marked read
      },
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
