import type { ExpressionStatement, Program } from 'estree'

import { parse } from '@typescript-eslint/parser'
import { join } from 'pathe'
import { describe, expect, it } from 'vitest'
import { classify } from '../../../src/lib/laioutr/layout'
import { entryFolder, isReferenced, isRegistered, readRegistration, runtimePath } from '../../../src/lib/laioutr/registration'
import { fixtureRuntime } from '../../utils'

function fixture(name: string) {
  return join(import.meta.dirname, '../../fixtures', name)
}

function expression(code: string) {
  return ((parse(code) as unknown as Program).body[0] as ExpressionStatement).expression
}

describe('readRegistration', () => {
  it('reads registerLaioutrApp() and addPlugin() from module.ts', () => {
    const registration = readRegistration(fixture('registered'))

    expect(registration.sections).toEqual(['app/section/**/Section*.vue'])
    expect(registration.blocks).toEqual(['app/section/**/Block*.vue', 'app/block/**/Block*.vue'])
    expect(registration.orchestr).toEqual(['server/handlers'])
    expect([...registration.plugins]).toEqual(['app/plugins/map', 'app/plugins/scanner.client'])
    expect(registration.references).toContain('app/overrides/SectionProductDetail')
  })

  it('registers nothing for an option module.ts leaves out', () => {
    expect(readRegistration(fixture('sections-only'))).toMatchObject({ sections: ['app/sections'], blocks: [], orchestr: ['server/orchestr'] })
  })

  it('falls back to the app starter\'s folders', () => {
    const starter = { sections: ['app/sections'], blocks: ['app/blocks'], orchestr: ['server/orchestr'] }

    expect(readRegistration(fixture('app'))).toMatchObject(starter)
    expect(readRegistration('/missing')).toMatchObject(starter)
  })
})

describe('runtimePath', () => {
  it('reads paths below src/runtime/', () => {
    expect(runtimePath(expression(`resolve('./runtime/app/sections')`))).toBe('app/sections')
    expect(runtimePath(expression(`resolve('runtime/server/orchestr')`))).toBe('server/orchestr')
    expect(runtimePath(expression(`resolveRuntimeModule('app/sections/')`))).toBe('app/sections')
    expect(runtimePath(expression(`resolve('./runtime', 'app/blocks')`))).toBe('app/blocks')
    expect(runtimePath(expression(`\`\${runtimeDir}/app/blocks\``))).toBe('app/blocks')
  })

  it('ignores paths elsewhere', () => {
    expect(runtimePath(expression(`resolve('./runtime')`))).toBeUndefined()
    expect(runtimePath(expression(`resolve('../app/sections')`))).toBeUndefined()
    expect(runtimePath(expression(`'@laioutr-core/kit'`))).toBeUndefined()
  })
})

describe('isRegistered', () => {
  it('globs folders the way the kit does', () => {
    expect(isRegistered('app/sections/hero/SectionHero.vue', ['app/sections'])).toBe(true)
    expect(isRegistered('app/sections/heroItems.ts', ['app/sections'])).toBe(false)
    expect(isRegistered('app/section/SectionHero.vue', ['app/section/**/Section*.vue'])).toBe(true)
    expect(isRegistered('app/section/HeroSlide.vue', ['app/section/**/Section*.vue'])).toBe(false)
  })
})

describe('entryFolder', () => {
  it('cuts an entry at its first wildcard or file name', () => {
    expect(entryFolder('app/sections')).toBe('app/sections')
    expect(entryFolder('app/section/**/Section*.vue')).toBe('app/section')
    expect(entryFolder('app/blocks/BlockCard.vue')).toBe('app/blocks')
  })
})

describe('isReferenced', () => {
  it('finds files module.ts names', () => {
    expect(isReferenced(classify(fixtureRuntime('app/overrides/SectionProductDetail.vue', 'registered'))!)).toBe(true)
    expect(isReferenced(classify(fixtureRuntime('app/overrides/SectionOther.vue', 'registered'))!)).toBe(false)
  })
})
