import type { Node } from 'estree'
import type { AST } from 'vue-eslint-parser'

import { walk } from '../ast/walk'

/**
 * Lists the elements a template renders at its root, leaving out `v-else-if` and `v-else` branches.
 *
 * @param template The `<template>` element.
 *
 * @returns The root elements.
 */
export function renderedRoots(template: AST.VElement) {
  return template.children.filter((child): child is AST.VElement => child.type === 'VElement' && !child.startTag.attributes.some(attribute => attribute.directive && (attribute.key.name.name === 'else' || attribute.key.name.name === 'else-if')))
}

/**
 * Finds an attribute of an element by name, static or bound.
 *
 * @param element The element.
 * @param name The attribute name, e.g. `href`.
 *
 * @returns The attribute, or `undefined`.
 */
export function findAttribute(element: AST.VElement, name: string) {
  return element.startTag.attributes.find(attribute => attribute.directive
    ? attribute.key.name.name === 'bind' && attribute.key.argument?.type === 'VIdentifier' && attribute.key.argument.name === name
    : attribute.key.name === name)
}

/**
 * Reads the literal start of an attribute's value, e.g. `/cart/` for `:href="`/cart/${id}`"`.
 *
 * @param attribute The attribute.
 *
 * @returns The start, or `undefined` if it isn't known.
 */
export function valueStart(attribute: AST.VAttribute | AST.VDirective) {
  if (!attribute.directive) {
    return attribute.value?.value
  }

  const expression = attribute.value?.expression

  if (expression?.type === 'Literal' && typeof expression.value === 'string') {
    return expression.value
  }

  return expression?.type === 'TemplateLiteral' ? expression.quasis[0]?.value.cooked ?? undefined : undefined
}

/**
 * Checks whether an element renders as a tag, also through `<component :is="…">`.
 *
 * @param element The element.
 * @param tag The tag, e.g. `a`.
 *
 * @returns `true` for the tag itself, and for a component whose `is` can be the tag.
 */
export function rendersTag(element: AST.VElement, tag: string) {
  const is = element.rawName === 'component' ? findAttribute(element, 'is') : undefined

  if (element.rawName === tag || (is && !is.directive && is.value?.value === tag)) {
    return true
  }

  const expression = is?.directive ? is.value?.expression : undefined
  let found = false

  if (expression) {
    walk(expression as Node, (node) => {
      found ||= node.type === 'Literal' && node.value === tag
    })
  }

  return found
}
