import { basename } from 'pathe'
import { defineRule } from '../../../lib/rule'
import { FILE_START } from '../../../utils/ast/location'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Keep orchestr handlers in domain folders.',
    },
    schema: [],
    messages: {
      noDomain: 'Put handlers in a domain folder, e.g. orchestr/<domain>/{{file}}.',
    },
  },

  applies: file => file.kind === 'handler' && !file.domain,

  create: ({ file, report }) => ({
    Program: () => {
      report({ loc: FILE_START, messageId: 'noDomain', data: { file: basename(file.path) } })
    },
  }),
})
