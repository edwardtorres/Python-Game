import type { ChallengeSpec } from '../types';

// A chart task (Visualization). The grader inspects the matplotlib figure object: the
// chart type, orientation, series count, labels, categories, and bar heights.
const REFERENCE = `import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt


def plot_late_rate_by_mode(df):
    rates = df.groupby("mode")["late"].mean().sort_index()
    fig, ax = plt.subplots()
    ax.bar(rates.index.tolist(), rates.values.tolist())
    ax.set_title("Late delivery rate by transport mode")
    ax.set_xlabel("Transport mode")
    ax.set_ylabel("Late delivery rate")
    return fig
`;

const STARTER = `import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt


def plot_late_rate_by_mode(df):
    """Return one matplotlib Figure: late delivery rate by transport mode.

    Rules:
    1. One vertical bar chart with one series.
    2. The categories are the modes, in alphabetical order.
    3. Each bar's height is the late rate: the share of shipments with late == 1.
    4. The chart has a title.
    5. The x-axis label mentions "mode".
    6. The y-axis label mentions "rate".
    """
    pass
`;

export const lateRateChart: ChallengeSpec = {
  id: 'late-rate-chart',
  chapterId: 'c08-visualization',
  title: 'Late deliveries by transport mode',
  kind: 'chart',
  notebook: false,
  ticket: {
    from: 'Hollis Aum, Operations Review',
    subject: 'One chart for the operations review',
    body: 'Operations wants one chart: the late delivery rate for each transport mode. Write plot_late_rate_by_mode(df) so it returns a matplotlib Figure. The rules are below. The grader checks the figure object itself.',
  },
  rules: [
    'One vertical bar chart with one series.',
    'The categories are the modes, in alphabetical order.',
    "Each bar's height is the late rate: the share of shipments with late == 1.",
    'The chart has a title.',
    'The x-axis label mentions "mode".',
    'The y-axis label mentions "rate".',
  ],
  entry: 'plot_late_rate_by_mode',
  starter: STARTER,
  competencies: ['mpl-figures', 'chart-choice', 'labels-titles', 'storytelling', 'groupby-agg'],
  datasets: [
    { name: 'shipments', generator: 'shipments', seed: 7, rows: 240, visibility: 'visible' },
    { name: 'shipments_hidden_1', generator: 'shipments', seed: 8, rows: 300, visibility: 'hidden' },
    { name: 'shipments_hidden_2', generator: 'shipments', seed: 9, rows: 120, visibility: 'hidden' },
  ],
  cases: [
    { id: 'v-shipments', label: 'The visible shipments', visibility: 'visible', dataset: 'shipments' },
    { id: 'h-second', label: 'A second shipment export', visibility: 'hidden', dataset: 'shipments_hidden_1' },
    { id: 'h-small', label: 'A small shipment export', visibility: 'hidden', dataset: 'shipments_hidden_2' },
  ],
  rulesForGrader: {
    chart_type: 'bar',
    orientation: 'vertical',
    series: 1,
    require_title: true,
    xlabel_contains: 'mode',
    ylabel_contains: 'rate',
    tolerance: 1e-9,
  },
  reference: REFERENCE,
  variants: [
    {
      id: 'horizontal-bars',
      code: REFERENCE.replace('ax.bar(rates.index.tolist(), rates.values.tolist())', 'ax.barh(rates.index.tolist(), rates.values.tolist())'),
      mistake: { tag: 'chart-type', title: 'Horizontal bars instead of vertical', explanation: 'Rule 1 asks for vertical bars. barh() draws them sideways, which the review template does not accept.' },
    },
    {
      id: 'line-chart',
      code: REFERENCE.replace('ax.bar(rates.index.tolist(), rates.values.tolist())', 'ax.plot(rates.index.tolist(), rates.values.tolist())'),
      mistake: { tag: 'chart-type', title: 'A line chart for categories', explanation: 'Categories such as transport modes have no order between them, so bars fit. A line implies a trend across modes.' },
    },
    {
      id: 'counts-not-rates',
      code: REFERENCE.replace('df.groupby("mode")["late"].mean()', 'df.groupby("mode")["late"].sum()'),
      mistake: { tag: 'aggregation', title: 'Counted late shipments instead of the rate', explanation: 'Rule 3 asks for the share of shipments that were late. sum() gives a count, which depends on how many shipments each mode carried.' },
    },
    {
      id: 'unsorted-categories',
      code: REFERENCE.replace('df.groupby("mode")["late"].mean().sort_index()', 'df.groupby("mode", sort=False)["late"].mean()'),
      mistake: { tag: 'ordering', title: 'Modes in the order they happened to appear', explanation: 'Rule 2 sorts the modes alphabetically. groupby(sort=False) keeps first-appearance order, which changes between datasets.' },
    },
    {
      id: 'two-series',
      code: REFERENCE.replace('    ax.set_title(', '    ax.bar(rates.index.tolist(), [1 - value for value in rates.values.tolist()], bottom=rates.values.tolist())\n    ax.set_title('),
      mistake: { tag: 'series', title: 'Two stacked series', explanation: 'Rule 1 asks for one series. Adding a second bar layer, even as a stacked filler, makes the chart harder to read and fails the review check.' },
    },
    {
      id: 'no-title',
      code: REFERENCE.replace('    ax.set_title("Late delivery rate by transport mode")\n', ''),
      mistake: { tag: 'labeling', title: 'The chart has no title', explanation: 'Rule 4 asks for a title. A reader who opens the chart on its own needs to know what it shows.' },
    },
    {
      id: 'vague-y-label',
      code: REFERENCE.replace('ax.set_ylabel("Late delivery rate")', 'ax.set_ylabel("Shipments")'),
      mistake: { tag: 'labeling', title: 'The y-axis label does not say rate', explanation: 'Rule 6 asks for the y-axis label to mention "rate". "Shipments" names the thing being counted, not the number the bars show.' },
    },
    {
      id: 'vague-x-label',
      code: REFERENCE.replace('ax.set_xlabel("Transport mode")', 'ax.set_xlabel("Category")'),
      mistake: { tag: 'labeling', title: 'The x-axis label is vague', explanation: 'Rule 5 asks for the x-axis label to mention "mode". "Category" does not say what the bars represent.' },
    },
  ],
  variantRule: {
    'horizontal-bars': 0,
    'line-chart': 0,
    'counts-not-rates': 2,
    'unsorted-categories': 1,
    'two-series': 0,
    'no-title': 3,
    'vague-x-label': 4,
    'vague-y-label': 5,
  },
  hints: [
    'Work out what one bar stands for: one transport mode. What number should its height show?',
    'Group the shipments by mode, average the late column (0 or 1), and draw one bar per group, sorted by mode name.',
    'Start like this:\n\n    rates = df.groupby("mode")["late"].mean().sort_index()\n    fig, ax = plt.subplots()\n    # draw one bar per mode, then set the title and both axis labels',
  ],
};
