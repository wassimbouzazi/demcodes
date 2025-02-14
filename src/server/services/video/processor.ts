import { db } from "~/server/db";
import { videos, codes, codeOccurrences } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";

export interface ProcessedCode {
  service: string;
  coupon_code: string;
  discount: string;
  url: string;
  details: string;
}

export async function processVideo(videoId: string): Promise<ProcessedCode[]> {
  // Dummy implementation for now
  const extractedCodes: ProcessedCode[] = [
    {
      service: "Incogni",
      coupon_code: "Veritasium",
      discount: "60% off annual subscription",
      url: "Incogni.com/Veritasium",
      details: "Fights data brokers by deleting your personal data."
    }
  ];

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
} 