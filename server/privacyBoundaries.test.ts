import { describe, expect, it } from "vitest";
import { sanitizeMessagesForPrivacy, type Message } from "./_core/llm";
import { sanitizeNotificationPayload } from "./_core/notification";

describe("privacy boundaries", () => {
  it("pseudonymizes text message content before invokeLLM payload construction", () => {
    const messages: Message[] = [
      {
        role: "user",
        content: "Mandantenfall mit IBAN DE89370400440532013000, E-Mail max.mustermann@example.de und Personalausweis ABC1234567.",
      },
      {
        role: "assistant",
        content: [{ type: "text", text: "Steuer-ID 12/345/67890" }],
      },
    ];

    const sanitized = sanitizeMessagesForPrivacy(messages);

    expect(sanitized[0]?.content).toBe("Mandantenfall mit IBAN [IBAN_1], E-Mail [EMAIL_1] und Personalausweis [PERSON_ID_1]");
    expect(Array.isArray(sanitized[1]?.content)).toBe(true);
    expect((sanitized[1]?.content as Array<{ type: string; text?: string }>)[0]?.text).toContain("[TAX_ID_1]");
  });

  it("pseudonymizes notification titles and contents before delivery", () => {
    const sanitized = sanitizeNotificationPayload({
      title: "Sofortalarm für IBAN DE89370400440532013000",
      content: "Bitte prüfe Personalausweis ABC1234567 und max.mustermann@example.de vor Freigabe.",
    });

    expect(sanitized.title).toContain("[IBAN_1]");
    expect(sanitized.content).toContain("[PERSON_ID_1]");
    expect(sanitized.content).toContain("[EMAIL_1]");
    expect(sanitized.content).not.toContain("ABC1234567");
  });
});
