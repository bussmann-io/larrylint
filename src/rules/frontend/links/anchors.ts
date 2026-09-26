import type { Rule } from 'eslint'
import type { CallExpression, Node } from 'estree'
import type { AST } from 'vue-eslint-parser'

import { destructuredResolvers, linkResolverMethod } from '../../../lib/laioutr/links'
import { defineRule } from '../../../lib/rule'
import { nameOf } from '../../../utils/ast/chain'
import { isInternalPath } from '../../../utils/nuxt/routes'
import { findHolder } from '../../../utils/vue/script'
import { findAttribute, rendersTag, valueStart } from '../../../utils/vue/template'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow plain `<a>` tags for internal links',
    },
    schema: [],
    messages: {
      anchor: 'A plain <a> reloads the whole page. Use <NuxtLink> for internal links.',
    },
  },

  applies: file => file.side === 'app' && file.path.endsWith('.vue'),

  create: ({ report, visitTemplate }) => {
    const destructured = new Map<string, string>()
    const resolved = new Set<string>()

    const resolves = (node: Node) => node.type === 'CallExpression' && (linkResolverMethod(node, destructured) !== undefined || nameOf(node.callee) === 'useResolvedLink')

    visitTemplate({
      VElement: (node: AST.VElement) => {
        const href = rendersTag(node, 'a') ? findAttribute(node, 'href') : undefined
        const target = findAttribute(node, 'target')

        if (!href || findAttribute(node, 'download') || (target && !target.directive && target.value?.value === '_blank')) {
          return
        }

        const expression = href.directive ? href.value?.expression as Node | null | undefined : undefined
        const bound = expression && (resolves(expression) || (expression.type === 'Identifier' && resolved.has(expression.name)))

        if (bound || isInternalPath(valueStart(href))) {
          report({ loc: href.loc, messageId: 'anchor' })
        }
      },
    })

    return {
      VariableDeclarator: (node) => {
        destructuredResolvers(node).forEach((method, local) => destructured.set(local, method))
      },

      CallExpression: (node: CallExpression & Rule.NodeParentExtension) => {
        const holder = resolves(node) ? findHolder(node) : undefined

        if (holder) {
          resolved.add(holder.name)
        }
      },
    }
  },
})
