import tsParser from '@typescript-eslint/parser'
import { Linter } from 'eslint'
import { describe, expect, it } from 'vitest'
import vueParser from 'vue-eslint-parser'
import rule from '../../../../src/rules/frontend/ui-kit/tags'
import { fixtureRuntime, runtime, vueTester } from '../../../utils'

const filename = fixtureRuntime('app/components/Menu.vue', 'components')

vueTester.run('ui-kit-tags', rule, {
  valid: [
    { filename, code: `<template><l-button /><LSheetClose /><l-sheet /><l-usp-banner-item /><button /></template>` },
    { filename, code: `<script setup lang="ts">\nimport { LMap } from '@vue-leaflet/vue-leaflet'\n</script>\n<template><LMap /></template>` },
    { filename, code: `<template><LanguageSwitcher /></template>` },
  ],

  invalid: [
    { filename, code: `<template><l-language-switcher /></template>`, errors: [{ messageId: 'unknown', data: { tag: 'l-language-switcher' } }] },
    { filename, code: `<template><LSheetFooter /></template>`, errors: [{ messageId: 'unknown', data: { tag: 'LSheetFooter' } }] },
  ],
})

describe('ui-kit-tags', () => {
  it('fails when ui-kit isn\'t installed', () => {
    const config: Linter.Config[] = [{
      files: ['**/*.vue'],
      languageOptions: { parser: vueParser, parserOptions: { parser: tsParser } },
      plugins: { larrylint: { rules: { 'ui-kit-tags': rule } } },
      rules: { 'larrylint/ui-kit-tags': 'error' },
    }]

    expect(() => new Linter({ cwd: '/app' }).verify(`<template><l-button /></template>`, config, runtime('app/components/Menu.vue')))
      .toThrow(/can't find @laioutr-core\/ui-kit/)
  })
})
