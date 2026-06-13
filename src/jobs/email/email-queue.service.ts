import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import {
  EMAIL_QUEUE,
  JOB_SEND_TRIP_INVITE,
  JOB_SEND_VERIFICATION,
  type SendTripInviteJob,
  type SendVerificationJob,
} from "../queues";

/** Producer-side API for the email queue. */
@Injectable()
export class EmailQueueService {
  constructor(@InjectQueue(EMAIL_QUEUE) private readonly queue: Queue) {}

  /** Queued after registration. */
  async enqueueVerificationEmail(email: string, verifyToken: string): Promise<void> {
    const job: SendVerificationJob = { email, verifyToken };
    await this.queue.add(JOB_SEND_VERIFICATION, job).catch((err) => {
      // Email is non-critical for the registration flow itself
      console.error("Failed to enqueue verification email:", err);
    });
  }

  /** Queued after a share token is created. */
  async enqueueTripInvite(email: string, tripTitle: string, shareUrl: string): Promise<void> {
    const job: SendTripInviteJob = { email, tripTitle, shareUrl };
    await this.queue.add(JOB_SEND_TRIP_INVITE, job).catch((err) => {
      console.error("Failed to enqueue trip invite email:", err);
    });
  }
}
