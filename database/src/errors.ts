export class InsufficientLevelUpsError extends Error {
  override name = "InsufficientLevelUpsError";

  constructor(public readonly requested: number) {
    super(`Cannot level up ${requested} times`);
  }
}

export class AgentNotFoundError extends Error {
  constructor(agentId: string) {
    super(`Agent with ID ${agentId} not found`);
    this.name = "AgentNotFoundError";
  }
}
