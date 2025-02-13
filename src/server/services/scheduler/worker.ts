import PgBoss from 'pg-boss';
import { env } from "~/env";
import { handleSubscriptionRenewal } from "./jobs";

let bossInstance: PgBoss | null = null;

export async function getBoss() {
  if (!bossInstance) {
    bossInstance = new PgBoss({
      connectionString: env.DATABASE_URL,
      retryLimit: 5, // Number of retries for failed jobs
      retryDelay: 60, // Delay in seconds between retries
    });

    await bossInstance.start();
  }
  return bossInstance;
}

export type SubscriptionRenewalJob = {
  channelId: string;
};

export async function scheduleSubscriptionRenewal(
  channelId: string,
  expiresAt: Date,
) {
  const boss = await getBoss();
  
  // Schedule 5 minutes before expiration
  const scheduleTime = new Date(expiresAt.getTime() - 5 * 60 * 1000);
  
  await boss.schedule(
    'subscription-renewal', // job name
    scheduleTime.toISOString(), // start time
    { channelId }, // job data
    {
      retryLimit: 3,
      retryBackoff: true,
    }
  );
}

// Function to start all workers
export async function startWorkers() {
  const boss = await getBoss();

  // Subscribe to subscription renewal jobs
  await boss.work<SubscriptionRenewalJob>(
    'subscription-renewal',
    async (job) => {
      try {
        await handleSubscriptionRenewal(job.data);
        return true; // Job completed successfully
      } catch (error) {
        console.error('Failed to process subscription renewal:', error);
        throw error; // This will trigger a retry based on the job configuration
      }
    }
  );
} 