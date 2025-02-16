import OpenAI from 'openai';
import { env } from "~/env";
import type { ProcessedCode } from '../video/processor';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a specialized AI that extracts promotional codes and offers from YouTube video transcripts.

Your task is to identify and extract:
- Service names
- Coupon codes
- Discount details
- Promotional URLs
- Additional details about the offer

Return the data in this exact JSON format:
[{
  "service": "string",
  "coupon_code": "string",
  "discount": "string",
  "url": "string",
  "details": "string"
}]

If no codes are found, return an empty array: []

Rules:
1. Only extract actual promotional codes and offers
2. Ensure URLs are complete and properly formatted
3. Include specific discount details when available
4. Be concise but complete in the details field
5. Return valid JSON that matches the specified format exactly`;

export async function extractCodesFromTranscript(transcript: string): Promise<ProcessedCode[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: transcript }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const response = completion.choices[0]?.message?.content;
    if (!response) {
      console.log('No codes found in transcript');
      return [];
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
      const parsed = JSON.parse(response);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return parsed.codes || [];
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      return [];
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}