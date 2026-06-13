import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { JOB_GENERATE_PDF, PDF_QUEUE, type GeneratePdfJob } from "../queues";

/** Producer-side API for the PDF queue. */
@Injectable()
export class PdfQueueService {
  constructor(@InjectQueue(PDF_QUEUE) private readonly queue: Queue) {}

  /** Queue PDF generation for a trip; the worker writes Trip.pdfUrl when done. */
  async enqueueGeneratePdf(tripId: string): Promise<void> {
    const job: GeneratePdfJob = { tripId };
    await this.queue.add(JOB_GENERATE_PDF, job);
  }
}
