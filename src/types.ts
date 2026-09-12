export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type CouncilSource = {
  id: string;
  title: string;
  url: string;
  kind: "primary" | "scholarship" | "official";
};

export type CouncilResponse = {
  answer: string;
  pause?: {
    question: string;
  } | null;
  sources: CouncilSource[];
  model?: string;
  recoveredWithFallback?: boolean;
  requestId?: string;
};
