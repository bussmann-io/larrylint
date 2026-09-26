import type { Node } from 'estree'
import type { AST } from 'vue-eslint-parser'

import { defineRule } from '../../../lib/rule'
import { nameOf } from '../../../utils/ast/chain'
import { isHandBuiltPath } from '../../../utils/nuxt/routes'

const LINK_NAMES = new Set(['to', 'href', 'link'])

const NAVIGATE = new Set(['navigateTo', 'push', 'replace'])

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

        if (argument?.type === 'VIdentifier' && LINK_NAMES.has(argument.name) && isHandBuiltPath(expression as Node | undefined)) {
          report({ node: expression as Node, messageId: 'path' })
        }
      },
    })

    return {
      CallExpression: (node) => {
        const [target] = node.arguments

        if (NAVIGATE.has(nameOf(node.callee) ?? '') && isHandBuiltPath(target)) {
          report({ node: target!, messageId: 'path' })
        }
      },

      Property: (node) => {
        if (node.key.type === 'Identifier' && LINK_NAMES.has(node.key.name) && isHandBuiltPath(node.value)) {
          report({ node: node.value, messageId: 'path' })
        }
      },
    }
  },
})
