import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { aiTools } from '@/lib/ai/tools';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    try {
        const result = streamText({
            model: openai('gpt-4o'),
            messages,
            system: `You are the "BlueShip Agent", an advanced AI logistics coordinator. 
      You have access to the live TMS/WMS database via tools.
      
      Your capabilities:
      1. Search for Orders and check their status.
      2. Check Inventory levels across warehouses.
      3. Look up Shipment details.
      4. Create Loads (Shipments) for allocated orders.
      5. Check overall System Status.

      Rules:
      - Always be concise and professional.
      - If a user asks to create a load, verify the order status first if possible, or just try the tool.
      - If you can't find data, say so clearly.
      - Format monetary values as currency.
      - When listing orders or items, use markdown tables or bullet points for readability.
      `,
            tools: aiTools,
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error('AI Error:', error);
        return new Response('An error occurred while processing your request.', { status: 500 });
    }
}
