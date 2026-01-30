# Workflow Agent

A **production-minded Temporal workflow agent** demonstrating enterprise patterns for building reliable, observable, and maintainable agent systems.

## Requirements Checklist

| Requirement | Status | Details |
|-------------|--------|---------|
| **Hard Constraints** | | |
| Temporal as only orchestration | Done | No external queues or state management |
| Each tool as separate activity | Done | 4 activities: webSearch, dataTransform, generateReport, validateResult |
| Deterministic workflow code | Done | All I/O isolated in activities |
| Side-effectful isolated activities | Done | Each activity in separate file with typed I/O |
| Frontend triggers workflow | Done | `POST /api/workflow/start` |
| Frontend displays status/result | Done | `GET /api/workflow/[id]/status` + real-time UI |
| TypeScript | Done | 100% TypeScript |
| **Build Requirements** | | |
| Workflow accepts task payload | Done | `TaskInput` with query + options |
| At least 3 activities | Done | 4 activities (exceeds requirement) |
| Explicit retry/timeout config | Done | Per-activity strategies in workflow |
| Structured result | Done | `TaskResult` with report, validation, steps |
| Clear I/O boundaries | Done | Typed inputs/outputs per activity |
| Worker with registrations | Done | `worker.ts` registers workflows + activities |
| **Bonus** | | |
| Step-by-step UI status | Done | Real-time progress with step timeline |
| Determinism comments | Done | Design Decisions section 1 |
| MCP integration notes | Done | Extensibility section |
| Extension points | Done | "Adding New Activities" guide |

## Overview

This project implements a **Research Agent** that orchestrates multiple activities through Temporal:

1. **Parses** the research query and creates an execution plan
2. **Searches** for relevant information (mocked external API)
3. **Transforms** raw data into structured insights
4. **Generates** a comprehensive report (mocked LLM)
5. **Validates** output quality with detailed scoring

All orchestration is handled by Temporal, ensuring **durability**, **reliability**, and **observability**.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js Frontend (Port 3000)               │
│  ┌────────────────┐  ┌───────────────┐  ┌───────────────────┐  │
│  │  Task Submit   │  │ Status Polling│  │  Result Display   │  │
│  └───────┬────────┘  └───────┬───────┘  └───────────────────┘  │
└──────────┼───────────────────┼──────────────────────────────────┘
           │                   │
           ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│              Next.js API Routes (/api/workflow/*)               │
│         POST /start → starts workflow, returns workflowId       │
│         GET /[id]/status → queries workflow state via Temporal  │
└──────────┬───────────────────┬──────────────────────────────────┘
           │                   │
           │      gRPC (localhost:7233)
           ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Temporal Server (Docker)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Task Queue: "agent-tasks"                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│  PostgreSQL (5432) │ gRPC (7233) │ Web UI (8080)               │
└──────────┬──────────────────────────────────────────────────────┘
           │
           │ Worker polls task queue
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Temporal Worker (Node.js)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ agentWorkflow (Deterministic Orchestrator)                │  │
│  │   ├─ parseTask()      [pure function]                     │  │
│  │   ├─ webSearch        [activity - 3 retries, exp backoff] │  │
│  │   ├─ dataTransform    [activity - 2 retries, 1.5x backoff]│  │
│  │   ├─ generateReport   [activity - 3 retries, long backoff]│  │
│  │   └─ validateResult   [activity - 1 retry]                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
workflow-agent/
├── packages/
│   ├── temporal-worker/          # Temporal workflows & activities
│   │   ├── Dockerfile            # Worker container image
│   │   └── src/
│   │       ├── workflows/        # Deterministic orchestrators
│   │       ├── activities/       # Side-effectful operations
│   │       ├── shared/           # Type definitions
│   │       └── worker.ts         # Worker entry point
│   │
│   └── web/                      # Next.js frontend
│       ├── Dockerfile            # Web container image
│       └── src/
│           ├── app/              # Next.js app router + API routes
│           ├── components/       # React components
│           └── lib/              # Temporal client singleton
│
├── .env.example                  # Environment variables template
├── docker-compose.yml            # Full stack Docker configuration
├── turbo.json                    # Monorepo task configuration
└── README.md
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- (Optional for local dev) Node.js 18+, npm 10+

### Option A: Full Docker Deployment (Recommended)

```bash
# (Optional) Customize environment variables
cp .env.example .env

# Start all services
docker-compose up -d
```

This starts:
- **PostgreSQL** - Temporal database
- **Temporal Server** - Workflow orchestration (gRPC on port 7233)
- **Temporal UI** - Web interface (http://localhost:8080)
- **Worker** - Executes workflows and activities
- **Web** - Next.js frontend (http://localhost:3000)

Verify all services are running:
```bash
docker-compose ps
```

To rebuild after code changes:
```bash
docker-compose build && docker-compose up -d
```

### Option B: Local Development

For faster iteration during development:

#### 1. Start Temporal Infrastructure

```bash
docker-compose up -d postgresql temporal temporal-ui
```

Temporal UI: http://localhost:8080

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Start the Worker

```bash
npm run dev:worker
```

#### 4. Start the Frontend

In a new terminal:
```bash
npm run dev:web
```

Open http://localhost:3000

### Test the System

1. Enter a research query (e.g., "Latest trends in AI")
2. Click "Start Research"
3. Watch step-by-step progress
4. View the generated report with quality validation

## Environment Variables

Copy `.env.example` to `.env` to customize configuration:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `TEMPORAL_ADDRESS` | `localhost:7233` | Temporal server gRPC address |
| `TEMPORAL_NAMESPACE` | `default` | Temporal namespace |
| `TEMPORAL_TASK_QUEUE` | `agent-tasks` | Task queue name for workflows |
| `POSTGRES_USER` | `temporal` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `temporal` | PostgreSQL password |
| `POSTGRES_DB` | `temporal` | PostgreSQL database name |
| `WORKER_MAX_CONCURRENT_ACTIVITIES` | `10` | Max concurrent activity executions |
| `WORKER_MAX_CONCURRENT_WORKFLOWS` | `10` | Max concurrent workflow executions |
| `WEB_PORT` | `3000` | Web frontend port |
| `TEMPORAL_UI_PORT` | `8080` | Temporal UI port |
| `TEMPORAL_CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins for Temporal UI |
| `NODE_ENV` | `production` | Node environment |

## Design Decisions

### 1. Workflow Determinism

Temporal workflows must be **deterministic** - producing identical results when replayed with the same inputs. This enables Temporal's durability guarantees.

**Approach:**
- All side effects (I/O, randomness, time) are isolated in activities
- Workflow code uses only Temporal-provided APIs
- State is maintained in workflow variables, exposed via queries

```typescript
// Correct: Side effect in activity
const searchResult = await searchActivities.webSearch(query);

// Wrong: Direct I/O in workflow (breaks replay)
const response = await fetch(url);
```

### 2. Activity Retry Strategies

Each activity has a **tailored retry strategy** based on failure characteristics:

| Activity | Max Retries | Backoff | Timeout | Rationale |
|----------|-------------|---------|---------|-----------|
| `webSearch` | 3 | Exponential (1s→10s) | 30s | Network calls are flaky; backoff avoids rate limits |
| `dataTransform` | 2 | 1.5x (500ms) | 60s | CPU-bound; rarely fails transiently |
| `generateReport` | 3 | Exponential (2s→30s) | 120s | LLM APIs can be slow; longer backoff for rate limits |
| `validateResult` | 1 | None | 10s | Fast & idempotent; failures are usually deterministic |

**Why different strategies?**
- Network I/O needs exponential backoff to handle rate limiting
- CPU operations rarely benefit from multiple retries
- LLM operations need longer intervals due to API quotas
- Validation is idempotent and fast—one retry catches transient issues

### 3. Query-Based Status Polling

Status is exposed via Temporal **queries** rather than signals or external databases:

```typescript
// Workflow: Define and handle query
export const getStatusQuery = defineQuery<WorkflowStatus>('getStatus');
setHandler(getStatusQuery, () => ({ currentStep, completedSteps, error }));

// API Route: Query without affecting history
const status = await handle.query<WorkflowStatus>('getStatus');
```

**Benefits:**
- Read-only—queries don't affect workflow history
- Always returns current state, even during replay
- No external database needed for status tracking
- Frontend can poll safely at any interval

### 4. Graceful Failure Handling

Activities throw **typed errors** distinguishing retryable from non-retryable failures:

```typescript
// Retryable: Temporal will retry with backoff
throw ApplicationFailure.create({
  message: 'Service unavailable',
  type: 'ServiceUnavailableError',
  nonRetryable: false,
});

// Non-retryable: Fail immediately (invalid input)
throw ApplicationFailure.create({
  message: 'Invalid query',
  type: 'ValidationError',
  nonRetryable: true,
});
```

The workflow handles failures gracefully:
- Critical failures (search, transform, generate) → workflow fails
- Non-critical failures (validation) → return partial result with `partial: true`

### 5. Temporal Client Singleton

The frontend uses a **singleton pattern** for the Temporal client:

```typescript
let clientPromise: Promise<Client> | null = null;

export async function getTemporalClient(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = createClient();
  }
  return clientPromise;
}
```

**Why?**
- gRPC connections are expensive to create
- Next.js API routes are stateless—reusing connections improves performance
- Thread-safe: multiple concurrent requests share the same connection

## Extensibility: MCP Tool Integration

This architecture is designed to integrate with MCP (Model Context Protocol) tools:

```typescript
// Future: Generate activities from MCP tool definitions
const mcpActivities = generateActivitiesFromMCP({
  tools: mcpToolDefinitions,
  retryConfig: {
    'web-search': { maxAttempts: 3, backoff: 'exponential' },
    'file-read': { maxAttempts: 1 },
    'code-execute': { maxAttempts: 2, timeout: '300s' },
  },
});
```

**Integration pattern:**
1. Parse MCP tool schema (JSON-RPC 2.0)
2. Generate activity wrapper with typed I/O
3. Activity invokes MCP tool via stdio/HTTP
4. Retry config derived from tool characteristics (network vs local)

## Production Considerations

If deploying to production, I would add:

1. **Authentication**: JWT/OAuth for API routes, namespace-level auth for Temporal
2. **Observability**: OpenTelemetry tracing, Prometheus metrics, structured logging
3. **Persistence**: Replace mocks with real search API (Serper, Bing) and LLM (OpenAI, Anthropic)
4. **Workflow Versioning**: Use `patched()` for backward-compatible workflow changes
5. **Rate Limiting**: Per-user workflow limits to prevent abuse
6. **Error Handling**: Dead letter queue for failed workflows, alerting
7. **Scaling**: Multiple worker replicas, separate task queues by workload type
8. **Testing**: Temporal's testing framework for workflow replay tests

## Development

### Viewing Workflow History

Open Temporal UI at http://localhost:8080:
1. Navigate to "default" namespace
2. Find workflow by ID (e.g., `agent-xxx`)
3. View full event history, including retries

### Adding New Activities

1. Create `packages/temporal-worker/src/activities/new-tool.activity.ts`
2. Define input/output types in `shared/types.ts`
3. Export from `activities/index.ts`
4. Create proxy in workflow with appropriate retry config
5. Call from workflow

### Workflow Versioning

For in-flight workflow compatibility:

```typescript
import { patched } from '@temporalio/workflow';

if (patched('enhanced-validation')) {
  await validateActivities.enhancedValidate(...);
} else {
  await validateActivities.validateResult(...);
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Worker not connecting | Verify Temporal server: `docker-compose ps` |
| Workflow stuck | Check worker is polling; inspect Temporal UI for activity failures |
| Frontend not updating | Check browser console; verify API routes return correct status |
| Query timeout | Ensure query handler is registered before any `await` |

## Tech Stack

- **Temporal** 1.10.0 - Workflow orchestration
- **Next.js** 14.1.0 - Frontend & API routes
- **TypeScript** 5.3 - Type safety
- **Turborepo** 2.0 - Monorepo tooling
- **Docker Compose** - Local infrastructure

