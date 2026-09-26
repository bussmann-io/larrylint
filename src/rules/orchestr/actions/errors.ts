import { defineRule } from '../../../lib/rule'
import { thrownStatus } from '../../../utils/nuxt/server'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require actions to return client errors as a status instead of throwing them.',
    },
    schema: [],
    messages: {
      status: 'The client never sees this {{status}}: orchestr\'s action transport drops status codes, so it arrives as a failed action. Return it as a status in the action\'s output instead.',
    },
  },

  applies: file => file.handler === 'action',

  create: ({ report }) => ({
    ThrowStatement: (node) => {
      const status = thrownStatus(node.argument)

      if (status !== undefined && status >= 400 && status < 500) {
        report({ node, messageId: 'status', data: { status: String(status) } })
      }
    },
  }),
})
