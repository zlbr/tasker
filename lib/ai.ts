"use server";
import { generateText } from "ai";
import {
  categorizeAction,
  detectMissingEntities,
  getBasePrompt,
} from "./prompt";
import { createAnthropic } from "@ai-sdk/anthropic";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_KEY,
});

export interface AIResponse {
  decision: string;
  rationale: string;
  confidence: string;
  suggested_response: string;
}

export default async function getResponse(
  prompt: string,
): Promise<{ parsed: AIResponse; raw: string }> {
  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    prompt,
  });

  const keys = [
    "decision",
    "rationale",
    "confidence",
    "suggested_response",
  ] as const;

  let json: AIResponse;
  try {
    json = JSON.parse(text) as AIResponse;
  } catch {
    throw new Error(`Failed to parse AI response as JSON. Raw output: ${text}`);
  }

  for (const k of keys) {
    if (!json[k] || typeof json[k] !== "string")
      throw new Error(`${k} is missing or invalid type`);
  }

  return { parsed: json, raw: text };
}

export interface RunAIResponse {
  error?: string;
  res?: AIResponse;
  debug?: {
    prompt: string;
    rawOutput: string;
    actionType: string;
    signals: Record<string, boolean | undefined>;
    possiblyMissing: string[];
  };
}

export async function runAI(_prevState: RunAIResponse, formData: FormData) {
  const turns = JSON.parse(String(formData.get("turns") || "[]")) as {
    role: string;
    message: string;
  }[];

  const proposedAction = String(formData.get("proposed_action") || "");
  const userPrompt = String(formData.get("userPrompt") || "");

  if (!proposedAction || !userPrompt)
    return {
      error: "missing proposed action or user prompt",
    };

  const actionInfo = categorizeAction(proposedAction);
  const possiblyMissing = detectMissingEntities(
    userPrompt,
    actionInfo.actionType,
  );

  const prompt = getBasePrompt({
    ...actionInfo,
    turns,
    userPrompt,
    proposedAction,
    possiblyMissing,
  });

  const debug = {
    prompt,
    rawOutput: "",
    actionType: actionInfo.actionType,
    signals: actionInfo.signals,
    possiblyMissing,
  };

  try {
    const { parsed, raw } = await getResponse(prompt);
    return { res: parsed, debug: { ...debug, rawOutput: raw } };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "AI request failed" };
  }
}
