export type LegalDocType = "terms" | "privacy";

const GITHUB_PAGES_BASE =
  "https://nishan456singh.github.io/TruckerLedger";

// Bundled HTML for Terms — used as fallback when the hosted URL is unavailable
const TERMS_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Terms of Service | TruckerLedger</title>
  <style>
    :root { color-scheme: light; --bg: #f4f6f8; --panel: #ffffff; --text: #1a1f2b; --muted: #4d5565; --accent: #0f6d8c; --accent-soft: #d9edf3; --border: #d8dee8; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; line-height: 1.65; color: var(--text); background: #eef3f6; padding: 24px 14px; }
    .policy { max-width: 900px; margin: 0 auto; background: var(--panel); border: 1px solid var(--border); border-radius: 14px; padding: 24px; }
    h1, h2 { line-height: 1.3; color: #152238; margin-top: 1.4em; margin-bottom: 0.6em; }
    h1 { margin-top: 0; font-size: 1.8rem; }
    h2 { font-size: 1.2rem; border-left: 4px solid var(--accent); padding-left: 10px; }
    p, li { font-size: 1rem; }
    ul { margin-top: 0.4em; margin-bottom: 1em; padding-left: 1.3em; }
    .meta { background: var(--accent-soft); border: 1px solid #b9dbe6; border-radius: 10px; padding: 12px 14px; margin-bottom: 20px; color: #14374b; }
    .contact { background: #f8fafc; border: 1px solid var(--border); border-radius: 10px; padding: 14px; }
    a { color: var(--accent); }
  </style>
</head>
<body>
  <main class="policy">
    <h1>Terms of Service for TruckerLedger</h1>
    <div class="meta"><strong>Effective Date:</strong> April 15, 2026<br><strong>Last Updated:</strong> April 15, 2026</div>
    <p>These Terms of Service ("Terms") govern your use of the TruckerLedger mobile application ("App") for iOS. By downloading, installing, or using the App, you agree to be bound by these Terms.</p>
    <p>TruckerLedger is developed and operated by Nishan Singh.</p>
    <h2>1. Acceptance of Terms</h2>
    <p>By accessing and using TruckerLedger, you acknowledge that you have read, understood, and agree to be legally bound by these Terms and our Privacy Policy.</p>
    <h2>2. License Grant</h2>
    <p>Subject to your compliance with these Terms, Nishan Singh grants you a limited, non-exclusive, non-transferable, revocable license to use TruckerLedger on your personal iOS device for your personal, non-commercial use only.</p>
    <p>You agree not to: copy, modify, or distribute the App; reverse engineer or decompile the App; use the App for any commercial purpose; remove proprietary notices; or attempt unauthorized access to any portion of the App.</p>
    <h2>3. User Responsibilities</h2>
    <p>You are responsible for maintaining confidentiality of account credentials, all activity under your account, and ensuring your use complies with applicable laws. Back up your data regularly — we are not liable for data loss.</p>
    <h2>4. Data Ownership</h2>
    <p>All data you create in TruckerLedger belongs to you. By using the App, you grant TruckerLedger a non-exclusive license to store and process your data solely to provide App functionality. You are solely responsible for the accuracy and legality of data you input.</p>
    <h2>5. Intellectual Property Rights</h2>
    <p>TruckerLedger, including its design, functionality, code, and contents (excluding user-generated data), is the property of Nishan Singh and is protected by copyright and other intellectual property laws.</p>
    <h2>6. Disclaimer of Warranties</h2>
    <p>TruckerLedger is provided on an "as-is" and "as-available" basis. To the fullest extent permitted by law, Nishan Singh disclaims all warranties, whether express or implied.</p>
    <h2>7. Limitation of Liability</h2>
    <p>To the maximum extent permitted by law, Nishan Singh shall not be liable for any indirect, incidental, special, consequential, punitive, or exemplary damages arising from your use of TruckerLedger.</p>
    <h2>8. Contact Information</h2>
    <div class="contact"><p><strong>Nishan Singh</strong><br>Email: <a href="mailto:nishan456singh@gmail.com">nishan456singh@gmail.com</a></p></div>
  </main>
</body>
</html>`;

const LEGAL_DOCS: Record<
  LegalDocType,
  { title: string; path: string; localHtml?: string }
> = {
  terms: {
    title: "Terms and Conditions",
    path: "TERMS.html",
    localHtml: TERMS_HTML,
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
    localHtml: doc.localHtml,
  };
}