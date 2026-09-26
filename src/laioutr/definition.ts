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
  /** The field's `type`, e.g. `text` or `checkbox`, if it's a string literal. */
  type?: string
  /** The decorator role, e.g. `style` or `visibility`, of a field that styles or toggles another field. */
  as?: string
}

export interface Group {
  /** The group's object literal. */
  node: ObjectExpression
  /** The group's `label`, if it's a string literal. */
  label?: { value: string, node: Literal }
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
 * Reads the schema groups of a definition, e.g. `{ label: 'Content', fields: [...] }`. Spreads and
 * factory calls are skipped, since their fields aren't known without running them.
 *
 * @param definition The definition.
 *
 * @returns The groups in schema order.
 */
export function readGroups(definition: Definition): Group[] {
  return definition.options ? readSchema(definition.options) : []
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
 * Lists every field of a definition, including those nested in the schema of `object` fields.
 *
 * @param definition The definition.
 *
 * @returns The fields, depth first.
 */
export function readAllFields(definition: Definition) {
  const fields: Field[] = []
  const visit = (field: Field) => {
    fields.push(field)
    readSchema(field.node).flatMap(group => group.fields).forEach(visit)
  }

  readFields(definition).forEach(visit)

  return fields
}

/**
 * Reads the `schema` groups of a definition or an `object` field.
 *
 * @param owner The object with the `schema` property.
 *
 * @returns The groups.
 */
function readSchema(owner: ObjectExpression): Group[] {
  return objectElements(findProperty(owner, 'schema')).map(group => ({
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
function readField(node: ObjectExpression): Field {
  return {
    node,
    name: findStringProperty(node, 'name'),
    type: findStringProperty(node, 'type')?.value,
    as: findStringProperty(node, 'as')?.value,
  }
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
