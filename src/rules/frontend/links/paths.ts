import type { Node } from 'estree'
import type { AST } from 'vue-eslint-parser'

import { defineRule } from '../../../lib/rule'
import { nameOf } from '../../../utils/ast/chain'
import { isHandBuiltPath, isRouter } from '../../../utils/nuxt/routes'

const LINK_NAMES = new Set(['to', 'href', 'link'])

const ROUTER_METHODS = new Set(['push', 'replace'])

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hand-built paths to pages, which miss the per-language paths and market prefixes Studio sets.',
    },
    schema: [],
    messages: {
      path: 'Page paths are set per page and language in Studio, and each market adds its own prefix, e.g. /en, so this path can lead to the wrong page. Resolve the link with linkResolver instead.',
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
        const { callee } = node
        const [target] = node.arguments
        const navigates = callee.type === 'Identifier'
          ? callee.name === 'navigateTo'
          : callee.type === 'MemberExpression' && ROUTER_METHODS.has(nameOf(callee) ?? '') && isRouter(callee.object)

        if (navigates && isHandBuiltPath(target)) {
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
