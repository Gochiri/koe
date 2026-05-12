/**
 * Static metadata + explanatory copy for each Dan Koe framework.
 * Content is hardcoded (extracted from the NotebookLM notebook) so the app
 * doesn't depend on the notebook at runtime.
 */
export type FrameworkMeta = {
  slug: string;
  name: string;
  tagline: string;
  domain: string;
  /** Sections explaining how the framework works — rendered inside a collapsible. */
  howItWorks: { heading: string; body: string }[];
  /** Direct Dan Koe quote/source, if applicable. */
  source?: { label: string; url?: string }[];
};
