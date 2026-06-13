import { Processor, WorkerHost } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
import { Job } from "bullmq";
import * as sgMail from "@sendgrid/mail";
import {
  EMAIL_QUEUE,
  JOB_SEND_TRIP_INVITE,
  JOB_SEND_VERIFICATION,
  type SendTripInviteJob,
  type SendVerificationJob,
} from "../queues";

const FROM_EMAIL = "no-reply@travelamigo.app";

/**
 * Email worker. Retries are inherited from the global BullMQ default job
 * options (3 attempts, exponential backoff).
 */
@Processor(EMAIL_QUEUE)
export class EmailProcessor extends WorkerHost {
  private readonly clientUrl: string;
  private readonly enabled: boolean;

  constructor(config: ConfigService) {
    super();
    this.clientUrl = config.get<string>("CLIENT_URL") ?? "http://localhost:3000";
    const apiKey = config.get<string>("SENDGRID_API_KEY");
    this.enabled = Boolean(apiKey);
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    }
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case JOB_SEND_VERIFICATION:
        return this.sendVerification(job.data as SendVerificationJob);
      case JOB_SEND_TRIP_INVITE:
        return this.sendTripInvite(job.data as SendTripInviteJob);
      default:
        console.warn(`Unknown email job: ${job.name}`);
    }
  }

  private async sendVerification(data: SendVerificationJob): Promise<void> {
    const verifyUrl = `${this.clientUrl}/verify-email?token=${encodeURIComponent(data.verifyToken)}`;
    await this.send({
      to: data.email,
      subject: "Verify your Travel Amigo account",
      text: `Welcome to Travel Amigo! Verify your email: ${verifyUrl}`,
      html: `<p>Welcome to Travel Amigo!</p><p><a href="${verifyUrl}">Verify your email</a> (link expires in 24 hours).</p>`,
    });
  }

  private async sendTripInvite(data: SendTripInviteJob): Promise<void> {
    await this.send({
      to: data.email,
      subject: `A Sri Lanka trip plan was shared with you: ${data.tripTitle}`,
      text: `View the shared itinerary: ${data.shareUrl}`,
      html: `<p>You've been invited to view <strong>${data.tripTitle}</strong>.</p><p><a href="${data.shareUrl}">Open the itinerary</a></p>`,
    });
  }

  private async send(msg: { to: string; subject: string; text: string; html: string }): Promise<void> {
    if (!this.enabled) {
      console.log(`[email disabled — no SENDGRID_API_KEY] Would send "${msg.subject}" to ${msg.to}`);
      return;
    }
    await sgMail.send({ ...msg, from: FROM_EMAIL });
  }
}
