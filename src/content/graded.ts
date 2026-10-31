// Helpers for graded items, shared by every chapter. A function item is graded by its cases, and
// each case names the rules it checks. A wrong variant breaks one rule, and its mistake names the
// tag that the feedback shows.
import type { ChallengeSpec, Ticket } from '../challenges/types';
import type { FunctionCase, StructureCheck, WrongVariant } from '../engine/types';
import { MISTAKES, type MistakeTag } from './mistakes';

// A wrong variant: its id, its code, the mistake it makes, and the index of the rule it breaks.
export type Variant = [id: string, code: string, tag: MistakeTag, rule: number];

// A case that names the rules it checks. A wrong variant may fail only the cases that name its rule.
export function fn(id: string, label: string, visibility: 'visible' | 'hidden', args: unknown[], rules: number[], kwargs?: Record<string, unknown>): FunctionCase {
  return kwargs === undefined ? { id, label, visibility, args, rules } : { id, label, visibility, args, rules, kwargs };
}

export interface GradedItem {
  id: string;
  title: string;
  lessonId: string;
  competencies: string[];
  ticket: Ticket;
  rules: string[];
  entry: string;
  starter: string;
  reference: string;
  cases: FunctionCase[];
  variants: Variant[];
  hints: [string, string, string];
  // Structure tasks are graded by ast checks instead of cases.
  structure?: StructureCheck[];
}

function toWrong(variants: Variant[]): { wrong: WrongVariant[]; rules: Record<string, number> } {
  const rules: Record<string, number> = {};
  const wrong = variants.map(([id, code, tag, rule]) => {
    rules[id] = rule;
    return { id, code, mistake: MISTAKES[tag] };
  });
  return { wrong, rules };
}

export function functionSpec(chapterId: string, item: GradedItem): ChallengeSpec {
  const { wrong, rules } = toWrong(item.variants);
  const base: ChallengeSpec = {
    id: item.id,
    chapterId,
    title: item.title,
    kind: 'function',
    notebook: false,
    ticket: item.ticket,
    rules: item.rules,
    entry: item.entry,
    starter: item.starter,
    competencies: item.competencies,
    datasets: [],
    cases: item.cases,
    rulesForGrader: {},
    reference: item.reference,
    variants: wrong,
    variantRule: rules,
    hints: item.hints,
  };
  return item.structure === undefined ? base : { ...base, kind: 'structure', structureChecks: item.structure };
}

// A wrong version of the code under test. The learner's tests must fail on it, and its rule is the
// one it breaks. A hidden mutant keeps its place in the list, but its label is not shown.
export interface MutantSpec {
  id: string;
  label: string;
  code: string;
  tag: MistakeTag;
  rule: number;
  visibility: 'visible' | 'hidden';
}

export interface TestingItem {
  id: string;
  title: string;
  lessonId: string;
  competencies: string[];
  ticket: Ticket;
  rules: string[];
  entry: string;
  starter: string;
  reference: string;
  modelTests: string;
  weakTests: string;
  mutants: MutantSpec[];
  hints: [string, string, string];
}

export function testingSpec(chapterId: string, item: TestingItem): ChallengeSpec {
  return {
    id: item.id,
    chapterId,
    title: item.title,
    kind: 'testing',
    notebook: false,
    ticket: item.ticket,
    rules: item.rules,
    entry: item.entry,
    starter: item.starter,
    competencies: item.competencies,
    datasets: [],
    cases: [],
    rulesForGrader: {},
    reference: item.reference,
    variants: [],
    variantRule: Object.fromEntries(item.mutants.map((mutant) => [mutant.id, mutant.rule])),
    hints: item.hints,
    mutants: item.mutants.map((mutant) => ({ id: mutant.id, label: mutant.label, code: mutant.code, mistake: MISTAKES[mutant.tag], visibility: mutant.visibility })),
    modelTests: item.modelTests,
    weakTests: item.weakTests,
  };
}

// A suite task: the learner writes the implementation, and the owner's test functions grade it.
export function suiteSpec(chapterId: string, item: GradedItem & { ownerTests: string }): ChallengeSpec {
  return { ...functionSpec(chapterId, item), kind: 'suite', ownerTests: item.ownerTests };
}
