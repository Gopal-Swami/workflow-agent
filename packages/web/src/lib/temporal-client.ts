import { Client, Connection } from '@temporalio/client';

const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
const TEMPORAL_NAMESPACE = process.env.TEMPORAL_NAMESPACE || 'default';
const TEMPORAL_TASK_QUEUE = process.env.TEMPORAL_TASK_QUEUE || 'agent-tasks';

let clientPromise: Promise<Client> | null = null;

async function createClient(): Promise<Client> {
  console.log(`Connecting to Temporal at ${TEMPORAL_ADDRESS}...`);
  const connection = await Connection.connect({ address: TEMPORAL_ADDRESS });
  console.log('Temporal client connected');
  return new Client({ connection, namespace: TEMPORAL_NAMESPACE });
}

export async function getTemporalClient(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = createClient();
  }
  return clientPromise;
}

export const AGENT_TASK_QUEUE = TEMPORAL_TASK_QUEUE;
