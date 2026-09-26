import type { Rule } from 'eslint'

import { inMiddleware } from '../../laioutr/orchestr'
import { defineRule } from '../../lib/rule'
import { responseEffect } from '../../utils/nuxt/server'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow Set-Cookie and redirects from orchestr handlers and middleware, which cached pages replay to every visitor.',
    },
    schema: [],
    messages: {
      cookie: 'ISR caches this response for every visitor, Set-Cookie included, so one visitor\'s cookie reaches the next. Set cookies from an API route or a Nitro middleware that skips cached pages.',
      redirect: 'ISR caches this redirect for every visitor. Redirect from an API route or on the client instead.',
    },
  },

  applies: file => file.side === 'server',

  create: ({ file, report }) => ({
    CallExpression: (node) => {
      const effect = responseEffect(node)

      if (effect && (file.kind === 'handler' || inMiddleware(node as Rule.Node))) {
        report({ node, messageId: effect })
      }
    },
  }),
})
