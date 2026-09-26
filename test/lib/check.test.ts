import type { ESLint } from 'eslint'

import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'pathe'
import { beforeEach, describe, expect, it } from 'vitest'
import { writeBaseline } from '../../src/lib/baseline'
import { check } from '../../src/lib/check'
import { copyFixture } from '../utils'

function reported(cwd: string, results: ESLint.LintResult[]) {
  return Object.fromEntries(results.filter(result => result.messages.length > 0).map(result => [result.filePath.slice(cwd.length + 1), result.messages.map(message => message.ruleId)]))
}

describe('check', () => {
  let cwd: string

  beforeEach(() => {
    cwd = copyFixture()
  })

  it('reports the larrylint rules and nothing else', async () => {
    const { results, violations } = await check(cwd)

    expect(reported(cwd, results)).toEqual({
      'src/runtime/app/sections/ContactFormSection.vue': ['larrylint/definitions', 'larrylint/button-type'],
      'src/runtime/server/orchestr/Brunch.query.ts': ['larrylint/orchestr-files', 'larrylint/orchestr-files'],
      'src/runtime/server/utils/vouchers/context.ts': ['larrylint/layers'],
    })

    expect(violations['src/runtime/server/orchestr/Brunch.query.ts']).toEqual({ 'larrylint/orchestr-files': 2 })
  })

  it('hides baselined violations until a file gets more of them', async () => {
    writeBaseline(cwd, (await check(cwd)).violations)

    const clean = await check(cwd)

    expect(reported(cwd, clean.results)).toEqual({})
    expect(clean.baselined).toBe(5)

    appendFileSync(join(cwd, 'src/runtime/server/orchestr/Brunch.query.ts'), `\nexport const extra = 1\n`)

    const dirty = await check(cwd)

    expect(reported(cwd, dirty.results)).toEqual({
      'src/runtime/server/orchestr/Brunch.query.ts': ['larrylint/orchestr-files', 'larrylint/orchestr-files', 'larrylint/orchestr-files'],
    })
  })

  it('counts baseline entries that got better', async () => {
    writeBaseline(cwd, (await check(cwd)).violations)
    writeFileSync(join(cwd, 'src/runtime/server/utils/vouchers/context.ts'), `export const context = () => []\n`)

    const { improved, results } = await check(cwd)

    expect(improved).toBe(1)
    expect(reported(cwd, results)).toEqual({})
  })

  it('fixes l-button types', async () => {
    await check(cwd, { fix: true })

    expect(readFileSync(join(cwd, 'src/runtime/app/sections/ContactFormSection.vue'), 'utf8')).toContain('<l-button button-type="submit">')
  })
})
