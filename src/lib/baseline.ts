import type { ESLint } from 'eslint'

import { rmSync, writeFileSync } from 'node:fs'
import { join, relative } from 'pathe'
import { cachedReader } from '../utils/fs'

export const BASELINE_FILE = 'larrylint-baseline.json'

export type Baseline = Record<string, Record<string, number>>

export interface BaselineResult {
  /** Lint results without the violations the baseline covers. */
  results: ESLint.LintResult[]
  /** All current violations per file and rule, as they would go into the baseline. */
  violations: Baseline
  /** Number of violations the baseline covers. */
  baselined: number
  /** Number of baseline entries that have fewer violations now. */
  improved: number
}

const readBaselineFile = cachedReader(text => JSON.parse(text) as Baseline)

/**
 * Reads the baseline of a package, cached until the file changes.
 *
 * @param root Absolute path of the package root.
 *
 * @returns The baseline, empty if the package has none.
 */
export function readBaseline(root: string): Baseline {
  return readBaselineFile(join(root, BASELINE_FILE)) ?? {}
}

/**
 * Writes the baseline of a package with sorted keys, or removes the file when nothing is left.
 *
 * @param root Absolute path of the package root.
 * @param baseline The violations to record.
 */
export function writeBaseline(root: string, baseline: Baseline) {
  const file = join(root, BASELINE_FILE)
  const files = Object.keys(baseline).sort()

  if (files.length === 0) {
    rmSync(file, { force: true })

    return
  }

  const sorted: Baseline = {}

  for (const path of files) {
    sorted[path] = Object.fromEntries(Object.entries(baseline[path]!).sort(([a], [b]) => a.localeCompare(b)))
  }

  writeFileSync(file, `${JSON.stringify(sorted, null, 2)}\n`)
}

/**
 * Counts the violations recorded in a baseline.
 *
 * @param baseline Violations per file and rule.
 *
 * @returns The total number of violations.
 */
export function countViolations(baseline: Baseline) {
  return Object.values(baseline).flatMap(rules => Object.values(rules)).reduce((sum, count) => sum + count, 0)
}

/**
 * Drops the violations the baseline covers, like ESLint's bulk suppressions.
 *
 * @param cwd The folder of the Laioutr app.
 * @param results The unfiltered lint results.
 *
 * @returns The filtered results and the violations behind them.
 */
export function applyBaseline(cwd: string, results: ESLint.LintResult[]): BaselineResult {
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
