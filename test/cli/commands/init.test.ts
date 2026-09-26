import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { runCommand } from 'citty'
import { consola } from 'consola'
import { join } from 'pathe'
import { beforeAll, describe, expect, it } from 'vitest'
import init from '../../../src/cli/commands/init'
import { NEW_ESLINT_CONFIG } from '../../../src/cli/utils/eslint'
import { BASELINE_FILE } from '../../../src/lib/baseline'
import { copyFixture } from '../../utils'

describe('init', () => {
  beforeAll(() => {
    consola.level = -999
  })

  it('creates an eslint config and records the baseline', async () => {
    const cwd = copyFixture()

    await runCommand(init, { rawArgs: ['--cwd', cwd] })

    expect(readFileSync(join(cwd, 'eslint.config.mjs'), 'utf8')).toBe(NEW_ESLINT_CONFIG)
    expect(JSON.parse(readFileSync(join(cwd, BASELINE_FILE), 'utf8'))).toEqual({
      'src/runtime/app/composables/useVoucher.ts': { 'larrylint/layers': 1 },
      'src/runtime/app/sections/ContactFormSection.vue': { 'larrylint/button-type': 1 },
      'src/runtime/app/sections/SectionMap.vue': { 'larrylint/heavy-imports': 1 },
      'src/runtime/server/orchestr/brunch/Brunch.query.ts': { 'larrylint/handler-exports': 1 },
      'src/runtime/server/utils/tracking/track.ts': { 'larrylint/config-keys': 1 },
    })
  })

  it('extends an existing eslint config', async () => {
    const cwd = copyFixture()

    writeFileSync(join(cwd, 'eslint.config.js'), `export default [{ rules: {} }]\n`)

    await runCommand(init, { rawArgs: ['--cwd', cwd] })

    expect(readFileSync(join(cwd, 'eslint.config.js'), 'utf8')).toContain('...(await larrylint())')
    expect(existsSync(join(cwd, 'eslint.config.mjs'))).toBe(false)
  })
})
