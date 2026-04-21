export type SensitiveDataCategory =
  | "email"
  | "phone"
  | "iban"
  | "bank_account"
  | "tax_identifier"
  | "personal_identifier"
  | "drivers_license"
  | "health_insurance"
  | "passport"
  | "payment_card";

export type SensitiveDataDetection = {
  category: SensitiveDataCategory;
  label: string;
  match: string;
  placeholder: string;
};

export type PrivacySanitizationResult = {
  originalText: string;
  sanitizedText: string;
  containsSensitiveData: boolean;
  detectionCount: number;
  detections: SensitiveDataDetection[];
  categories: SensitiveDataCategory[];
};

export const privacyProtectionCatalog = [
  { category: "email", label: "E-Mail-Adressen", strategy: "globale Mustererkennung" },
  { category: "phone", label: "Telefonnummern", strategy: "globale Mustererkennung" },
  { category: "iban", label: "IBAN", strategy: "Regex plus Mod-97-Prüfung" },
  { category: "bank_account", label: "Bankverbindungen", strategy: "Schlüsselwortbasierte Maskierung" },
  { category: "tax_identifier", label: "Steuer- und VAT-IDs", strategy: "Schlüsselwort- und Mustererkennung" },
  { category: "personal_identifier", label: "Personalausweis- und nationale ID-Nummern", strategy: "Schlüsselwortbasierte Maskierung" },
  { category: "drivers_license", label: "Führerschein- und Lizenznummern", strategy: "Schlüsselwortbasierte Maskierung" },
  { category: "health_insurance", label: "Krankenversicherungsnummern", strategy: "Schlüsselwortbasierte Maskierung" },
  { category: "passport", label: "Reisepass- und Passnummern", strategy: "Schlüsselwortbasierte Maskierung" },
  { category: "payment_card", label: "Kartennummern", strategy: "Regex plus Luhn-Prüfung" },
] as const;

const categoryLabels: Record<SensitiveDataCategory, string> = {
  email: "EMAIL",
  phone: "PHONE",
  iban: "IBAN",
  bank_account: "BANK_ACCOUNT",
  tax_identifier: "TAX_ID",
  personal_identifier: "PERSON_ID",
  drivers_license: "DRIVERS_LICENSE",
  health_insurance: "HEALTH_INSURANCE",
  passport: "PASSPORT",
  payment_card: "PAYMENT_CARD",
};

export type PrivacyContextualDefinition = {
  category: SensitiveDataCategory;
  keywords: string[];
};

export type PrivacyRegexDefinition = {
  category: SensitiveDataCategory;
  regex: RegExp;
  validator?: (value: string) => boolean;
};

export type PrivacySanitizationOptions = {
  additionalContextualDefinitions?: PrivacyContextualDefinition[];
  additionalRegexDefinitions?: PrivacyRegexDefinition[];
};

const contextualDefinitions: PrivacyContextualDefinition[] = [
  {
    category: "tax_identifier",
    keywords: ["steuernummer", "steuer-id", "steuer id", "tax id", "tax number", "tin", "vat id", "vat number", "ust-id", "umsatzsteuer-id"],
  },
  {
    category: "personal_identifier",
    keywords: ["personalausweis", "ausweisnummer", "id nummer", "national id", "personal id", "identity number", "ssn", "social security"],
  },
  {
    category: "drivers_license",
    keywords: ["führerschein", "fuehrerschein", "driver license", "drivers license", "driving licence", "license number"],
  },
  {
    category: "health_insurance",
    keywords: ["krankenversicherung", "versicherungsnummer", "insurance number", "health insurance", "policy number", "member id"],
  },
  {
    category: "passport",
    keywords: ["reisepass", "passnummer", "passport", "passport number", "travel document"],
  },
  {
    category: "bank_account",
    keywords: ["kontonummer", "bankverbindung", "account number", "routing number", "sort code", "swift", "bic"],
  },
];

function createPlaceholder(category: SensitiveDataCategory, index: number) {
  return `[${categoryLabels[category]}_${index}]`;
}

function addDetection(
  detections: SensitiveDataDetection[],
  counters: Record<SensitiveDataCategory, number>,
  category: SensitiveDataCategory,
  match: string,
) {
  counters[category] = (counters[category] ?? 0) + 1;
  const placeholder = createPlaceholder(category, counters[category]);
  detections.push({
    category,
    label: categoryLabels[category],
    match,
    placeholder,
  });
  return placeholder;
}

function normalizeIbanCandidate(value: string) {
  return value.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

function isValidIban(value: string) {
  const candidate = normalizeIbanCandidate(value);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(candidate)) {
    return false;
  }

  const rearranged = `${candidate.slice(4)}${candidate.slice(0, 4)}`;
  let expanded = "";
  for (const char of rearranged) {
    expanded += /[A-Z]/.test(char) ? String(char.charCodeAt(0) - 55) : char;
  }

  let remainder = 0;
  for (const digit of expanded) {
    remainder = (remainder * 10 + Number(digit)) % 97;
  }

  return remainder === 1;
}

function isLikelyPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

function isLikelyCard(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyRegexReplacement(
  text: string,
  regex: RegExp,
  category: SensitiveDataCategory,
  detections: SensitiveDataDetection[],
  counters: Record<SensitiveDataCategory, number>,
  validator?: (value: string) => boolean,
) {
  return text.replace(regex, match => {
    if (validator && !validator(match)) {
      return match;
    }
    return addDetection(detections, counters, category, match);
  });
}

function applyContextualReplacement(
  text: string,
  category: SensitiveDataCategory,
  keywords: string[],
  detections: SensitiveDataDetection[],
  counters: Record<SensitiveDataCategory, number>,
) {
  const keywordPattern = keywords.map(escapeRegex).join("|");
  const regex = new RegExp(`\\b(${keywordPattern})\\b(\\s*[:=#-]?\\s*)([A-Z0-9][A-Z0-9./\\- ]{4,40})`, "giu");
  return text.replace(regex, (_match, keyword: string, separator: string, value: string) => {
    const normalizedValue = value.trim();
    if (normalizedValue.length < 5) {
      return `${keyword}${separator}${value}`;
    }
    const placeholder = addDetection(detections, counters, category, normalizedValue);
    return `${keyword}${separator}${placeholder}`;
  });
}

export function sanitizeTextForPrivacy(
  input: string,
  options: PrivacySanitizationOptions = {},
): PrivacySanitizationResult {
  const detections: SensitiveDataDetection[] = [];
  const counters = {
    email: 0,
    phone: 0,
    iban: 0,
    bank_account: 0,
    tax_identifier: 0,
    personal_identifier: 0,
    drivers_license: 0,
    health_insurance: 0,
    passport: 0,
    payment_card: 0,
  } satisfies Record<SensitiveDataCategory, number>;

  const mergedContextualDefinitions = [
    ...contextualDefinitions,
    ...(options.additionalContextualDefinitions ?? []),
  ];
  const additionalRegexDefinitions = options.additionalRegexDefinitions ?? [];

  let sanitizedText = input;
  sanitizedText = applyRegexReplacement(sanitizedText, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "email", detections, counters);
  sanitizedText = applyRegexReplacement(sanitizedText, /\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{3,5}){2,7}\b/g, "iban", detections, counters, isValidIban);
  sanitizedText = applyRegexReplacement(sanitizedText, /(?<!\d)(?:\d[ -]?){13,19}(?!\d)/g, "payment_card", detections, counters, isLikelyCard);

  for (const definition of additionalRegexDefinitions) {
    sanitizedText = applyRegexReplacement(sanitizedText, definition.regex, definition.category, detections, counters, definition.validator);
  }

  for (const definition of mergedContextualDefinitions) {
    sanitizedText = applyContextualReplacement(sanitizedText, definition.category, definition.keywords, detections, counters);
  }

  sanitizedText = applyRegexReplacement(sanitizedText, /(?<!\w)(?:\+?\d[\d()./ -]{8,}\d)(?!\w)/g, "phone", detections, counters, isLikelyPhone);

  return {
    originalText: input,
    sanitizedText,
    containsSensitiveData: detections.length > 0,
    detectionCount: detections.length,
    detections,
    categories: Array.from(new Set(detections.map(item => item.category))),
  };
}

export function combinePrivacySanitizationResults(...results: PrivacySanitizationResult[]): PrivacySanitizationResult {
  const originalText = results.map(item => item.originalText).filter(Boolean).join("\n");
  const sanitizedText = results.map(item => item.sanitizedText).filter(Boolean).join("\n");
  const detections = results.flatMap(item => item.detections);

  return {
    originalText,
    sanitizedText,
    containsSensitiveData: detections.length > 0,
    detectionCount: detections.length,
    detections,
    categories: Array.from(new Set(detections.map(item => item.category))),
  };
}

export function summarizePrivacySanitization(result: PrivacySanitizationResult) {
  if (!result.containsSensitiveData) {
    return "Keine sensiblen Identifikatoren erkannt.";
  }

  const labels = Array.from(new Set(result.detections.map(item => item.label))).join(", ");
  return `${result.detectionCount} sensible Datenelement(e) pseudonymisiert: ${labels}.`;
}

export function getPrivacyProtectionSummary() {
  return {
    enabled: true,
    mode: "pseudonymization_before_ai" as const,
    strictness: "high" as const,
    coverageModel: "global_heuristic_patterns" as const,
    configurable: true,
    notes: "Erkennt und pseudonymisiert strukturierte Identifikatoren vor KI-nahen Datenflüssen. Vollständige weltweite Formatabdeckung ist heuristisch und erweiterbar, nicht abschließend.",
    supportedCategories: privacyProtectionCatalog,
  };
}
