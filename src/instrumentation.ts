import { getRunner } from "./server/services/scheduler/graphile";

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🔄 Initializing background jobs...');
    
    try {
      await getRunner();
      console.log('✅ Background jobs initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize background jobs:', error);
    }
  }
} 