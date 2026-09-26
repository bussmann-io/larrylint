import type { Expression, Pattern, Program, SpreadElement } from 'estree'
import type { AST } from 'vue-eslint-parser'

import tsParser from '@typescript-eslint/parser'
import { parse } from 'vue-eslint-parser'
import { readFileCached } from './fs'

/**
 * Finds the variable that holds a component's props, e.g. `props` in `const props = defineProps(...)`.
 *
 * @param program The component's script.
 *
 * @returns The variable's name, or `undefined` if the props aren't assigned.
 */
export function findPropsVariable(program: Program) {
  for (const statement of program.body) {
    if (statement.type !== 'VariableDeclaration') {
      continue
    }

    for (const declarator of statement.declarations) {
      if (declarator.id.type === 'Identifier' && declarator.init && isDefineProps(declarator.init)) {
        return declarator.id.name
      }
    }
  }

  return undefined
}

/**
 * Checks whether an expression declares props, also through `withDefaults()`.
 *
 * @param node The expression.
 *
 * @returns `true` for `defineProps(...)` and `withDefaults(defineProps(...), ...)`.
 */
export function isDefineProps(node: Expression | Pattern | SpreadElement): boolean {
  if (node.type !== 'CallExpression' || node.callee.type !== 'Identifier') {
    return false
  }

  const [first] = node.arguments

  return node.callee.name === 'defineProps' || (node.callee.name === 'withDefaults' && first !== undefined && isDefineProps(first))
}

/**
 * Lists the elements a template renders at its root. An element with `v-else-if` or `v-else`
 * renders instead of the one before it, so it doesn't count as another root.
 *
 * @param template The `<template>` element.
 *
 * @returns The root elements.
 */
export function renderedRoots(template: AST.VElement) {
  return template.children.filter((child): child is AST.VElement => child.type === 'VElement' && !child.startTag.attributes.some(attribute => attribute.directive && (attribute.key.name.name === 'else' || attribute.key.name.name === 'else-if')))
}

/**
 * Parses a Vue single-file component from disk, cached until the file changes.
 *
 * @param path Absolute path of the `.vue` file.
 *
 * @returns The AST and the source, or `undefined` if the file is missing or doesn't parse.
 */
export function parseVueFile(path: string) {
  return readFileCached(path, (text) => {
    try {
      return { ast: parse(text, { parser: tsParser, sourceType: 'module', ecmaVersion: 'latest' }), text }
    }
    catch {
      return undefined
    }
  })
}
