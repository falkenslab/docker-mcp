import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  guide: ["intro", "getting-started", { type: "category", label: "Reference", items: ["reference/tools", "releases"] }],
};

export default sidebars;
