export type AgentEnvironment = "production" | "staging" | "development";

export type AgentFormInput = {
  name: string;
  description: string;
  team: string;
  owner: string;
  model: string;
  environment: AgentEnvironment;
};

export type ExistingAgentFormSource = Omit<AgentFormInput, "environment"> & {
  id?: number;
  environment: string;
};

export function createDefaultAgentForm(): AgentFormInput {
  return {
    name: "",
    description: "",
    team: "Finance Operations",
    owner: "",
    model: "gpt-4.1",
    environment: "production",
  };
}

function normalizeAgentEnvironment(environment: string): AgentEnvironment {
  if (environment === "staging" || environment === "development") {
    return environment;
  }

  return "production";
}

export function createAgentFormFromExistingAgent(agent: ExistingAgentFormSource, mode: "edit" | "duplicate" = "edit"): AgentFormInput {
  const normalized = normalizeAgentFormInput({
    ...agent,
    environment: normalizeAgentEnvironment(agent.environment),
  });

  return {
    ...normalized,
    name: mode === "duplicate" ? `${normalized.name} Kopie` : normalized.name,
  };
}

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
