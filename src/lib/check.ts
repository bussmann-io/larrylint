import type { Linter } from 'eslint'
import type { BaselineResult } from './baseline'

import tsParser from '@typescript-eslint/parser'
import { ESLint } from 'eslint'
import vueParser from 'vue-eslint-parser'
import { applyBaseline } from './baseline'
import { larrylint } from './setup/preset'

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

export interface CheckResult extends BaselineResult {
  /** The ESLint instance, e.g. to load a formatter. */
  eslint: ESLint
}

/**
 * Lints a Laioutr app with only the larrylint rules, apart from the project's own ESLint setup.
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
