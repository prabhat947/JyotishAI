/**
 * BullMQ queue definitions and enqueue helpers.
 */

import { Queue } from "bullmq";
import { redisConnection } from "./connection";

// Report generation queue
export const reportQueue = new Queue("report-generation", {
  connection: redisConnection,
});

// Alert generation queue
export const alertQueue = new Queue("transit-alerts", {
  connection: redisConnection,
});

/**
 * Add PDF generation job to queue
 */
export async function enqueuePDFGeneration(reportId: string) {
  await reportQueue.add(
    "generate-pdf",
    { reportId },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    }
  );
}

/**
 * Add daily alert generation job
 */
export async function enqueueAlertGeneration(profileId: string) {
  await alertQueue.add(
    "generate-alerts",
    { profileId },
    {
      attempts: 2,
      backoff: {
        type: "fixed",
        delay: 5000,
      },
    }
  );
}
