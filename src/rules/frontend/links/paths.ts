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
      description: 'Disallow page paths built by hand',
    },
    schema: [],
    messages: {
      path: 'Hand-built page paths differ per language and market. Use linkResolver instead.',
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
