import { startWorkers } from "./services/scheduler/worker";

export async function initializeApp() {
  // Start pg-boss workers
  await startWorkers();
  
  // Add any other initialization logic here
} 