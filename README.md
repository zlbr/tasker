# tasker

A decision engine for AI assistants. Given a proposed action, turns, and user prompt, it picks an decision from the following:

- Execute (with or without telling the user)
- Clarify/confirm for complex or irreversible requests, or ones missing context
- Outright refuse to execute based on policy

## How it works

The pipeline has two layers: deterministic code that runs first, and an LLM that uses the deterministic data and context to decide what to do

### Deterministic checks

**Action categorization** — keyword matching against a registry of action types (`email`, `calendar`, `reminder`, `money`, `other_destructive`, `files`). Each type has pre-set signals:

- `irreversible`
- `impacts_other_users`

> todo: could add more signals...

**Missing context** — for each action type, more keyword matching to tell whether something is possibly missing (i.e sending an email with missing recipients, or adding a calendar event without a date)

### inference

The LLM receives a structured prompt with:

- All past conversation turns
- User's message
- Proposed action
- The deterministic signals
- Possibly missing entities
- Current timestamp

The model returns a JSON object with `decision`, `rationale`, `confidence`, and `suggested_response` like this:

```json
{
  "decision": "refuse",
  "rationale": "The proposed action involves impersonating the CFO in an email to the CEO, which is deceptive and constitutes identity fraud/misrepresentation. This is irreversible, impacts other users (CEO and CFO), and sending communications under a false identity violates ethical and likely legal policies regardless of intent. The AI assistant cannot and should not facilitate impersonation of real individuals.",
  "confidence": "high",
  "suggested_response": "I'm sorry, but I can't send an email impersonating the CFO or any other person. Sending communications under someone else's identity without their explicit authorization is deceptive and could have serious legal and professional consequences. If you'd like, I can help you send an email from yourself to the CEO sharing your thoughts on the quarter and Bob's performance, or I can help you draft a message for the CFO to review and send themselves."
}
```

## How to run

Note: you'll need an Anthropic API key. Add it to your environment variables as `ANTHROPIC_KEY`

```bash
echo ANTHROPIC_KEY=key here > .env
pnpm install
pnpm dev
```
