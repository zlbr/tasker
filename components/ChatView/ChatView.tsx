"use client";
import { testData } from "@/lib/test-data";
import { useSearchParams } from "next/navigation";
import { ReactNode, useActionState, useEffect, useRef, useState } from "react";
import { AIResponse, RunAIResponse, runAI } from "@/lib/ai";
import { BookAlert, Loader, Megaphone, VolumeX, XCircle } from "lucide-react";

export default function ChatView() {
  const search = useSearchParams();
  const currentId = search.get("id") || "";
  const currentData = testData[currentId];

  const [actionRes, formAction, isLoading] = useActionState(runAI, {
    error: "",
    debug: undefined,
  });

  const [localTurns, setLocalTurns] = useState<
    { role: string; message: string }[]
  >(currentData?.turns ?? []);
  const [userPrompt, setUserPrompt] = useState(currentData?.userPrompt ?? "");
  const pendingUserPrompt = useRef("");

  useEffect(() => {
    if (!actionRes.res) return;
    setLocalTurns((prev) => [
      ...prev,
      { role: "user", message: pendingUserPrompt.current },
      { role: "assistant", message: actionRes.res!.suggested_response },
    ]);
    setUserPrompt("");
  }, [actionRes.res]);

  if (!currentData) {
    return (
      <div className="w-full flex flex-col items-center mt-16 text-2xl font-semibold">
        &lt;- Select a test
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {localTurns.map(({ role, message }, i) => (
        <div
          className={[
            "px-6 pt-4 pb-6 relative rounded-lg",
            role === "user" ? "bg-blue-500/25 text-end" : "bg-zinc-100/5",
          ].join(" ")}
          key={i}
        >
          {message}
          <div className="absolute right-0 bottom-0 text-sm font-bold font-mono text-zinc-400">
            {role}
          </div>
        </div>
      ))}
      {localTurns.length === 0 && (
        <div className="w-full text-center text-zinc-600 font-mono -mb-3">
          (no previous chat turns)
        </div>
      )}

      {/* new message */}
      <div className="mt-4 p-6 rounded-lg bg-blue-500/25">
        <form
          className="grid gap-4"
          action={formAction}
          onSubmit={() => {
            pendingUserPrompt.current = userPrompt;
          }}
        >
          <input
            type="hidden"
            name="turns"
            value={JSON.stringify(localTurns)}
          />

          <ChatViewInput
            label="Proposed action:"
            name="proposed_action"
            defaultValue={currentData.proposedAction}
          />

          <div className="flex flex-row gap-6 items-center">
            <h2 className="font-semibold whitespace-nowrap">User prompt:</h2>
            <input
              className="w-full p-2 rounded-t-md outline-none border-b-2 border-zinc-50 bg-zinc-50/10"
              type="text"
              name="userPrompt"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
            />
          </div>

          {actionRes.error && (
            <div className="bg-red-500/50 p-4">{actionRes.error}</div>
          )}

          <div className="flex flex-row-reverse gap-4 items-center">
            <button
              type="submit"
              className="bg-zinc-50/5 border border-zinc-50/25 p-2 rounded-md hover:opacity-50 duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Send message
            </button>
            {isLoading && <Loader className="animate-spin w-6 h-6" />}
          </div>
        </form>
      </div>

      {actionRes.res && !isLoading && <ActionResponse {...actionRes.res} />}
      {actionRes.debug && !isLoading && <DebugPanel debug={actionRes.debug} />}
    </div>
  );
}

function ActionResponse({
  decision,
  confidence,
  rationale,
  suggested_response,
}: AIResponse) {
  return (
    <div className="mt-4 p-6 rounded-lg bg-zinc-100/5 grid gap-4">
      <ActionDecision decision={decision} confidence={confidence}>
        {rationale}
      </ActionDecision>
      <p>{suggested_response}</p>
    </div>
  );
}

function ActionDecision({
  decision,
  confidence,
  children,
}: {
  decision: string;
  confidence: string;
  children: ReactNode;
}) {
  return (
    <div
      className={[
        "grid gap-2 p-4 rounded-md",
        decision == "execute_silent" || decision == "execute_notify"
          ? "bg-green-500/20"
          : "",
        decision == "confirm" || decision == "clarify"
          ? "bg-yellow-500/20"
          : "",
        decision == "refuse" ? "bg-red-500/20" : "",
      ].join(" ")}
    >
      <h1 className="text-xl font-semibold flex flex-row items-center gap-2">
        {decision == "execute_silent" && (
          <>
            <VolumeX className="text-green-500 w-6 h-6" />
            Execute (silently)
          </>
        )}
        {decision == "execute_notify" && (
          <>
            <Megaphone className="text-green-500 w-6 h-6" />
            Execute and notify
          </>
        )}
        {decision == "confirm" && (
          <>
            <BookAlert className="text-yellow-500 w-6 h-6" />
            Confirm
          </>
        )}
        {decision == "clarify" && (
          <>
            <BookAlert className="text-yellow-500 w-6 h-6" />
            Clarify
          </>
        )}
        {decision == "refuse" && (
          <>
            <XCircle className="text-red-500 w-6 h-6" />
            Refuse request
          </>
        )}
      </h1>
      <p className="text-zinc-300">Model confidence: {confidence}</p>
      <p className="italic text-zinc-300">{children}</p>
    </div>
  );
}

function DebugPanel({ debug }: { debug: NonNullable<RunAIResponse["debug"]> }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-zinc-50/10 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-950 text-sm font-mono text-zinc-400 hover:text-zinc-200 duration-150"
        onClick={() => setOpen((o) => !o)}
      >
        <span>under the hood</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="p-4 grid gap-4 bg-zinc-950/50 font-mono text-sm">
          <DebugSection label="signals">
            <DebugRow label="action type" value={debug.actionType} />
            {Object.entries(debug.signals)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => (
                <DebugRow key={k} label={k} value={String(v)} />
              ))}
            <DebugRow
              label="possibly missing"
              value={
                debug.possiblyMissing.length
                  ? debug.possiblyMissing.join(", ")
                  : "none"
              }
            />
          </DebugSection>

          <DebugSection label="Prompt sent to model">
            <pre className="whitespace-pre-wrap text-zinc-300 text-xs leading-relaxed">
              {debug.prompt}
            </pre>
          </DebugSection>

          <DebugSection label="Raw model output">
            <pre className="whitespace-pre-wrap text-zinc-300 text-xs">
              {debug.rawOutput}
            </pre>
          </DebugSection>
        </div>
      )}
    </div>
  );
}

function DebugSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <p className="text-zinc-500 uppercase text-xs tracking-widest">{label}</p>
      {children}
    </div>
  );
}

function DebugRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-xs">
      <span className="text-zinc-500 w-40 shrink-0">{label}</span>
      <span className="text-zinc-300">{value}</span>
    </div>
  );
}

function ChatViewInput({
  label,
  defaultValue,
  name,
}: {
  label: string;
  defaultValue: string;
  name: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="flex flex-row gap-6 items-center">
      <h2 className="font-semibold whitespace-nowrap">{label}</h2>
      <input
        className="w-full p-2 rounded-t-md outline-none border-b-2 border-zinc-50 bg-zinc-50/10"
        type="text"
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}
