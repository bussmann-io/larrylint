import { cpSync, mkdtempSync, realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import tsParser from '@typescript-eslint/parser'
import { RuleTester } from 'eslint'
import { join } from 'pathe'
import { describe, it } from 'vitest'
import vueParser from 'vue-eslint-parser'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

export const tsTester = new RuleTester({
  languageOptions: { parser: tsParser },
})

export const vueTester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    parserOptions: { parser: tsParser },
  },
})

export function runtime(path: string) {
  return `/app/src/runtime/${path}`
}

export function fixtureRuntime(path: string, app = 'app') {
  return join(import.meta.dirname, 'fixtures', app, 'src/runtime', path)
}

export function copyFixture() {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'larrylint-')))

  cpSync(join(import.meta.dirname, 'fixtures/app'), cwd, { recursive: true })

  return cwd
}

export function withDefinition(definition: string) {
  return `<script lang="ts">\nexport const definition = ${definition}\n</script>\n\n<template><div /></template>\n`
}
