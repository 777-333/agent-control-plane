import { describe, expect, it } from "vitest";
import { getAgentFormValidationMessage, normalizeAgentFormInput } from "./agent-form";

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

  it("accepts valid normalized agent payloads", () => {
    const message = getAgentFormValidationMessage({
      name: "Agent A",
      description: "  Diese Beschreibung ist lang genug.  ",
      team: "Finance",
      owner: "Owner",
      model: "gpt-4.1",
      environment: "production",
    });

    expect(message).toBeNull();
  });
});
