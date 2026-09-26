import type { AST } from 'vue-eslint-parser'

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
