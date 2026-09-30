import "server-only";
import type { LanguageModel } from "ai";
import { MockLanguageModelV4, simulateReadableStream } from "ai/test";
import { env } from "@/lib/env";

// The AI brick's single entry point: services never know whether they talk to a real model or a mock.
// AI_MODE=mock (default in dev, tests and previews): the fixture the caller provides, streamed in small chunks.
// AI_MODE=live: the AI Gateway, model configurable.
const LIVE_MODEL = "anthropic/claude-sonnet-5-5";

export type MockFixture = { text: string; usage: { inputTokens: number; outputTokens: number } };

function chunks(text: string): string[] {
  const words = text.split(" ");
  return words.map((word, i) => (i === 0 ? word : ` ${word}`));
}

export function getModel(fixture: MockFixture): LanguageModel {
  if (env.AI_MODE === "live") return LIVE_MODEL;
  return new MockLanguageModelV4({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunkDelayInMs: 20,
        chunks: [
          { type: "text-start", id: "0" },
          ...chunks(fixture.text).map((delta) => ({ type: "text-delta" as const, id: "0", delta })),
          { type: "text-end", id: "0" },
          {
            type: "finish",
            finishReason: { unified: "stop", raw: undefined },
            usage: {
              inputTokens: {
                total: fixture.usage.inputTokens,
                noCache: fixture.usage.inputTokens,
                cacheRead: 0,
                cacheWrite: 0,
              },
              outputTokens: { total: fixture.usage.outputTokens, text: fixture.usage.outputTokens, reasoning: 0 },
            },
          },
        ],
      }),
    }),
  });
}
