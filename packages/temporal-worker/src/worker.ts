import { NativeConnection, Worker } from '@temporalio/worker';
import * as path from 'path';
import * as activities from './activities/index.js';

const config = {
  temporalAddress: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
  taskQueue: process.env.TASK_QUEUE || 'agent-tasks',
  namespace: process.env.TEMPORAL_NAMESPACE || 'default',
  maxConcurrentActivities: parseInt(process.env.MAX_CONCURRENT_ACTIVITIES || '10', 10),
  maxConcurrentWorkflows: parseInt(process.env.MAX_CONCURRENT_WORKFLOWS || '10', 10),
};

// Resolve workflows path - works in both dev (tsx) and prod (compiled)
function getWorkflowsPath(): string {
  const currentDir = path.dirname(new URL(import.meta.url).pathname);
  // In dev: currentDir is src/, workflows at src/workflows/index.ts
  // In prod: currentDir is dist/, workflows at src/workflows/index.ts (relative: ../src/workflows)
  if (currentDir.endsWith('/dist')) {
    return path.resolve(currentDir, '../src/workflows/index.ts');
  }
  return path.resolve(currentDir, './workflows/index.ts');
}

async function run(): Promise<void> {
  console.log(`Starting Temporal Worker [${config.taskQueue}] → ${config.temporalAddress}`);

  const connection = await NativeConnection.connect({
    address: config.temporalAddress,
  });

  const workflowsPath = getWorkflowsPath();
  console.log(`Workflows path: ${workflowsPath}`);

  try {
    const worker = await Worker.create({
      connection,
      namespace: config.namespace,
      taskQueue: config.taskQueue,
      workflowsPath,
      activities,
      maxConcurrentActivityTaskExecutions: config.maxConcurrentActivities,
      maxConcurrentWorkflowTaskExecutions: config.maxConcurrentWorkflows,
    });

    console.log('Worker ready, polling for tasks...');
    await worker.run();
  } catch (err) {
    console.error('Worker error:', err);
    throw err;
  } finally {
    await connection.close();
  }
}

const shutdown = (signal: string) => () => {
  console.log(`\n${signal} received, shutting down...`);
  process.exit(0);
};

process.on('SIGINT', shutdown('SIGINT'));
process.on('SIGTERM', shutdown('SIGTERM'));

run().catch((err) => {
  console.error('Failed to start worker:', err);
  process.exit(1);
});
