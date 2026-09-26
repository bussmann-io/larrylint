import type { Rule } from 'eslint'
import type { HandlerType } from '../../laioutr/layout'

import { enclosingMiddleware } from '../../laioutr/orchestr'
import { defineRule } from '../../lib/rule'
import { responseWrite } from '../../utils/nuxt/server'

const STREAMED = new Set<HandlerType | undefined>(['query', 'link', 'resolver'])

const MANAGED: Record<string, string> = {
  setCookie: 'setManagedCookie',
  deleteCookie: 'deleteManagedCookie',
}

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require cookies and headers to be set in `extendRequest()` or action handlers, with frontend-core\'s managed cookie functions',
    },
    schema: [],
    messages: {
      streamed: 'The headers may already be sent when {{name}}() runs here. Call it in extendRequest() or an action handler instead.',
      managed: 'Use {{managed}}() instead, so it also works in the Studio preview.',
    },
  },

  applies: file => file.side === 'server',

  create: ({ file, report }) => ({
    CallExpression: (node) => {
      const write = responseWrite(node)

      if (!write) {
        return
      }

      const method = enclosingMiddleware(node as Rule.Node)?.method
      const managed = MANAGED[write.name]

      if (method === 'use' || (!method && STREAMED.has(file.handler))) {
        report({ node, messageId: 'streamed', data: { name: write.name } })
      }
      else if (managed && (method === 'extendRequest' || (!method && file.handler === 'action'))) {
        report({ node, messageId: 'managed', data: { name: write.name, managed } })
      }
    },
  }),
})
