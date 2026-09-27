import type { CallExpression, Literal, ObjectExpression, Program } from 'estree'
import type { Kind } from './layout'

import { unwrap } from '../../utils/ast/chain'
import { resolveConstant } from '../../utils/ast/module'
import { findProperty, findStringProperty, objectElements } from '../../utils/ast/object'
import { walk } from '../../utils/ast/walk'

export const DEFINERS = {
  defineSection: { kind: 'section', option: 'sections' },
  defineBlock: { kind: 'block', option: 'blocks' },
} as const

export type Definer = keyof typeof DEFINERS

const PICKERS = new Set(['select', 'radio', 'toggle_button'])

const TEXTS = new Set(['text', 'textarea', 'secret'])

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
 * Lists the fields that `if` conditions read, e.g. `showHeading` in `if: ['get', 'showHeading']`.
 *
 * @param definition The definition.
 *
 * @returns The field names.
 */
export function conditionFields(definition: Definition) {
  const names = new Set<string>()

  for (const field of readAllFields(definition)) {
    const condition = findProperty(field.node, 'if')

    if (condition) {
      walk(condition, (node) => {
        const [operator, name] = node.type === 'ArrayExpression' ? node.elements : []

        if (operator?.type === 'Literal' && operator.value === 'get' && name?.type === 'Literal' && typeof name.value === 'string') {
          names.add(name.value.split('.')[0]!)
        }
      })
    }
  }

  return names
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

/**
 * Reads the value frontend-core fills an unset field with, e.g. `''` for text or a select's first option.
 *
 * @param field The field.
 * @param program The module with the definition, to find options declared elsewhere.
 * @param filename Absolute path of that module.
 *
 * @returns The value, or `undefined` if the field has no fill value or its options can't be read.
 */
export function fillValue(field: Field, program: Program, filename: string): { value: Literal['value'] } | undefined {
  if (field.type === 'checkbox') {
    return { value: field.as === 'visibility' }
  }

  if (TEXTS.has(field.type ?? '')) {
    return { value: '' }
  }

  if (field.type === 'content_alignment') {
    const axis = findStringProperty(field.node, 'axis')?.value

    return { value: !axis || axis === 'both' ? 'center-center' : 'center' }
  }

  if (!PICKERS.has(field.type ?? '')) {
    return undefined
  }

  const property = findProperty(field.node, 'options')
  const declared = property?.type === 'Identifier' ? resolveConstant(property.name, program, filename) : property
  let options = declared && unwrap(declared)

  if (options?.type === 'CallExpression') {
    options = options.arguments[0]
  }

  const first = options?.type === 'ArrayExpression' ? options.elements[0] : undefined
  const value = first?.type === 'ObjectExpression' ? findProperty(first, 'value') : first

  return value?.type === 'Literal' ? { value: value.value } : undefined
}
