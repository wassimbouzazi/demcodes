import { run, type Runner } from 'graphile-worker';
import { env } from "~/env";
import { handleSubscriptionRenewal } from './jobs';

let runner: Runner | null = null;

export async function getRunner() {
  if (!runner) {
    console.log('📦 Initializing Graphile Worker...');
    
    runner = await run({
      connectionString: env.DATABASE_URL,
      concurrency: 5,
      // Add task executors
      taskList: {
        'subscription-renewal': async (payload) => {
          const { channelId } = payload as { channelId: string };
          console.log(`Processing subscription renewal for channel: ${channelId}`);
          
          try {
            await handleSubscriptionRenewal({ channelId });
            console.log(`✅ Successfully renewed subscription for channel: ${channelId}`);
          } catch (error) {
            console.error(`❌ Failed to process subscription renewal:`, error);
            throw error; // Graphile will handle retries
          }
        },
      },
    });

    console.log('✅ Graphile Worker initialized successfully');
  }
  return runner;
}

export async function scheduleJob(
  taskName: string,
  payload: unknown,
  runAt: Date,
) {
  const runner = await getRunner();
  return runner.addJob(taskName, payload, { runAt });
}

export async function stopRunner() {
  if (runner) {
    await runner.stop();
    runner = null;
  }
}