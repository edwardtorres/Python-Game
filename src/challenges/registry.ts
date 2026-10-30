import type { ChallengeSpec } from './types';
import { cleanWeights } from './samples/cleanWeights';
import { churnByRegion } from './samples/churnByRegion';
import { lateRateChart } from './samples/lateRateChart';

export const CHALLENGES: readonly ChallengeSpec[] = [cleanWeights, churnByRegion, lateRateChart];

export function getChallenge(id: string): ChallengeSpec | undefined {
  return CHALLENGES.find((challenge) => challenge.id === id);
}
