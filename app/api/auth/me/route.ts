import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    // Check active shift for this user or store
    const activeShift = await db.shift.findFirst({
      where: {
        userId: user.id,
        status: 'OPEN',
      },
      orderBy: { openedAt: 'desc' },
    });

    const store = await db.storeSetting.findUnique({
      where: { id: 'default-store' },
    });

    return NextResponse.json({
      authenticated: true,
      user,
      activeShift,
      store,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}

