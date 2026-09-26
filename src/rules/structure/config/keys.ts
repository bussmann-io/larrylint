import type { Node } from 'estree'

import { readPackage } from '../../../laioutr/package'
import { defineRule } from '../../../lib/rule'

/**
 * Checks whether an expression is the runtime config, e.g. `useRuntimeConfig()` or its `.public`.
 *
 * @param node The expression.
 * @param variables Variables that hold the runtime config.
 *
 * @returns `true` for the runtime config or its public part.
 */
function isRuntimeConfig(node: Node, variables: Set<string>): boolean {
  if (node.type === 'CallExpression') {
    return node.callee.type === 'Identifier' && node.callee.name === 'useRuntimeConfig'
  }

  if (node.type === 'Identifier') {
    return variables.has(node.name)
  }

  return node.type === 'MemberExpression' && !node.computed && node.property.type === 'Identifier' && node.property.name === 'public' && isRuntimeConfig(node.object, variables)
}

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require runtime config keys of apps to be the package itself or one of its dependencies.',
    },
    schema: [],
    messages: {
      key: '\'{{key}}\' isn\'t this package or one of its dependencies, so its config is missing at runtime. Use the key of an installed app.',
    },
  },

  applies: file => file.side === 'app' || file.side === 'server' || file.side === 'shared',

  create: ({ file, report }) => {
    const variables = new Set<string>()

    return {
      VariableDeclarator: (node) => {
        if (node.id.type === 'Identifier' && node.init && isRuntimeConfig(node.init, variables)) {
          variables.add(node.id.name)
        }
      },

      MemberExpression: (node) => {
        const key = node.computed && node.property.type === 'Literal' && typeof node.property.value === 'string' ? node.property.value : undefined

        if (!key?.startsWith('@') || !isRuntimeConfig(node.object, variables)) {
          return
        }

        const pkg = readPackage(file.root)

        if (pkg && key !== pkg.name && !pkg.dependencies.has(key)) {
          report({ node: node.property, messageId: 'key', data: { key } })
        }
      },
    }
  },
})
