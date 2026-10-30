import type { GradePayload, StructurePayload } from '../engine/types';
import { buildDatasets } from './datasets';
import type { ChallengeSpec } from './types';

export interface GradeRequest {
  payload: GradePayload | StructurePayload;
  datasets: Record<string, string>;
}

export type GradeMode = 'run' | 'submit';

// Run grades visible cases with visible datasets only. Submit grades everything.
// The payload carries the learner's code and the challenge's references; the
// datasets are generated here, so a Run never receives hidden data.
export function buildGradeRequest(spec: ChallengeSpec, learner: string, mode: GradeMode): GradeRequest {
  if (spec.kind === 'structure') {
    // Structure checks read the learner's code with ast. Run and Submit run the same checks.
    return { payload: { kind: 'structure', learner, checks: spec.structureChecks ?? [], requires: [], variants: spec.variants }, datasets: {} };
  }
  const scope = mode === 'run' ? 'visible' : 'all';
  const requires = spec.kind === 'function' ? [] : spec.kind === 'chart' ? ['pandas', 'matplotlib'] : ['pandas'];
  const payload: GradePayload = {
      kind: spec.kind,
      entry: spec.entry,
      learner,
      reference: spec.reference,
      scope,
      rules: spec.rulesForGrader,
      cases: spec.cases,
      variants: spec.variants,
      requires,
      definitions_only: spec.notebook,
  };
  return { payload, datasets: buildDatasets(spec.datasets, scope) };
}
