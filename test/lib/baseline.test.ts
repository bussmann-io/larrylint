import { existsSync, readFileSync } from 'node:fs'
import tsParser from '@typescript-eslint/parser'
import { Linter } from 'eslint'
import { join } from 'pathe'
import { beforeEach, describe, expect, it } from 'vitest'
import { BASELINE_FILE, writeBaseline } from '../../src/lib/baseline'
import { plugin } from '../../src/setup/plugin'
import { copyFixture } from '../utils'

const HANDLER = 'src/runtime/server/orchestr/Brunch.query.ts'

describe('baseline', () => {
  let cwd: string

  beforeEach(() => {
    cwd = copyFixture()
  })

  function lint(code: string, settings: Record<string, unknown> = {}) {
    const config: Linter.Config[] = [{
      files: ['**/*.ts'],
      languageOptions: { parser: tsParser },
      plugins: { larrylint: plugin },
      rules: { 'larrylint/handler-exports': 'error' },
      settings,
    }]

    return new Linter({ cwd }).verify(code, config, join(cwd, HANDLER))
  }

  it('lets rules skip what the baseline covers', () => {
    writeBaseline(cwd, { [HANDLER]: { 'larrylint/handler-exports': 1 } })

    expect(lint('export const a = 1\nexport default handler')).toEqual([])
    expect(lint('export const a = 1\nexport const b = 2\nexport default handler')).toHaveLength(2)
    expect(lint('export const a = 1\nexport default handler', { larrylint: { baseline: false } })).toHaveLength(1)
  })

  it('writes sorted entries and removes an empty baseline', () => {
    writeBaseline(cwd, { 'src/b.ts': { 'larrylint/layers': 1, 'larrylint/component-name': 2 }, 'src/a.ts': { 'larrylint/layers': 3 } })

    expect(readFileSync(join(cwd, BASELINE_FILE), 'utf8')).toBe(`{
  "src/a.ts": {
    "larrylint/layers": 3
  },
  "src/b.ts": {
    "larrylint/component-name": 2,
    "larrylint/layers": 1
  }
}
`)

    writeBaseline(cwd, {})

    expect(existsSync(join(cwd, BASELINE_FILE))).toBe(false)
  })
})
