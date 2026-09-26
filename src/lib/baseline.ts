import { readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'pathe'

export const BASELINE_FILE = 'larrylint-baseline.json'

export type Baseline = Record<string, Record<string, number>>

const cache = new Map<string, { mtimeMs: number, baseline: Baseline }>()

/**
 * Reads the baseline of a package, cached until the file changes.
 *
 * @param root Absolute path of the package root.
 *
 * @returns The baseline, empty if the package has none.
 */
export function readBaseline(root: string): Baseline {
  const file = join(root, BASELINE_FILE)

  let mtimeMs: number

  try {
    mtimeMs = statSync(file).mtimeMs
  }
  catch {
    return {}
  }

  const cached = cache.get(file)

  if (cached?.mtimeMs === mtimeMs) {
    return cached.baseline
  }

  const baseline = JSON.parse(readFileSync(file, 'utf8')) as Baseline

  cache.set(file, { mtimeMs, baseline })

  return baseline
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
