# Implementation Plan: interview-forge

**Version:** 0.1  
**Date:** 2026-06-02  
**Source Document:** Project Overview v1.0  
**Status:** Draft

---

## Milestone Summary

| #   | Milestone                         | Description                                                                                                                     | Issues | Depends On |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| M1  | Foundation & CI/CD                | Deploy/Teardown workflows, DynamoDB table, S3 bucket, API Gateway, base Lambda wiring, shared Zod schemas                       | 6      | —          |
| M2  | JD Ingestion & Session Management | JD ingest Lambda (paste + PDF), JD list UI, session creation, CRUD Lambda, session list UI                                      | 7      | M1         |
| M3  | Plan Generation Agent             | Bedrock Agent (plan), action group Lambdas, plan-handler Lambda, plan review/edit UI (Checkpoint 1), approve-plan Lambda        | 8      | M2         |
| M4  | Scorecard                         | Scorecard schema, score-handler Lambda, scorecard entry UI                                                                      | 4      | M3         |
| M5  | Reconciliation Agent & Assessment | Bedrock Agent (assess), action group Lambdas, assess-handler Lambda, assessment review UI (Checkpoint 2), approve-assess Lambda | 7      | M4         |
| M6  | PDF Export & Polish               | Client-side pdfmake export, UI polish, error state handling, README + demo walkthrough                                          | 5      | M5         |

---

## Milestone M1: Foundation & CI/CD

**Goal:** All infrastructure is provisioned and deployable via CDK; CI is extended with Deploy and Teardown workflows; DynamoDB single-table design, S3 bucket, API Gateway REST API, and Lambda execution role are live and validated. No business logic yet — only the structural skeleton that every subsequent milestone builds on.

**Deliverables:**

- Two new GitHub Actions workflows: Deploy (manual) and Teardown (manual)
- CDK stack deploying: DynamoDB table with GSI1 + TTL, S3 bucket with 72hr lifecycle, API Gateway REST API skeleton, shared Lambda execution IAM role, CloudWatch log groups
- Shared Zod schemas for JD and Session entities in `packages/shared`
- CDK synth passing in CI; Deploy workflow executes successfully against a dev AWS account

---

### Issue M1-01: Implement GitHub Actions Deploy Workflow

**Description:**  
Create a manually triggered GitHub Actions workflow (`deploy.yml`) that installs dependencies, runs CDK bootstrap if needed, and executes `cdk deploy --all` against the target AWS account. The workflow must accept an `environment` input (defaulting to `dev`) and use repository-level secrets for AWS credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`). Follow the same job structure as the existing CI workflow for consistency.

**Acceptance Criteria:**

- AC-01: Workflow is triggered via `workflow_dispatch` with an optional `environment` input defaulting to `dev`
- AC-02: Workflow installs Node.js dependencies at root, then runs `npm run cdk deploy --all -w packages/infra` with `--require-approval never`
- AC-03: AWS credentials are injected from repository secrets; no credentials are hardcoded
- AC-04: Workflow fails fast and surfaces CDK error output clearly if deploy fails
- AC-05: Successful run completes without manual approval gates (fully automated given manual trigger)

**Effort:** S  
**Notes:** AWS credentials must be configured as GitHub repository secrets before first run. Document this prerequisite in the workflow file header comment.

---

### Issue M1-02: Implement GitHub Actions Teardown Workflow

**Description:**  
Create a manually triggered GitHub Actions workflow (`teardown.yml`) that executes `cdk destroy --all` to remove all provisioned infrastructure. Include a confirmation input (`confirm: "yes"`) to prevent accidental destruction. Mirror the credential and dependency setup from the Deploy workflow.

**Acceptance Criteria:**

- AC-01: Workflow is triggered via `workflow_dispatch` with a required `confirm` string input; workflow exits with a non-zero code and clear message if input is not `"yes"`
- AC-02: Workflow runs `npm run cdk destroy --all --force -w packages/infra` when confirmation passes
- AC-03: AWS credentials are injected from repository secrets, consistent with M1-01
- AC-04: Workflow outputs a confirmation summary (stack names destroyed) on success

**Effort:** S  
**Notes:** Depends on M1-01 for credential pattern. The `--force` flag bypasses CDK's interactive destroy prompt, which is required for non-interactive CI execution.

---

### Issue M1-03: Define DynamoDB Single-Table CDK Construct

**Description:**  
Implement the DynamoDB table CDK construct in `packages/infra/src/stacks/` using the single-table design specified in the Project Overview. The table requires a composite primary key (`PK` / `SK`), one GSI (`GSI1` with `GSI1PK` / `GSI1SK`), TTL attribute configuration (`TTL`), and on-demand billing mode. Every resource must carry the required organizational tags: `App`, `Env`, `OU`, `Owner`.

**Acceptance Criteria:**

- AC-01: Table is defined with `PK` (String, partition key) and `SK` (String, sort key)
- AC-02: GSI1 is defined with `GSI1PK` (partition) and `GSI1SK` (sort), projection type `ALL`
- AC-03: TTL is enabled on the `TTL` attribute
- AC-04: Billing mode is `PAY_PER_REQUEST` (on-demand)
- AC-05: Table resource carries all four required tags: `App`, `Env`, `OU`, `Owner`
- AC-06: Table name is configurable via CDK context or environment variable, not hardcoded
- AC-07: `cdk synth` produces valid CloudFormation with no warnings on the table resource

**Effort:** S  
**Notes:** Table name and tag values should be driven by the `CDK_` prefixed env vars validated via Zod in `packages/infra/src/utils/` per the technology guidelines.

---

### Issue M1-04: Define S3 Bucket and API Gateway CDK Constructs

**Description:**  
Implement the S3 bucket CDK construct for JD file upload staging and the API Gateway REST API skeleton. The S3 bucket requires a 72-hour lifecycle expiration rule aligned to the DynamoDB TTL strategy. The API Gateway construct should define the REST API resource with CORS enabled and placeholder routes that Lambda integrations will be wired into by subsequent milestones. Define the shared Lambda execution IAM role with least-privilege baseline permissions (CloudWatch Logs, DynamoDB read/write on the table, S3 read/write on the bucket, Bedrock InvokeModel).

**Acceptance Criteria:**

- AC-01: S3 bucket has a lifecycle rule expiring objects after 72 hours
- AC-02: S3 bucket blocks all public access
- AC-03: API Gateway REST API is defined with CORS configured for `*` origin (portfolio scope; no auth)
- AC-04: Shared Lambda execution IAM role is defined with permissions scoped to the DynamoDB table ARN, S3 bucket ARN, CloudWatch Logs, and Bedrock `InvokeModel` on `*` (Bedrock does not support resource-level ARN restrictions for InvokeModel)
- AC-05: All resources carry the four required organizational tags
- AC-06: `cdk synth` produces valid CloudFormation for all resources in this issue

**Effort:** M  
**Notes:** CORS `*` is acceptable for a no-auth portfolio project. API Gateway routes are stubs at this stage — they will be wired to Lambda integrations in M2 and beyond.

---

### Issue M1-05: Define Shared Zod Schemas for JD and Session Entities

**Description:**  
Implement the canonical Zod schemas for the `JD` and `Session` entities in `packages/shared/src/schemas/`. These schemas are the single source of truth consumed symmetrically by Lambda handlers (input validation) and the React frontend (form validation and type inference). Derive TypeScript types from the schemas using `z.infer`. Include the `status` enum for session lifecycle states.

**Acceptance Criteria:**

- AC-01: `JdSchema` validates all JD entity attributes defined in the Project Overview data model; optional fields (`s3Key`) are correctly typed as optional
- AC-02: `SessionSchema` validates all Session entity attributes; optional fields (`plan`, `scorecard`, `assessment`) are correctly typed as optional Maps
- AC-03: `SessionStatus` enum is defined as a Zod enum with values: `PLAN_PENDING`, `PLAN_APPROVED`, `SCORED`, `ASSESSED`, `COMPLETE`
- AC-04: TypeScript types `Jd`, `Session`, and `SessionStatus` are inferred from schemas using `z.infer` and exported
- AC-05: Schemas are importable from `@monorepo/shared` in both `packages/api` and `packages/web` without relative path imports
- AC-06: Unit tests cover valid payloads, missing required fields, and invalid enum values for both schemas

**Effort:** M  
**Notes:** No barrel files — import directly from the schema file path per the technology guidelines. The `plan`, `scorecard`, and `assessment` Map schemas will be stubs at this stage and deepened in M3–M5 as their structures are finalized.

---

### Issue M1-06: Implement CloudWatch Structured Logging Baseline

**Description:**  
Establish the structured logging pattern for all Lambda functions in `packages/api`. Create a shared logger utility in `packages/api/src/utils/logger.ts` that wraps `console.log` with structured JSON output (timestamp, level, lambdaName, correlationId, message, optional payload). All Lambda handlers must use this logger rather than raw `console.log`. Define CloudWatch Log Groups in CDK for each Lambda with a 7-day retention policy.

**Acceptance Criteria:**

- AC-01: Logger utility exports a `createLogger(lambdaName: string)` factory returning `info`, `warn`, and `error` methods
- AC-02: Every log line emits valid JSON with at minimum: `timestamp` (ISO 8601), `level`, `lambdaName`, `message`
- AC-03: `correlationId` is accepted as an optional parameter and included in all log lines when provided (sourced from API Gateway `requestId`)
- AC-04: CDK defines a CloudWatch Log Group per Lambda with 7-day retention and required resource tags
- AC-05: Unit tests validate logger JSON output structure for info, warn, and error levels

**Effort:** S  
**Notes:** This is a cross-cutting concern. Every Lambda handler added in M2–M5 must instantiate the logger via `createLogger`. Establish this pattern before any business logic Lambda is written.

---

## Milestone M2: JD Ingestion & Session Management

**Goal:** A recruiter can submit a job description (paste or upload), see it appear in the JD list, create a candidate session against any JD, and see sessions listed per JD. All state is persisted in DynamoDB. No agent involvement yet.

**Deliverables:**

- `ingest-handler` Lambda: accepts JD text or PDF/TXT file, extracts text, writes JD record to DynamoDB
- `session-handler` Lambda: CRUD operations for JDs and sessions (list JDs, get JD, create session, list sessions, get session)
- JD input page (paste + drag-and-drop upload)
- JD list page with session list per JD and "New Session" action
- All API routes wired in CDK

---

### Issue M2-01: Implement JD Ingest Lambda (`ingest-handler`)

**Description:**  
Implement the `ingest-handler` Lambda in `packages/api/src/handlers/ingest/`. This handler accepts two input modes via API Gateway: (1) raw JSON body with `title` and `rawText` (paste mode), and (2) multipart or pre-signed S3 URL flow for file uploads. For file uploads, the handler reads the file from S3 (uploaded directly by the frontend using a pre-signed PUT URL), extracts text via `unpdf` for PDFs or reads directly for TXT, then writes the JD record to DynamoDB with a 72-hour TTL. Generate `jdId` (UUID) and `createdAt` at write time.

**Acceptance Criteria:**

- AC-01: Handler validates the incoming event body using `JdInputSchema` (Zod); returns 400 with structured error if validation fails
- AC-02: Paste mode: accepts `{ title, rawText }` and writes a JD record directly to DynamoDB; no S3 involvement
- AC-03: File upload mode: accepts `{ title, s3Key }`, reads the file from S3, extracts text via `unpdf` for `.pdf` or reads raw for `.txt`, and writes the JD record with `s3Key` populated
- AC-04: `unpdf` extraction failure (scanned/encrypted PDF) returns a 422 with a user-readable message advising paste fallback
- AC-05: DynamoDB write sets `TTL` to `Math.floor(Date.now() / 1000) + (72 * 3600)`
- AC-06: Successful response returns `{ jdId, createdAt, ttl }` with HTTP 201
- AC-07: Handler uses the structured logger from M1-06 with `correlationId` from the API Gateway request context
- AC-08: Unit tests cover paste mode write, file upload mode (mocked S3 + `unpdf`), validation failure, and `unpdf` extraction failure

**Effort:** M  
**Notes:** Pre-signed S3 URL generation for direct browser → S3 upload should be a separate lightweight Lambda or part of `session-handler` (see M2-02). Do not generate pre-signed URLs inside `ingest-handler`; keep concerns separated.

---

### Issue M2-02: Implement Session & JD CRUD Lambda (`session-handler`)

**Description:**  
Implement the `session-handler` Lambda in `packages/api/src/handlers/session/` to handle all CRUD operations for JDs and sessions via path-based routing. Operations: list all JDs (GSI1 query), get single JD, create candidate session (write SESSION item with TTL copied from parent JD), list sessions for a JD (GSI1 query), get single session. Also expose a `GET /jds/{jdId}/upload-url` sub-route that generates a pre-signed S3 PUT URL for file uploads (used by the frontend before calling `ingest-handler`).

**Acceptance Criteria:**

- AC-01: `GET /jds` returns all JD records sorted by `createdAt` descending (GSI1 query on `GSI1PK = "JDS"`)
- AC-02: `GET /jds/{jdId}` returns a single JD record or 404 if not found
- AC-03: `POST /jds/{jdId}/sessions` creates a SESSION item; `TTL` is read from the parent JD record and copied to the new session; returns 404 if the parent JD does not exist
- AC-04: `GET /jds/{jdId}/sessions` returns all sessions for the JD sorted by `createdAt` ascending (GSI1 query)
- AC-05: `GET /jds/{jdId}/sessions/{sessionId}` returns a single session or 404
- AC-06: `POST /jds/{jdId}/upload-url` creates and returns a pre-signed S3 PUT URL valid for 5 minutes, with the `s3Key` value included in the response for use by the frontend
- AC-07: All DynamoDB operations use AWS SDK v3 (`@aws-sdk/client-dynamodb` + `@aws-sdk/util-dynamodb`); no full SDK import
- AC-08: Unit tests cover each operation with mocked DynamoDB client; 404 paths are explicitly tested

**Effort:** L  
**Notes:** Path-based routing within a single Lambda is acceptable here given the low traffic volume and coherence of the CRUD domain. If the handler grows beyond 5 operations, split into separate Lambda functions.

---

### Issue M2-03: Wire M2 Lambda Routes in CDK

**Description:**  
Add CDK Lambda function constructs and API Gateway integrations for `ingest-handler` and `session-handler` in `packages/infra`. Wire the routes defined in M2-01 and M2-02 to the API Gateway REST API skeleton from M1-04. Assign the shared Lambda execution role from M1-04. Pass required environment variables (`TABLE_NAME`, `BUCKET_NAME`) via CDK `environment` map.

**Acceptance Criteria:**

- AC-01: `ingest-handler` Lambda is defined with the shared execution role and environment variables for `TABLE_NAME` and `BUCKET_NAME`
- AC-02: `session-handler` Lambda is defined with the same role and environment variables
- AC-03: API Gateway routes `POST /jds`, `GET /jds`, `GET /jds/{jdId}`, `POST /jds/{jdId}/sessions`, `GET /jds/{jdId}/sessions`, `GET /jds/{jdId}/sessions/{sessionId}`, `POST /jds/{jdId}/upload-url` are wired to Lambda integrations with proxy integration enabled
- AC-04: `cdk synth` produces valid CloudFormation for all new resources
- AC-05: All Lambda and API Gateway resources carry the four required organizational tags

**Effort:** S  
**Notes:** Enable Lambda function URL or use API Gateway endpoint URL for local smoke testing during development.

---

### Issue M2-04: Implement JD Input Page (React)

**Description:**  
Implement the JD input page in `packages/web/src/pages/jd/create/`. The page provides two input modes selectable via tabs: (1) paste mode — a title field and a large textarea for raw JD text; (2) upload mode — a title field and a drag-and-drop file dropzone accepting `.pdf` and `.txt` files only. On submit, paste mode calls `POST /jds` directly; upload mode calls `GET /jds/{jdId}/upload-url`, uploads the file directly to S3 via the pre-signed URL, then calls `POST /jds` with the `s3Key`. On success, navigate to the JD list page.

**Acceptance Criteria:**

- AC-01: Page renders two tabs: "Paste Text" and "Upload File"; active tab state is managed locally
- AC-02: Paste mode: title (required, max 200 chars) and rawText (required, min 100 chars) are validated client-side via the shared `JdInputSchema` before submission
- AC-03: Upload mode: accepts only `.pdf` and `.txt` files; rejects other file types with a user-visible error message
- AC-04: Upload mode: shows upload progress indicator during S3 PUT; shows error state if S3 upload fails
- AC-05: Both modes show a loading state on the submit button during API calls and disable the button to prevent double-submission
- AC-06: On success, user is navigated to the JD list page (`/jds`)
- AC-07: On API error, a non-blocking toast or inline error message is shown with a retry affordance
- AC-08: Component tests cover tab switching, paste mode validation, file type rejection, and success navigation (mocked API calls)

**Effort:** M  
**Notes:** Use shadcn/ui `Tabs`, `Textarea`, `Input`, `Button` components. The file dropzone can use a wrapper around the HTML `<input type="file">` with drag-and-drop events — no additional library needed unless time permits `react-dropzone` integration.

---

### Issue M2-05: Implement JD List Page with Session List (React)

**Description:**  
Implement the JD list page in `packages/web/src/pages/jd/list/`. Display all JDs returned from `GET /jds` as a scrollable list of cards. Each card shows: JD title, created date, TTL expiry countdown, and a count of existing sessions. Selecting a JD expands or navigates to a session sub-view listing all sessions for that JD with status badges and a "New Session" button. "New Session" calls `POST /jds/{jdId}/sessions` with a recruiter-entered candidate name and navigates to the plan generation page (M3).

**Acceptance Criteria:**

- AC-01: JD list fetches from `GET /jds` using a TanStack Query `useQuery` hook; shows loading skeleton and error state
- AC-02: Each JD card displays: title, formatted `createdAt`, TTL expiry in human-readable format (e.g., "Expires in 47h"), session count
- AC-03: Clicking a JD card loads the session list for that JD via `GET /jds/{jdId}/sessions`; sessions display candidate name and `status` badge
- AC-04: "New Session" opens an inline dialog (shadcn/ui `Dialog`) prompting for candidate name (required); on confirm, calls `POST /jds/{jdId}/sessions` and navigates to the session plan page on success
- AC-05: Empty state is handled for both "no JDs" and "no sessions for this JD" with appropriate call-to-action messaging
- AC-06: Component tests cover JD list rendering, session list expansion, empty states, and "New Session" dialog (mocked API)

**Effort:** M  
**Notes:** TanStack Query cache should be invalidated for the session list after a successful "New Session" creation. Use `useInvalidateQuery` or `queryClient.invalidateQueries`.

---

### Issue M2-06: Add Shared API Client and TanStack Query Hooks for JD/Session Domain

**Description:**  
Implement the Axios instance and TanStack Query hooks for the JD and session domain in `packages/web/src/common/api/` (global Axios config) and `packages/web/src/pages/jd/hooks/`. Hooks needed: `useGetJds`, `useGetJd`, `useCreateSession`, `useGetSessions`, `useGetSession`, `useGetUploadUrl`. Each hook wraps the corresponding API route.

**Acceptance Criteria:**

- AC-01: A global Axios instance is defined in `packages/web/src/common/utils/axios.ts` with `baseURL` sourced from `import.meta.env.VITE_API_BASE_URL`
- AC-02: `useGetJds` and `useGetJd` are `useQuery` hooks; `useCreateSession` is a `useMutation` hook; all are co-located in `packages/web/src/pages/jd/hooks/`
- AC-03: All hooks use the shared Axios instance; no inline `fetch` calls in page components
- AC-04: `useCreateSession` mutation invalidates the session list query for the relevant `jdId` on success
- AC-05: Unit tests for each hook use `msw` or mock Axios; cover success and error states

**Effort:** M  
**Notes:** `VITE_API_BASE_URL` must be set to the API Gateway endpoint URL. Document this in a `.env.example` file at `packages/web/`.

---

### Issue M2-07: Implement Error Handling Middleware for Lambda Handlers

**Description:**  
Create a higher-order function `withErrorHandler` in `packages/api/src/utils/error-handler.ts` that wraps Lambda handler functions in a standardized try/catch. The wrapper catches unhandled errors, logs them via the structured logger, and returns a uniform API Gateway error response shape: `{ statusCode, body: { error: string, message: string } }`. Define typed `AppError` classes for 400, 404, 422, and 500 error scenarios.

**Acceptance Criteria:**

- AC-01: `withErrorHandler` wraps any async Lambda handler and catches all thrown errors
- AC-02: `AppError` base class is defined with `statusCode` and `message`; subclasses: `ValidationError` (400), `NotFoundError` (404), `UnprocessableError` (422), `InternalError` (500)
- AC-03: Known `AppError` subclasses are returned with their specific status code and message in the response body
- AC-04: Unknown errors are caught, logged at `error` level with stack trace, and returned as 500 with a generic message (no stack trace in response body)
- AC-05: All Lambda handlers introduced in M2 use `withErrorHandler`
- AC-06: Unit tests cover each `AppError` subclass response shape and the unknown error fallback

**Effort:** S  
**Notes:** This is a cross-cutting concern that should be established before business logic handlers are written. Backfill M2-01 and M2-02 handlers with `withErrorHandler` as part of this issue.

---

## Milestone M3: Plan Generation Agent

**Goal:** Agent generates a structured interview plan from the JD; recruiter can review, edit, and approve it at Checkpoint 1. The plan is locked in DynamoDB on approval and the session status transitions to `PLAN_APPROVED`.

**Deliverables:**

- Bedrock Agent (`interview-forge-plan-agent`) with action group and system prompt
- Action group Lambda functions: `read-jd-action`, `write-plan-action`
- `plan-handler` Lambda invoking the agent and returning the draft plan
- `approve-plan-handler` Lambda locking the plan and transitioning session status
- Plan Review & Edit UI (Checkpoint 1) with deep editing capability (Option B)
- CDK constructs for agent, action group, and new Lambda routes

---

### Issue M3-01: Define Interview Plan Zod Schema

**Description:**  
Finalize and implement the `InterviewPlanSchema` in `packages/shared/src/schemas/`. The plan structure must support: an array of competency areas, each with a name, description, evaluation criteria, and an ordered array of questions. Each question has a text, a type (behavioral/situational/technical), and a follow-up prompt. This schema is used by the plan-generation agent output validation, the plan-handler Lambda, and the plan edit UI.

**Acceptance Criteria:**

- AC-01: `CompetencySchema` validates: `competencyId` (UUID), `name` (string), `description` (string), `evaluationCriteria` (string), `questions` (array, min 1)
- AC-02: `QuestionSchema` validates: `questionId` (UUID), `text` (string), `type` (enum: `BEHAVIORAL | SITUATIONAL | TECHNICAL`), `followUpPrompt` (string, optional)
- AC-03: `InterviewPlanSchema` validates: `planId` (UUID), `competencies` (array of `CompetencySchema`, min 1, max 8), `generatedAt` (ISO timestamp)
- AC-04: TypeScript types `InterviewPlan`, `Competency`, `Question` are exported via `z.infer`
- AC-05: Unit tests cover valid plans, empty competency array rejection, and invalid question type enum values

**Effort:** S  
**Notes:** The max of 8 competencies is a soft heuristic for structured interviewing best practices. The Bedrock Agent system prompt will instruct the model to stay within this range; the schema enforces it at the boundary.

---

### Issue M3-02: Implement Bedrock Plan Agent Action Group Lambdas

**Description:**  
Implement two Lambda functions that serve as the action group for the plan generation Bedrock Agent: `read-jd-action` and `write-plan-action`. These are invoked by Bedrock Agents (not API Gateway) and must conform to the Bedrock Agents action group Lambda invocation contract (input event shape: `{ actionGroup, function, parameters }`; response shape: `{ actionGroup, function, functionResponse }`).

- `read-jd-action`: Accepts `jdId` parameter, reads the JD record from DynamoDB, returns `rawText` and `title`
- `write-plan-action`: Accepts `sessionId`, `jdId`, and a serialized `InterviewPlan` JSON string, validates against `InterviewPlanSchema`, writes the plan to the SESSION item in DynamoDB, updates `status` to `PLAN_PENDING`

**Acceptance Criteria:**

- AC-01: Both Lambdas handle the Bedrock Agents action group event contract; event parsing is validated with Zod
- AC-02: `read-jd-action`: returns `{ title, rawText }` as a JSON string in `functionResponse.responseBody.TEXT.body`; returns a structured error response if the JD is not found
- AC-03: `write-plan-action`: validates the incoming plan JSON against `InterviewPlanSchema`; returns a validation error response (not a thrown exception) if schema validation fails — agent must receive a structured error to reason about, not a Lambda execution error
- AC-04: `write-plan-action`: performs a DynamoDB `UpdateItem` on `PK=JD#{jdId}`, `SK=SESSION#{sessionId}`, setting `plan` and `status = PLAN_PENDING`
- AC-05: Both Lambdas use the structured logger and `withErrorHandler`
- AC-06: Unit tests mock DynamoDB; cover JD not found, successful read, valid plan write, and schema validation failure scenarios

**Effort:** M  
**Notes:** The Bedrock Agents Lambda invocation contract differs from API Gateway proxy integration. Review the Bedrock Agents developer guide action group Lambda input/output spec before implementing. Validation errors returned as structured responses (not thrown) are critical — a thrown exception terminates the agent loop; a structured error allows the agent to retry or self-correct.

---

### Issue M3-03: Configure Bedrock Plan Agent and Action Group in CDK

**Description:**  
Define the `interview-forge-plan-agent` Bedrock Agent in CDK using `CfnAgent` and `CfnAgentAlias`. Configure the agent with: Claude Sonnet 4.6 as the foundation model, the plan generation system prompt (see Notes), the action group referencing the `read-jd-action` and `write-plan-action` Lambda ARNs, and an `DRAFT` alias for development. Grant Bedrock the `lambda:InvokeFunction` permission on both action group Lambdas. Grant the agent IAM role `bedrock:InvokeModel` on the Claude Sonnet 4.6 model ARN.

**Acceptance Criteria:**

- AC-01: `CfnAgent` is defined with `foundationModel: "anthropic.claude-sonnet-4-6"`, `agentName: "interview-forge-plan-agent"`, and the system prompt specified in the CDK construct
- AC-02: Action group is defined with `actionGroupName: "interview-forge-plan-actions"`, referencing both action Lambda ARNs with function schemas (OpenAPI-style) defined inline in CDK
- AC-03: `CfnAgentAlias` is defined with alias name `dev` pointing to the `DRAFT` agent version
- AC-04: Bedrock service principal (`bedrock.amazonaws.com`) has `lambda:InvokeFunction` permission on both action Lambdas via resource-based policy
- AC-05: Agent execution IAM role has `bedrock:InvokeModel` scoped to the Claude Sonnet 4.6 model ARN
- AC-06: All CDK resources carry the four required organizational tags
- AC-07: `cdk synth` produces valid CloudFormation for the agent resources

**Effort:** L  
**Notes:** The system prompt for plan generation should instruct the agent to: (1) read the JD using `read-jd-action`, (2) identify 4–8 competency areas relevant to the role, (3) generate 3–5 structured questions per competency with types and follow-up prompts, (4) write the plan using `write-plan-action`. The system prompt is a CDK string literal in the construct — it will be iterated during M3 development. The OpenAPI-style function schema for the action group must precisely describe parameter names, types, and descriptions to drive reliable agent tool selection.

---

### Issue M3-04: Implement Plan Handler Lambda (`plan-handler`)

**Description:**  
Implement the `plan-handler` Lambda in `packages/api/src/handlers/plan/`. This handler is invoked by API Gateway (`POST /jds/{jdId}/sessions/{sessionId}/plan`). It invokes the Bedrock Agent (`interview-forge-plan-agent`) using the AWS SDK `BedrockAgentRuntimeClient` with `InvokeAgentCommand`, passing `jdId` and `sessionId` as the initial user message. The agent runs its ReAct loop autonomously (reads JD, generates plan, writes to DynamoDB). The handler streams or polls the agent response and returns the completed plan to the frontend by reading the SESSION record from DynamoDB after the agent loop completes.

**Acceptance Criteria:**

- AC-01: Handler accepts `POST /jds/{jdId}/sessions/{sessionId}/plan`; validates path parameters with Zod
- AC-02: Handler invokes the Bedrock Agent using `BedrockAgentRuntimeClient` with `InvokeAgentCommand`; `sessionId` is passed as the Bedrock Agent `sessionId` for session continuity
- AC-03: Handler reads the updated SESSION record from DynamoDB after agent completion and returns the `plan` attribute in the response body with HTTP 200
- AC-04: If the agent returns a completion event without a plan written (agent loop failure), handler returns 502 with a descriptive error message
- AC-05: Handler uses structured logger; agent invocation duration is logged at `info` level for cost monitoring
- AC-06: Unit tests mock `BedrockAgentRuntimeClient` and DynamoDB; cover successful agent invocation, agent failure (no plan written), and path parameter validation failure

**Effort:** M  
**Notes:** Bedrock Agent `InvokeAgentCommand` returns a streaming response via `AsyncIterable`. Accumulate the completion event chunks to determine when the agent loop is done. The agent alias ID (from M3-03 CDK output) must be passed as an environment variable to this Lambda.

---

### Issue M3-05: Implement Approve Plan Lambda (`approve-plan-handler`)

**Description:**  
Implement the `approve-plan-handler` Lambda in `packages/api/src/handlers/approve-plan/`. Invoked by `PUT /jds/{jdId}/sessions/{sessionId}/plan/approve`. Accepts an optional modified plan payload (the recruiter may have edited the plan in the UI before approving). If a plan payload is provided, validates it against `InterviewPlanSchema` and overwrites the `plan` attribute in DynamoDB. Whether or not a modified plan is provided, updates `status` to `PLAN_APPROVED`.

**Acceptance Criteria:**

- AC-01: Handler accepts `PUT /jds/{jdId}/sessions/{sessionId}/plan/approve`; validates path parameters
- AC-02: If request body contains a `plan` field, validates it against `InterviewPlanSchema`; returns 400 if validation fails
- AC-03: DynamoDB `UpdateItem` sets `plan` (if modified plan provided) and `status = PLAN_APPROVED` atomically using a single update expression
- AC-04: A condition expression prevents the update if `status` is already `PLAN_APPROVED` or beyond (idempotency guard); returns 409 if condition fails
- AC-05: Returns the updated session (at minimum `sessionId`, `status`, `plan`) with HTTP 200
- AC-06: Uses structured logger and `withErrorHandler`
- AC-07: Unit tests cover: approve with no edit, approve with valid modified plan, approve with invalid plan schema, 409 when already approved

**Effort:** M

---

### Issue M3-06: Implement Plan Review & Edit UI — Checkpoint 1 (React)

**Description:**  
Implement the plan review and edit page in `packages/web/src/pages/session/plan/`. This is the Checkpoint 1 UI. On load, it fetches the session (which contains the generated plan) and renders it as an editable structure. The page must support Option B deep editing: edit competency name and description, add/remove/edit individual questions within a competency (text, type, follow-up), reorder questions via drag-and-drop (or up/down buttons), and add/remove competencies. When the recruiter approves, the (potentially modified) plan is sent to `approve-plan-handler`.

**Acceptance Criteria:**

- AC-01: Page loads the session via `useGetSession`; shows loading skeleton during fetch; shows error state on failure
- AC-02: Each competency is rendered as a collapsible section (shadcn/ui `Accordion`) showing competency name, description, and question list
- AC-03: Competency name and description are inline-editable (click-to-edit or always-editable inputs); changes update local React state
- AC-04: Each question displays text, type badge, and follow-up prompt; each is inline-editable
- AC-05: "Add Question" button within a competency appends a new blank question; "Remove" button on a question removes it from local state (with a confirmation affordance)
- AC-06: "Add Competency" button appends a blank competency with one empty question; "Remove Competency" removes the entire section with a confirmation dialog
- AC-07: "Approve Plan" button is enabled only when the plan has at least 1 competency and each competency has at least 1 question; calls `PUT .../plan/approve` with the current local plan state
- AC-08: On successful approval, session status updates to `PLAN_APPROVED` and the page transitions to a read-only confirmation view with a "Return to Sessions" link
- AC-09: Component tests cover: plan render from session data, competency edit, question add/remove, approve button disabled state, successful approval transition

**Effort:** L  
**Notes:** All edits are local React state until "Approve Plan" is submitted — there is no auto-save. Make this explicit in the UI (e.g., "Changes are saved when you approve"). For drag-and-drop reordering, prefer simple up/down arrow buttons over a DnD library to keep scope contained.

---

### Issue M3-07: Add Plan Agent Lambda Routes and CDK Wiring

**Description:**  
Add CDK Lambda function constructs and API Gateway integrations for `plan-handler` and `approve-plan-handler`. Pass required environment variables: `TABLE_NAME`, `BEDROCK_PLAN_AGENT_ID`, `BEDROCK_PLAN_AGENT_ALIAS_ID`. Grant the plan-handler Lambda `bedrock:InvokeAgent` permission on the plan agent ARN.

**Acceptance Criteria:**

- AC-01: `plan-handler` and `approve-plan-handler` Lambda constructs are defined with the shared execution role and required environment variables
- AC-02: `POST /jds/{jdId}/sessions/{sessionId}/plan` is wired to `plan-handler`
- AC-03: `PUT /jds/{jdId}/sessions/{sessionId}/plan/approve` is wired to `approve-plan-handler`
- AC-04: `plan-handler` Lambda execution role includes `bedrock:InvokeAgent` scoped to the plan agent ARN
- AC-05: Agent ID and alias ID CDK outputs from M3-03 are referenced as cross-stack values or environment variable inputs; no hardcoded ARNs
- AC-06: `cdk synth` produces valid CloudFormation for all new resources with required tags

**Effort:** S

---

### Issue M3-08: Iterate Plan Generation System Prompt

**Description:**  
Validate and iterate the plan generation agent system prompt established in M3-03 against a set of representative JD inputs. This is an explicit prompt engineering task — not incidental to other development. The goal is a system prompt that consistently produces plans within the schema constraints (4–8 competencies, 3–5 questions each, correct question types) and generates professionally credible interview content.

**Acceptance Criteria:**

- AC-01: Minimum 5 representative JDs tested end-to-end through the agent (engineering, product, design, sales, operations roles)
- AC-02: 100% of test runs produce a `plan` that passes `InterviewPlanSchema` validation without agent self-correction
- AC-03: Generated competencies are role-relevant and non-generic (e.g., not just "Communication" and "Teamwork" for every role)
- AC-04: System prompt is versioned as a string constant in CDK with a comment noting the version and date of last iteration
- AC-05: Any prompt changes from initial version are documented with the rationale (a comment block in the CDK construct is sufficient)

**Effort:** M  
**Notes:** This is the highest-risk item in M3 (Medium/High risk per the Project Overview). Allocate time for 2–3 iteration cycles. If the agent consistently fails schema validation, add a few-shot example of a well-formed plan to the system prompt.

---

## Milestone M4: Scorecard

**Goal:** Recruiter can enter per-question Likert ratings and free-text notes per competency area after the interview. Scorecard is persisted in DynamoDB and session status transitions to `SCORED`.

**Deliverables:**

- `ScorecardSchema` in `packages/shared`
- `score-handler` Lambda writing the scorecard to DynamoDB
- Scorecard entry UI rendering the approved plan as a scoring form

---

### Issue M4-01: Define Scorecard Zod Schema

**Description:**  
Implement `ScorecardSchema` in `packages/shared/src/schemas/`. The scorecard captures a rating (Likert 1–5) and optional notes per question, plus a free-text notes field per competency area. The schema must align structurally with `InterviewPlanSchema` (same `competencyId` and `questionId` references).

**Acceptance Criteria:**

- AC-01: `QuestionRatingSchema` validates: `questionId` (UUID), `rating` (integer enum: 1 | 2 | 3 | 4 | 5), `notes` (string, optional, max 1000 chars)
- AC-02: `CompetencyNotesSchema` validates: `competencyId` (UUID), `overallNotes` (string, optional, max 2000 chars), `questionRatings` (array of `QuestionRatingSchema`, min 1)
- AC-03: `ScorecardSchema` validates: `scorecardId` (UUID), `completedAt` (ISO timestamp), `competencyScores` (array of `CompetencyNotesSchema`, min 1)
- AC-04: TypeScript types `Scorecard`, `CompetencyNotes`, `QuestionRating` are exported
- AC-05: Unit tests cover valid scorecard, rating out-of-range (0 or 6), and missing `questionRatings`

**Effort:** S

---

### Issue M4-02: Implement Score Handler Lambda (`score-handler`)

**Description:**  
Implement the `score-handler` Lambda in `packages/api/src/handlers/score/`. Invoked by `POST /jds/{jdId}/sessions/{sessionId}/scorecard`. Validates the request body against `ScorecardSchema`, writes the scorecard to the SESSION item in DynamoDB (`scorecard` attribute), and transitions `status` to `SCORED`. A condition expression prevents overwriting a scorecard if status is already `ASSESSED` or `COMPLETE`.

**Acceptance Criteria:**

- AC-01: Handler validates path parameters and request body (against `ScorecardSchema`); returns 400 on validation failure
- AC-02: DynamoDB `UpdateItem` sets `scorecard` and `status = SCORED`; condition expression guards against overwriting in terminal states
- AC-03: Returns the updated session summary (`sessionId`, `status`) with HTTP 200
- AC-04: Handler uses structured logger and `withErrorHandler`
- AC-05: CDK Lambda construct and `POST /jds/{jdId}/sessions/{sessionId}/scorecard` API Gateway route are added (can be a sub-issue or included here)
- AC-06: Unit tests cover: valid scorecard write, schema validation failure, condition expression rejection (already assessed)

**Effort:** M

---

### Issue M4-03: Implement Scorecard Entry UI (React)

**Description:**  
Implement the scorecard entry page in `packages/web/src/pages/session/scorecard/`. The page renders the approved interview plan as a structured scoring form. For each competency, display: competency name, a `Textarea` for overall competency notes, and each question with its text and a 5-point Likert rating control (radio buttons or segmented control) plus an optional per-question notes field. All ratings default to unrated. A "Submit Scorecard" button is enabled only when all questions have a rating.

**Acceptance Criteria:**

- AC-01: Page loads the session (which contains the approved `plan`) via `useGetSession`; renders loading and error states
- AC-02: Each competency section shows competency name, overall notes textarea, and a list of questions
- AC-03: Each question shows: question text, question type badge, 5-point Likert rating control (1–5; all required), optional notes textarea
- AC-04: "Submit Scorecard" button is disabled until all questions have a rating value set
- AC-05: On submit, sends `POST .../scorecard` with the constructed scorecard payload; shows loading state on button
- AC-06: On success, navigates to a confirmation page or the session detail page showing `status: SCORED` with a "Generate Assessment" call-to-action
- AC-07: Component tests cover: plan-to-form rendering, rating interaction, submit disabled until all rated, successful submission navigation

**Effort:** M  
**Notes:** The Likert control should be keyboard-accessible. Use `shadcn/ui RadioGroup` styled as a 1–5 scale.

---

### Issue M4-04: Add Scorecard TanStack Query Hooks

**Description:**  
Implement the `useSubmitScorecard` mutation hook in `packages/web/src/pages/session/hooks/`. Wraps `POST /jds/{jdId}/sessions/{sessionId}/scorecard`. On success, invalidates the session query for `sessionId` so the updated status is reflected immediately.

**Acceptance Criteria:**

- AC-01: `useSubmitScorecard` is a `useMutation` hook accepting `{ jdId, sessionId, scorecard: Scorecard }` parameters
- AC-02: On success, `queryClient.invalidateQueries` is called for the session query key for `sessionId`
- AC-03: Unit test covers success response handling and query invalidation

**Effort:** S

---

## Milestone M5: Reconciliation Agent & Assessment

**Goal:** Agent synthesizes the approved plan and completed scorecard into a final candidate assessment with hire/no-hire recommendation. Recruiter reviews and approves at Checkpoint 2. Assessment is locked in DynamoDB and session status transitions to `COMPLETE`.

**Deliverables:**

- `AssessmentSchema` in `packages/shared`
- Bedrock Agent (`interview-forge-assess-agent`) with action group and system prompt
- Action group Lambdas: `read-plan-action`, `read-scorecard-action`, `write-assessment-action`
- `assess-handler` Lambda invoking the reconciliation agent
- `approve-assess-handler` Lambda locking the assessment
- Assessment Review UI (Checkpoint 2)
- CDK constructs for all new resources

---

### Issue M5-01: Define Assessment Zod Schema

**Description:**  
Implement `AssessmentSchema` in `packages/shared/src/schemas/`. The assessment captures: a per-competency summary (strengths, concerns, rating conflicts identified), an overall recommendation (HIRE | NO_HIRE | STRONG_HIRE | STRONG_NO_HIRE), a confidence level (HIGH | MEDIUM | LOW), supporting reasoning narrative, and a list of notable signal conflicts identified between ratings and free-text notes.

**Acceptance Criteria:**

- AC-01: `CompetencyAssessmentSchema` validates: `competencyId` (UUID), `name` (string), `strengths` (string), `concerns` (string), `conflictsIdentified` (array of strings, may be empty)
- AC-02: `AssessmentSchema` validates: `assessmentId` (UUID), `recommendation` (enum: `STRONG_HIRE | HIRE | NO_HIRE | STRONG_NO_HIRE`), `confidence` (enum: `HIGH | MEDIUM | LOW`), `reasoning` (string, min 100 chars), `competencyAssessments` (array of `CompetencyAssessmentSchema`), `generatedAt` (ISO timestamp)
- AC-03: TypeScript types `Assessment`, `CompetencyAssessment`, `Recommendation`, `Confidence` are exported
- AC-04: Unit tests cover valid assessments, invalid recommendation enum, reasoning below minimum length

**Effort:** S

---

### Issue M5-02: Implement Bedrock Reconciliation Agent Action Group Lambdas

**Description:**  
Implement three Lambda functions for the reconciliation agent action group: `read-plan-action`, `read-scorecard-action`, and `write-assessment-action`. These conform to the Bedrock Agents action group Lambda contract.

- `read-plan-action`: reads the `plan` attribute from the SESSION item in DynamoDB; returns serialized `InterviewPlan` JSON
- `read-scorecard-action`: reads the `scorecard` attribute from the SESSION item; returns serialized `Scorecard` JSON
- `write-assessment-action`: accepts serialized `Assessment` JSON, validates against `AssessmentSchema`, writes to SESSION item, updates `status` to `ASSESSED`

**Acceptance Criteria:**

- AC-01: All three Lambdas handle the Bedrock Agents action group event contract; input parameters are validated with Zod
- AC-02: `read-plan-action` and `read-scorecard-action` return 404-equivalent structured error responses if the attribute is absent in the session (e.g., scorecard not yet submitted)
- AC-03: `write-assessment-action` validates incoming JSON against `AssessmentSchema`; returns a structured validation error (not a thrown exception) on failure, consistent with the pattern established in M3-02
- AC-04: `write-assessment-action` sets `assessment` and `status = ASSESSED` via DynamoDB `UpdateItem`; condition expression prevents overwrite if `status = COMPLETE`
- AC-05: All Lambdas use structured logger and `withErrorHandler`
- AC-06: Unit tests: cover not-found, successful reads, valid write, schema validation failure, condition expression rejection

**Effort:** M

---

### Issue M5-03: Configure Bedrock Reconciliation Agent and Action Group in CDK

**Description:**  
Define the `interview-forge-assess-agent` Bedrock Agent in CDK using `CfnAgent` and `CfnAgentAlias`. Follows the same pattern as M3-03. Configure with: Claude Sonnet 4.6, the reconciliation system prompt (see Notes), the action group referencing all three action Lambda ARNs, and a `dev` alias.

**Acceptance Criteria:**

- AC-01–AC-07: Mirror the acceptance criteria from M3-03, substituting the reconciliation agent name, system prompt, and action group Lambda ARNs
- AC-08: Action group function schemas precisely describe all three tools with parameter names, types, and descriptions sufficient to drive reliable agent tool selection

**Effort:** M  
**Notes:** The reconciliation system prompt must explicitly instruct the agent to: (1) read the plan, (2) read the scorecard, (3) for each competency, identify where Likert ratings and free-text notes agree or conflict, (4) produce a competency-level narrative of strengths and concerns, (5) synthesize an overall recommendation with confidence level and reasoning, (6) write the assessment. Include explicit conflict-detection instructions: "A conflict exists when a rating of 4 or 5 is accompanied by notes describing concerns, or when a rating of 1 or 2 is accompanied by notes describing strengths." Few-shot examples are strongly recommended given the Medium/High quality risk in the Project Overview.

---

### Issue M5-04: Implement Assess Handler Lambda (`assess-handler`)

**Description:**  
Implement the `assess-handler` Lambda in `packages/api/src/handlers/assess/`. Invoked by `POST /jds/{jdId}/sessions/{sessionId}/assessment`. Follows the same invocation pattern as `plan-handler` (M3-04): invokes the `interview-forge-assess-agent` via `BedrockAgentRuntimeClient`, uses `sessionId` as the Bedrock session ID, and reads the completed SESSION record from DynamoDB after the agent loop completes to return the `assessment` attribute.

**Acceptance Criteria:**

- AC-01–AC-06: Mirror the acceptance criteria from M3-04, substituting reconciliation agent configuration and `assessment` attribute

**Effort:** M

---

### Issue M5-05: Implement Approve Assessment Lambda (`approve-assess-handler`)

**Description:**  
Implement the `approve-assess-handler` Lambda in `packages/api/src/handlers/approve-assess/`. Invoked by `PUT /jds/{jdId}/sessions/{sessionId}/assessment/approve`. Accepts an optional recruiter override flag (`{ override: true, overrideReason: string }`). If override is present, records the override in the assessment attribute before finalizing. Updates `status` to `COMPLETE`. A condition expression prevents double-approval.

**Acceptance Criteria:**

- AC-01: Handler accepts the approval request with optional `{ override: boolean, overrideReason?: string }` body; validates with Zod
- AC-02: If `override: true`, `overrideReason` is required and min 20 chars; returns 400 if absent or too short
- AC-03: DynamoDB `UpdateItem` sets `status = COMPLETE`; if override, merges `{ overrideApplied: true, overrideReason }` into the `assessment` Map attribute
- AC-04: Condition expression prevents update if `status = COMPLETE` (409 response)
- AC-05: Returns updated session summary with HTTP 200
- AC-06: Uses structured logger and `withErrorHandler`
- AC-07: Unit tests cover: straight approval, override with valid reason, override missing reason, 409 already complete

**Effort:** M

---

### Issue M5-06: Implement Assessment Review UI — Checkpoint 2 (React)

**Description:**  
Implement the assessment review page in `packages/web/src/pages/session/assessment/`. Displays the generated assessment in a structured read-only view: overall recommendation badge (color-coded by recommendation strength), confidence level, reasoning narrative, and per-competency assessment cards showing strengths, concerns, and any identified conflicts. Provides two actions: "Approve Assessment" (straight approval) and "Approve with Override" (opens a dialog requiring override reason text). Both call `approve-assess-handler`.

**Acceptance Criteria:**

- AC-01: Page loads the session via `useGetSession`; renders loading and error states
- AC-02: Overall recommendation is displayed as a prominent badge with color coding: `STRONG_HIRE` (green), `HIRE` (teal), `NO_HIRE` (orange), `STRONG_NO_HIRE` (red)
- AC-03: Confidence level and reasoning narrative are displayed below the recommendation badge
- AC-04: Per-competency assessment cards show: competency name, strengths text, concerns text, and any identified conflicts (highlighted distinctly if present)
- AC-05: "Approve Assessment" button calls `PUT .../assessment/approve` with no override; on success, transitions to `COMPLETE` state view with PDF export button
- AC-06: "Approve with Override" opens a shadcn/ui `Dialog` with a required textarea (min 20 chars); on confirm, calls `PUT .../assessment/approve` with `{ override: true, overrideReason }`
- AC-07: On session `status = COMPLETE`, the page renders in read-only mode with approval actions hidden and PDF export button visible
- AC-08: Component tests cover: assessment render, conflict highlighting, approve flow, override dialog validation, read-only state when complete

**Effort:** L

---

### Issue M5-07: Add Assessment Lambda Routes and CDK Wiring

**Description:**  
Add CDK Lambda function constructs and API Gateway integrations for `assess-handler`, `approve-assess-handler`, and all three reconciliation agent action Lambdas. Wire API Gateway routes. Grant `assess-handler` Lambda `bedrock:InvokeAgent` permission on the reconciliation agent ARN.

**Acceptance Criteria:**

- AC-01: All five new Lambda constructs are defined with shared execution role and required environment variables
- AC-02: `POST /jds/{jdId}/sessions/{sessionId}/assessment` → `assess-handler`
- AC-03: `PUT /jds/{jdId}/sessions/{sessionId}/assessment/approve` → `approve-assess-handler`
- AC-04: `assess-handler` execution role includes `bedrock:InvokeAgent` scoped to the reconciliation agent ARN
- AC-05: Bedrock service principal has `lambda:InvokeFunction` on all three action group Lambdas
- AC-06: `cdk synth` produces valid CloudFormation for all resources with required tags

**Effort:** S

---

## Milestone M6: PDF Export, Polish & Documentation

**Goal:** Recruiter can download the final assessment as a PDF. The application handles all error states gracefully, UI is polished end-to-end, and the repository is documented for portfolio reviewers.

**Deliverables:**

- Client-side PDF export via `pdfmake`
- Comprehensive error state handling across all pages
- README with architecture summary, setup instructions, and demo walkthrough
- Environment variable documentation

---

### Issue M6-01: Implement Client-Side PDF Assessment Export

**Description:**  
Implement the PDF export feature in `packages/web/src/pages/session/assessment/` using `pdfmake`. When the recruiter clicks "Download Assessment PDF" on a `COMPLETE` session, generate and download a formatted PDF containing: candidate name, JD title, generation date, overall recommendation with confidence, reasoning narrative, per-competency assessment (strengths, concerns, conflicts), and a footer noting whether a recruiter override was applied.

**Acceptance Criteria:**

- AC-01: `pdfmake` is installed in `packages/web` and imported as an ES module; bundle size impact is acceptable (tree-shakeable import)
- AC-02: PDF contains: header with "interview-forge" branding, candidate name, JD title, assessment date; body with recommendation, confidence, reasoning, and competency sections; footer with override notice if applicable
- AC-03: Recommendation section uses text styling (bold, larger font) to visually distinguish recommendation strength; no color dependency (PDF must be readable when printed in grayscale)
- AC-04: "Download Assessment PDF" button triggers client-side generation and browser download; no network call to Lambda
- AC-05: Component test validates that the PDF generation function constructs the correct `pdfmake` document definition object given a mock `Assessment` and session metadata (no actual PDF binary assertion needed)

**Effort:** M  
**Notes:** `pdfmake` requires its font files to be available. Use the CDN-hosted virtual file system approach or bundle the default fonts. Validate this works in the Vite build before writing the full document definition.

---

### Issue M6-02: Implement Comprehensive Error State Handling

**Description:**  
Audit all pages and API hooks for missing error states and implement consistent error UI patterns across the application. Error scenarios to cover: API Gateway 4xx/5xx responses, network timeouts, agent invocation failures (502 from plan/assess handlers), DynamoDB conditional check failures (409 conflicts), and empty/expired session states (TTL-expired records returning 404).

**Acceptance Criteria:**

- AC-01: All `useQuery` and `useMutation` hooks have `onError` handlers that surface user-readable messages; no silent error swallowing
- AC-02: API 404 responses for expired sessions display a specific "This session has expired" message with a link to the JD list — distinct from generic not-found errors
- AC-03: 502 responses from plan/assess handlers (agent failure) display a retry affordance; retry re-invokes the same API call
- AC-04: 409 conflict responses (double-approve) display a message indicating the action was already completed and refresh the session state
- AC-05: A global Axios response interceptor handles unexpected 500 responses with a generic fallback toast; no unhandled promise rejections reach the browser console
- AC-06: All error states are covered in component tests using mocked API error responses

**Effort:** M

---

### Issue M6-03: End-to-End UI Polish Pass

**Description:**  
Conduct a focused UI polish pass across all pages: consistent spacing and typography via Tailwind tokens, loading skeleton states on all data-fetching views, empty states on all list views, responsive layout at standard breakpoints (mobile is not a primary target but should not break at 768px), and consistent use of shadcn/ui component variants across all interactive elements.

**Acceptance Criteria:**

- AC-01: All pages use consistent spacing scale (Tailwind `space-*` and `p-*` tokens); no ad-hoc pixel values in class names
- AC-02: All data-fetching views have a loading skeleton (shadcn/ui `Skeleton`) that matches the approximate layout of the loaded content
- AC-03: All list views (JD list, session list, competency list in plan editor) have explicit empty state components with messaging and a call-to-action
- AC-04: Application renders without layout breakage at 768px viewport width
- AC-05: All primary action buttons use the same shadcn/ui `Button` variant consistently; destructive actions use the `destructive` variant

**Effort:** M  
**Notes:** This is a quality pass, not a redesign. Time-box to 1.5 days maximum. Document any deferred polish items in a `KNOWN_LIMITATIONS.md` file rather than scope-creeping.

---

### Issue M6-04: Write Repository README and Architecture Documentation

**Description:**  
Write a comprehensive `README.md` at the monorepo root covering: project concept and portfolio context, architecture summary with the Mermaid diagram from the Project Overview, technology stack table, prerequisites and setup instructions (AWS account, GitHub secrets, env vars), workflow instructions (how to run CI, deploy, teardown), and a demo walkthrough narrative describing the end-to-end recruiter workflow.

**Acceptance Criteria:**

- AC-01: README opens with a concise one-paragraph project summary and the target portfolio signal (HITL agent pattern)
- AC-02: Architecture section includes the Mermaid flowchart from the Project Overview (adapted if needed for README rendering)
- AC-03: Setup section documents all required GitHub secrets, AWS prerequisites (account ID, region, CDK bootstrap), and environment variables with example values
- AC-04: Demo walkthrough section describes all 8 workflow steps from the Project Overview in recruiter-facing language (not developer language)
- AC-05: A `KNOWN_LIMITATIONS.md` file documents: `unpdf` limitation with scanned PDFs, 72-hour TTL non-extensibility, no authentication, single-recruiter session model

**Effort:** M

---

### Issue M6-05: Iterate Reconciliation System Prompt

**Description:**  
Validate and iterate the reconciliation agent system prompt from M5-03 against representative scorecard inputs, mirroring the prompt iteration task in M3-08. Focus specifically on conflict detection quality: does the agent meaningfully distinguish rating/note agreements from conflicts, and does the hire/no-hire recommendation reflect the overall signal rather than averaging?

**Acceptance Criteria:**

- AC-01: Minimum 5 representative scorecard sets tested (covering: clear hire, clear no-hire, mixed signals, high conflict, low conflict scenarios)
- AC-02: 100% of test runs produce an `assessment` that passes `AssessmentSchema` validation without agent self-correction
- AC-03: In mixed-signal scenarios, `conflictsIdentified` is non-empty and the `reasoning` narrative references the specific conflicts
- AC-04: System prompt is versioned as a string constant with iteration notes, consistent with M3-08 convention
- AC-05: If conflict detection quality is insufficient after 2 iteration cycles, few-shot examples are added to the system prompt and documented

**Effort:** M  
**Notes:** This is allocated in M6 (rather than M5) to allow real scorecard data from end-to-end testing to drive prompt iteration, rather than synthetic test cases used during M5 development.

---

## Appendix A: Cross-Cutting Concerns Checklist

The following concerns are addressed by explicit issues rather than assumed:

| Concern                                  | Issue(s)                   |
| ---------------------------------------- | -------------------------- |
| CI/CD: Deploy workflow                   | M1-01                      |
| CI/CD: Teardown workflow                 | M1-02                      |
| Structured logging (all Lambdas)         | M1-06                      |
| Centralized error handling (all Lambdas) | M2-07                      |
| Shared type contracts (Zod schemas)      | M1-05, M3-01, M4-01, M5-01 |
| DynamoDB TTL strategy                    | M1-03                      |
| S3 lifecycle alignment                   | M1-04                      |
| IAM least-privilege                      | M1-04, M3-07, M5-07        |
| Bedrock Agent system prompt quality      | M3-08, M6-05               |
| Error state UI (all pages)               | M6-02                      |
| Repository documentation                 | M6-04                      |

---

## Appendix B: Environment Variables Reference

| Variable                        | Workspace                                            | Description                                |
| ------------------------------- | ---------------------------------------------------- | ------------------------------------------ |
| `VITE_API_BASE_URL`             | `packages/web`                                       | API Gateway base URL (from CDK output)     |
| `TABLE_NAME`                    | `packages/api` (all Lambdas)                         | DynamoDB table name                        |
| `BUCKET_NAME`                   | `packages/api` (`ingest-handler`, `session-handler`) | S3 bucket name                             |
| `BEDROCK_PLAN_AGENT_ID`         | `packages/api` (`plan-handler`)                      | Bedrock plan agent ID                      |
| `BEDROCK_PLAN_AGENT_ALIAS_ID`   | `packages/api` (`plan-handler`)                      | Bedrock plan agent alias ID                |
| `BEDROCK_ASSESS_AGENT_ID`       | `packages/api` (`assess-handler`)                    | Bedrock reconciliation agent ID            |
| `BEDROCK_ASSESS_AGENT_ALIAS_ID` | `packages/api` (`assess-handler`)                    | Bedrock reconciliation agent alias ID      |
| `CDK_APP`                       | `packages/infra`                                     | Resource tag value for `App`               |
| `CDK_ENV`                       | `packages/infra`                                     | Resource tag value for `Env` (e.g., `dev`) |
| `CDK_OU`                        | `packages/infra`                                     | Resource tag value for `OU`                |
| `CDK_OWNER`                     | `packages/infra`                                     | Resource tag value for `Owner`             |

---

## Revision History

| Version | Date       | Changes                                           |
| ------- | ---------- | ------------------------------------------------- |
| 0.1     | 2026-06-02 | Initial draft — all milestones and issues defined |
