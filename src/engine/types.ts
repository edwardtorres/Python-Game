// Shared types for the Python engine: challenge payloads, grader results, and
// the worker message protocol. The grader itself is Python; these describe its JSON.

export type ChallengeKind = 'function' | 'pandas' | 'chart' | 'ml' | 'api' | 'testing' | 'suite' | 'structure';

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
  // Indexes into the task's rules that this case checks. A wrong variant may fail only cases that name its rule.
  rules?: number[];
}

export interface DatasetCase {
  id: string;
  label: string;
  visibility: Visibility;
  dataset: string;
}

export type GradeCase = FunctionCase | DatasetCase;

// A buggy version for a testing task. The learner's tests must fail on it.
export type Mutant = WrongVariant & { label: string; visibility?: Visibility };

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
  type:
    | 'defines'
    | 'no_loops_in'
    | 'uses_comprehension_in'
    | 'uses_yield_in'
    | 'calls'
    | 'forbids_calls'
    | 'annotated_in'
    | 'calls_method'
    | 'forbids_method'
    | 'calls_symbol'
    | 'recurses_in';
  label: string;
  // A dotted name such as Parcel.total reaches a method inside a class.
  name?: string;
  within?: string;
  // Method checks: a literal first argument, such as 0 for pop(0). Omit it to match any call.
  arg?: string | number | boolean | null;
  // Indexes into the task's rules that this check covers.
  rules?: number[];
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
  // The learner's tests. They run against the correct implementation and each mutant.
  learner: string;
  reference: string;
  // Run grades visible mutants only. Submit grades all of them.
  scope?: 'visible' | 'all';
  mutants: Mutant[];
  // Content checks ask for the per-test report: which test functions kill which mutants.
  report?: boolean;
  requires: string[];
}

export interface SuitePayload {
  kind: 'suite';
  // The learner's implementation. The owner's tests run against it, one case per test function.
  learner: string;
  tests: string;
  scope: 'visible' | 'all';
  cases: GradeCase[];
  variants: WrongVariant[];
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

export type AnyPayload = GradePayload | StructurePayload | TestingPayload | SuitePayload | ApiPayload | MlPayload;

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

export interface TestingReport {
  // Every test function in the learner's tests, in order.
  tests: string[];
  // The test functions that pass on the correct implementation.
  correct: string[];
  // Mutant id -> the test functions that fail on it.
  kills: Record<string, string[]>;
}

export interface GradeResult {
  status: 'pass' | 'fail' | 'error';
  error: PythonErrorInfo | null;
  cases: CaseResult[];
  passed: number;
  total: number;
  matched: MatchedMistake[];
  report?: TestingReport;
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
