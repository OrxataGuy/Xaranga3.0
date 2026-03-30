import connectDB from '@/lib/mongodb';
import Song from '@/models/Song';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        try {
          await connectDB();
          const songs = await Song.find().sort({ votes: -1, addedAt: 1 }).lean();
          const data = `data: ${JSON.stringify(songs)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch {
          controller.close();
        }
      };

      await send();
      const interval = setInterval(send, 3000);

      // Limpiar al cerrar
      return () => clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
