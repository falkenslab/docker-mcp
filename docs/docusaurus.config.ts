import { existsSync } from "node:fs";
import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// The released versions' docs are snapshots (versions.json, made on each release); the current docs
// are the next release's, shown as such until one is cut.
const released = existsSync(new URL("./versions.json", import.meta.url));
const NAME = "mcp-server-template";
const REPO = `https://github.com/falkenslab/${NAME}`;
const NPM = `https://www.npmjs.com/package/@falkenslab/${NAME}`;

const config: Config = {
  title: NAME,
  tagline: "A Falken's Lab MCP server.",
  favicon: "img/logo.svg",

  url: "https://falkenslab.github.io",
  baseUrl: `/${NAME}/`,
  organizationName: "falkenslab",
  projectName: NAME,
  trailingSlash: false,

  onBrokenLinks: "throw",
  onBrokenAnchors: "throw",
  markdown: { hooks: { onBrokenMarkdownLinks: "throw" } },

  i18n: {
    defaultLocale: "en",
    locales: ["en", "es"],
    localeConfigs: { en: { label: "English" }, es: { label: "Español" } },
  },

  presets: [
    [
      "classic",
      {
        docs: {
          path: "content",
          routeBasePath: "/",
          sidebarPath: "./sidebars.ts",
          editLocalizedFiles: true,
          editUrl: ({ locale, docPath }) =>
            locale === "en" ? `${REPO}/edit/main/docs/content/${docPath}` : `${REPO}/edit/main/docs/i18n/${locale}/docusaurus-plugin-content-docs/current/${docPath}`,
          ...(released && { versions: { current: { label: "Next (unreleased)", path: "next", banner: "unreleased" } } }),
        },
        blog: false,
        theme: { customCss: "./src/css/custom.css" },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    [
      "@easyops-cn/docusaurus-search-local",
      { hashed: true, language: ["en", "es"], docsDir: "content", docsRouteBasePath: "/", indexBlog: false, highlightSearchTermsOnTargetPage: true },
    ],
  ],

  themeConfig: {
    colorMode: { respectPrefersColorScheme: true },
    navbar: {
      title: NAME,
      logo: { alt: NAME, src: "img/logo.svg" },
      items: [
        { type: "docSidebar", sidebarId: "guide", position: "left", label: "Guide" },
        { type: "doc", docId: "reference/tools", position: "left", label: "Tools" },
        ...(released ? [{ type: "docsVersionDropdown" as const, position: "right" as const }] : []),
        { type: "localeDropdown", position: "right" },
        { href: NPM, label: "npm", position: "right" },
        { href: REPO, label: "GitHub", position: "right" },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Documentation",
          items: [
            { label: "Getting started", to: "/getting-started" },
            { label: "Tools", to: "/reference/tools" },
            { label: "Releases", to: "/releases" },
          ],
        },
        {
          title: "Project",
          items: [
            { label: "GitHub", href: REPO },
            { label: "Issues", href: `${REPO}/issues` },
            { label: "npm", href: NPM },
          ],
        },
        {
          title: "Related",
          items: [
            { label: "agent-kit", href: "https://falkenslab.github.io/agent-kit/" },
            { label: "Model Context Protocol", href: "https://modelcontextprotocol.io" },
          ],
        },
      ],
      copyright: "Made with 💖 by Falken's Lab Team",
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["bash", "json", "powershell"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
