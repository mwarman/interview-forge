/**
 * PlanNotWrittenError
 * Thrown when a Bedrock Agent completes without writing a plan to the session.
 * This indicates the agent ran but did not successfully persist the plan.
 */
export class PlanNotWrittenError extends Error {
  constructor(
    public jdId: string,
    public sessionId: string,
    message: string = 'Agent completed without writing plan to session',
  ) {
    super(message);
    this.name = 'PlanNotWrittenError';
    Object.setPrototypeOf(this, PlanNotWrittenError.prototype);
  }
}
