import { z } from 'zod';

/**
 * API Configuration Schema
 * Validates environment variables for the API
 */
const ConfigSchema = z.object({
  LOG_ENABLED: z
    .string()
    .default('true')
    .transform((val) => val.toLowerCase() === 'true')
    .describe('LOG_ENABLED - Enable or disable logging (optional, default: "true")'),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info')
    .describe('LOG_LEVEL - Logging level (optional, default: "info")'),
  LOG_FORMAT: z
    .enum(['json', 'text'])
    .default('json')
    .describe('LOG_FORMAT - Logging format (optional, default: "json")'),
  JD_TABLE_NAME: z.string().min(1).describe('JD_TABLE_NAME - DynamoDB table for Job Descriptions (required)'),
  JD_BUCKET_NAME: z.string().min(1).describe('JD_BUCKET_NAME - S3 bucket for Job Descriptions (required)'),
  PLAN_AGENT_ID: z.string().min(1).describe('PLAN_AGENT_ID - Bedrock Agent ID for plan generation (required)'),
  PLAN_AGENT_ALIAS_ID: z
    .string()
    .min(1)
    .describe('PLAN_AGENT_ALIAS_ID - Bedrock Agent alias ID for plan generation (required)'),
});

/**
 * TypeScript type for configuration, inferred from Zod schema
 */
export type Config = z.infer<typeof ConfigSchema>;

/**
 * Load and validate configuration from environment variables
 * Throws an error if validation fails, with detailed messages
 * @returns {Config} Validated configuration object
 */
const getConfig = (): Config => {
  try {
    return ConfigSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((issue) => `- ${issue.path.join('.')} (${issue.message})`).join('\n');
      throw new Error(`Configuration validation error:\n${messages}`, { cause: error });
    }
    throw error;
  }
};

/**
 * Singleton configuration instance, loaded and validated at module initialization
 * This ensures configuration is only loaded once and is available throughout the application
 */
const config = getConfig();

export { config };
