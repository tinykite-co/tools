import { describe, expect, it } from "vitest";
import {
  buildFeedbackMailto,
  buildFeedbackUrl,
  FEEDBACK_EMAIL,
  readFeedbackContext
} from "./feedback";

const FEEDBACK_PAGE = "/tools/feedback/";

function decodeMailto(mailto: string) {
  const [address, query] = mailto.replace(/^mailto:/, "").split("?");
  const pairs = query.split("&").map((pair) => pair.split("="));
  const fields = Object.fromEntries(pairs.map(([key, value]) => [key, decodeURIComponent(value)]));
  return { address, subject: fields.subject, body: fields.body };
}

describe("buildFeedbackUrl", () => {
  it("passes the tool, version and browser to the feedback page", () => {
    expect(
      buildFeedbackUrl(FEEDBACK_PAGE, { tool: "word-count", version: "0.1.0", userAgent: "Test UA" })
    ).toBe("/tools/feedback/?tool=word-count&version=0.1.0&ua=Test+UA");
  });

  it("omits fields that are missing or empty", () => {
    expect(buildFeedbackUrl(FEEDBACK_PAGE, { tool: "word-count", userAgent: "" })).toBe(
      "/tools/feedback/?tool=word-count"
    );
  });

  it("returns the bare page path when there is no context", () => {
    expect(buildFeedbackUrl(FEEDBACK_PAGE, {})).toBe(FEEDBACK_PAGE);
  });
});

describe("readFeedbackContext", () => {
  it("reads back what buildFeedbackUrl wrote", () => {
    const context = { tool: "resize-image", version: "0.1.0", userAgent: "Mozilla/5.0 (X11)" };
    const url = buildFeedbackUrl(FEEDBACK_PAGE, context);
    expect(readFeedbackContext(url.slice(url.indexOf("?")))).toEqual(context);
  });

  it("drops blank values and ignores unknown parameters", () => {
    expect(readFeedbackContext("?tool=%20&version=0.1.0&utm_source=x")).toEqual({ version: "0.1.0" });
  });

  it("returns an empty context for an empty query string", () => {
    expect(readFeedbackContext("")).toEqual({});
  });
});

describe("buildFeedbackMailto", () => {
  it("addresses the support inbox with the tool and version in the subject", () => {
    const mail = decodeMailto(buildFeedbackMailto({ tool: "word-count", version: "0.1.0" }));
    expect(mail.address).toBe(FEEDBACK_EMAIL);
    expect(mail.subject).toBe("TinyKite Tools feedback: word-count (v0.1.0)");
  });

  it("lists the known details in the body, one per CRLF line", () => {
    const mail = decodeMailto(
      buildFeedbackMailto({ tool: "word-count", version: "0.1.0", userAgent: "Test UA" })
    );
    expect(mail.body.split("\r\n")).toEqual([
      "Tool: word-count",
      "Version: 0.1.0",
      "Browser: Test UA",
      "",
      "What happened, or what would you like to see?"
    ]);
  });

  it("falls back to a generic message when there is no context", () => {
    const mail = decodeMailto(buildFeedbackMailto({}));
    expect(mail.subject).toBe("TinyKite Tools feedback");
    expect(mail.body).toBe("What happened, or what would you like to see?");
  });

  it("leaves the version out of the subject when it is unknown", () => {
    expect(decodeMailto(buildFeedbackMailto({ tool: "word-count" })).subject).toBe(
      "TinyKite Tools feedback: word-count"
    );
  });

  it("encodes spaces as %20, never +, and escapes reserved characters", () => {
    const mailto = buildFeedbackMailto({ tool: "a&b=c?d" });
    expect(mailto).not.toContain("+");
    expect(mailto).toContain("%20");
    expect(decodeMailto(mailto).subject).toBe("TinyKite Tools feedback: a&b=c?d");
  });

  it("sends to a different inbox when one is given", () => {
    expect(buildFeedbackMailto({}, "hello@example.com")).toMatch(/^mailto:hello@example\.com\?/);
  });
});
