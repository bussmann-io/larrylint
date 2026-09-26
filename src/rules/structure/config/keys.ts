import { readPackage } from '../../../lib/laioutr/package'
import { defineRule } from '../../../lib/rule'
import { isRuntimeConfig } from '../../../utils/nuxt/config'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require runtime config keys to be this package or one of its dependencies',
    },
    schema: [],
    messages: {
      key: '\'{{key}}\' isn\'t this package or one of its dependencies, so this config is undefined.',
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
