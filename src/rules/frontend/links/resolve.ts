import type { Rule } from 'eslint'
import type { CallExpression, Identifier } from 'estree'

import { defineRule } from '../../../lib/rule'
import { nameOf } from '../../../utils/ast/chain'
import { isReference, isTested } from '../../../utils/ast/values'
import { findHolder } from '../../../utils/vue/script'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow testing the result of linkResolver.resolve(), which is never empty.',
    },
    schema: [],
    messages: {
      tested: 'linkResolver.resolve() never returns an empty value: a link it can\'t resolve comes back as a \'#missing-required-params…\' string, so this check always passes. Use resolveOrThrow() in a try/catch to tell an unresolvable link apart.',
    },
  },

  applies: file => file.side === 'app',

  create: ({ report, visitTemplate }) => {
    const resolveNames = new Set<string>()
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
        if (node.id.type !== 'ObjectPattern' || !node.init || nameOf(node.init) !== 'linkResolver') {
          return
        }

        for (const property of node.id.properties) {
          if (property.type === 'Property' && nameOf(property.key) === 'resolve' && property.value.type === 'Identifier') {
            resolveNames.add(property.value.name)
          }
        }
      },

      'CallExpression': (node) => {
        calls.push(node)
      },

      'Identifier': (node) => {
        scriptIdentifiers.push(node)
      },

      'Program:exit': () => {
        const holders = new Map<string, boolean>()

        for (const call of calls) {
          const { callee } = call
          const linkResolver = callee.type === 'MemberExpression' && nameOf(callee) === 'resolve' && nameOf(callee.object) === 'linkResolver'

          if (!linkResolver && !(callee.type === 'Identifier' && resolveNames.has(callee.name))) {
            continue
          }

          if (isTested(call)) {
            report({ node: call, messageId: 'tested' })
          }

          const holder = findHolder(call)

          if (holder) {
            holders.set(holder.name, holder.computed)
          }
        }

        const check = (identifier: Identifier & Rule.NodeParentExtension, template: boolean) => {
          const computed = holders.get(identifier.name)
          const { parent } = identifier

          if (computed === undefined || !isReference(identifier)) {
            return
          }

          const readsValue = parent.type === 'MemberExpression' && parent.object === identifier && nameOf(parent) === 'value'
          const value = computed && !template ? (readsValue ? parent : undefined) : identifier

          if (value && isTested(value)) {
            report({ node: value, messageId: 'tested' })
          }
        }

        scriptIdentifiers.forEach(identifier => check(identifier, false))
        templateIdentifiers.forEach(identifier => check(identifier, true))
      },
    }
  },
})
