import type { Rule } from 'eslint'
import type { CallExpression, Identifier } from 'estree'

import { destructuredResolvers, linkResolverMethod } from '../../../laioutr/links'
import { defineRule } from '../../../lib/rule'
import { nameOf } from '../../../utils/ast/chain'
import { canReturnNullish } from '../../../utils/ast/functions'
import { isReference, isTested } from '../../../utils/ast/values'
import { findHolder } from '../../../utils/vue/script'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow testing the result of linkResolver.resolve(), which falls back to a \'#…\' string instead of an empty value.',
    },
    schema: [],
    messages: {
      tested: 'linkResolver.resolve() returns a \'#…\' fallback instead of an empty value when it can\'t resolve a link, so this check doesn\'t catch broken links. Use resolveOrThrow() (frontend-core 0.42+) in a try/catch to tell them apart.',
      branch: 'When it can\'t resolve the link, linkResolver.resolve() returns a \'#…\' fallback here, so the checks on {{name}} treat a broken link as a working one. Use resolveOrThrow() (frontend-core 0.42+) in a try/catch and return undefined instead.',
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
