import { readMiddleware } from '../../../laioutr/orchestr'
import { defineRule } from '../../../lib/rule'
import { FILE_START } from '../../../utils/ast/location'

const MIDDLEWARE = new Set(['defineOrchestr', 'defineEventHandler', 'eventHandler', 'defineRequestMiddleware', 'fromNodeMiddleware'])

export default defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow files other than middleware in `server/middleware/`',
    },
    schema: [],
    messages: {
      helper: 'Only middleware belongs in server/middleware/. Move this file to server/utils/.',
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
