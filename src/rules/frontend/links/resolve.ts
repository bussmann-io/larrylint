import type { Rule } from 'eslint'
import type { CallExpression, Identifier } from 'estree'

import { destructuredResolvers, linkResolverMethod } from '../../../lib/laioutr/links'
import { defineRule } from '../../../lib/rule'
import { nameOf } from '../../../utils/ast/chain'
import { canReturnNullish } from '../../../utils/ast/functions'
import { isReference, isTested } from '../../../utils/ast/values'
import { findHolder } from '../../../utils/vue/script'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow checking the result of `linkResolver.resolve()`',
    },
    schema: [],
    messages: {
      tested: 'linkResolver.resolve() never returns an empty value, so this check misses broken links. Use resolveOrThrow() in a try/catch instead.',
      branch: 'linkResolver.resolve() never returns an empty value, so the checks on \'{{name}}\' miss broken links. Use resolveOrThrow() in a try/catch instead.',
    },
  },

  applies: file => file.side === 'app',

  create: ({ report, visitTemplate }) => {
    const destructured = new Map<string, string>()
    const calls: (CallExpression & Rule.NodeParentExtension)[] = []
    const scriptIdentifiers: (Identifier & Rule.NodeParentExtension)[] = []
    const templateIdentifiers: (Identifier & Rule.NodeParentExtension)[] = []

    visitTemplate({
      Identifier: (node: Identifier & Rule.NodeParentExtension) => {
        templateIdentifiers.push(node)
      },
    })

    return {
      'VariableDeclarator': (node) => {
        destructuredResolvers(node).forEach((method, local) => destructured.set(local, method))
      },

      'CallExpression': (node) => {
        calls.push(node)
      },

      'Identifier': (node) => {
        scriptIdentifiers.push(node)
      },

      'Program:exit': () => {
        const holders = new Map<string, { computed: boolean, branch?: CallExpression }>()
        const reported = new Set<CallExpression>()

        for (const call of calls) {
          if (linkResolverMethod(call, destructured) !== 'resolve') {
            continue
          }

          if (isTested(call)) {
            report({ node: call, messageId: 'tested' })
          }

          const holder = findHolder(call)

          if (holder) {
            holders.set(holder.name, { computed: holder.computed, branch: holder.fn && canReturnNullish(holder.fn, call) ? call : undefined })
          }
        }

        const check = (identifier: Identifier & Rule.NodeParentExtension, template: boolean) => {
          const holder = holders.get(identifier.name)
          const { parent } = identifier

          if (!holder || !isReference(identifier)) {
            return
          }

          const readsValue = parent.type === 'MemberExpression' && parent.object === identifier && nameOf(parent) === 'value'
          const value = holder.computed && !template ? (readsValue ? parent : undefined) : identifier

          if (!value || !isTested(value)) {
            return
          }

          if (!holder.branch) {
            report({ node: value, messageId: 'tested' })
          }
          else if (!reported.has(holder.branch)) {
            reported.add(holder.branch)
            report({ node: holder.branch, messageId: 'branch', data: { name: identifier.name } })
          }
        }

        scriptIdentifiers.forEach(identifier => check(identifier, false))
        templateIdentifiers.forEach(identifier => check(identifier, true))
      },
    }
  },
})
