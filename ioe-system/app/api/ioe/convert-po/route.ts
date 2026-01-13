import { NextResponse } from 'next/server';
const pdfId = require('pdf-parse');

// Disable body parser for file uploads if needed (Next.js App Router handles FormData automatically)
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const data = await pdfId(buffer);
        const textContent = data.text;

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
        }

        const systemPrompt = `You are a logistics data extraction expert. 
Your task is to extract structured Purchase Order (PO) data from the provided raw text and convert it into a JSON format suitable for a Sales Order (SO).

RETURN ONLY JSON. NO MARKDOWN. NO EXPLANATION.

Expected JSON Structure:
{
    "po_number": "string",
    "vendor": "string",
    "date": "string",
    "ship_to": {
        "name": "string",
        "address": "string",
        "city_state_zip": "string"
    },
    "items": [
        {
            "sku": "string",
            "description": "string",
            "quantity": number,
            "unit": "string"
        }
    ],
    "automation_rules": [
        "string" // inferred rules based on content, e.g., "Expedited Shipping", "Net 30"
    ]
}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Here is the PO Document Text:\n\n${textContent}` }
                ],
                temperature: 0.1,
                response_format: { type: "json_object" }
            }),
        });

        const gptData = await response.json();

        if (!response.ok) {
            console.error("OpenAI API Error:", gptData);
            return NextResponse.json({ error: gptData.error?.message || 'OpenAI API error' }, { status: response.status });
        }

        const extractedData = JSON.parse(gptData.choices[0].message.content);

        return NextResponse.json({
            success: true,
            extractedData
        });

    } catch (error: any) {
        console.error('PO Conversion Error:', error);
        return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    }
}
