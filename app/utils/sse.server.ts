export type SSEFunction = (data: any) => void;

export function eventStream(
  signal: AbortSignal,
  init: (send: SSEFunction) => () => void
): Response {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      const send: SSEFunction = (data) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      
      const cleanup = init(send);
      
      signal.addEventListener('abort', () => {
        cleanup();
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
} 