export type LegalDocType = "terms" | "privacy";

const GITHUB_PAGES_BASE =
  "https://nishan456singh.github.io/TruckerLedger";
const RAW_GITHUB_BASE =
  "https://raw.githubusercontent.com/Nishan456singh/TruckerLedger/main/docs";

const LEGAL_DOCS: Record<
  LegalDocType,
  { title: string; path: string }
> = {
  terms: {
    title: "Terms and Conditions",
    path: "TERMS.html",
  },
  privacy: {
    title: "Privacy Policy",
    path: "PRIVACY_POLICY.html",
  },
};

export function isLegalDocType(value: string): value is LegalDocType {
  return value === "terms" || value === "privacy";
}

export function getLegalDocMeta(type: LegalDocType) {
  const doc = LEGAL_DOCS[type];

  return {
    title: doc.title,
    url: `${GITHUB_PAGES_BASE}/${doc.path}`,
    fallbackUrl: `${RAW_GITHUB_BASE}/${doc.path}`,
  };
}