import { defineRule } from '../../lib/rule'
import { FILE_START } from '../../utils/ast/location'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow files other than handlers in `orchestr/`',
    },
    schema: [],
    messages: {
      notAHandler: 'Only handlers belong in orchestr/. Move this file to server/utils/, or give it a handler suffix like .query.ts or .action.ts.',
    },
  },

  applies: file => file.kind === 'orchestr-file',

  create: ({ report }) => ({
    Program: () => {
      report({ loc: FILE_START, messageId: 'notAHandler' })
    },
  }),
})
