import type { ChallengeKind, GradeCase, Mutant, StructureCheck, Visibility, WrongVariant } from '../engine/types';
import type { GeneratorName } from '../data';

export interface DatasetSpec {
  name: string;
  generator: GeneratorName;
  seed: number;
  rows: number;
  visibility: Visibility;
}

export interface Ticket {
  from: string;
  subject: string;
  body: string;
}

export interface ChallengeSpec {
  id: string;
  chapterId: string;
  title: string;
  kind: Exclude<ChallengeKind, 'ml' | 'api'>;
  // Structure tasks are graded by these ast checks instead of cases.
  structureChecks?: StructureCheck[];
  // Testing tasks: buggy versions that the learner's tests must catch. Each has a label and visibility.
  mutants?: Mutant[];
  // Suite tasks: the owner's test functions, in the source the grader runs against the learner's code.
  ownerTests?: string;
  notebook: boolean;
  ticket: Ticket;
  // Stated rules. Every rule has at least one wrong variant that violates it (see variantRule).
  rules: string[];
  entry: string;
  starter: string;
  setupCell?: string;
  competencies: string[];
  datasets: DatasetSpec[];
  cases: GradeCase[];
  rulesForGrader: Record<string, unknown>;
  reference: string;
  variants: WrongVariant[];
  // Variant id -> index into `rules` that the variant breaks, and nothing else.
  variantRule: Record<string, number>;
  hints: [string, string, string];
}
