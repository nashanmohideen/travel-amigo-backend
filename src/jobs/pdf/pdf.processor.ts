import { Processor, WorkerHost } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
import { Job } from "bullmq";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import PDFDocument = require("pdfkit");
import { PrismaService } from "../../prisma/prisma.service";
import { JOB_GENERATE_PDF, PDF_QUEUE, type GeneratePdfJob } from "../queues";
import type { GeneratedItinerary } from "../../common/types/domain";

/**
 * PDF worker: renders the trip's itinerarySnapshot to a PDF, uploads it to
 * Cloudflare R2 (S3-compatible), and stores the public URL on Trip.pdfUrl.
 * Retries inherit the global policy (3 attempts, exponential backoff).
 */
@Processor(PDF_QUEUE)
export class PdfProcessor extends WorkerHost {
  private readonly s3: S3Client | null;
  private readonly bucket: string;
  private readonly accountId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService
  ) {
    super();
    this.accountId = config.get<string>("R2_ACCOUNT_ID") ?? "";
    this.bucket = config.get<string>("R2_BUCKET_NAME") ?? "";
    const accessKeyId = config.get<string>("R2_ACCESS_KEY_ID");
    const secretAccessKey = config.get<string>("R2_SECRET_ACCESS_KEY");

    this.s3 =
      this.accountId && this.bucket && accessKeyId && secretAccessKey
        ? new S3Client({
            region: "auto",
            endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
            credentials: { accessKeyId, secretAccessKey },
          })
        : null;
  }

  async process(job: Job): Promise<void> {
    if (job.name !== JOB_GENERATE_PDF) {
      console.warn(`Unknown pdf job: ${job.name}`);
      return;
    }
    const { tripId } = job.data as GeneratePdfJob;

    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      throw new Error(`Trip ${tripId} not found for PDF generation`);
    }

    const itinerary = trip.itinerarySnapshot as unknown as GeneratedItinerary;
    const pdfBuffer = await this.renderPdf(itinerary);

    if (!this.s3) {
      console.log(`[pdf] R2 not configured — skipping upload for trip ${tripId}`);
      return;
    }

    const key = `trips/${tripId}/${Date.now()}.pdf`;
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: pdfBuffer,
        ContentType: "application/pdf",
      })
    );

    const pdfUrl = `https://${this.bucket}.${this.accountId}.r2.cloudflarestorage.com/${key}`;
    await this.prisma.trip.update({ where: { id: tripId }, data: { pdfUrl } });
  }

  /** Renders a simple day-by-day itinerary document. */
  private renderPdf(itinerary: GeneratedItinerary): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 48 });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.fontSize(22).text(itinerary.title, { underline: false });
      doc.moveDown(0.5);
      doc
        .fontSize(11)
        .fillColor("#555555")
        .text(
          `${itinerary.tripInput.duration} day(s) · ${itinerary.tripInput.travelers} traveller(s) · Budget LKR ${itinerary.tripInput.budgetLKR.toLocaleString("en")}`
        );
      doc.moveDown();

      for (const day of itinerary.days) {
        doc.fillColor("#000000").fontSize(15).text(`Day ${day.day} — ${day.title}`);
        doc.fontSize(10).fillColor("#555555").text(day.transportNote);
        doc.moveDown(0.4);
        for (const item of day.items) {
          doc
            .fillColor("#000000")
            .fontSize(11)
            .text(`${item.startTime}–${item.endTime}  ${item.placeName}`, { continued: false });
          doc
            .fontSize(9)
            .fillColor("#555555")
            .text(
              `${item.shortDescription}  (Est. LKR ${item.estimatedCostLkr.toLocaleString("en")})`,
              { indent: 16 }
            );
          doc.moveDown(0.3);
        }
        doc.moveDown(0.6);
      }

      doc.fillColor("#000000").fontSize(15).text("Budget breakdown");
      const b = itinerary.budget;
      doc.fontSize(10).fillColor("#333333");
      doc.text(`Accommodation: LKR ${b.accommodation.toLocaleString("en")}`);
      doc.text(`Food: LKR ${b.food.toLocaleString("en")}`);
      doc.text(`Transport: LKR ${b.transport.toLocaleString("en")}`);
      doc.text(`Activities: LKR ${b.activities.toLocaleString("en")}`);
      doc.text(`Buffer (10%): LKR ${b.buffer.toLocaleString("en")}`);
      doc.text(`Total: LKR ${b.total.toLocaleString("en")} (LKR ${b.perPerson.toLocaleString("en")} per person)`);

      doc.end();
    });
  }
}
