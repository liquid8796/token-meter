export interface WorkloadPreset {
  slug: string;
  name: string;
  description: string;
  inputText: string;
  outputText: string;
  cachedText: string;
  contextText: string;
  disclaimer: string;
}

const DISCLAIMER = "Example starting point only; replace these values with your measured workload before making budget decisions.";

export const WORKLOAD_PRESETS: WorkloadPreset[] = [
  {
    slug: "chatbot",
    name: "Chatbot",
    description: "Moderate conversational traffic with short request context.",
    inputText: "5M",
    outputText: "1.5M",
    cachedText: "0",
    contextText: "8K",
    disclaimer: DISCLAIMER,
  },
  {
    slug: "rag",
    name: "RAG pipeline",
    description: "Retrieval-heavy prompts with reusable system and document context.",
    inputText: "12M",
    outputText: "2M",
    cachedText: "2M",
    contextText: "32K",
    disclaimer: DISCLAIMER,
  },
  {
    slug: "coding-agent",
    name: "Coding agent",
    description: "Longer agent turns with tool traces and code context.",
    inputText: "20M",
    outputText: "8M",
    cachedText: "5M",
    contextText: "64K",
    disclaimer: DISCLAIMER,
  },
  {
    slug: "document-processing",
    name: "Document processing",
    description: "High input volume with concise structured outputs.",
    inputText: "50M",
    outputText: "5M",
    cachedText: "0",
    contextText: "128K",
    disclaimer: DISCLAIMER,
  },
  {
    slug: "high-cache",
    name: "High-cache workload",
    description: "Repeated prompt prefixes where published cache-read pricing matters.",
    inputText: "30M",
    outputText: "3M",
    cachedText: "20M",
    contextText: "16K",
    disclaimer: DISCLAIMER,
  },
];

export function getWorkloadPreset(slug: string): WorkloadPreset | undefined {
  return WORKLOAD_PRESETS.find((preset) => preset.slug === slug);
}
