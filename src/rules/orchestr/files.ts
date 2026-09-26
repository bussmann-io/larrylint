import { defineRule } from '../../lib/rule'
import { FILE_START } from '../../utils/ast/location'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Keep orchestr/ to handler files, since Laioutr loads every file in it as a server plugin.',
    },
    schema: [],
    messages: {
      notAHandler: 'Laioutr loads every file in orchestr/ as a server plugin. Name handlers *.query.ts, *.resolver.ts, *.link.ts, *.action.ts, *.template.ts or *.page-index.ts, and move everything else to server/utils/.',
    },
  },

  applies: file => file.kind === 'orchestr-file',

  create: ({ report }) => ({
    Program: () => {
      report({ loc: FILE_START, messageId: 'notAHandler' })
    },
  }),
})
