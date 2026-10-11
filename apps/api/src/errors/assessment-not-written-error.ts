/**
 * AssessmentNotWrittenError
 * Thrown when a Bedrock Agent completes without writing an assessment to the session.
 * This indicates the agent ran but did not successfully persist the assessment.
 */
export class AssessmentNotWrittenError extends Error {
  constructor(
    public jdId: string,
    public sessionId: string,
    message: string = 'Agent completed without writing assessment to session',
  ) {
    super(message);
    this.name = 'AssessmentNotWrittenError';
    Object.setPrototypeOf(this, AssessmentNotWrittenError.prototype);
  }
}
