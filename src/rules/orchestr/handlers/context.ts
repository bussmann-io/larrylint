import { defineRule } from '../../../lib/rule'

export default defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require handlers to take config, clients and the request from their arguments and middleware context.',
    },
    schema: [],
    messages: {
      runtimeConfig: 'Handlers get their config and clients from the middleware context. Read the config once in the builder\'s middleware.',
      event: 'Handlers get the request as `event` in their arguments, not from useEvent().',
    },
  },

  applies: file => file.kind === 'handler',

  create: ({ report }) => ({
    CallExpression: (node) => {
      if (node.callee.type !== 'Identifier') {
        return
      }

      if (node.callee.name === 'useRuntimeConfig') {
        report({ node, messageId: 'runtimeConfig' })
      }
      else if (node.callee.name === 'useEvent') {
        report({ node, messageId: 'event' })
      }
    },
  }),
})
