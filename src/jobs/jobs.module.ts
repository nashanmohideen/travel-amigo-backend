import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { EMAIL_QUEUE, PDF_QUEUE } from "./queues";
import { EmailQueueService } from "./email/email-queue.service";
import { EmailProcessor } from "./email/email.processor";
import { PdfQueueService } from "./pdf/pdf-queue.service";
import { PdfProcessor } from "./pdf/pdf.processor";

/**
 * Async job infrastructure (BullMQ on the shared Redis instance).
 * Retry policy (3 attempts, exponential backoff) is set globally in
 * AppModule's BullModule.forRootAsync defaultJobOptions.
 */
@Module({
  imports: [
    BullModule.registerQueue({ name: EMAIL_QUEUE }, { name: PDF_QUEUE }),
  ],
  providers: [EmailQueueService, EmailProcessor, PdfQueueService, PdfProcessor],
  exports: [EmailQueueService, PdfQueueService],
})
export class JobsModule {}
