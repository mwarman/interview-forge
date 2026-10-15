# Project Overview: interview-forge

**Version:** 1.3  
**Date:** 2026-10-12  
**Project Type:** Portfolio  
**Status:** Approved for Planning

---

## Executive Summary

`interview-forge` is a human-in-the-loop AI agent that transforms a job description into a structured, recruiter-reviewed interview plan — and then closes the loop by reconciling post-interview scorecards with free-text recruiter notes to produce a final candidate assessment. The agent handles the heavy lifting (question generation, competency mapping, scoring reconciliation) while the human recruiter retains approval authority at two explicit checkpoints: plan review before the interview, and assessment review after. The system supports multiple candidates per job description, enabling a recruiter to maintain a durable JD and run independent interview sessions for each candidate against a consistent evaluation framework. This project demonstrates the commercially dominant agentic pattern — AI that accelerates and augments human decision-making without removing human accountability from high-stakes hiring decisions.

---

## Goals

- **Primary Goal:** Demonstrate production-grade human-in-the-loop agent architecture using Amazon Bedrock AgentCore, including explicit approval checkpoints, tool use, and structured output generation.
- **Secondary Goals:**
  - Show continuity with prior portfolio projects (`resume-lens`, `career-compass`, `talent-finder`) within the career/talent domain
  - Demonstrate multi-modal input ingestion (paste text + PDF/TXT upload via `unpdf`)
  - Demonstrate agent-driven structured output with Zod schema validation
  - Demonstrate reconciliation inference: agent resolving signal conflicts between structured ratings and free-text notes
  - Demonstrate a DynamoDB single-table design supporting a realistic one-to-many access pattern (JD → candidate sessions)

---

## Scope

### In Scope

- Job description ingestion via paste (raw text) or file upload (PDF or TXT); PDF parsed via `unpdf` in Lambda
- JD list view: browse all available JDs stored in DynamoDB and create new candidate sessions from any existing JD
- AI agent generation of a structured interview plan: competency areas, suggested questions per competency, evaluation criteria
- Recruiter review and edit UI: accept, modify, or regenerate sections of the plan before the interview (**Checkpoint 1**)
- Candidate session management: one interview session per candidate per JD, each with its own plan, scorecard, and assessment
- Post-interview scorecard: per-question structured ratings (Likert scale) plus free-text notes per competency area
- Agent reconciliation: synthesize ratings and free-text notes into a final candidate assessment with hire/no-hire recommendation and supporting reasoning
- Recruiter review and approval of final assessment before it is persisted (**Checkpoint 2**)
- Client-side PDF export of the final assessment report using `pdfmake` (runs in React, no Lambda involvement)
- DynamoDB persistence with a uniform 72-hour TTL applied to all records (JD metadata and all child session records share the TTL value set at JD creation time)
- Three GitHub Actions workflows: CI (format check, lint, build, unit tests, CDK synth), Deploy (manual, provisions and deploys all infrastructure), Teardown (manual, destroys all infrastructure)

### Out of Scope

- Calendar integration or interview scheduling
- Multi-user / team collaboration (single recruiter session only)
- Support for Word (.docx) document upload
- Candidate-facing interfaces or communication
- ATS (Applicant Tracking System) integration
- Authentication / user accounts (no login — consistent with prior portfolio projects)
- Multi-language support
- Assessment export to formats other than PDF
- TTL extension or reset — all records expire on a fixed 72-hour window from JD creation; no override mechanism

---

## Target Audience _(Portfolio)_

| Audience                                     | Signal Being Demonstrated                                                                                       |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Enterprise HR / talent platform clients      | Ability to design agentic AI workflows within legally defensible human-in-the-loop guardrails                   |
| Technical recruiters evaluating AI engineers | Mastery of AgentCore tool use, approval flows, and structured output generation                                 |
| AWS-focused engineering teams                | AWS-native agent architecture: Bedrock AgentCore, Lambda, DynamoDB, CDK, API Gateway                            |
| Solution design / pre-sales context          | Translating a complex multi-step business process (structured interviewing) into a feasible AI-augmented system |

---

## Technology Stack

| Layer               | Technology / Service                             | Rationale                                                                                                                              |
| ------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend            | React 19, Vite, TailwindCSS, shadcn/ui           | Consistent with monorepo portfolio standard; supports drag-and-drop upload and multi-step workflow UI                                  |
| PDF Export          | `pdfmake` (client-side, React)                   | Bundles cleanly in the browser; no Lambda involvement; zero cold-start overhead                                                        |
| API                 | AWS Lambda (Node.js, ES Modules)                 | Serverless; consistent with portfolio pattern; cost-optimized at near-zero idle traffic                                                |
| PDF Parsing         | `unpdf` (npm) bundled in Lambda                  | Synchronous; bundles and executes cleanly in Lambda ES module environment; confirmed working in `resume-lens`                          |
| Agent Orchestration | Amazon Bedrock AgentCore                         | Native HITL support; managed harness runs the ReAct loop; gateway-hosted tools; session management; AWS-recommended managed agent tier |
| LLM                 | Claude Haiku 4.5 via Bedrock                     | Low cost and fast responses for plan generation and reconciliation; $1.00/$5.00 per 1M tokens in/out                                   |
| Data                | DynamoDB (single-table design, on-demand)        | Serverless, zero idle cost; one-to-many JD → session access patterns via GSI; 72-hour TTL auto-expiry                                  |
| Storage             | S3                                               | JD file upload staging (PDF/TXT); 72-hour lifecycle policy aligned to DynamoDB TTL                                                     |
| Infrastructure      | AWS CDK (TypeScript)                             | IaC consistent with portfolio standard                                                                                                 |
| Monorepo            | npm workspaces (`web`, `api`, `shared`, `infra`) | Consistent with `technology-guidelines.md`                                                                                             |
| Validation          | Zod (shared schemas)                             | Cross-boundary type safety; consistent with portfolio standard                                                                         |
| Testing             | Vitest (all workspaces)                          | Consistent with portfolio standard                                                                                                     |
| CI/CD               | GitHub Actions (3 workflows)                     | CI, Deploy (manual), Teardown (manual)                                                                                                 |

---

## Architecture Overview

The system is organized around two human approval checkpoints that explicitly gate agent progression. Between checkpoints, the AgentCore harness autonomously executes tool calls to read context from DynamoDB, generate structured content, and write results back. All state — JD text, interview plan, scorecard, and final assessment — is persisted in DynamoDB throughout the session lifecycle.

**Workflow:**

1. Recruiter submits a JD (paste or upload) → Lambda extracts text (via `unpdf` for PDF) → JD record written to DynamoDB with 72-hour TTL
2. Recruiter selects a JD from the JD list and creates a new candidate session → session record written with the same TTL as the parent JD
3. Agent invoked for plan generation: calls tools to read the JD, generate competency areas and interview questions, write the draft plan to DynamoDB
4. **Checkpoint 1:** Recruiter reviews, edits, and approves the plan → plan locked in DynamoDB; interview proceeds offline
5. Recruiter returns post-interview, enters per-question Likert ratings and free-text notes per competency → scorecard written to DynamoDB
6. Agent invoked for reconciliation: reads plan and scorecard, identifies agreements and conflicts between ratings and notes, generates final assessment with hire/no-hire recommendation and reasoning → assessment written to DynamoDB
7. **Checkpoint 2:** Recruiter reviews and approves (or overrides) the final assessment → assessment locked in DynamoDB
8. Recruiter downloads the final assessment as a PDF (generated client-side via `pdfmake`)

### Architecture Diagram

```mermaid
flowchart TD
    subgraph Web["React Frontend (apps/web)"]
        A[JD Input\nPaste or Upload]
        B[JD List + Session List]
        C[Plan Review & Edit UI\nCheckpoint 1]
        D[Scorecard Entry UI]
        E[Assessment Review UI\nCheckpoint 2]
        F[PDF Export\npdfmake client-side]
    end

    subgraph APIGW["API Gateway"]
        GW[REST API]
    end

    subgraph Lambda["Lambda Functions (apps/api)"]
        L1[ingest-handler]
        L2[plan-handler]
        L3[approve-plan-handler]
        L4[score-handler]
        L5[assess-handler]
        L6[approve-assess-handler]
        L7[session-handler\nCRUD for JDs + Sessions]
    end

    subgraph Agent["Amazon Bedrock AgentCore"]
        AG1[Plan Generation Agent\nReAct Tool Loop]
        AG2[Reconciliation Agent\nReAct Tool Loop]
    end

    subgraph Data["Data Layer"]
        DB[(DynamoDB\nSingle-Table\n72hr TTL)]
        S3[(S3\nJD File Uploads\n72hr Lifecycle)]
    end

    A -->|Upload| S3
    A -->|API GW| L1
    L1 -->|unpdf extract| S3
    L1 --> DB
    B -->|API GW| L7
    L7 --> DB
    B --> C
    C -->|Generate Plan| L2
    L2 --> AG1
    AG1 -->|Tool: read-jd| DB
    AG1 -->|Tool: write-plan| DB
    AG1 --> C
    C -->|Approve| L3
    L3 --> DB
    D -->|Submit Scorecard| L4
    L4 --> DB
    L4 --> L5
    L5 --> AG2
    AG2 -->|Tool: read-plan| DB
    AG2 -->|Tool: read-scorecard| DB
    AG2 -->|Tool: write-assessment| DB
    AG2 --> E
    E -->|Approve| L6
    L6 --> DB
    E --> F
```

---

## Key Design Decisions

### Decision: Bedrock AgentCore vs. Bedrock Agents (Classic) vs. Custom ReAct Loop

| Option                       | Pros                                                                                                                                            | Cons                                                                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Bedrock AgentCore**        | Native HITL support; built-in session management and tool orchestration; AWS-managed ReAct loop; strong portfolio signal for managed agent tier | Less fine-grained loop control; per-token cost amplification across multiple internal calls; some opacity in internal orchestration                  |
| **Custom Lambda ReAct Loop** | Full control over prompt, loop, and state; cheaper at low token volumes; re-uses pattern already implicit in `talent-finder`                    | Requires custom session state management for HITL approval; re-implements what Bedrock AgentCore provides natively; weaker portfolio differentiation |

**Decision:** Bedrock AgentCore (harness + gateway)  
**Rationale:** The primary portfolio signal is the human-in-the-loop agent pattern. Bedrock AgentCore provides this natively and is the AWS-recommended managed tier. The project originally used Bedrock Agents (Classic), which is now in maintenance mode; it was migrated to one AgentCore harness per agent, each with its own AgentCore gateway whose Lambda targets expose that agent's tools (preserving per-agent tool isolation). A custom loop was already demonstrated implicitly in `talent-finder`; this project advances to the managed agent abstraction. Cost amplification is acceptable at portfolio demo volumes (~$0.50–1/month).

---

### Decision: PDF Parsing — `unpdf` vs. AWS Textract

| Option                | Pros                                                                                                              | Cons                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **`unpdf` in Lambda** | Synchronous; zero additional AWS cost; confirmed working in `resume-lens`; bundles cleanly as ES module in Lambda | May not handle scanned or image-only PDFs; limited layout fidelity for complex documents                 |
| **AWS Textract**      | Handles scanned and complex-layout PDFs; managed service; high fidelity                                           | Async job model adds latency and state management complexity; per-page cost; overkill for text-heavy JDs |

**Decision:** `unpdf` in Lambda  
**Rationale:** JDs are universally text-heavy, machine-generated PDFs. `unpdf` is proven in `resume-lens` and has zero incremental AWS cost. Textract's async complexity and per-page cost are not justified for this input type.

---

### Decision: Multi-Candidate per JD — Shared JD Record vs. JD Duplication

| Option                                        | Pros                                                                                                                                 | Cons                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| **Shared JD record, sessions as children**    | Single source of truth for JD; key design is more interesting and realistic; enables JD reuse across candidates without re-ingestion | Slightly more complex single-table key design; requires GSI for session list queries |
| **Flat sessions (JD duplicated per session)** | Simpler data model; no GSI needed                                                                                                    | Redundant storage; no JD reuse; weaker data model story for portfolio                |

**Decision:** Shared JD record with sessions as children  
**Rationale:** More defensible production design. The one-to-many relationship makes the DynamoDB key design demonstrably more interesting. The additional GSI is negligible cost on DynamoDB on-demand pricing.

---

### Decision: PDF Assessment Export — Client-Side vs. Lambda

| Option                             | Pros                                                                                             | Cons                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| **Client-side `pdfmake` in React** | Zero Lambda invocation cost; no cold-start latency; simpler architecture; no S3 staging required | PDF generation capability tied to browser environment; cannot be triggered server-side |
| **`pdfmake` in Lambda**            | Server-side generation enables future automation; consistent output regardless of client         | Additional Lambda complexity; cold-start overhead; requires S3 staging for download    |

**Decision:** Client-side `pdfmake` in React  
**Rationale:** Assessment export is always recruiter-triggered from the UI. Server-side generation adds complexity with no practical benefit at portfolio scope.

---

### Decision: DynamoDB TTL Strategy — Uniform vs. Per-Record

| Option                                                                    | Pros                                                                                                                                                | Cons                                                                                                                                             |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Uniform TTL: JD TTL stamped onto all child sessions**                   | Single TTL value computed once at JD creation; no per-session TTL management; all related records expire together; simplest possible implementation | Sessions created late in a JD's TTL window will have a shorter effective lifetime than 72 hours from their own creation                          |
| **Per-record TTL: each record gets its own 72-hour window from creation** | Each session always lives for a full 72 hours from its creation                                                                                     | TTL values diverge across records; JD metadata may expire before child sessions; requires TTL enforcement logic to account for orphaned sessions |

**Decision:** Uniform TTL — JD TTL value stamped onto all child session records at creation  
**Rationale:** Simplest implementation with no orphan risk. All records related to a JD expire together. The edge case (a session created near a JD's TTL boundary expiring sooner than 72 hours from its own creation) is acceptable at portfolio scope with no auth or ownership model.

---

## DynamoDB Data Model

### Design Principles

- Single-table design with composite keys (`PK` / `SK`)
- All items carry a `TTL` attribute (Unix timestamp) set to the JD's creation time + 72 hours; this value is computed once at JD creation and propagated to all child session records
- A single GSI (`GSI1`) enables all required query access patterns without table scans

### Entity Definitions

#### JD (Job Description)

| Attribute   | Type    | Value                                     | Notes                                                    |
| ----------- | ------- | ----------------------------------------- | -------------------------------------------------------- |
| `PK`        | String  | `JD#{jdId}`                               | Partition key                                            |
| `SK`        | String  | `METADATA`                                | Sort key                                                 |
| `GSI1PK`    | String  | `JDS`                                     | Constant — enables listing all JDs via GSI1              |
| `GSI1SK`    | String  | `{createdAt}#{jdId}`                      | ISO timestamp prefix enables sort-by-date                |
| `jdId`      | String  | UUID                                      |                                                          |
| `title`     | String  | Recruiter-provided job title              |                                                          |
| `rawText`   | String  | Extracted JD text (from paste or `unpdf`) |                                                          |
| `s3Key`     | String? | S3 object key                             | Present only for file uploads                            |
| `createdAt` | String  | ISO 8601 timestamp                        |                                                          |
| `TTL`       | Number  | Unix timestamp                            | `createdAt` + 72 hours; propagated to all child sessions |

#### Session (one per candidate per JD)

| Attribute       | Type   | Value                             | Notes                                                                     |
| --------------- | ------ | --------------------------------- | ------------------------------------------------------------------------- |
| `PK`            | String | `JD#{jdId}`                       | Same partition as parent JD — co-located                                  |
| `SK`            | String | `SESSION#{sessionId}`             | Sort key                                                                  |
| `GSI1PK`        | String | `JD#{jdId}`                       | Enables listing all sessions for a JD via GSI1                            |
| `GSI1SK`        | String | `SESSION#{createdAt}#{sessionId}` | Sort-by-date within a JD's sessions                                       |
| `sessionId`     | String | UUID                              |                                                                           |
| `jdId`          | String | UUID                              | Denormalized for convenience                                              |
| `candidateName` | String | Recruiter-entered label           |                                                                           |
| `status`        | String | Enum                              | `PLAN_PENDING` \| `PLAN_APPROVED` \| `SCORED` \| `ASSESSED` \| `COMPLETE` |
| `plan`          | Map?   | Structured interview plan         | Written after Checkpoint 1 approval                                       |
| `scorecard`     | Map?   | Structured ratings + notes        | Written after scorecard submission                                        |
| `assessment`    | Map?   | Final assessment + recommendation | Written after Checkpoint 2 approval                                       |
| `createdAt`     | String | ISO 8601 timestamp                |                                                                           |
| `TTL`           | Number | Unix timestamp                    | Copied from parent JD's TTL at session creation                           |

### Access Patterns

| Access Pattern                                       | Key Expression                                            | Index |
| ---------------------------------------------------- | --------------------------------------------------------- | ----- |
| List all JDs (sorted by date desc)                   | `GSI1PK = "JDS"`, sort on `GSI1SK` desc                   | GSI1  |
| Get a single JD                                      | `PK = "JD#{jdId}"`, `SK = "METADATA"`                     | Table |
| List all sessions for a JD (sorted by date)          | `GSI1PK = "JD#{jdId}"`, `GSI1SK` begins_with `"SESSION#"` | GSI1  |
| Get a single session                                 | `PK = "JD#{jdId}"`, `SK = "SESSION#{sessionId}"`          | Table |
| Write / update session (plan, scorecard, assessment) | `PK = "JD#{jdId}"`, `SK = "SESSION#{sessionId}"`          | Table |

### Entity Relationship

```mermaid
erDiagram
    JD {
        string jdId PK
        string title
        string rawText
        string s3Key
        string createdAt
        number TTL
    }
    SESSION {
        string sessionId PK
        string jdId FK
        string candidateName
        string status
        object plan
        object scorecard
        object assessment
        string createdAt
        number TTL
    }
    JD ||--o{ SESSION : "has many"
```

---

## API Design

### API Architecture

The `apps/api` workspace is organized into three cohesive layers enforcing Single Responsibility Principle (SRP) and Don't Repeat Yourself (DRY) across all Lambda handlers. Each layer has a well-defined contract with the layers adjacent to it; no layer reaches past its immediate neighbor.

```
API Gateway
    │
    ▼
┌─────────────────────────────────────────────────────┐
│  Handlers  (src/handlers/)                          │
│  • Parse and validate the API Gateway event         │
│  • Delegate to one or more Services                 │
│  • Format and return the API Gateway response       │
│  • No business logic; no direct DynamoDB calls      │
└─────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────┐
│  Services  (src/services/)                          │
│  • Encapsulate all business logic for one domain    │
│  • Orchestrate cross-entity operations              │
│  • Call Repositories for persistence; call AWS      │
│    SDK clients for Bedrock AgentCore / S3 directly            │
│  • No knowledge of HTTP or API Gateway shapes       │
└─────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────┐
│  Repositories  (src/repositories/)                  │
│  • Encapsulate all DynamoDB operations for one      │
│    entity (get, put, update, query, delete)         │
│  • Return typed domain objects; no raw DynamoDB     │
│    AttributeValue shapes leak above this layer      │
│  • No business logic; no AWS SDK clients other      │
│    than DynamoDB DocumentClient                     │
└─────────────────────────────────────────────────────┘
```

#### Layer Responsibilities

**Handlers** (`src/handlers/`) are the Lambda entry points. Each handler is co-located in a domain subfolder (e.g., `src/handlers/job-description/`), validates the incoming event payload using a Zod schema, calls the appropriate Service method(s), and returns a structured API Gateway proxy response. Handlers contain no business logic and make no direct DynamoDB or AWS SDK calls.

**Services** (`src/services/`) contain all domain business logic. Each service is scoped to a single domain entity or workflow (e.g., `job-description-service.ts`, `session-service.ts`, `plan-service.ts`). Services orchestrate Repository calls for persistence and call AWS SDK clients directly for Bedrock Agent invocations and S3 operations. Services are ignorant of HTTP — they accept typed inputs and return typed outputs.

**Repositories** (`src/repositories/`) provide entity-scoped DynamoDB CRUD operations. Each repository wraps the DynamoDB `DocumentClient` and exposes typed methods (e.g., `JobDescriptionRepository.findById()`, `SessionRepository.updatePlan()`). All DynamoDB key construction, expression building, and `AttributeValue` marshalling is confined to this layer. No raw DynamoDB types leak above the repository boundary.

#### Shared Utilities (`src/utils/`)

Cross-cutting concerns that are not domain-specific live in `src/utils/`:

- `logger.ts` — structured JSON logger factory (`createLogger(lambdaName)`)
- `error-handler.ts` — `withErrorHandler` HOF wrapping handlers in standardized try/catch; `AppError` subclass hierarchy (400 / 404 / 422 / 500)
- `response.ts` — API Gateway response builder (success and error shapes)
- `aws-clients.ts` — singleton AWS SDK v3 client instances (DynamoDB, S3, BedrockAgentCore)

---

### API Endpoints

All routes are exposed through a single API Gateway REST API. Lambda integrations use proxy integration. CORS is enabled for `*` origin (no auth at portfolio scope).

#### Job Description Routes

| Method | Route             | Handler                                                     | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------ | ----------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST` | `/jds`            | `src/handlers/job-description/create-jd-handler.ts`         | Creates a new JD record from pasted text or an S3-staged file upload. Extracts text via `unpdf` for PDF uploads. Writes JD to DynamoDB with 72-hour TTL.                                                                                                                                                                                                                                                                 |
| `GET`  | `/jds`            | `src/handlers/job-description/list-jds-handler.ts`          | Returns all JD records sorted by `createdAt` descending (GSI1 query on `GSI1PK = "JDS"`).                                                                                                                                                                                                                                                                                                                                |
| `GET`  | `/jds/{jdId}`     | `src/handlers/job-description/get-jd-handler.ts`            | Returns a single JD record by ID. Returns 404 if not found.                                                                                                                                                                                                                                                                                                                                                              |
| `POST` | `/jds/upload-url` | `src/handlers/job-description/create-upload-url-handler.ts` | Generates a pre-assigned `jdId` (UUID), constructs an S3 key (`uploads/{jdId}/{filename}`), and returns a pre-signed S3 PUT URL along with the `jdId` and `s3Key`. The client uses the pre-signed URL to upload the file directly to S3, then passes `jdId` and `s3Key` to `POST /jds` to complete JD creation. API Gateway resolves `upload-url` as a static segment before `{jdId}`, so there is no routing ambiguity. |

#### Session Routes

| Method | Route                              | Handler                                          | Purpose                                                                                                                                                       |
| ------ | ---------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/jds/{jdId}/sessions`             | `src/handlers/session/create-session-handler.ts` | Creates a new candidate session under a JD. Reads the parent JD's TTL and stamps it onto the new session record. Returns 404 if the parent JD does not exist. |
| `GET`  | `/jds/{jdId}/sessions`             | `src/handlers/session/list-sessions-handler.ts`  | Returns all sessions for a JD sorted by `createdAt` ascending (GSI1 query).                                                                                   |
| `GET`  | `/jds/{jdId}/sessions/{sessionId}` | `src/handlers/session/get-session-handler.ts`    | Returns a single session record including any attached plan, scorecard, and assessment. Returns 404 if not found.                                             |

#### Plan Routes

| Method | Route                                           | Handler                                      | Purpose                                                                                                                                                                                                                |
| ------ | ----------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/jds/{jdId}/sessions/{sessionId}/plan`         | `src/handlers/plan/generate-plan-handler.ts` | Invokes the AgentCore Plan Generation harness for the given session. The agent reads the JD, generates a structured interview plan, and writes it to the session record in DynamoDB. Returns the completed plan.       |
| `PUT`  | `/jds/{jdId}/sessions/{sessionId}/plan/approve` | `src/handlers/plan/approve-plan-handler.ts`  | Accepts an optional recruiter-modified plan payload. Validates against `InterviewPlanSchema`, writes the final plan to DynamoDB, and transitions session `status` to `PLAN_APPROVED`. Returns 409 if already approved. |

#### Scorecard Routes

| Method | Route                                        | Handler                                              | Purpose                                                                                                                                                                                       |
| ------ | -------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/jds/{jdId}/sessions/{sessionId}/scorecard` | `src/handlers/scorecard/submit-scorecard-handler.ts` | Accepts and validates a structured scorecard (per-question Likert ratings + per-competency free-text notes). Writes the scorecard to the session record and transitions `status` to `SCORED`. |

#### Assessment Routes

| Method | Route                                                 | Handler                                                  | Purpose                                                                                                                                                                                                                                                                       |
| ------ | ----------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/jds/{jdId}/sessions/{sessionId}/assessment`         | `src/handlers/assessment/generate-assessment-handler.ts` | Invokes the AgentCore Reconciliation harness for the given session. The agent reads the plan and scorecard, reconciles structured ratings with free-text notes, and writes a final assessment with hire/no-hire recommendation to DynamoDB. Returns the completed assessment. |
| `PUT`  | `/jds/{jdId}/sessions/{sessionId}/assessment/approve` | `src/handlers/assessment/approve-assessment-handler.ts`  | Accepts recruiter approval of the final assessment, with an optional override flag and required override reason. Transitions session `status` to `COMPLETE`. Returns 409 if already complete.                                                                                 |

#### AgentCore Gateway Tool Routes

These Lambda functions are invoked by AgentCore gateways (one gateway per agent) as Lambda targets — not via API Gateway. They receive the tool arguments as a flat event object, return plain JSON (or `{ error, message }` on failure), and are not publicly accessible.

| Invoker               | Handler                                                         | Purpose                                                                                                      |
| --------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Plan Generation Agent | `src/handlers/agent-actions/read-jd-action-handler.ts`          | Reads JD `rawText` and `title` from DynamoDB for the agent's plan generation context.                        |
| Plan Generation Agent | `src/handlers/agent-actions/write-plan-action-handler.ts`       | Validates and writes the agent-generated interview plan to the session record; sets `status = PLAN_PENDING`. |
| Reconciliation Agent  | `src/handlers/agent-actions/read-plan-action-handler.ts`        | Reads the approved interview plan from the session record for reconciliation context.                        |
| Reconciliation Agent  | `src/handlers/agent-actions/read-scorecard-action-handler.ts`   | Reads the submitted scorecard from the session record for reconciliation context.                            |
| Reconciliation Agent  | `src/handlers/agent-actions/write-assessment-action-handler.ts` | Validates and writes the agent-generated assessment to the session record; sets `status = ASSESSED`.         |

---

## Estimated Costs

> All estimates assume **portfolio demo usage**: 10–20 full workflow executions per month (end-to-end: JD ingestion → plan generation → scorecard → assessment). Rates are US East (N. Virginia), on-demand pricing as of October 2026. Items marked _(assumption)_ could not be confirmed against a published price and should be re-checked on the [AWS AgentCore pricing](https://aws.amazon.com/bedrock/agentcore/pricing/) and [Amazon Bedrock pricing](https://aws.amazon.com/bedrock/pricing/) pages.

### Token Cost Model

A single full workflow execution runs two AgentCore harness invocations (plan, then assessment). Each harness runs a ReAct loop with multiple internal model calls and passes the full context on every call. A realistic estimate per execution:

| Phase                                       | Est. Input Tokens | Est. Output Tokens | Notes                                                                                               |
| ------------------------------------------- | ----------------- | ------------------ | --------------------------------------------------------------------------------------------------- |
| Plan Generation (agent loop, ~3 tool calls) | ~6,000            | ~2,000             | JD text + system prompt + gateway tool schemas + tool results as context; structured plan as output |
| Reconciliation (agent loop, ~3 tool calls)  | ~8,000            | ~1,500             | Plan + scorecard + notes as context; assessment + recommendation as output                          |
| **Per execution total**                     | **~14,000**       | **~3,500**         |                                                                                                     |

Both harnesses use **Claude Haiku 4.5** through the `us.` cross-region inference profile. Anthropic's first-party rate is $1.00 / $5.00 per 1M input/output tokens; Bedrock geo cross-region profiles carry a ~10% premium over global routing, so this document budgets **$1.10 / $5.50** _(assumption — derived from the premium pattern on other Claude models, not a confirmed Haiku 4.5 figure)_:

| Volume              | Input Cost | Output Cost | Total            |
| ------------------- | ---------- | ----------- | ---------------- |
| 1 execution         | $0.015     | $0.019      | **~$0.035**      |
| 10 executions/month | $0.15      | $0.19       | **~$0.35/month** |
| 20 executions/month | $0.31      | $0.39       | **~$0.69/month** |

> **Important:** AgentCore harnesses act as cost multipliers — each user-initiated action may trigger multiple internal model calls, and every call is billed. The estimates above assume approximately 3 tool calls per harness invocation with full context passed on each. Real costs may run 20–30% higher depending on system prompt verbosity and plan length. Token usage is the dominant cost driver; AgentCore's own charges are small (below).

### AgentCore Charges

| Component                     | Billing basis                                                                                                                                                                                                                                                | Estimated cost                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| **Gateway**                   | $0.005 per 1,000 API calls (`ListTools`, `InvokeTool`, `Ping`); no free tier. ~5 tool calls per execution                                                                                                                                                    | < $0.01/month                                      |
| **Gateway search / indexing** | $0.025 per 1,000 searches; $0.02 per 100 tools indexed per month — not used (semantic search is off)                                                                                                                                                         | $0.00                                              |
| **Harness compute**           | The AWS pricing page lists no separate Harness charge; the harness is assumed to bill as Runtime compute ($0.0895 per vCPU-hour + $0.00945 per GB-hour, per second of actual consumption) _(assumption)_. Upper bound: 1 vCPU + 2 GB for 60 s per invocation | ≤ ~$0.004 per execution (≤ $0.08 at 20 executions) |
| **Memory**                    | Disabled on both harnesses (the agents are stateless; results are persisted by the write tools)                                                                                                                                                              | $0.00                                              |
| **Identity**                  | No charge when used through a Gateway                                                                                                                                                                                                                        | $0.00                                              |
| **Observability**             | Spans and logs at CloudWatch rates (~$0.35/GB spans, ~$0.50/GB logs); no free tier                                                                                                                                                                           | < $0.05/month at demo volume _(allowance)_         |

### Supporting AWS Services

| Service                  | Usage                                                                                                                              | Estimated Monthly Cost |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **DynamoDB** (on-demand) | ~20 writes + ~60 reads per execution × 20 executions                                                                               | < $0.01                |
| **S3**                   | ~20 JD file uploads × ~50KB avg; 72hr lifecycle auto-delete                                                                        | < $0.01                |
| **Lambda**               | ~10 invocations per execution (API, worker and gateway tool Lambdas) × 20 executions = 200/month; well within free tier (1M/month) | $0.00                  |
| **API Gateway**          | ~200 requests/month; well within free tier (1M/month, first 12 months)                                                             | $0.00                  |
| **CloudWatch Logs**      | Low-volume demo logging (Lambda and AgentCore log groups; Lambda groups retain 1 week)                                             | < $0.01                |

### Total Estimated Monthly Cost

| Scenario                     | Bedrock (LLM) | AgentCore (Gateway + harness + observability) | Other AWS | **Total**        |
| ---------------------------- | ------------- | --------------------------------------------- | --------- | ---------------- |
| Light use (10 executions)    | ~$0.35        | ~$0.08                                        | ~$0.02    | **~$0.45/month** |
| Active demo (20 executions)  | ~$0.69        | ~$0.14                                        | ~$0.02    | **~$0.85/month** |
| Stress test (100 executions) | ~$3.47        | ~$0.60                                        | ~$0.10    | **~$4.20/month** |

**Bottom line:** At portfolio demo volumes this project runs for roughly **$0.50–1/month**. The dominant cost is still LLM token usage via Bedrock; AgentCore adds a small, usage-based overhead. Nothing in the stack is provisioned, so there is no idle cost between demos, and tearing the stacks down removes the Gateways and Harnesses entirely.

### Cost Guardrails

- **Bounded agent loops:** each harness is configured with `maxIterations: 10`, `maxTokens: 8192` per iteration and `timeoutSeconds: 240`, which caps the worst-case spend of a runaway loop. The 240 s timeout sits below the 300 s worker Lambda timeout so the harness fails first and the worker records the error.
- **No retries on workers:** the worker Lambdas run with `retryAttempts: 0`, so a failed generation is never silently re-billed; the recruiter retries explicitly.
- **Token monitoring:** `harness-client` logs the token usage reported by each harness invocation, so real spend can be compared against the estimates above.
- **Memory off:** enabling AgentCore Memory would add per-event and storage charges with no benefit here.
- **Watch the tool schemas:** Gateway tool schemas are sent to the model as context on every call; keep tool descriptions concise.

> **Cost optimization levers available if needed:**
>
> - Both agents already run on the cheapest generally suitable model in the Claude 4.x line (Haiku 4.5). Newer Haiku generations (e.g. Claude Haiku 5.5) are listed at lower per-token rates, but the migration is intentionally out of scope for this project's AgentCore move.
> - Use the global (rather than `us.` geo) inference profile to drop the ~10% geo premium, if data-residency constraints allow
> - Prompt caching on the system prompt and tool schemas — only if the harness exposes it _(not verified)_
> - Batch inference (50% discount) — not applicable here since executions are interactive and synchronous

---

## Constraints

- **Time:** 3–4 weeks solo effort
- **Budget:** under ~$1/month at demo volumes; acceptable for portfolio use
- **Team:** Solo
- **Existing Systems:** Monorepo structure per `technology-guidelines.md`; no auth system (session-based, consistent with prior portfolio projects); 72-hour TTL on all session data; no TTL extension mechanism

---

## Risks & Mitigations

| Risk                                                                                                                                   | Likelihood | Impact | Mitigation                                                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AgentCore HITL state management adds unexpected implementation complexity                                                              | Medium     | Medium | Timebox agent integration to M1; if Bedrock Agents proves too opaque for HITL checkpoint state, fall back to custom Lambda ReAct loop with explicit state machine |
| Reconciliation inference quality is poor (agent fails to meaningfully distinguish agreements from conflicts between ratings and notes) | Medium     | High   | Design system prompt with explicit conflict-detection instructions and few-shot examples; allocate a dedicated prompt iteration task in M2                        |
| Token amplification drives costs higher than estimated during active development and testing                                           | Low        | Low    | Add CloudWatch token usage logging from day one; cap `maxTokens` per agent invocation                                                                             |
| `unpdf` fails on edge-case JD PDFs (scanned, encrypted, or image-only)                                                                 | Low        | Low    | Validate during M1; document as a known limitation; advise paste fallback in UI error messaging                                                                   |
| Sessions created late in a JD's TTL window expire before a recruiter completes the full workflow                                       | Low        | Low    | 72-hour window is generous for the expected workflow duration; acceptable at portfolio scope                                                                      |

---

## Open Questions

None. All blocking questions resolved.

---

## Revision History

| Version | Date       | Changes                                                                                                                                                                                                                                                                                                             |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Draft 1 | 2026-06-01 | Initial brainstorming draft                                                                                                                                                                                                                                                                                         |
| Draft 2 | 2026-06-02 | Resolved all Draft 1 open questions; added DynamoDB data model, Estimated Costs section, GitHub Actions CI/CD definitions, `unpdf` and `pdfmake` decisions, multi-candidate JD → session navigation                                                                                                                 |
| 1.0     | 2026-06-02 | Finalized for planning; increased TTL from 24 to 72 hours; uniform TTL strategy formalized with trade-off table; TTL extension explicitly out of scope; JD list shows all available records with no status display; all open questions resolved                                                                     |
| 1.1     | 2026-06-03 | Added API Design section: Handler → Service → Repository layered architecture with SRP/DRY principles; full API endpoint table across all domains (JD, Session, Plan, Scorecard, Assessment); Bedrock Agent action group handlers documented separately as internal-only invocations                                |
| 1.2     | 2026-06-03 | Fixed upload-url endpoint: corrected sequencing flaw (jdId does not exist at upload time); route changed from `GET /jds/{jdId}/upload-url` to `POST /jds/upload-url`; handler renamed to `create-upload-url-handler.ts`; jdId is now pre-assigned by the upload-url handler and passed by the client to `POST /jds` |
| 1.3     | 2026-10-12 | Migrated from Bedrock Agents (Classic) to Bedrock AgentCore: one harness and one gateway per agent; tool Lambdas now use the gateway Lambda target contract; model reference corrected to Claude Haiku 4.5                                                                                                          |
