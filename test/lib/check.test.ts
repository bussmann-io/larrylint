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
      'src/runtime/app/composables/useVoucher.ts': ['larrylint/layers'],
      'src/runtime/app/sections/ContactFormSection.vue': ['larrylint/button-type'],
      'src/runtime/app/sections/SectionMap.vue': ['larrylint/heavy-imports'],
      'src/runtime/server/orchestr/brunch/Brunch.query.ts': ['larrylint/handler-exports'],
      'src/runtime/server/utils/tracking/track.ts': ['larrylint/config-keys'],
    })

    expect(violations['src/runtime/server/utils/tracking/track.ts']).toEqual({ 'larrylint/config-keys': 1 })
  })

  it('hides baselined violations until a file gets more of them', async () => {
    writeBaseline(cwd, (await check(cwd)).violations)

    const clean = await check(cwd)

    expect(reported(cwd, clean.results)).toEqual({})
    expect(clean.baselined).toBe(5)

    appendFileSync(join(cwd, 'src/runtime/server/utils/tracking/track.ts'), `\nexport const shop = () => useRuntimeConfig()['@laioutr-app/shopware']\n`)

    const dirty = await check(cwd)

    expect(reported(cwd, dirty.results)).toEqual({
      'src/runtime/server/utils/tracking/track.ts': ['larrylint/config-keys', 'larrylint/config-keys'],
    })
  })

  it('counts baseline entries that got better', async () => {
    writeBaseline(cwd, (await check(cwd)).violations)
    writeFileSync(join(cwd, 'src/runtime/app/composables/useVoucher.ts'), `export const useVoucher = () => []\n`)

    const { improved, results } = await check(cwd)

    expect(improved).toBe(1)
    expect(reported(cwd, results)).toEqual({})
  })

  it('fixes l-button types', async () => {
    await check(cwd, { fix: true })

    expect(readFileSync(join(cwd, 'src/runtime/app/sections/ContactFormSection.vue'), 'utf8')).toContain('<l-button button-type="submit">')
  })
})
