import { beforeEach, describe, expect, it } from "vitest";
import {
  combinePrivacySanitizationResults,
  createCustomPrivacyRule,
  deleteCustomPrivacyRule,
  listCustomPrivacyRules,
  resetCustomPrivacyRules,
  sanitizeTextForPrivacy,
  summarizePrivacySanitization,
} from "./privacy";

beforeEach(() => {
  resetCustomPrivacyRules();
});

describe("privacy sanitization", () => {
  it("pseudonymizes globally recognizable identifiers such as email, phone and IBAN", () => {
    const result = sanitizeTextForPrivacy(
      "Kontakt: max.mustermann@example.de, Telefon +49 151 23456789, IBAN DE89370400440532013000.",
    );

    expect(result.containsSensitiveData).toBe(true);
    expect(result.sanitizedText).toContain("[EMAIL_1]");
    expect(result.sanitizedText).toContain("[PHONE_1]");
    expect(result.sanitizedText).toContain("[IBAN_1]");
    expect(result.categories).toEqual(expect.arrayContaining(["email", "phone", "iban"]));
  });

  it("pseudonymizes contextual identifiers such as tax, passport and insurance numbers", () => {
    const result = sanitizeTextForPrivacy(
      "Steuer-ID: 12/345/67890, Passnummer C01X00AB2, Krankenversicherung: AOK99887766",
    );

    expect(result.sanitizedText).toContain("Steuer-ID: [TAX_ID_1]");
    expect(result.sanitizedText).toContain("Passnummer [PASSPORT_1]");
    expect(result.sanitizedText).toContain("Krankenversicherung: [HEALTH_INSURANCE_1]");
  });

  it("supports runtime extension rules for additional international identifiers", () => {
    const result = sanitizeTextForPrivacy("Fiscal code IT-ABCDEF12G34H567I", {
      additionalContextualDefinitions: [
        {
          category: "tax_identifier",
          keywords: ["fiscal code"],
        },
      ],
    });

    expect(result.sanitizedText).toContain("Fiscal code [TAX_ID_1]");
  });

  it("applies manually managed custom privacy rules globally", () => {
    createCustomPrivacyRule({
      name: "Mandantenreferenz",
      kind: "contextual",
      category: "personal_identifier",
      keywords: ["mandanten-id", "client reference"],
    });

    const result = sanitizeTextForPrivacy("Mandanten-ID: C-7788-44 muss vor der KI-Verarbeitung entfernt werden.");

    expect(result.sanitizedText).toContain("Mandanten-ID: [PERSON_ID_1]");
    expect(result.categories).toContain("personal_identifier");
  });

  it("creates, lists and removes manual privacy rules", () => {
    const rule = createCustomPrivacyRule({
      name: "Interne Ledger-ID",
      kind: "regex",
      category: "tax_identifier",
      pattern: "LEDGER-[0-9]{4}",
      flags: "giu",
      validator: "none",
    });

    expect(listCustomPrivacyRules()).toHaveLength(1);
    expect(listCustomPrivacyRules()[0]?.name).toBe("Interne Ledger-ID");

    const result = sanitizeTextForPrivacy("Bitte prüfe LEDGER-4821 vor dem Export.");
    expect(result.sanitizedText).toContain("[TAX_ID_1]");

    deleteCustomPrivacyRule(rule.id);
    expect(listCustomPrivacyRules()).toHaveLength(0);
  });

  it("combines multiple sanitization results into one auditable summary", () => {
    const threshold = sanitizeTextForPrivacy("IBAN DE89370400440532013000");
    const detail = sanitizeTextForPrivacy("Personalausweis ABC1234567");
    const combined = combinePrivacySanitizationResults(threshold, detail);

    expect(combined.detectionCount).toBe(2);
    expect(summarizePrivacySanitization(combined)).toContain("2 sensible Datenelement(e) pseudonymisiert");
    expect(combined.categories).toEqual(expect.arrayContaining(["iban", "personal_identifier"]));
  });
});
