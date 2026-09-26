import type { Node } from 'estree'

import { findViolation } from '../../laioutr/layers'
import { classify } from '../../laioutr/layout'
import { defineRule } from '../../lib/rule'
import { isTypeOnly } from '../../utils/ast/module'
import { resolveImport } from '../../utils/fs'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce which parts of a Laioutr app can import each other',
    },
    schema: [],
    messages: {
      appImportsServer: 'App code can\'t import server code. Move what both need to src/runtime/shared/.',
      serverImportsApp: 'Server code can\'t import app code. Move what both need to src/runtime/shared/.',
      sharedImportsSide: 'Shared code can\'t import from {{side}}/.',
      runtimeImportsBuild: 'Runtime code can\'t import build code from src/, like module.ts. Type imports are fine.',
      handlerImported: 'Don\'t import orchestr handlers. Move the code you need to server/utils/.',
      clientInHandler: 'Handlers get API clients from the orchestr context, not by import. Move other code to server/utils/.',
      serverUtilImportsUp: 'Server utils can\'t import {{kind}}. Type imports are fine.',
      appUtilImportsUp: 'App utils can\'t import {{kind}}. Type imports are fine.',
      composableImportsUp: 'Composables can\'t import {{kind}}. Type imports are fine.',
      componentImportsSection: 'Components can\'t import sections.',
      nodeBuiltin: '\'{{name}}\' only works on the server. Move this code to server/.',
    },
  },

  applies: file => file.side === 'app' || file.side === 'server' || file.side === 'shared',

  create: ({ context, file: importer, report }) => {
    const checkImport = (node: Node, source: unknown, typeOnly: boolean) => {
      if (typeof source !== 'string') {
        return
      }

      if (source.startsWith('node:')) {
        if (importer.side !== 'server' && !typeOnly) {
          report({ node, messageId: 'nodeBuiltin', data: { name: source } })
        }

        return
      }

      const path = resolveImport(context.filename, source)
      const target = path ? classify(path) : undefined
      const violation = target && findViolation(importer, target, typeOnly)

      if (violation) {
        report({ node, ...violation })
      }
    }

    return {
      ImportDeclaration: (node) => {
        checkImport(node, node.source.value, isTypeOnly(node))
      },

      ExportNamedDeclaration: (node) => {
        if (node.source) {
          checkImport(node, node.source.value, isTypeOnly(node))
        }
      },

      ExportAllDeclaration: (node) => {
        checkImport(node, node.source.value, isTypeOnly(node))
      },

      ImportExpression: (node) => {
        if (node.source.type === 'Literal') {
          checkImport(node, node.source.value, false)
        }
      },
    }
  },
})
