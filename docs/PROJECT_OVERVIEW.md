# Project Overview: interview-forge

**Version:** Draft 2  
**Date:** 2026-06-02  
**Project Type:** Portfolio  
**Status:** In Elaboration

---

## Executive Summary

`interview-forge` is a human-in-the-loop AI agent that transforms a job description into a structured, recruiter-reviewed interview plan — and then closes the loop by reconciling post-interview scorecards with free-text recruiter notes to produce a final candidate assessment. The agent handles the heavy lifting (question generation, competency mapping, scoring reconciliation) while the human recruiter retains approval authority at two explicit checkpoints: plan review before the interview, and assessment review after. The system supports multiple candidates per job description, enabling a recruiter to maintain a durable JD and run independent interview sessions for each candidate against a consistent evaluation framework. This project demonstrates the commercially dominant agentic pattern — AI that accelerates and augments human decision-making without removing human accountability from high-stakes hiring decisions.

---

## Goals

- **Primary Goal:** Demonstrate production-grade human-in-the-loop agent architecture using AWS Bedrock Agents, including explicit approval checkpoints, tool use, and structured output generation.
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
- JD list view: browse and reuse existing job descriptions across multiple candidate sessions
- AI agent generation of a structured interview plan: competency areas, suggested questions per competency, evaluation criteria
- Recruiter review and edit UI: accept, modify, or regenerate sections of the plan before the interview (**Checkpoint 1**)
- Candidate session management: one interview session per candidate per JD, each with its own plan, scorecard, and assessment
- Post-interview scorecard: per-question structured ratings (Likert scale) plus free-text notes per competency area
- Agent reconciliation: synthesize ratings and free-text notes into a final candidate assessment with hire/no-hire recommendation and supporting reasoning
- Recruiter review and approval of final assessment before it is persisted (**Checkpoint 2**)
- Client-side PDF export of the final assessment report using `pdfmake` (runs in React, no Lambda)
- DynamoDB persistence of all sessions with 24-hour TTL auto-expiry
- Three GitHub Actions workflows: CI (format check, lint, build, unit tests, CDK synth), Deploy (manual, provisions and deploys all infrastructure), Teardown (manual, destroys all infrastructure)

### Out of Scope

- Calendar integration or interview scheduling
- Multi-user / team collaboration (single recruiter session only)
- Support for Word (.docx) document upload
- Candidate-facing interfaces or communication
- ATS (Applicant Tracking System) integration
- Authentication / user accounts (no login — consistent with prior portfolio projects)
- Multi-language support
- Assessment export to formats other than PDF (no JSON export)

---

## Target Audience _(Portfolio)_

| Audience                                     | Signal Being Demonstrated                                                                                       |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Enterprise HR / talent platform clients      | Ability to design agentic AI workflows within legally defensible human-in-the-loop guardrails                   |
| Technical recruiters evaluating AI engineers | Mastery of Bedrock Agents tool use, approval flows, and structured output generation                            |
| AWS-focused engineering teams                | AWS-native agent architecture: Bedrock Agents, Lambda, DynamoDB, CDK, API Gateway                               |
| Solution design / pre-sales context          | Translating a complex multi-step business process (structured interviewing) into a feasible AI-augmented system |

---

## Technology Stack

| Layer               | Technology / Service                             | Rationale                                                                                                     |
| ------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Frontend            | React 19, Vite, TailwindCSS, shadcn/ui           | Consistent with monorepo portfolio standard; supports drag-and-drop upload and multi-step workflow UI         |
| PDF Export          | `pdfmake` (client-side, React)                   | Bundles cleanly in the browser; no Lambda cold-start overhead; keeps export entirely client-side              |
| API                 | AWS Lambda (Node.js, ES Modules)                 | Serverless; consistent with portfolio pattern; cost-optimized at near-zero idle traffic                       |
| PDF Parsing         | `unpdf` (npm) bundled in Lambda                  | Synchronous; bundles and executes cleanly in Lambda ES module environment; confirmed working in `resume-lens` |
| Agent Orchestration | AWS Bedrock Agents                               | Native HITL support; built-in tool use and ReAct loop; session management; AWS-recommended managed agent tier |
| LLM                 | Claude Sonnet 4.6 via Bedrock                    | Best quality/cost balance for plan generation and reconciliation; $3/$15 per 1M tokens in/out                 |
| Data                | DynamoDB (single-table design)                   | Serverless, on-demand pricing, zero idle cost; supports one-to-many JD → session access patterns via GSI      |
| Storage             | S3                                               | JD file upload staging (PDF/TXT); lifecycle policy to auto-delete after 24 hours aligned to DynamoDB TTL      |
| Infrastructure      | AWS CDK (TypeScript)                             | IaC consistent with portfolio standard                                                                        |
| Monorepo            | npm workspaces (`web`, `api`, `shared`, `infra`) | Consistent with `technology-guidelines.md` constraints                                                        |
| Validation          | Zod (shared schemas)                             | Cross-boundary type safety; consistent with portfolio standard                                                |
| Testing             | Vitest (all workspaces)                          | Consistent with portfolio standard                                                                            |
| CI/CD               | GitHub Actions (3 workflows)                     | CI, Deploy, Teardown — see CI/CD section under Scope                                                          |

---

## Architecture Overview

The system is organized around two human approval checkpoints that explicitly gate agent progression. Between checkpoints, the Bedrock Agent autonomously executes tool calls to read context from DynamoDB, generate structured content, and write results back.

**Workflow:**

1. Recruiter submits a JD (paste or upload) → Lambda extracts text (via `unpdf` for PDF) → JD record stored in DynamoDB
2. Recruiter selects a JD and creates a new candidate session → agent invoked for plan generation
3. Agent calls tools to read the JD, generate competency areas and interview questions, and write the draft plan back to DynamoDB
4. **Checkpoint 1:** Recruiter reviews, edits, and approves the plan → plan locked in DynamoDB; interview proceeds offline
5. Recruiter returns, enters per-question Likert ratings and free-text notes per competency → scorecard stored in DynamoDB
6. Agent invoked for reconciliation: reads plan and scorecard, identifies agreements and conflicts between ratings and notes, generates final assessment with hire/no-hire recommendation and reasoning
7. **Checkpoint 2:** Recruiter reviews and approves (or overrides) the final assessment → assessment locked in DynamoDB
8. Recruiter downloads assessment as PDF (generated client-side via `pdfmake`)

### Architecture Diagram

```mermaid
flowchart TD
    subgraph Web["React Frontend (packages/web)"]
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

    subgraph Lambda["Lambda Functions (packages/api)"]
        L1[ingest-handler]
        L2[plan-handler]
        L3[approve-plan-handler]
        L4[score-handler]
        L5[assess-handler]
        L6[approve-assess-handler]
        L7[session-handler\nCRUD for JDs + Sessions]
    end

    subgraph Agent["AWS Bedrock Agents"]
        AG1[Plan Generation Agent\nReAct Tool Loop]
        AG2[Reconciliation Agent\nReAct Tool Loop]
    end

    subgraph Data["Data Layer"]
        DB[(DynamoDB\nSingle-Table\n24hr TTL)]
        S3[(S3\nJD File Uploads\n24hr Lifecycle)]
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

### Decision: Bedrock Agents vs. Custom ReAct Loop

| Option                       | Pros                                                                                                                                            | Cons                                                                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Bedrock Agents**           | Native HITL support; built-in session management and tool orchestration; AWS-managed ReAct loop; strong portfolio signal for managed agent tier | Less fine-grained loop control; per-token cost amplification across multiple internal calls; some opacity in internal orchestration               |
| **Custom Lambda ReAct Loop** | Full control over prompt, loop, and state; cheaper at low token volumes; re-uses pattern already implicit in `talent-finder`                    | Requires custom session state management for HITL approval; re-implements what Bedrock Agents provides natively; weaker portfolio differentiation |

**Decision:** Bedrock Agents  
**Rationale:** The primary portfolio signal is the human-in-the-loop agent pattern. Bedrock Agents provides this natively and is the AWS-recommended managed tier. A custom loop was already demonstrated implicitly in `talent-finder`; this project advances to the managed agent abstraction. Cost amplification is acceptable at portfolio demo volumes (see Estimated Costs section).

---

### Decision: PDF Parsing — `unpdf` vs. AWS Textract

| Option                | Pros                                                                                                              | Cons                                                                                                                    |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **`unpdf` in Lambda** | Synchronous; zero additional AWS cost; confirmed working in `resume-lens`; bundles cleanly as ES module in Lambda | May not handle scanned or image-only PDFs; limited layout fidelity for complex documents                                |
| **AWS Textract**      | Handles scanned and complex-layout PDFs; managed service; high fidelity                                           | Async job model adds latency and state management complexity; $0.0015/page adds cost; overkill for clean text-heavy JDs |

**Decision:** `unpdf` in Lambda  
**Rationale:** JDs are universally text-heavy, machine-generated PDFs. `unpdf` is proven in `resume-lens` and has zero incremental AWS cost. Textract's async complexity and per-page cost are not justified for this input type.

---

### Decision: Multi-Candidate per JD — Shared JD Record vs. JD Duplication

| Option                                        | Pros                                                                                                                                 | Cons                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| **Shared JD record, sessions as children**    | Single source of truth for JD; key design is more interesting and realistic; enables JD reuse across candidates without re-ingestion | Slightly more complex single-table key design; requires GSI for session list queries |
| **Flat sessions (JD duplicated per session)** | Simpler data model; no GSI needed                                                                                                    | Redundant storage; no JD reuse; weaker data model story for portfolio                |

**Decision:** Shared JD record with sessions as children  
**Rationale:** This is the more defensible production design, and the one-to-many relationship makes the DynamoDB key design demonstrably more interesting. The additional GSI is low cost on DynamoDB on-demand.

---

### Decision: PDF Assessment Export — Client-Side vs. Lambda

| Option                             | Pros                                                                                               | Cons                                                                                                     |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Client-side `pdfmake` in React** | Zero Lambda invocation cost; no cold-start latency; simpler architecture; no file storage required | PDF generation capability tied to browser environment; cannot be triggered server-side or via automation |
| **`pdfmake` in Lambda**            | Server-side generation enables future automation; consistent output regardless of client           | Additional Lambda complexity; cold-start for a rarely-called function; requires S3 staging for download  |

**Decision:** Client-side `pdfmake` in React  
**Rationale:** Assessment export is always recruiter-triggered in the UI. Server-side generation adds complexity with no practical benefit at portfolio scope.

---

## DynamoDB Data Model

### Design Principles

- Single-table design with composite keys (`PK` / `SK`)
- All items carry a `TTL` attribute (Unix timestamp, 24 hours from creation) for automatic expiry
- A single GSI (`GSI1`) enables the JD → sessions list access pattern without a full table scan

### Entity Definitions

#### JD (Job Description)

| Attribute   | Value                | Notes                                           |
| ----------- | -------------------- | ----------------------------------------------- |
| `PK`        | `JD#{jdId}`          | Partition key                                   |
| `SK`        | `METADATA`           | Sort key                                        |
| `GSI1PK`    | `JDS`                | Constant — enables listing all JDs              |
| `GSI1SK`    | `{createdAt}#{jdId}` | ISO timestamp prefix enables sort-by-date       |
| `jdId`      | UUID                 |                                                 |
| `title`     | string               | Recruiter-provided job title                    |
| `rawText`   | string               | Extracted JD text (from paste or unpdf)         |
| `s3Key`     | string?              | Present only for file uploads; used for cleanup |
| `createdAt` | ISO string           |                                                 |
| `TTL`       | Unix timestamp       | createdAt + 24 hours                            |

---

#### Session (one per candidate per JD)

| Attribute       | Value                             | Notes                                                                     |
| --------------- | --------------------------------- | ------------------------------------------------------------------------- |
| `PK`            | `JD#{jdId}`                       | Same partition as parent JD — co-located                                  |
| `SK`            | `SESSION#{sessionId}`             | Sort key                                                                  |
| `GSI1PK`        | `JD#{jdId}`                       | Enables listing sessions for a JD via GSI1                                |
| `GSI1SK`        | `SESSION#{createdAt}#{sessionId}` | Sort-by-date within a JD                                                  |
| `sessionId`     | UUID                              |                                                                           |
| `jdId`          | UUID                              | Denormalized for convenience                                              |
| `candidateName` | string                            | Recruiter-entered label                                                   |
| `status`        | enum                              | `PLAN_PENDING` \| `PLAN_APPROVED` \| `SCORED` \| `ASSESSED` \| `COMPLETE` |
| `plan`          | object?                           | Structured interview plan (set after Checkpoint 1 approval)               |
| `scorecard`     | object?                           | Structured ratings + notes (set after scorecard submission)               |
| `assessment`    | object?                           | Final assessment + recommendation (set after Checkpoint 2 approval)       |
| `createdAt`     | ISO string                        |                                                                           |
| `TTL`           | Unix timestamp                    | createdAt + 24 hours                                                      |

---

### Access Patterns

| Access Pattern                                     | Key Expression                                    | Index |
| -------------------------------------------------- | ------------------------------------------------- | ----- |
| List all JDs (sorted by date desc)                 | `GSI1PK = "JDS"`                                  | GSI1  |
| Get a single JD                                    | `PK = "JD#{jdId}", SK = "METADATA"`               | Table |
| List all sessions for a JD (sorted by date)        | `GSI1PK = "JD#{jdId}", SK begins_with "SESSION#"` | GSI1  |
| Get a single session                               | `PK = "JD#{jdId}", SK = "SESSION#{sessionId}"`    | Table |
| Write/update session (plan, scorecard, assessment) | `PK = "JD#{jdId}", SK = "SESSION#{sessionId}"`    | Table |

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

## Estimated Costs

> All estimates assume **portfolio demo usage**: 10–20 full workflow executions per month (end-to-end: JD ingestion → plan generation → scorecard → assessment). Rates are US East (N. Virginia), on-demand pricing as of June 2026.

### Token Cost Model

A single full workflow execution through Bedrock Agents involves multiple internal model calls (the ReAct loop). A realistic estimate per execution:

| Phase                                       | Est. Input Tokens | Est. Output Tokens | Notes                                                                                     |
| ------------------------------------------- | ----------------- | ------------------ | ----------------------------------------------------------------------------------------- |
| Plan Generation (agent loop, ~3 tool calls) | ~6,000            | ~2,000             | JD text + system prompt + tool schemas + tool results as input; structured plan as output |
| Reconciliation (agent loop, ~3 tool calls)  | ~8,000            | ~1,500             | Plan + scorecard + notes as input; assessment as output                                   |
| **Per execution total**                     | **~14,000**       | **~3,500**         |                                                                                           |

At Claude Sonnet 4.6 rates ($3.00 per 1M input tokens, $15.00 per 1M output tokens):

| Volume              | Input Cost | Output Cost | Total            |
| ------------------- | ---------- | ----------- | ---------------- |
| 1 execution         | $0.042     | $0.053      | **~$0.095**      |
| 10 executions/month | $0.42      | $0.53       | **~$0.95/month** |
| 20 executions/month | $0.84      | $1.05       | **~$1.89/month** |

> **Note:** Bedrock Agents act as cost multipliers — a single user query may trigger an agent to make five or more internal calls, and you pay for every step. The estimates above account for ~3 tool calls per agent invocation and include the full context window passed on each internal call. Real costs may be 20–30% higher depending on system prompt size and plan verbosity. Token amplification is the primary cost driver, not per-invocation fees — Bedrock Agents themselves do not charge a per-invocation fee.

---

### Supporting AWS Services

| Service                  | Usage                                                                                       | Estimated Monthly Cost |
| ------------------------ | ------------------------------------------------------------------------------------------- | ---------------------- |
| **DynamoDB** (on-demand) | ~20 writes + ~60 reads per execution × 20 executions                                        | < $0.01                |
| **S3**                   | ~20 JD file uploads × ~50KB avg; 24hr lifecycle auto-delete                                 | < $0.01                |
| **Lambda**               | ~10 invocations per execution × 20 executions = 200/month; well within free tier (1M/month) | $0.00                  |
| **API Gateway**          | ~200 requests/month; well within free tier (1M/month first 12 months)                       | $0.00                  |
| **CloudWatch Logs**      | Low-volume demo logging                                                                     | < $0.01                |

---

### Total Estimated Monthly Cost (Portfolio Demo)

| Scenario                     | Bedrock (LLM) | AWS Infrastructure | **Total**        |
| ---------------------------- | ------------- | ------------------ | ---------------- |
| Light use (10 executions)    | ~$0.95        | ~$0.02             | **~$1.00/month** |
| Active demo (20 executions)  | ~$1.89        | ~$0.02             | **~$2.00/month** |
| Stress test (100 executions) | ~$9.50        | ~$0.10             | **~$9.60/month** |

**Bottom line:** At portfolio demo volumes, this project runs for approximately **$1–2/month**. The dominant cost is LLM token usage via Bedrock Agents. All other AWS services are effectively free at this scale.

> **Cost optimization levers available if needed:**
>
> - Switch plan generation to Claude Haiku 4.5 ($1/$5 per 1M tokens) — reduces LLM cost by ~67% at the expense of output quality
> - Enable prompt caching on the system prompt (5-min TTL) — up to 90% reduction on cached input tokens for repeated executions within the TTL window
> - Batch API (50% discount) — not applicable here since executions are interactive/synchronous

---

## Constraints

- **Time:** 3–4 weeks solo effort
- **Budget:** ~$1–2/month at demo volumes; acceptable for portfolio use
- **Team:** Solo
- **Existing Systems:** Monorepo structure per `technology-guidelines.md`; no auth system (session-based, consistent with prior projects); 24-hour TTL on all session data

---

## Risks & Mitigations

| Risk                                                                                                | Likelihood | Impact | Mitigation                                                                                                                |
| --------------------------------------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| Bedrock Agents session management complexity adds unexpected scope                                  | Medium     | Medium | Timebox agent integration to M1; fall back to custom Lambda ReAct loop if Bedrock Agents proves too opaque for HITL state |
| Reconciliation inference quality is poor (agent fails to meaningfully synthesize ratings vs. notes) | Medium     | High   | Design prompt with explicit conflict-detection instructions and few-shot examples; add a prompt iteration task to M2      |
| Token amplification drives costs higher than estimated during development/testing                   | Low        | Low    | Add CloudWatch token usage logging from day one; cap `maxTokens` per agent invocation                                     |
| `unpdf` fails on edge-case JD PDFs (e.g., scanned, encrypted)                                       | Low        | Low    | Validate during M1; document as known limitation; advise paste fallback                                                   |
| 24-hour TTL creates poor demo UX if sessions expire during extended review                          | Low        | Medium | Surface TTL expiry time in UI; make TTL configurable via CDK environment variable                                         |

---

## Open Questions

- [ ] Should the recruiter be able to extend or reset the 24-hour TTL on a JD/session, or is auto-expiry fixed?
- [ ] Should the JD list show only active (non-expired) JDs, or should expired JDs remain visible with a "Completed" / "Expired" status before DynamoDB removes them?

---

## Revision History

| Version | Date       | Changes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Draft 1 | 2026-06-01 | Initial brainstorming draft                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Draft 2 | 2026-06-02 | Resolved all open questions from Draft 1; added: DynamoDB single-table data model with GSI design and ER diagram; Estimated Costs section with per-execution token model and monthly totals; GitHub Actions CI/CD workflow definitions; `unpdf` confirmed for PDF parsing; `pdfmake` confirmed client-side in React; full multi-candidate JD → session navigation in scope; 24-hour DynamoDB TTL confirmed; Architecture diagram updated to reflect JD list and session management flows |
