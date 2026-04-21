import { describe, expect, it } from "vitest";
import { createAgentFormFromExistingAgent, getAgentFormValidationMessage, normalizeAgentFormInput } from "../client/src/lib/agent-form";

describe("agent form helpers", () => {
  it("trims user input before submission", () => {
    const normalized = normalizeAgentFormInput({
      name: "  Finance Sentinel  ",
      description: "  Überwacht kritische Zahlungsfreigaben.  ",
      team: "  Operations  ",
      owner: "  Max Mustermann  ",
      model: "  gpt-4.1  ",
      environment: "production",
    });

    expect(normalized).toEqual({
      name: "Finance Sentinel",
      description: "Überwacht kritische Zahlungsfreigaben.",
      team: "Operations",
      owner: "Max Mustermann",
      model: "gpt-4.1",
      environment: "production",
    });
  });

  it("rejects descriptions shorter than ten characters after trimming", () => {
    const message = getAgentFormValidationMessage({
      name: "Agent A",
      description: "  kurz  ",
      team: "Finance",
      owner: "Owner",
      model: "gpt-4.1",
      environment: "production",
    });

    expect(message).toBe("Die Beschreibung muss mindestens 10 Zeichen enthalten.");
  });

  it("prefills existing agents for editing and duplication", () => {
    const editForm = createAgentFormFromExistingAgent({
      id: 7,
      name: "Finance Sentinel",
      description: "Überwacht kritische Zahlungsfreigaben.",
      team: "Finance Operations",
      owner: "Sophie Keller",
      model: "gpt-4.1",
      environment: "staging",
    });

    const duplicateForm = createAgentFormFromExistingAgent({
      id: 7,
      name: "Finance Sentinel",
      description: "Überwacht kritische Zahlungsfreigaben.",
      team: "Finance Operations",
      owner: "Sophie Keller",
      model: "gpt-4.1",
      environment: "staging",
    }, "duplicate");

    expect(editForm.name).toBe("Finance Sentinel");
    expect(editForm.environment).toBe("staging");
    expect(duplicateForm.name).toBe("Finance Sentinel Kopie");
  });
});
