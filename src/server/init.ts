import { getRunner, stopRunner } from './services/scheduler/graphile';

export async function initializeApp() {
  console.log('🚀 Initializing application...');
  
  try {
    // Initialize Graphile Worker
    await getRunner();
    
    // Handle graceful shutdown
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    process.on('SIGTERM', async () => {
      console.log('Shutting down...');
      await stopRunner();
      process.exit(0);
    });
    
    console.log('✅ Application initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    throw error;
  }
}