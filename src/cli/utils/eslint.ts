import type { AstNode, Edit } from './edit'

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { parseModule } from 'magicast'
import { join } from 'pathe'
import { appendItem } from './edit'

const CONFIG_FILES = ['eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs', 'eslint.config.ts', 'eslint.config.mts', 'eslint.config.cts']

const COMPOSERS = /^(?:@nuxt\/eslint-config(?:\/flat)?|@antfu\/eslint-config|eslint-flat-config-utils)$|\/\.nuxt\/eslint\.config\.mjs$/

const CONFIG_FUNCTIONS = new Set(['defineConfig', 'extendConfig'])

export const NEW_ESLINT_CONFIG = `import larrylint from 'larrylint'\n\nexport default larrylint()\n`

export const MANUAL_SNIPPET = `import larrylint from 'larrylint'

export default [
  // ...your config
  ...(await larrylint()),
]`

export interface WireResult {
  status: 'created' | 'updated' | 'present' | 'unknown'
  file: string
}

/**
 * Adds larrylint to the project's ESLint config, or creates `eslint.config.mjs` if there is none.
 *
 * @param cwd The folder of the Laioutr app.
 *
 * @returns What happened to which file.
 */
export function wireEslintConfig(cwd: string): WireResult {
  const file = CONFIG_FILES.map(name => join(cwd, name)).find(path => existsSync(path))

  if (!file) {
    const created = join(cwd, 'eslint.config.mjs')

    writeFileSync(created, NEW_ESLINT_CONFIG)

    return { status: 'created', file: created }
  }

  const result = addLarrylint(readFileSync(file, 'utf8'))

  if (typeof result === 'string') {
    writeFileSync(file, result)

    return { status: 'updated', file }
  }

  return { status: result, file }
}

/**
 * Adds the larrylint import and config to the source of an ESLint flat config, keeping its formatting.
 *
 * @param code The source of the config file.
 *
 * @returns The new source, `present` if larrylint is already there, or `unknown` for a shape it can't extend.
 */
export function addLarrylint(code: string): string | 'present' | 'unknown' {
  const mod = parseModule(code)
  const imports = Object.values(mod.imports)

  if (imports.some(item => item.from === 'larrylint')) {
    return 'present'
  }

  const body = (mod.$ast as unknown as { body: AstNode[] }).body
  const exported = body.find(node => node.type === 'ExportDefaultDeclaration')?.declaration as AstNode | undefined

  let edit: Edit | undefined

  if (exported?.type === 'ArrayExpression') {
    edit = appendItem(code, exported, exported.elements, '...(await larrylint())')
  }
  else if (exported?.type === 'CallExpression' && isComposer(exported, imports)) {
    const indent = code.slice(exported.start, exported.end).match(/\n([ \t]*)\.[a-z]/i)?.[1]

    edit = { start: exported.end, end: exported.end, text: `${indent === undefined ? '' : `\n${indent}`}.append(larrylint())` }
  }
  else if (exported?.type === 'CallExpression' && exported.callee.type === 'Identifier' && CONFIG_FUNCTIONS.has(exported.callee.name)) {
    edit = appendItem(code, exported, exported.arguments, 'await larrylint()')
  }
  else if (exported?.type === 'Identifier') {
    edit = extendBinding(body, exported, imports)
  }

  if (!edit) {
    return 'unknown'
  }

  const lastImport = body.filter(node => node.type === 'ImportDeclaration').at(-1)
  const semi = lastImport ? code.slice(lastImport.start, lastImport.end).endsWith(';') : false
  const importLine = `import larrylint from 'larrylint'${semi ? ';' : ''}`

  let result = `${code.slice(0, edit.start)}${edit.text}${code.slice(edit.end)}`

  result = lastImport
    ? `${result.slice(0, lastImport.end)}\n${importLine}${result.slice(lastImport.end)}`
    : `${importLine}\n\n${result}`

  return result
}

/**
 * Extends a config exported by name, like `export default config` in laioutr's app starter.
 *
 * @param body The statements of the config file.
 * @param identifier The exported identifier.
 * @param imports The imports of the config file.
 *
 * @returns `.append()` for a composer, otherwise a new array spreading both configs.
 */
export function extendBinding(body: AstNode[], identifier: AstNode, imports: { from: string, local: string }[]): Edit {
  const imported = imports.find(item => item.local === identifier.name)
  const declared = body.flatMap(node => node.type === 'VariableDeclaration' ? node.declarations as AstNode[] : []).find(declarator => declarator.id.name === identifier.name)
  const composer = imported ? COMPOSERS.test(imported.from) : declared?.init?.type === 'CallExpression' && isComposer(declared.init, imports)

  return composer
    ? { start: identifier.end, end: identifier.end, text: '.append(larrylint())' }
    : { start: identifier.start, end: identifier.end, text: `[...${identifier.name}, ...(await larrylint())]` }
}

/**
 * Checks whether a call chain starts with a config factory that returns a composer.
 *
 * @param call The exported call expression.
 * @param imports The imports of the config file.
 *
 * @returns `true` for e.g. `createConfigForNuxt(...).append(...)` or `antfu(...)`.
 */
export function isComposer(call: AstNode, imports: { from: string, local: string }[]) {
  let node = call

  while (node.callee.type === 'MemberExpression' && node.callee.object.type === 'CallExpression') {
    node = node.callee.object
  }

  const factory = node.callee.type === 'Identifier' ? imports.find(item => item.local === node.callee.name) : undefined

  return factory ? COMPOSERS.test(factory.from) : false
}
