/**
 * Feedback goes by email to the support inbox tinykite.co already publishes on
 * its contact and support pages. The site is static, so the feedback page
 * cannot read its query string at build time: tool pages pass their context in
 * the URL and the feedback page turns it into a prefilled email in the browser.
 */

/** Inbox that receives tools feedback. */
export const FEEDBACK_EMAIL = "support@tinykite.co";

/** Query parameters shared by the tool-page link and the feedback page. */
export const FEEDBACK_QUERY_PARAMS = {
  tool: "tool",
  version: "version",
  userAgent: "ua"
} as const;

/** DOM id of the feedback page's email link, which the page script prefills. */
export const FEEDBACK_EMAIL_LINK_ID = "feedback-email";

const SUBJECT_PREFIX = "TinyKite Tools feedback";
const BODY_PROMPT = "What happened, or what would you like to see?";
/** RFC 6068: line breaks in a mailto body are CRLF. */
const MAIL_LINE_BREAK = "\r\n";

/** Where a piece of feedback came from. Every field is optional. */
export interface FeedbackContext {
  tool?: string;
  version?: string;
  userAgent?: string;
}

type FeedbackField = keyof FeedbackContext;

const FEEDBACK_FIELDS = Object.keys(FEEDBACK_QUERY_PARAMS) as FeedbackField[];

const BODY_LABELS: Record<FeedbackField, string> = {
  tool: "Tool",
  version: "Version",
  userAgent: "Browser"
};

/** Builds the feedback page URL, carrying the tool and version it came from. */
export function buildFeedbackUrl(feedbackPagePath: string, context: FeedbackContext): string {
  const search = new URLSearchParams();
  for (const field of FEEDBACK_FIELDS) {
    const value = context[field];
    if (value) {
      search.set(FEEDBACK_QUERY_PARAMS[field], value);
    }
  }
  const query = search.toString();
  return query ? `${feedbackPagePath}?${query}` : feedbackPagePath;
}

/** Reads the context back from the feedback page's query string, dropping blanks. */
export function readFeedbackContext(search: string): FeedbackContext {
  const params = new URLSearchParams(search);
  const context: FeedbackContext = {};
  for (const field of FEEDBACK_FIELDS) {
    const value = params.get(FEEDBACK_QUERY_PARAMS[field])?.trim();
    if (value) {
      context[field] = value;
    }
  }
  return context;
}

function buildSubject({ tool, version }: FeedbackContext): string {
  if (!tool) {
    return SUBJECT_PREFIX;
  }
  const versionSuffix = version ? ` (v${version})` : "";
  return `${SUBJECT_PREFIX}: ${tool}${versionSuffix}`;
}

function buildBody(context: FeedbackContext): string {
  const details = FEEDBACK_FIELDS.filter((field) => context[field]).map(
    (field) => `${BODY_LABELS[field]}: ${context[field]}`
  );
  const lines = details.length > 0 ? [...details, "", BODY_PROMPT] : [BODY_PROMPT];
  return lines.join(MAIL_LINE_BREAK);
}

/**
 * Builds a mailto link prefilled from the context. Encodes with
 * encodeURIComponent, not URLSearchParams: mail clients show a "+" literally
 * instead of reading it as a space.
 */
export function buildFeedbackMailto(context: FeedbackContext, email: string = FEEDBACK_EMAIL): string {
  const subject = encodeURIComponent(buildSubject(context));
  const body = encodeURIComponent(buildBody(context));
  return `mailto:${email}?subject=${subject}&body=${body}`;
}
