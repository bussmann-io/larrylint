import { defineRule } from '../../../lib/rule'

const COMPONENTS = new Set(['section', 'block', 'component', 'override'])

export default defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Keep useOrchestrStore() out of components, in composables.',
    },
    schema: [],
    messages: {
      store: 'Read orchestr data through a composable, so every component that shows it reads and refreshes it the same way. Move useOrchestrStore() into one.',
    },
  },

  applies: file => COMPONENTS.has(file.kind ?? ''),

  create: ({ report }) => ({
    CallExpression: (node) => {
      if (node.callee.type === 'Identifier' && node.callee.name === 'useOrchestrStore') {
        report({ node, messageId: 'store' })
      }
    },
  }),
})
