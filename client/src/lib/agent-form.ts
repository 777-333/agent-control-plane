export type AgentFormInput = {
  name: string;
  description: string;
  team: string;
  owner: string;
  model: string;
  environment: "production" | "staging" | "development";
};

export function normalizeAgentFormInput(input: AgentFormInput): AgentFormInput {
  return {
    ...input,
    name: input.name.trim(),
    description: input.description.trim(),
    team: input.team.trim(),
    owner: input.owner.trim(),
    model: input.model.trim(),
  };
}

export function getAgentFormValidationMessage(input: AgentFormInput) {
  const normalized = normalizeAgentFormInput(input);

  if (!normalized.name || !normalized.description || !normalized.owner) {
    return "Bitte vervollständige Name, Beschreibung und Owner.";
  }

  if (normalized.description.length < 10) {
    return "Die Beschreibung muss mindestens 10 Zeichen enthalten.";
  }

  return null;
}
