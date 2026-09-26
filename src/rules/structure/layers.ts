import type { Node } from 'estree'

import { findViolation } from '../../laioutr/layers'
import { classify } from '../../laioutr/layout'
import { defineRule } from '../../lib/rule'
import { isTypeOnly } from '../../utils/ast/module'
import { resolveImport } from '../../utils/fs'

interface Options {
  sharedDomains?: string[]
}

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce the layers of a Laioutr app: app, server and shared code, orchestr handlers, middleware, clients, utils and domains.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          sharedDomains: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      appImportsServer: 'App code can\'t import server code. Move what both sides need to src/runtime/shared/.',
      serverImportsApp: 'Server code can\'t import app code. Move what both sides need to src/runtime/shared/.',
      sharedImportsSide: 'Shared code runs in the app and on the server, so it can\'t import from {{side}}/.',
      runtimeImportsBuild: 'Runtime code can\'t import build-time code from src/; it isn\'t part of the runtime bundle. Type imports are fine.',
      handlerImported: 'Orchestr handlers are registered by laioutr, never imported. Move the shared code to server/utils/.',
      clientInHandler: 'Handlers read API clients from the orchestr context. server/client/ only holds clients; move constants and helpers to server/utils/.',
      clientInUtil: 'Server utils get API clients passed in. server/client/ only holds clients; move constants and helpers to server/utils/.',
      middlewareImported: 'Only orchestr handlers and media libraries import middleware. Move helpers like this to server/utils/.',
      serverUtilImportsUp: 'Server utils are the bottom layer and can\'t import {{kind}} code.',
      crossDomain: 'The {{from}} domain can\'t import from the {{to}} domain. Move the shared code out of the {{to}} folders into server/utils/, or add \'{{to}}\' to sharedDomains.',
      sharedImportsDomain: 'Shared server utils can\'t import from the {{to}} domain, or every domain that uses them depends on {{to}}. Move the shared code out of the {{to}} folders, or add \'{{to}}\' to sharedDomains.',
      appUtilImportsUp: 'App utils are the bottom layer and can\'t import a {{kind}}. Type imports are fine.',
      composableImportsUp: 'Composables can\'t import a {{kind}}. Type imports are fine.',
      componentImportsSection: 'Components can\'t import sections; sections compose components.',
      nodeBuiltin: '\'{{name}}\' only exists on the server. Keep it in server/.',
    },
  },

  applies: file => file.side === 'app' || file.side === 'server' || file.side === 'shared',

  create: ({ context, file: importer, report }) => {
    const { sharedDomains = [] } = (context.options[0] ?? {}) as Options

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
      const violation = target && findViolation(importer, target, typeOnly, sharedDomains)

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
