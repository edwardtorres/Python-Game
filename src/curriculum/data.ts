// The curriculum, as typed data. Chapters follow the Step 1 brief. Each competency
// becomes a planned lesson; lesson content is written in later steps.
import type { Chapter, Competency, Curriculum, Lesson } from './types';

const COMPETENCY_LABELS: Record<string, string> = {
  types: 'Types and conversions',
  'strings-fstrings': 'Strings and f-strings',
  lists: 'Lists',
  dicts: 'Dictionaries',
  sets: 'Sets',
  tuples: 'Tuples',
  'control-flow': 'Control flow',
  'functions-params': 'Functions: defaults, *args, **kwargs',
  comprehensions: 'Comprehensions',
  exceptions: 'Exceptions',
  'with-blocks': 'with blocks',
  modules: 'Modules and imports',
  'iterators-generators': 'Iterators and generators',
  classes: 'Classes',
  dataclasses: 'Dataclasses',
  inheritance: 'Inheritance',
  'dunder-methods': 'Dunder methods',
  'big-o': 'Big-O basics',
  'list-dict-set': 'List vs dict vs set',
  'deque-heapq': 'deque and heapq',
  recursion: 'Recursion',
  'sort-key': 'Sorting with key functions',
  'type-hints': 'Type hints',
  tracebacks: 'Reading tracebacks and debugging',
  assert: 'assert statements',
  'pytest-style': 'pytest-style tests',
  'good-test-cases': 'Writing good test cases',
  'test-driven-fixes': 'Test-driven fixes',
  csv: 'CSV files',
  json: 'JSON',
  pathlib: 'pathlib',
  datetime: 'datetime',
  regex: 'Regular expressions',
  'requests-json': 'requests with JSON',
  'query-params': 'Query parameters',
  pagination: 'Pagination',
  'status-codes': 'HTTP status codes',
  'rate-limits-retries': 'Rate limits and retries with backoff',
  timeouts: 'Timeouts',
  'fetch-transform-save': 'Fetch, transform, and save scripts',
  arrays: 'NumPy arrays',
  vectorization: 'Vectorization',
  broadcasting: 'Broadcasting',
  'boolean-masks': 'Boolean masks',
  'select-filter': 'Selecting and filtering',
  'clean-missing': 'Missing values',
  'clean-types': 'Types in pandas',
  'clean-duplicates': 'Duplicates',
  'clean-strings': 'String cleaning',
  'groupby-agg': 'groupby and aggregation',
  'merge-join': 'Merges and joins',
  'reshape-pivot-melt': 'Reshaping: pivot and melt',
  'time-series': 'Dates and time series',
  'resample-rolling': 'resample and rolling',
  'method-chaining': 'Method chaining',
  'vector-vs-apply': 'Vectorized operations vs apply',
  'mpl-figures': 'matplotlib figures and axes',
  'chart-choice': 'Choosing the right chart',
  'labels-titles': 'Labels and titles',
  seaborn: 'seaborn where available',
  storytelling: 'Telling a story with a chart',
  'descriptive-stats': 'Descriptive statistics',
  distributions: 'Distributions',
  sampling: 'Sampling',
  'correlation-causation': 'Correlation vs causation',
  'ab-test-scipy': 'A/B test basics with scipy',
  'train-test-split': 'Train/test splits',
  'preprocessing-pipelines': 'Preprocessing pipelines',
  'linear-regression': 'Linear regression',
  classification: 'Classification',
  'metrics-regression': 'MAE and RMSE',
  'metrics-classification': 'Accuracy, precision, and recall',
  'confusion-matrix': 'The confusion matrix',
  'overfitting-cv': 'Overfitting and cross-validation',
  'data-leakage': 'Data leakage',
  'feature-engineering': 'Feature engineering',
  'capstone-end-to-end': 'End-to-end capstone project',
  'timed-problem-solving': 'Timed entry-level problem solving',
  'timed-pandas': 'Timed pandas screen',
};

interface ChapterSpec {
  id: string;
  title: string;
  prerequisites: string[];
  competencies: string[];
}

const SPECS: ChapterSpec[] = [
  {
    id: 'c01-foundations',
    title: 'Foundations refresh',
    prerequisites: [],
    competencies: ['types', 'strings-fstrings', 'lists', 'dicts', 'sets', 'tuples', 'control-flow', 'functions-params', 'comprehensions', 'exceptions', 'with-blocks', 'modules', 'iterators-generators'],
  },
  {
    id: 'c02-informatics',
    title: 'Informatics fundamentals',
    prerequisites: ['c01-foundations'],
    competencies: ['classes', 'dataclasses', 'inheritance', 'dunder-methods', 'big-o', 'list-dict-set', 'deque-heapq', 'recursion', 'sort-key', 'type-hints', 'tracebacks'],
  },
  {
    id: 'c03-testing',
    title: 'Testing',
    prerequisites: ['c02-informatics'],
    competencies: ['assert', 'pytest-style', 'good-test-cases', 'test-driven-fixes'],
  },
  {
    id: 'c04-files-formats',
    title: 'Files and formats',
    prerequisites: ['c01-foundations'],
    competencies: ['csv', 'json', 'pathlib', 'datetime', 'regex'],
  },
  {
    id: 'c05-apis-automation',
    title: 'APIs and automation',
    prerequisites: ['c03-testing', 'c04-files-formats'],
    competencies: ['requests-json', 'query-params', 'pagination', 'status-codes', 'rate-limits-retries', 'timeouts', 'fetch-transform-save'],
  },
  {
    id: 'c06-numpy',
    title: 'NumPy',
    prerequisites: ['c02-informatics'],
    competencies: ['arrays', 'vectorization', 'broadcasting', 'boolean-masks'],
  },
  {
    id: 'c07-pandas',
    title: 'pandas',
    prerequisites: ['c06-numpy', 'c04-files-formats'],
    competencies: ['select-filter', 'clean-missing', 'clean-types', 'clean-duplicates', 'clean-strings', 'groupby-agg', 'merge-join', 'reshape-pivot-melt', 'time-series', 'resample-rolling', 'method-chaining', 'vector-vs-apply'],
  },
  {
    id: 'c08-visualization',
    title: 'Visualization and reporting',
    prerequisites: ['c07-pandas'],
    competencies: ['mpl-figures', 'chart-choice', 'labels-titles', 'seaborn', 'storytelling'],
  },
  {
    id: 'c09-statistics',
    title: 'Statistics',
    prerequisites: ['c06-numpy', 'c07-pandas'],
    competencies: ['descriptive-stats', 'distributions', 'sampling', 'correlation-causation', 'ab-test-scipy'],
  },
  {
    id: 'c10-machine-learning',
    title: 'Machine learning basics',
    prerequisites: ['c07-pandas', 'c09-statistics'],
    competencies: ['train-test-split', 'preprocessing-pipelines', 'linear-regression', 'classification', 'metrics-regression', 'metrics-classification', 'confusion-matrix', 'overfitting-cv', 'data-leakage', 'feature-engineering'],
  },
  {
    id: 'c11-capstones-interviews',
    title: 'Capstones and interviews',
    prerequisites: ['c05-apis-automation', 'c07-pandas', 'c08-visualization', 'c10-machine-learning'],
    competencies: ['capstone-end-to-end', 'timed-problem-solving', 'timed-pandas'],
  },
];

function lessonFor(chapterId: string, competency: string): Lesson {
  return {
    id: `${chapterId}/${competency}`,
    title: COMPETENCY_LABELS[competency] ?? competency,
    competency,
    status: 'planned',
  };
}

export const CURRICULUM: Curriculum = {
  competencies: Object.entries(COMPETENCY_LABELS).map(([id, label]): Competency => ({ id, label })),
  chapters: SPECS.map(
    (spec, index): Chapter => ({
      id: spec.id,
      number: index + 1,
      title: spec.title,
      prerequisites: spec.prerequisites,
      competencies: spec.competencies,
      lessons: spec.competencies.map((competency) => lessonFor(spec.id, competency)),
    }),
  ),
};
