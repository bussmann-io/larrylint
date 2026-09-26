import type { CallExpression, Literal, ObjectExpression } from 'estree'
import type { Kind } from './layout'

import { findProperty, findStringProperty, objectElements } from '../utils/ast/object'

export const DEFINERS = {
  defineSection: { kind: 'section', folder: 'sections', prefix: 'Section' },
  defineBlock: { kind: 'block', folder: 'blocks', prefix: 'Block' },
} as const

export type Definer = keyof typeof DEFINERS

export interface Definition {
  /** The called definer, e.g. `defineSection`. */
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
  /** The field's `type`, e.g. `text` or `checkbox`, if it's a string literal. */
  type?: string
  /** The decorator role of a field that styles or toggles another, e.g. `style`. */
  as?: string
}

export interface Group {
  /** The group's object literal. */
  node: ObjectExpression
  /** The group's `label`, if it's a string literal. */
  label?: { value: string, node: Literal }
  /** The group's fields. */
  fields: Field[]
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
 * Reads the schema groups of a definition or an `object` field, skipping spreads and factory calls.
 *
 * @param owner The definition or field.
 *
 * @returns The groups in schema order.
 */
export function readGroups(owner: Definition | Field): Group[] {
  const node = 'call' in owner ? owner.options : owner.node

  return objectElements(node && findProperty(node, 'schema')).map(group => ({
    node: group,
    label: findStringProperty(group, 'label'),
    fields: objectElements(findProperty(group, 'fields')).map(readField),
  }))
}

/**
 * Reads a field's name, type and decorator role.
 *
 * @param node The field's object literal.
 *
 * @returns The field.
 */
export function readField(node: ObjectExpression): Field {
  return {
    node,
    name: findStringProperty(node, 'name'),
    type: findStringProperty(node, 'type')?.value,
    as: findStringProperty(node, 'as')?.value,
  }
}

/**
 * Lists the top-level fields of every schema group, which become the component's props.
 *
 * @param definition The definition.
 *
 * @returns The fields in schema order.
 */
export function readFields(definition: Definition) {
  return readGroups(definition).flatMap(group => group.fields)
}

/**
 * Lists every field of a definition, including those nested in `object` fields.
 *
 * @param definition The definition.
 *
 * @returns The fields, depth first.
 */
export function readAllFields(definition: Definition) {
  const fields: Field[] = []
  const visit = (field: Field) => {
    fields.push(field)
    readGroups(field).flatMap(group => group.fields).forEach(visit)
  }

  readFields(definition).forEach(visit)

  return fields
}

/**
 * Finds the definer that files of a kind must call.
 *
 * @param kind The kind of the file.
 *
 * @returns `defineSection` for sections, `defineBlock` for blocks, otherwise `undefined`.
 */
export function expectedDefiner(kind: Kind | undefined) {
  return (Object.keys(DEFINERS) as Definer[]).find(definer => DEFINERS[definer].kind === kind)
}
