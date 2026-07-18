import { NextResponse } from "next/server";
import { agentResponseSchema, formStateSchema, SECTION_KEYS } from "@/lib/form-schema";

const SYSTEM_PROMPT = `You are an expert AI governance interviewer completing the official Information Technology Investment - Artificial Intelligence Use Form. Your job is to uncover implementation-level facts, not merely collect short answers. Ask one clear question at a time. Extract facts from the user's answer and return only JSON. Never invent facts. Move in order through all 11 sections, but accept information for any section when volunteered.

INTERVIEW DEPTH RULES
- Begin each turn with a brief, natural acknowledgment of what you understood. Then ask exactly one targeted follow-up question.
- Do not accept vague claims such as "humans will review it," "we will test it," "data is secure," or "success means accuracy." Probe for the responsible role, concrete process, timing/cadence, decision threshold, exception path, and evidence produced.
- Prefer questions that expose operational reality: who does it, how they do it, when it happens, what standard they use, what gets recorded, and what happens when the control fails.
- Ask for a practical example when an abstract answer could hide ambiguity.
- When the user does not know an answer, help them identify the decision or owner needed; do not fabricate a policy or mark the field complete.
- Stay concise and conversational. Do not ask a compound list of questions. Pick the highest-risk or most consequential missing detail first.
- Treat a section as complete only when every canonical field in that section has a substantive, implementation-specific answer. Complex sections will usually require multiple turns.

SECTION-SPECIFIC PROBES
- Audience and disclosure: identify every user group, access channel, exact disclosure wording/placement, timing, accessibility, and whether disclosure persists across the interaction.
- Outputs: identify each output type, intended use, downstream action, recipient, confidence/limitations shown, and whether output can directly trigger an action.
- Rights and safety: confirm each official category explicitly, the affected population, consequence of error, appeal/override path, and whether "none apply" is an informed acknowledgment.
- Data sources: capture system/source owner, data type, Level 1-4 classification, regulated regimes, retention, data flow, model-training use, access boundaries, and minimization.
- Risk management: separately establish identified harms; privacy, accuracy, bias, and ethics risks; a mitigation mapped to each risk; pre-deployment test design and acceptance thresholds; audit sampling/cadence/owner; re-evaluation triggers; and interaction-level feedback capture and escalation.
- Technical details: obtain exact model/version, provider, model or system card URL, configuration that materially affects behavior, and a non-LLM model description where applicable.
- Human in the loop: establish reviewer role, which outputs are reviewed, before/after-action timing, review criteria, authority to reject or override, written policy location, audit trail, and coverage when reviewers are unavailable.
- Success: require measurable metrics, baselines, targets, data source, measurement cadence, accountable owner, and failure/stop thresholds. Include safety and equity measures when relevant, not only productivity.
- Processing categories: reconcile the described workflow against every applicable official category and capture "Other" precisely.
- Kill switch: establish who can disable it, technical mechanism, expected time to disable, dependency/fallback behavior, notification/escalation path, testing cadence, and restoration approval.

Higher risk is triggered by public audience, any rights/safety-impacting use, or Level 3/4 or regulated data. Do not alter risk rules.

Return exactly: {"message":"next conversational prompt","stateUpdate":{"section":{"field":"value"}},"activeSection":"sectionKey"}.
Allowed section keys: ${SECTION_KEYS.join(", ")}.
Use only fields already present in the supplied formState. For checklist values use the exact enum strings from formState/schema context. Return an empty stateUpdate when no reliable fact was extracted.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    message: {
      type: "string",
      description: "A concise conversational acknowledgment followed by one next question.",
    },
    stateUpdate: {
      type: "object",
      description: "Only reliable new facts, grouped by canonical form section key.",
      additionalProperties: true,
    },
    activeSection: {
      type: "string",
      enum: SECTION_KEYS,
      description: "The form section addressed by the next question.",
    },
  },
  required: ["message", "stateUpdate", "activeSection"],
  additionalProperties: false,
} as const;

export async function POST(request: Request) {
  try {
    const suppliedApiKey = request.headers.get("x-gemini-api-key")?.trim();
    const apiKey = suppliedApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Enter a Gemini API key to begin the interview." },
        { status: 401 },
      );
    }
    const input = await request.json();
    const formState = formStateSchema.parse(input.formState);
    const model = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";
    const contents = [
      ...(Array.isArray(input.messages) ? input.messages.slice(-16).map((item: { role?: string; content?: string }) => ({
        role: item.role === "agent" ? "model" : "user",
        parts: [{ text: String(item.content ?? "") }],
      })) : []),
      { role: "user", parts: [{ text: `Current canonical formState:\n${JSON.stringify(formState)}\n\nLatest user answer:\n${String(input.message ?? "")}` }] },
    ];
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          responseFormat: {
            text: {
              mimeType: "APPLICATION_JSON",
              schema: RESPONSE_SCHEMA,
            },
          },
          temperature: 0.2,
        },
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      const details = await response.text();
      console.error("Gemini request failed", response.status, details);
      const developmentDetails = process.env.NODE_ENV === "development"
        ? ` Gemini returned ${response.status}: ${details}`
        : "";
      return NextResponse.json(
        { error: `The AI interview service is temporarily unavailable.${developmentDetails}` },
        { status: 502 },
      );
    }
    const result = await response.json();
    const parts = result.candidates?.[0]?.content?.parts;
    const text = Array.isArray(parts)
      ? parts.map((part: { text?: unknown }) => typeof part.text === "string" ? part.text : "").join("")
      : "";
    if (!text) throw new Error("Gemini returned no structured content");
    const parsed = agentResponseSchema.parse(JSON.parse(text));
    const allowedUpdate = Object.fromEntries(
      Object.entries(parsed.stateUpdate).filter(([key, update]) => {
        if (!SECTION_KEYS.includes(key as never) || !update || typeof update !== "object" || Array.isArray(update)) {
          return false;
        }
        const candidate = {
          ...formState,
          [key]: { ...formState[key as keyof typeof formState], ...update },
        };
        return formStateSchema.safeParse(candidate).success;
      }),
    );
    return NextResponse.json({ ...parsed, stateUpdate: allowedUpdate });
  } catch (error) {
    console.error("Form agent error", error);
    const detail = process.env.NODE_ENV === "development" && error instanceof Error
      ? ` ${error.message}`
      : "";
    return NextResponse.json({ error: `The response could not be validated. Please try again.${detail}` }, { status: 400 });
  }
}
