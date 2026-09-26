import { canonicalNamespaces } from '../../../lib/laioutr/canonical'
import { defineRule } from '../../../lib/rule'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow your own token ids in the namespaces of Laioutr\'s canonical types',
    },
    schema: [],
    messages: {
      canonical: '\'{{namespace}}/\' belongs to Laioutr\'s canonical types. Use your app\'s own namespace.',
    },
  },

  applies: file => file.side === 'app' || file.side === 'server' || file.side === 'shared',

  create: ({ file, report }) => ({
    CallExpression: (node) => {
      const [id] = node.arguments

      if (node.callee.type !== 'Identifier' || !/^define\w*Token$/.test(node.callee.name) || id?.type !== 'Literal' || typeof id.value !== 'string' || !id.value.includes('/')) {
        return
      }

      const namespace = id.value.slice(0, id.value.indexOf('/'))

      if (canonicalNamespaces(file.root).has(namespace)) {
        report({ node: id, messageId: 'canonical', data: { namespace } })
      }
    },
  }),
})
