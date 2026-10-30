import type { GradePayload } from '../engine/types';
import { buildDatasets } from './datasets';
import type { ChallengeSpec } from './types';

export interface GradeRequest {
  payload: GradePayload;
  datasets: Record<string, string>;
}

export type GradeMode = 'run' | 'submit';

// Run grades visible cases with visible datasets only. Submit grades everything.
// The payload carries the learner's code and the challenge's references; the
// datasets are generated here, so a Run never receives hidden data.
export function buildGradeRequest(spec: ChallengeSpec, learner: string, mode: GradeMode): GradeRequest {
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
