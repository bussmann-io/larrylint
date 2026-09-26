import type { Rule } from 'eslint'

import { basename } from 'pathe'
import { createReporter } from '../../lib/baseline'
import { classify } from '../../lib/layout'
import { FILE_START } from '../../utils/ast/location'

export const files: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Keep orchestr/ to handler files in domain folders that only export their handler.',
    },
    schema: [],
    messages: {
      notAHandler: 'Laioutr loads every file in orchestr/ as a server plugin. Name handlers *.query.ts, *.resolver.ts, *.link.ts, *.action.ts, *.template.ts or *.page-index.ts, and move everything else to server/utils/.',
      noDomain: 'Put handlers in a domain folder, e.g. orchestr/<domain>/{{file}}.',
      namedExport: 'Handler files only export their handler. Laioutr registers the default export; move everything else to server/utils/.',
      missingDefault: 'Handler files export their handler as default, otherwise laioutr registers nothing.',
    },
  },

  create(context) {
    const file = classify(context.filename)

    if (!file || file.test || file.side !== 'server' || (file.kind !== 'handler' && file.kind !== 'orchestr-file')) {
      return {}
    }

    const reporter = createReporter(context, file)

    if (file.kind === 'orchestr-file') {
      return {
        'Program:exit': () => {
          reporter.report({ loc: FILE_START, messageId: 'notAHandler' })
          reporter.flush()
        },
      }
    }

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
          reporter.report({ node, messageId: 'namedExport' })
        }
      },

      'ExportAllDeclaration': (node) => {
        reporter.report({ node, messageId: 'namedExport' })
      },

      'Program:exit': () => {
        if (!file.domain) {
          reporter.report({ loc: FILE_START, messageId: 'noDomain', data: { file: basename(file.path) } })
        }

        if (!hasDefault) {
          reporter.report({ loc: FILE_START, messageId: 'missingDefault' })
        }

        reporter.flush()
      },
    }
  },
}
