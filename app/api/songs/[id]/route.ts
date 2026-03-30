import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Song from '@/models/Song';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;

  const song = await Song.findByIdAndDelete(id);
  if (!song) {
    return NextResponse.json({ error: 'Canción no encontrada' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
