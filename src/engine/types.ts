// Shared types for the Python engine: challenge payloads, grader results, and
// the worker message protocol. The grader itself is Python; these describe its JSON.

export type ChallengeKind = 'function' | 'pandas' | 'chart' | 'ml' | 'api' | 'testing' | 'structure';

export type Visibility = 'visible' | 'hidden';

export interface Mistake {
  tag: string;
  title: string;
  explanation: string;
}

export interface WrongVariant {
  id: string;
  code: string;
  mistake: Mistake;
}

export interface FunctionCase {
  id: string;
  label: string;
  visibility: Visibility;
  args?: unknown[];
  kwargs?: Record<string, unknown>;
}

export interface DatasetCase {
  id: string;
  label: string;
  visibility: Visibility;
  dataset: string;
}

export type GradeCase = FunctionCase | DatasetCase;

export interface GradePayload {
  kind: 'function' | 'pandas' | 'chart';
  entry: string;
  learner: string;
  reference: string;
  scope: 'visible' | 'all';
  rules: Record<string, unknown>;
  cases: GradeCase[];
  variants: WrongVariant[];
  requires: string[];
  // Notebook submissions: keep imports and definitions, ignore top-level exploration.
  definitions_only?: boolean;
}

export interface StructureCheck {
  type: 'defines' | 'no_loops_in' | 'uses_comprehension_in' | 'uses_yield_in' | 'calls' | 'forbids_calls';
  label: string;
  name?: string;
  within?: string;
}

export interface StructurePayload {
  kind: 'structure';
  learner: string;
  checks: StructureCheck[];
  requires: string[];
  variants?: WrongVariant[];
}

export interface TestingPayload {
  kind: 'testing';
  entry: string;
  learner: string;
  reference: string;
  mutants: Array<WrongVariant & { label: string; visibility?: Visibility }>;
  requires: string[];
}

export interface ApiPayload {
  kind: 'api';
  entry: string;
  learner: string;
  reference: string;
  failures: Array<{ page: number; status: number; retry_after?: number | null }>;
  rules: { max_attempts_per_page?: number };
  requires: string[];
}

export interface MlPayload {
  kind: 'ml';
  entry: string;
  learner: string;
  train: string;
  holdout: string;
  features: string[];
  target: string;
  metric: 'mae' | 'accuracy';
  threshold: number;
  requires: string[];
}

export type AnyPayload = GradePayload | StructurePayload | TestingPayload | ApiPayload | MlPayload;

export interface CaseResult {
  id: string;
  label: string;
  visibility: Visibility;
  ok: boolean;
  message: string;
}

export interface PythonErrorInfo {
  type: string;
  message: string;
  line: number | null;
}

export interface MatchedMistake extends Mistake {
  variantId: string;
}

export interface GradeResult {
  status: 'pass' | 'fail' | 'error';
  error: PythonErrorInfo | null;
  cases: CaseResult[];
  passed: number;
  total: number;
  matched: MatchedMistake[];
}

export interface CellDisplay {
  kind: 'html' | 'text';
  data: string;
}

export interface CellResult {
  stdout: string;
  display: CellDisplay | null;
  images: string[];
  error: PythonErrorInfo | null;
}

export type WorkerRequest =
  | { id: number; op: 'init' }
  | { id: number; op: 'loadPackages'; names: string[] }
  | { id: number; op: 'setInterrupt'; buffer: SharedArrayBuffer; ignore: boolean }
  | { id: number; op: 'setDatasets'; datasetsJson: string }
  | { id: number; op: 'grade'; payloadJson: string; datasetsJson: string }
  | { id: number; op: 'runCell'; sessionId: string; code: string }
  | { id: number; op: 'resetSession'; sessionId: string }
  | { id: number; op: 'memory' };

export type WorkerResponse =
  | { id: number; ok: true; data: unknown }
  | { id: number; ok: false; error: PythonErrorInfo };
