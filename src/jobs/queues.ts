/** Queue and job name constants shared by producers and workers. */

export const EMAIL_QUEUE = "email-queue";
export const PDF_QUEUE = "pdf-queue";

export const JOB_SEND_VERIFICATION = "send-verification";
export const JOB_SEND_TRIP_INVITE = "send-trip-invite";
export const JOB_GENERATE_PDF = "generate-pdf";

export interface SendVerificationJob {
  email: string;
  verifyToken: string;
}

export interface SendTripInviteJob {
  email: string;
  tripTitle: string;
  shareUrl: string;
}

export interface GeneratePdfJob {
  tripId: string;
}
