import { defineRule } from '../../lib/rule'
import { FILE_START } from '../../utils/ast/location'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Keep orchestr/ to handler files, since Laioutr loads every file in it as a Nitro plugin.',
    },
    schema: [],
    messages: {
      notAHandler: 'Laioutr loads every file in orchestr/ as a Nitro plugin, so a helper here runs at startup or breaks the build. Move it to server/utils/, and name handlers *.query.ts, *.resolver.ts, *.link.ts, *.action.ts, *.template.ts or *.page-index.ts.',
    },
  },

  applies: file => file.kind === 'orchestr-file',

  create: ({ report }) => ({
    Program: () => {
      report({ loc: FILE_START, messageId: 'notAHandler' })
    },
  }),
})
