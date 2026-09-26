import { defineRule } from '../../../lib/rule'
import { FILE_START } from '../../../utils/ast/location'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require handler files to export their handler as default, and nothing else.',
    },
    schema: [],
    messages: {
      namedExport: 'Handler files only export their handler. Laioutr registers the default export; move everything else to server/utils/.',
      missingDefault: 'Handler files export their handler as default, otherwise laioutr registers nothing.',
    },
  },

  applies: file => file.kind === 'handler',

  create: ({ report }) => {
    let hasDefault = false

    return {
      'ExportDefaultDeclaration': () => {
        hasDefault = true
      },

      'ExportNamedDeclaration': (node) => {
        const others = node.specifiers.filter((specifier) => {
          const name = specifier.exported.type === 'Identifier' ? specifier.exported.name : specifier.exported.value

          if (name === 'default') {
            hasDefault = true
          }

          return name !== 'default'
        })

        if (node.declaration || others.length > 0) {
          report({ node, messageId: 'namedExport' })
        }
      },

      'ExportAllDeclaration': (node) => {
        report({ node, messageId: 'namedExport' })
      },

      'Program:exit': () => {
        if (!hasDefault) {
          report({ loc: FILE_START, messageId: 'missingDefault' })
        }
      },
    }
  },
})
