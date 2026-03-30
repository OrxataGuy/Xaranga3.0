import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Song from '@/models/Song';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;

  const song = await Song.findByIdAndUpdate(
    id,
    { votes: 0 },
    { new: true }
  ).lean();

  if (!song) {
    return NextResponse.json({ error: 'Canción no encontrada' }, { status: 404 });
  }

  return NextResponse.json(song);
}
