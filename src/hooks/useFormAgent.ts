"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { agentResponseSchema, deriveRiskFlags, initialFormState, normalizeFormState, validateCompletedForm, type AgentMessage, type AIUseFormState, type FormSectionKey, type FormStateUpdate } from "@/lib/form-schema";

const message = (role: AgentMessage["role"], content: string): AgentMessage => ({ id: crypto.randomUUID(), role, content });

function mergeUpdate(current: AIUseFormState, update: FormStateUpdate) {
  const next = structuredClone(current);
  for (const key of Object.keys(update) as FormSectionKey[]) {
    Object.assign(next[key], update[key]);
  }
  return normalizeFormState(next);
}

export function useFormAgent() {
  const [formState, setFormState] = useState(() => structuredClone(initialFormState));
  const [messages, setMessages] = useState<AgentMessage[]>([
    message("agent", "Welcome. I’ll guide you through all 11 sections and ask focused follow-ups so the final form is specific enough for review. To start, what will this AI system do in the real-world workflow?"),
  ]);
  const [activeSection, setActiveSection] = useState<FormSectionKey>("audience");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string, apiKey: string) => {
    const value = content.trim();
    if (!value || isLoading) return;
    const userMessage = message("user", value);
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setIsLoading(true);
    setError(null);
    requestRef.current?.abort();
    requestRef.current = new AbortController();
    try {
      const response = await fetch("/api/form-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": apiKey.trim(),
        },
        body: JSON.stringify({ message: value, formState, messages: nextMessages.slice(-16) }),
        signal: requestRef.current.signal,
      });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(typeof body === "object" && body && "error" in body ? String(body.error) : "Agent request failed");
      const payload = agentResponseSchema.parse(body);
      setFormState(current => mergeUpdate(current, payload.stateUpdate as FormStateUpdate));
      if (payload.activeSection) setActiveSection(payload.activeSection);
      setMessages(current => [...current, message("agent", payload.message)]);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "Unable to contact the form agent.");
    } finally {
      setIsLoading(false);
    }
  }, [formState, isLoading, messages]);

  const validation = useMemo(() => validateCompletedForm(formState), [formState]);
  const riskFlags = useMemo(() => deriveRiskFlags(formState), [formState]);
  return { formState, messages, activeSection, setActiveSection, isLoading, error, sendMessage, validation, riskFlags };
}
