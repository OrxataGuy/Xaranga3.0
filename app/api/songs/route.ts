import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Song from '@/models/Song';
import { sessionOptions, SessionData } from '@/lib/session';

export async function GET() {
  await connectDB();
  const songs = await Song.find().sort({ votes: -1, addedAt: 1 }).lean();
  return NextResponse.json(songs);
}

export async function POST(request: NextRequest) {
  await connectDB();

  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  const addedCount = session.addedCount ?? 0;
  if (addedCount >= 3) {
    return NextResponse.json(
      { error: 'Has assolit el límit de 3 cançons per sessió (10 min). Torna-ho a intentar més tard.' },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { title } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: 'El títol és obligatori' }, { status: 400 });
  }

  const song = await Song.create({
    title: title.trim(),
    votes: 0,
    isRequested: true,
  });

  session.addedCount = addedCount + 1;
  await session.save();

  return NextResponse.json(song, { status: 201 });
}
