import type { CallExpression, Literal, ObjectExpression } from 'estree'
import type { Kind } from './layout'

import { findProperty, findStringProperty, objectElements } from '../utils/ast/object'

/** The definers, with the folder and file name prefix Laioutr expects for each. */
export const DEFINERS = {
  defineSection: { kind: 'section', folder: 'sections', prefix: 'Section' },
  defineBlock: { kind: 'block', folder: 'blocks', prefix: 'Block' },
} as const

export type Definer = keyof typeof DEFINERS

export interface Definition {
  definer: Definer
  /** The `defineSection(...)` or `defineBlock(...)` call. */
  call: CallExpression
  /** The options object, if it's written inline. */
  options?: ObjectExpression
  /** The `component` name, if it's a string literal. */
  component?: { value: string, node: Literal }
}

export interface Field {
  /** The field's object literal. */
  node: ObjectExpression
  /** The field's `name`, if it's a string literal. */
  name?: { value: string, node: Literal }
}

/**
 * Reads a `defineSection(...)` or `defineBlock(...)` call.
 *
 * @param call Any call expression.
 *
 * @returns The definition, or `undefined` for other calls.
 */
export function readDefinition(call: CallExpression): Definition | undefined {
  if (call.callee.type !== 'Identifier' || !Object.hasOwn(DEFINERS, call.callee.name)) {
    return undefined
  }

  const [options] = call.arguments
  const inline = options?.type === 'ObjectExpression' ? options : undefined

  return {
    definer: call.callee.name as Definer,
    call,
    options: inline,
    component: inline && findStringProperty(inline, 'component'),
  }
}

/**
 * Lists the top-level fields of every schema group. Spreads and factory calls are skipped,
 * since their fields aren't known without running them.
 *
 * @param definition The definition.
 *
 * @returns The fields in schema order.
 */
export function readFields(definition: Definition) {
  if (!definition.options) {
    return []
  }

  return objectElements(findProperty(definition.options, 'schema'))
    .flatMap(group => objectElements(findProperty(group, 'fields')))
    .map((node): Field => ({ node, name: findStringProperty(node, 'name') }))
}

/**
 * Finds the definer that files in a folder must call.
 *
 * @param kind The kind of the file.
 *
 * @returns `defineSection` for sections, `defineBlock` for blocks, otherwise `undefined`.
 */
export function expectedDefiner(kind: Kind | undefined) {
  return (Object.keys(DEFINERS) as Definer[]).find(definer => DEFINERS[definer].kind === kind)
}
