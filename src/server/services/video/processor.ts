import { db } from "~/server/db";
import { videos, codes, codeOccurrences } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { getVideoTranscript } from "../transcription/tactiq";
import { extractCodesFromTranscript } from "../ai/openai";

export interface ProcessedCode {
  service: string;
  coupon_code: string;
  discount: string;
  url: string;
  details: string;
}

export async function processVideo(videoId: string): Promise<ProcessedCode[]> {
  try {
    console.log(`Starting processing for video ${videoId}`);

    // Get video transcript
    const transcript = await getVideoTranscript(videoId);
    console.log(`Got transcript for video ${videoId}, length: ${transcript.length} chars`);

    // Extract codes using AI
    const extractedCodes = await extractCodesFromTranscript(transcript);
    console.log(`Extracted ${extractedCodes.length} codes from video ${videoId}`);

    // Process each extracted code
    for (const extractedCode of extractedCodes) {
      // Check if code exists for this service
      const existingCode = await db.query.codes.findFirst({
        where: and(
          eq(codes.service, extractedCode.service),
          eq(codes.couponCode, extractedCode.coupon_code)
        ),
      });

      let codeId: number;

      if (existingCode) {
        // Update existing code if details changed
        if (
          existingCode.discount !== extractedCode.discount ||
          existingCode.url !== extractedCode.url ||
          existingCode.details !== extractedCode.details
        ) {
          await db
            .update(codes)
            .set({
              discount: extractedCode.discount,
              url: extractedCode.url,
              details: extractedCode.details,
              updatedAt: new Date(),
            })
            .where(eq(codes.id, existingCode.id));
        }
        codeId = existingCode.id;
      } else {
        // Create new code
        const [newCode] = await db
          .insert(codes)
          .values({
            service: extractedCode.service,
            couponCode: extractedCode.coupon_code,
            discount: extractedCode.discount,
            url: extractedCode.url,
            details: extractedCode.details,
          })
          .returning();
        if (!newCode) throw new Error("Failed to insert code");
        codeId = newCode.id;
      }

      // Record occurrence
      await db.insert(codeOccurrences).values({
        codeId,
        videoId,
      });
    }

    // Mark video as processed
    await db
      .update(videos)
      .set({
        isProcessed: true,
        processedAt: new Date(),
      })
      .where(eq(videos.videoId, videoId));

    return extractedCodes;
  } catch (error) {
    console.error(`Error processing video ${videoId}:`, error);
    throw error;
  }
} 