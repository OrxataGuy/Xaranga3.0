import connectDB from '@/lib/mongodb';
import Song from '@/models/Song';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        try {
          await connectDB();
          const songs = await Song.find().sort({ votes: -1, addedAt: 1 }).lean();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(songs)}\n\n`));
        } catch {
          if (interval) clearInterval(interval);
          controller.close();
        }
      };

      await send();
      interval = setInterval(send, 3000);
    },
    cancel() {
      // S'executa quan el client es desconnecta
      if (interval) clearInterval(interval);
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
