import { describe, expect, it } from "vitest";
import { createAppRoutes, createMainSiteLinks, joinBasePath } from "./urls";

describe("joinBasePath", () => {
  it("joins a base without a trailing slash", () => {
    expect(joinBasePath("/tools", "word-count/")).toBe("/tools/word-count/");
  });

  it("joins a base with a trailing slash", () => {
    expect(joinBasePath("/tools/", "word-count/")).toBe("/tools/word-count/");
  });

  it("drops a leading slash on the path so it cannot escape the base", () => {
    expect(joinBasePath("/tools", "/feedback/")).toBe("/tools/feedback/");
  });

  it("returns the base itself for an empty path", () => {
    expect(joinBasePath("/tools", "")).toBe("/tools/");
  });

  it("works when the app is mounted at the domain root", () => {
    expect(joinBasePath("/", "word-count/")).toBe("/word-count/");
    expect(joinBasePath("/", "")).toBe("/");
  });
});

describe("createAppRoutes", () => {
  const routes = createAppRoutes("/tools");

  it("roots every page at the base path, with a trailing slash", () => {
    expect(routes.home()).toBe("/tools/");
    expect(routes.tool("word-count")).toBe("/tools/word-count/");
    expect(routes.flow("document-cleanup")).toBe("/tools/flows/document-cleanup/");
    expect(routes.privacy()).toBe("/tools/privacy/");
    expect(routes.feedback()).toBe("/tools/feedback/");
  });

  it("roots every asset at the base path, without a trailing slash", () => {
    expect(routes.manifest()).toBe("/tools/manifest.webmanifest");
    expect(routes.serviceWorker()).toBe("/tools/sw.js");
  });

  it("follows the base path rather than assuming /tools", () => {
    const other = createAppRoutes("/utilities/");
    expect(other.home()).toBe("/utilities/");
    expect(other.feedback()).toBe("/utilities/feedback/");
    expect(other.manifest()).toBe("/utilities/manifest.webmanifest");
  });
});

describe("createMainSiteLinks", () => {
  it("builds absolute parent-site URLs", () => {
    expect(createMainSiteLinks("https://tinykite.co")).toEqual({
      home: "https://tinykite.co/",
      privacy: "https://tinykite.co/privacy/",
      terms: "https://tinykite.co/terms/",
      logo: "https://tinykite.co/icon.png"
    });
  });

  it("ignores any path on the site URL so links stay at the parent root", () => {
    expect(createMainSiteLinks("https://tinykite.co/tools/").privacy).toBe(
      "https://tinykite.co/privacy/"
    );
  });
});
