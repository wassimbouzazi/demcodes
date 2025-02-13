import { startWorkers } from "./server/services/scheduler/worker";

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🔄 Initializing background job workers...');
    
    try {
      await startWorkers();
      console.log('✅ Background job workers initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize background job workers:', error);
      // Optionally re-throw if you want the server to fail on worker init error
      // throw error;
    }
  }
} 