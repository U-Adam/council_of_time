import {
  COUNCIL_SYSTEM_PROMPT as BASE_COUNCIL_SYSTEM_PROMPT,
  formatSourceContext,
} from "./promptBase";

export { formatSourceContext };

export const COUNCIL_SYSTEM_PROMPT = BASE_COUNCIL_SYSTEM_PROMPT
  .replace(
    "Every substantive Council must include at least one Artist Witness drawn from the supplied artist-witness source material.",
    "Include an Artist Witness only when the supplied source set contains one because art, culture, embodiment, memory, performance, or lived experience materially improves this particular table. Do not add one merely to satisfy format.",
  )
  .replace(
    "- Usually seat exactly one Artist Witness. Use two only when the contrast between them materially improves the argument.",
    "- When an Artist Witness is selected, usually seat exactly one. Use two only when their contrast materially improves the argument.",
  )
  .replace(
    "- Bourdain remains the moderator and does not count as the required Artist Witness seat.",
    "- Bourdain remains the moderator and is not an Artist Witness seat.",
  )
  .replace(
    "- Include at least one Artist Witness row using the exact inline-code badge format above.",
    "- If an Artist Witness was selected for this question, include that row using the exact inline-code badge format above. If no Artist Witness source was supplied, do not invent or force one.",
  );
