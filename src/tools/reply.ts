/** A tool's result: the structured content, and the same as text for clients that only read text. */
export function reply<T extends Record<string, unknown>>(content: T) {
  return { structuredContent: content, content: [{ type: "text" as const, text: JSON.stringify(content, null, 2) }] };
}
