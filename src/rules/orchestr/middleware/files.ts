import { readMiddleware } from '../../../laioutr/orchestr'
import { defineRule } from '../../../lib/rule'
import { FILE_START } from '../../../utils/ast/location'

/** Identifiers that make a file orchestr or Nitro middleware. */
const MIDDLEWARE = new Set(['defineOrchestr', 'defineEventHandler', 'eventHandler', 'defineRequestMiddleware', 'fromNodeMiddleware'])

export default defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Keep server/middleware/ to orchestr and Nitro middleware.',
    },
    schema: [],
    messages: {
      helper: 'server/middleware/ holds orchestr and Nitro middleware. Move helpers like this to server/utils/.',
    },
  },

  applies: file => file.kind === 'middleware',

  create: ({ report }) => {
    let middleware = false

    return {
      'Identifier': (node) => {
        middleware ||= MIDDLEWARE.has(node.name)
      },

      'CallExpression': (node) => {
        middleware ||= readMiddleware(node) !== undefined
      },

      'Program:exit': () => {
        if (!middleware) {
          report({ loc: FILE_START, messageId: 'helper' })
        }
      },
    }
  },
})
