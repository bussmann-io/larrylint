import type { Node } from 'estree'
import type { AST } from 'vue-eslint-parser'

import { defineRule } from '../../../lib/rule'

/** Attributes and properties that take a link target. */
const LINK_NAMES = new Set(['to', 'href', 'link'])

/** Calls that navigate to a path. */
const NAVIGATE = new Set(['navigateTo', 'push', 'replace'])

/**
 * Checks whether an expression builds an internal path by hand, e.g. `` `/hotels/${slug}` `` or `'/hotels/' + slug`.
 *
 * @param node The expression.
 *
 * @returns `true` for a path that starts with `/` and has variable parts, outside `/api/`.
 */
function isHandBuilt(node: Node | null | undefined): boolean {
  const start = node?.type === 'TemplateLiteral' && node.expressions.length > 0
    ? node.quasis[0]?.value.cooked
    : node?.type === 'BinaryExpression' && node.operator === '+' && node.left.type === 'Literal' && typeof node.left.value === 'string'
      ? node.left.value
      : undefined

  return start !== undefined && start !== null && start.startsWith('/') && !start.startsWith('//') && !start.startsWith('/api/')
}

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hand-built internal paths, which break when a page type\'s route changes.',
    },
    schema: [],
    messages: {
      path: 'This path breaks when the page type\'s route changes, and Studio can\'t follow it. Resolve the link with linkResolver instead.',
    },
  },

  applies: file => file.side === 'app',

  create: ({ report, visitTemplate }) => {
    visitTemplate({
      VAttribute: (node: AST.VAttribute | AST.VDirective) => {
        const argument = node.directive && node.key.name.name === 'bind' ? node.key.argument : null
        const expression = node.directive ? node.value?.expression : undefined

        if (argument?.type === 'VIdentifier' && LINK_NAMES.has(argument.name) && isHandBuilt(expression as Node | undefined)) {
          report({ node: expression as Node, messageId: 'path' })
        }
      },
    })

    return {
      CallExpression: (node) => {
        const { callee } = node
        const name = callee.type === 'Identifier' ? callee.name : callee.type === 'MemberExpression' && callee.property.type === 'Identifier' ? callee.property.name : ''
        const [target] = node.arguments

        if (NAVIGATE.has(name) && isHandBuilt(target)) {
          report({ node: target!, messageId: 'path' })
        }
      },

      Property: (node) => {
        if (node.key.type === 'Identifier' && LINK_NAMES.has(node.key.name) && isHandBuilt(node.value)) {
          report({ node: node.value, messageId: 'path' })
        }
      },
    }
  },
})
