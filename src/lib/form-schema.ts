import { z } from "zod";

export const rightsSafetyOptions = [
  "emotionRecognition",
  "databaseImageScraping",
  "predictiveCrimeAnalysis",
  "biometricCategorizationOrIdentification",
  "safetyComponent",
  "safetyDecisions",
  "employmentEvaluation",
  "educationalEvaluation",
  "eligibilityEvaluation",
  "administrationOfJustice",
] as const;

export const processingOptions = [
  "transcription", "ocr", "translation", "summarization", "drafting",
  "questionAnswering", "classification", "routing", "recommendation",
  "riskScoring", "forecasting", "sentiment", "biometrics", "surveillance",
  "redaction", "dataExtraction", "codeAssist", "imageVideoGeneration",
  "audioVoiceGeneration", "simulation", "policyRuleDrafting",
  "decisionAutomation", "fraudDetection", "eligibilityDetermination", "other",
] as const;

const requiredText = z.string().trim().min(1);
const sectionMetaSchema = z.object({
  status: z.enum(["not_started", "in_progress", "complete"]),
});

export const formStateSchema = z.object({
  project: z.object({ ppmProjectId: z.string() }),
  audience: sectionMetaSchema.extend({
    value: z.enum(["internal", "public"]).nullable(),
    details: z.string(),
  }),
  disclosure: sectionMetaSchema.extend({ mechanism: z.string() }),
  systemOutputs: sectionMetaSchema.extend({
    types: z.array(z.string()),
    description: z.string(),
  }),
  rightsSafety: sectionMetaSchema.extend({
    selected: z.array(z.enum(rightsSafetyOptions)),
    noneApply: z.boolean().nullable(),
    details: z.string(),
  }),
  dataSources: sectionMetaSchema.extend({
    sources: z.array(z.string()),
    dataTypes: z.array(z.string()),
    classificationLevels: z.array(z.number().int().min(1).max(4)),
    regulatedDataTypes: z.array(z.string()),
    details: z.string(),
  }),
  riskManagement: sectionMetaSchema.extend({
    identifiedRisks: z.string(),
    privacyAccuracyBiasEthicsRisks: z.string(),
    mitigationStrategies: z.string(),
    preDeploymentTesting: z.string(),
    auditMethod: z.string(),
    reevaluationTriggers: z.string(),
    userFeedbackCapture: z.string(),
  }),
  technicalDetails: sectionMetaSchema.extend({
    modelName: z.string(),
    modelCardUrl: z.string(),
    nonLlmModelDescription: z.string(),
  }),
  humanInTheLoop: sectionMetaSchema.extend({
    reviewProcess: z.string(), writtenPolicies: z.string(), controls: z.string(),
  }),
  definingSuccess: sectionMetaSchema.extend({
    metrics: z.array(z.string()), measurementStrategy: z.string(),
  }),
  processingCategories: sectionMetaSchema.extend({
    selected: z.array(z.enum(processingOptions)), otherDescription: z.string(),
  }),
  killSwitch: sectionMetaSchema.extend({
    canDisable: z.boolean().nullable(), process: z.string(),
  }),
});

export type AIUseFormState = z.infer<typeof formStateSchema>;
export type FormSectionKey = Exclude<keyof AIUseFormState, "project">;
export type FormStateUpdate = Partial<{ [K in FormSectionKey]: Partial<AIUseFormState[K]> }>;

export interface RiskFlags {
  isHigherRisk: boolean;
  publicAudience: boolean;
  rightsOrSafetyImpacting: boolean;
  sensitiveOrRegulatedData: boolean;
  reasons: string[];
}

export interface AgentMessage {
  id: string;
  role: "agent" | "user";
  content: string;
}

export const SECTION_KEYS: FormSectionKey[] = [
  "audience", "disclosure", "systemOutputs", "rightsSafety", "dataSources",
  "riskManagement", "technicalDetails", "humanInTheLoop", "definingSuccess",
  "processingCategories", "killSwitch",
];

export const initialFormState: AIUseFormState = {
  project: { ppmProjectId: "" },
  audience: { status: "not_started", value: null, details: "" },
  disclosure: { status: "not_started", mechanism: "" },
  systemOutputs: { status: "not_started", types: [], description: "" },
  rightsSafety: { status: "not_started", selected: [], noneApply: null, details: "" },
  dataSources: { status: "not_started", sources: [], dataTypes: [], classificationLevels: [], regulatedDataTypes: [], details: "" },
  riskManagement: { status: "not_started", identifiedRisks: "", privacyAccuracyBiasEthicsRisks: "", mitigationStrategies: "", preDeploymentTesting: "", auditMethod: "", reevaluationTriggers: "", userFeedbackCapture: "" },
  technicalDetails: { status: "not_started", modelName: "", modelCardUrl: "", nonLlmModelDescription: "" },
  humanInTheLoop: { status: "not_started", reviewProcess: "", writtenPolicies: "", controls: "" },
  definingSuccess: { status: "not_started", metrics: [], measurementStrategy: "" },
  processingCategories: { status: "not_started", selected: [], otherDescription: "" },
  killSwitch: { status: "not_started", canDisable: null, process: "" },
};

const hasText = (value: string) => value.trim().length > 0;

export function calculateSectionStatus(state: AIUseFormState, key: FormSectionKey) {
  const complete: Record<FormSectionKey, boolean> = {
    audience: state.audience.value !== null && hasText(state.audience.details),
    disclosure: hasText(state.disclosure.mechanism),
    systemOutputs: state.systemOutputs.types.length > 0 && hasText(state.systemOutputs.description),
    rightsSafety: state.rightsSafety.noneApply !== null && (state.rightsSafety.noneApply || state.rightsSafety.selected.length > 0) && hasText(state.rightsSafety.details),
    dataSources: state.dataSources.sources.length > 0 && state.dataSources.dataTypes.length > 0 && state.dataSources.classificationLevels.length > 0 && hasText(state.dataSources.details),
    riskManagement: [state.riskManagement.identifiedRisks, state.riskManagement.privacyAccuracyBiasEthicsRisks, state.riskManagement.mitigationStrategies, state.riskManagement.preDeploymentTesting, state.riskManagement.auditMethod, state.riskManagement.reevaluationTriggers, state.riskManagement.userFeedbackCapture].every(hasText),
    technicalDetails: hasText(state.technicalDetails.modelName) && (hasText(state.technicalDetails.modelCardUrl) || hasText(state.technicalDetails.nonLlmModelDescription)),
    humanInTheLoop: [state.humanInTheLoop.reviewProcess, state.humanInTheLoop.writtenPolicies, state.humanInTheLoop.controls].every(hasText),
    definingSuccess: state.definingSuccess.metrics.length > 0 && hasText(state.definingSuccess.measurementStrategy),
    processingCategories: state.processingCategories.selected.length > 0 && (!state.processingCategories.selected.includes("other") || hasText(state.processingCategories.otherDescription)),
    killSwitch: state.killSwitch.canDisable !== null && hasText(state.killSwitch.process),
  };
  if (complete[key]) return "complete" as const;
  const started = Object.entries(state[key]).some(([field, value]) => field !== "status" && (Array.isArray(value) ? value.length > 0 : value !== "" && value !== null));
  return started ? "in_progress" as const : "not_started" as const;
}

export function normalizeFormState(state: AIUseFormState): AIUseFormState {
  const next = structuredClone(state);
  for (const key of SECTION_KEYS) next[key].status = calculateSectionStatus(next, key);
  return next;
}

export function deriveRiskFlags(state: AIUseFormState): RiskFlags {
  const publicAudience = state.audience.value === "public";
  const rightsOrSafetyImpacting = state.rightsSafety.selected.length > 0;
  const sensitiveOrRegulatedData = state.dataSources.classificationLevels.some(level => level >= 3) || state.dataSources.regulatedDataTypes.length > 0;
  const reasons = [publicAudience && "Public audience", rightsOrSafetyImpacting && "Rights/safety-impacting processing", sensitiveOrRegulatedData && "Level 3/4 or regulated data"].filter((value): value is string => Boolean(value));
  return { isHigherRisk: reasons.length > 0, publicAudience, rightsOrSafetyImpacting, sensitiveOrRegulatedData, reasons };
}

export function validateCompletedForm(state: AIUseFormState) {
  const normalized = normalizeFormState(state);
  const missingSections = SECTION_KEYS.filter(key => normalized[key].status !== "complete");
  return { isValid: missingSections.length === 0, missingSections, data: normalized };
}

export const completedFormSchema = formStateSchema.superRefine((state, context) => {
  const result = validateCompletedForm(state);
  result.missingSections.forEach(section => context.addIssue({ code: "custom", path: [section], message: "Section is incomplete" }));
});

export const agentResponseSchema = z.object({
  message: requiredText,
  stateUpdate: z.record(z.string(), z.unknown()),
  activeSection: z.enum(SECTION_KEYS).optional(),
});
