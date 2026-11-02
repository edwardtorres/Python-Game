import type { GradePayload, StructurePayload, SuitePayload, TestingPayload } from '../engine/types';
import { buildDatasets } from './datasets';
import type { ChallengeSpec } from './types';

export interface GradeRequest {
  payload: GradePayload | StructurePayload | TestingPayload | SuitePayload;
  datasets: Record<string, string>;
}

export type GradeMode = 'run' | 'submit';

// Run grades visible cases with visible datasets only. Submit grades everything.
// The payload carries the learner's code and the challenge's references; the
// datasets are generated here, so a Run never receives hidden data.
export function buildGradeRequest(spec: ChallengeSpec, learner: string, mode: GradeMode, options: { reportTimings?: boolean } = {}): GradeRequest {
  const scope = mode === 'run' ? 'visible' : 'all';
  const kind = spec.kind;
  if (kind === 'structure') {
    // Structure checks read the learner's code with ast. Run and Submit run the same checks.
    return { payload: { kind, learner, checks: spec.structureChecks ?? [], requires: [], variants: spec.variants }, datasets: {} };
  }
  if (kind === 'testing') {
    // The learner's tests run against the correct implementation and each mutant, under pytest.
    return { payload: { kind, entry: spec.entry, learner, reference: spec.reference, scope, mutants: spec.mutants ?? [], requires: ['pytest'] }, datasets: {} };
  }
  if (kind === 'suite') {
    // The learner's implementation runs against the owner's tests under pytest, one case per test function.
    return { payload: { kind, learner, tests: spec.ownerTests ?? '', scope, cases: spec.cases, variants: spec.variants, requires: ['pytest'] }, datasets: {} };
  }
  const requires = kind === 'function' ? [] : kind === 'chart' ? ['pandas', 'matplotlib'] : ['pandas'];
  const payload: GradePayload = {
      kind,
      entry: spec.entry,
      learner,
      reference: spec.reference,
      scope,
      rules: spec.rulesForGrader,
      cases: spec.cases,
      variants: spec.variants,
      requires,
      definitions_only: spec.notebook,
      ...(spec.timing === undefined ? {} : { timing: spec.timing }),
      ...(spec.structureChecks === undefined ? {} : { checks: spec.structureChecks }),
      ...(options.reportTimings === true ? { report_timings: true } : {}),
  };
  return { payload, datasets: buildDatasets(spec.datasets, scope) };
}
