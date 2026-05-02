import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';

// GET /api/notifications - List unread notifications for current user
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as any;
  const escritorioId = user.escritorioId;

  try {
    const notifications = await prisma.notificacao.findMany({
      where: {
        escritorioId,
        lida: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

// PUT /api/notifications - Mark notification as read
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as any;
  const escritorioId = user.escritorioId;
  const { id, markAll } = await req.json();

  try {
    if (markAll) {
      // Mark all notifications as read for this escritorio
      await prisma.notificacao.updateMany({
        where: {
          escritorioId,
          lida: false,
        },
        data: {
          lida: true,
        },
      });
      return NextResponse.json({ success: true });
    }

    // Mark single notification as read
    if (!id) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    await prisma.notificacao.updateMany({
      where: {
        id,
        escritorioId,
      },
      data: {
        lida: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating notification:', error);
    throw error;
  }
}
