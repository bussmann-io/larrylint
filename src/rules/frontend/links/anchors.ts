import type { AST } from 'vue-eslint-parser'

import { defineRule } from '../../../lib/rule'

/**
 * Reads the start of an attribute's value, static or bound to a string or template literal.
 *
 * @param attribute The attribute, e.g. `href="/cart"` or `:href="`/cart/${id}`"`.
 *
 * @returns The literal start of the value, or `undefined` if it isn't known.
 */
function valueStart(attribute: AST.VAttribute | AST.VDirective) {
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
 * Finds an attribute of an element by name, static or bound.
 *
 * @param element The element.
 * @param name The attribute name, e.g. `href`.
 *
 * @returns The attribute, or `undefined`.
 */
function findAttribute(element: AST.VElement, name: string) {
  return element.startTag.attributes.find(attribute => attribute.directive
    ? attribute.key.name.name === 'bind' && attribute.key.argument?.type === 'VIdentifier' && attribute.key.argument.name === name
    : attribute.key.name === name)
}

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow plain `<a>` tags for internal links, which reload the page and break Studio\'s navigation sync.',
    },
    schema: [],
    messages: {
      anchor: 'A plain <a> reloads the whole page and breaks Studio\'s navigation sync. Use <NuxtLink> for internal links.',
    },
  },

  applies: file => file.side === 'app' && file.path.endsWith('.vue'),

  create: ({ report, visitTemplate }) => {
    visitTemplate({
      VElement: (node: AST.VElement) => {
        if (node.rawName !== 'a') {
          return
        }

        const href = findAttribute(node, 'href')
        const target = findAttribute(node, 'target')
        const start = href && valueStart(href)
        const external = target && !target.directive && target.value?.value === '_blank'

        // API routes need a full page load, e.g. a login that redirects.
        if (href && start?.startsWith('/') && !start.startsWith('//') && !start.startsWith('/api/') && !external) {
          report({ loc: href.loc, messageId: 'anchor' })
        }
      },
    })

    return {}
  },
})
