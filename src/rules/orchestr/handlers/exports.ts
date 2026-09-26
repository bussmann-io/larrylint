import { defineRule } from '../../../lib/rule'
import { FILE_START } from '../../../utils/ast/location'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require handler files to export their handler as default',
    },
    schema: [],
    messages: {
      missingDefault: 'Export the handler as default, this will fail the build.',
    },
  },

  applies: file => file.kind === 'handler',

  create: ({ report }) => {
    let hasDefault = false

    return {
      'ExportDefaultDeclaration': () => {
        hasDefault = true
      },

      'ExportSpecifier': (node) => {
        hasDefault ||= (node.exported.type === 'Identifier' ? node.exported.name : node.exported.value) === 'default'
      },

      'Program:exit': () => {
        if (!hasDefault) {
          report({ loc: FILE_START, messageId: 'missingDefault' })
        }
      },
    }
  },
})
