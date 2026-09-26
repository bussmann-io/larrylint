import type { Rule } from 'eslint'
import type { Expression, Identifier, Node, Pattern, Program, SpreadElement } from 'estree'

import type { FunctionNode } from '../ast/functions'

import { isFunction } from '../ast/functions'
import { findImport } from '../ast/module'
import { resolveModule } from '../fs'

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
 * Lists the props a use of the props object reads, e.g. `title` for `props.title`.
 *
 * @param node The props identifier.
 *
 * @returns The prop names, or `undefined` if the whole object escapes, e.g. `v-bind="props"`.
 */
export function usedProps(node: Identifier & { parent: Node }): string[] | undefined {
  const { parent } = node

  if (parent.type === 'MemberExpression' && parent.object === node) {
    if (!parent.computed && parent.property.type === 'Identifier') {
      return [parent.property.name]
    }

    return parent.property.type === 'Literal' && typeof parent.property.value === 'string' ? [parent.property.value] : undefined
  }

  if (parent.type === 'VariableDeclarator' && parent.init === node && parent.id.type === 'ObjectPattern') {
    const names = parent.id.properties.map(property => property.type === 'Property' && property.key.type === 'Identifier' && !property.computed ? property.key.name : undefined)

    return names.every(name => name !== undefined) ? names : undefined
  }

  return undefined
}

/**
 * Finds the variable that holds a value: `const x = value` or `const x = computed(() => value)`.
 *
 * @param node The value.
 *
 * @returns The variable's name, whether it's a computed ref, and the function that returns the value, or `undefined`.
 */
export function findHolder(node: Rule.Node) {
  let value = node
  let fn: FunctionNode | undefined
  const { parent } = node

  if (parent?.type === 'ReturnStatement') {
    let current: Rule.Node | null = parent.parent

    while (current && !isFunction(current)) {
      current = current.parent
    }

    fn = current as FunctionNode | null ?? undefined
    value = current ?? value
  }
  else if (parent && isFunction(parent) && parent.body === node) {
    fn = parent
    value = parent
  }

  const computed = value.parent?.type === 'CallExpression' && value.parent.callee.type === 'Identifier' && value.parent.callee.name === 'computed' ? value.parent : undefined
  const declarator = (computed ?? value).parent

  return declarator?.type === 'VariableDeclarator' && declarator.id.type === 'Identifier' ? { name: declarator.id.name, computed: computed !== undefined, fn } : undefined
}

/**
 * Finds the `.vue` file a component is imported from.
 *
 * @param program The script of the importing component.
 * @param filename Absolute path of the importing component.
 * @param name The component's local name, e.g. `BurgerMenu`.
 *
 * @returns The file, or `undefined` for global and package components.
 */
export function importedComponent(program: Program, filename: string, name: string) {
  const imported = findImport(program, name)

  return imported?.name === 'default' && imported.source.endsWith('.vue') ? resolveModule(filename, imported.source) : undefined
}
