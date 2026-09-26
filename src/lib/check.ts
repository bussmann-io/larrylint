import type { Linter } from 'eslint'
import type { Baseline } from './baseline'

import tsParser from '@typescript-eslint/parser'
import { ESLint } from 'eslint'
import { relative } from 'pathe'
import vueParser from 'vue-eslint-parser'
import { larrylint } from '../setup/preset'
import { readBaseline } from './baseline'

const PARSERS: Linter.Config[] = [
  {
    ignores: ['**/*.d.ts'],
  },
  {
    files: ['**/*.{ts,mts,cts}'],
    languageOptions: { parser: tsParser },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: { parser: tsParser, extraFileExtensions: ['.vue'] },
    },
  },
]

export interface CheckResult {
  /** The ESLint instance, e.g. to load a formatter. */
  eslint: ESLint
  /** Lint results without the violations the baseline covers. */
  results: ESLint.LintResult[]
  /** All current violations per file and rule, as they would go into the baseline. */
  violations: Baseline
  /** Number of violations the baseline covers. */
  baselined: number
  /** Number of baseline entries that have fewer violations now. */
  improved: number
}

/**
 * Lints a Laioutr app with only the larrylint rules, independent of the project's own ESLint setup.
 *
 * @param cwd The folder of the Laioutr app.
 * @param options Whether to write automatic fixes.
 * @param options.fix Write automatic fixes to disk.
 *
 * @returns The results with the baseline applied.
 */
export async function check(cwd: string, options: { fix?: boolean } = {}): Promise<CheckResult> {
  const eslint = new ESLint({
    cwd,
    overrideConfigFile: true,
    overrideConfig: [
      ...PARSERS,
      ...await larrylint({ cwd }),
      {
        linterOptions: { reportUnusedDisableDirectives: 'off' },
        settings: { larrylint: { baseline: false } },
      },
    ],
    fix: options.fix,
    errorOnUnmatchedPattern: false,
  })

  const results = await eslint.lintFiles(['src'])

  if (options.fix) {
    await ESLint.outputFixes(results)
  }

  return { eslint, ...applyBaseline(cwd, results) }
}

/**
 * Drops the violations the baseline covers: a file keeps all violations of a rule
 * once it has more than the baseline allows, like ESLint's bulk suppressions.
 *
 * @param cwd The folder of the Laioutr app.
 * @param results The unfiltered lint results.
 *
 * @returns The filtered results and the violations behind them.
 */
function applyBaseline(cwd: string, results: ESLint.LintResult[]): Omit<CheckResult, 'eslint'> {
  const baseline = readBaseline(cwd)
  const violations: Baseline = {}
  let baselined = 0
  let improved = 0

  const filtered = results.map((result) => {
    const path = relative(cwd, result.filePath)
    const perRule: Record<string, number> = {}

    const relevant = result.messages.filter(message => message.fatal || message.ruleId?.startsWith('larrylint/'))

    for (const { ruleId } of relevant) {
      if (ruleId) {
        perRule[ruleId] = (perRule[ruleId] ?? 0) + 1
      }
    }

    if (Object.keys(perRule).length > 0) {
      violations[path] = perRule
    }

    const messages = relevant.filter(({ ruleId }) => !ruleId || perRule[ruleId]! > (baseline[path]?.[ruleId] ?? 0))

    baselined += relevant.length - messages.length

    return {
      ...result,
      messages,
      errorCount: messages.filter(message => message.severity === 2).length,
      fatalErrorCount: messages.filter(message => message.fatal).length,
      warningCount: messages.filter(message => message.severity === 1).length,
      fixableErrorCount: messages.filter(message => message.severity === 2 && message.fix).length,
      fixableWarningCount: messages.filter(message => message.severity === 1 && message.fix).length,
    }
  })

  for (const [path, rules] of Object.entries(baseline)) {
    for (const [rule, allowed] of Object.entries(rules)) {
      if ((violations[path]?.[rule] ?? 0) < allowed) {
        improved++
      }
    }
  }

  return { results: filtered, violations, baselined, improved }
}
