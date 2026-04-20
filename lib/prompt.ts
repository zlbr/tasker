export interface PromptInput {
  actionType: string;
  signals: Record<string, string | undefined>; // mapping of calculated signals
  turns: { role: string; message: string }[];
  userPrompt: string; // latest user message
  proposedAction: string;
  possiblyMissing: string[];
}

export const getBasePrompt = (
  input: PromptInput,
) => `You are an execution decision engine acting for an AI assistant that has access to users' communication suites (i.e chat messages, email, calendar, reminders, scheduling, etc).

Your task: given a proposed action and context, decide how to handle it.

Your response includes the following:

DECISION LABELS: respond with one of the following labels:
- execute_silent: Execute without notifying. Only for low-risk and fully reversible actions where intent is very clear, and nobody but the user is impacted
- execute_notify: Execute and then notify the user. Only for low-risk and fully reversible actions that have minor or no external impact, and the user would expect it to just happen.
- confirm: Ask the user to confirm with a yes/no question before executing. The intent is clear, but the action is irreversible, has external impact, or is risky
- clarify: Ask a clarifying question (i.e if the intent, recipient, eventtime, or something key to the action is unknown)
- refuse: Decline to execute the action. Policy disallows it, or risk/uncertainty is too high even after considering the conversation history

Keep in mind the following:

RULE: do not ignore conversation history. A confirmation response in the latest message doesn't mean execute if an earlier message contradicts or adds a condition on the action. You must trace the full arc of the conversation.

SIGNALS: Here are pre-computed signals generated from deterministic code. Use them in justification as they're facts, not suggestions:
${Object.keys(input.signals)
  .map((s) => `${s}: ${input.signals[s]}`)
  .join("\n")}

CONVERSATION HISTORY:
${input.turns.map(({ role, message }) => `${role}: "${message}"`).join("\n")}

LATEST USER MESSAGE: "${input.userPrompt}"

PROPOSED ACTION: "${input.proposedAction}"

POSSIBLY MISSING CONTEXT: ${input.possiblyMissing.join(", ")}

CURRENT TIMESTAMP: ${new Date().toISOString()}

You MUST Respond with ONLY a JSON object formatted like the one below. Do not add code fences or additional styling to it.:
{
  "decision": "<label>",
  "rationale": "<2-3 sentences explaining the decision, citing signals or conversation messages>",
  "confidence": "<high|medium|low>",
  "suggested_response": "<the response to the user that will be shown in the thread>"
}`;

// # Action keywords → category
export const actionTypes: Record<
  string,
  {
    keywords: string[]; // keywords indicating what kind of action it is
    possibly_missing_entities?: Record<string, string[]>; // keywords for missing entities in format entity_type:keywords

    // signals
    irreversible?: boolean;
    impacts_other_users?: boolean;
  }
> = {
  email: {
    keywords: ["email", "message", "reply", "forward", "send", "draft"],
    irreversible: true,
    impacts_other_users: true,
    possibly_missing_entities: {
      recipient: ["to", "reply", "forward"],
      subject: ["subject", "titled", "about", "re:"],
    },
  },
  calendar: {
    keywords: [
      "calendar",
      "schedule",
      "meeting",
      "appointment",
      "event",
      "invite",
      "reschedule",
      "book",
    ],
    impacts_other_users: true,
    possibly_missing_entities: {
      date: [
        "at",
        "today",
        "tomorrow",
        "days",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
      ],
    },
  },
  reminder: {
    keywords: ["reminder", "remind", "alert", "notify"],
  },
  money: {
    keywords: [
      "payment",
      "transfer",
      "pay",
      "money",
      "invoice",
      "charge",
      "billing",
      "$",
    ],
    irreversible: true,
    impacts_other_users: true,
  },
  other_destructive: {
    keywords: ["delete", "remove", "cancel", "clear", "purge", "unsubscribe"],
    irreversible: true,
  },
  files: {
    keywords: ["file", "document", "attachment", "upload", "download"],
  },
};

export const categorizeAction = (
  prompt: string,
): {
  actionType: string;
  signals: Record<string, string | undefined>;
} => {
  for (const actionType of Object.keys(actionTypes)) {
    const action = actionTypes[actionType];

    for (const word of action.keywords) {
      if (prompt.toLowerCase().includes(word)) {
        return {
          actionType,
          signals: {
            ...action,
            possibly_missing_entities: undefined,
            keywords: undefined,
          },
        };
      }
    }
  }

  return {
    actionType: "unknown",
    signals: {},
  };
};

export const detectMissingEntities = (prompt: string, actionType: string) => {
  const action = actionTypes[actionType];

  if (!action || !action.possibly_missing_entities) return [];

  const possiblyMissing: string[] = [];

  for (const entity of Object.keys(action.possibly_missing_entities)) {
    const keywords = action.possibly_missing_entities[entity];
    const foundKeywords = keywords
      .map((k) => prompt.toLowerCase().includes(k))
      .filter(Boolean);

    if (foundKeywords.length == 0) {
      possiblyMissing.push(entity);
    }
  }

  return possiblyMissing;
};
