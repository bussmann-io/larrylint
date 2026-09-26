import type { Rule } from 'eslint'
import type { Node } from 'estree'
import type { FileInfo, Kind } from '../../lib/layout'

import { createReporter } from '../../lib/baseline'
import { classify, domainOf } from '../../lib/layout'
import { isTypeOnly } from '../../utils/ast/module'
import { resolveImport } from '../../utils/fs'

interface Options {
  sharedDomains?: string[]
}

interface Violation {
  messageId: string
  data?: Record<string, string>
}

const LABELS: Partial<Record<Kind, string>> = {
  'section': 'section',
  'block': 'block',
  'component': 'component',
  'composable': 'composable',
  'app-plugin': 'plugin',
  'override': 'override',
  'route': 'API route',
  'nitro-plugin': 'Nitro plugin',
  'orchestr-plugin': 'orchestr plugin',
  'orchestr-file': 'orchestr',
  'media-library': 'media library',
}

const ABOVE_APP_UTILS = new Set<Kind | undefined>(['section', 'block', 'component', 'composable', 'app-plugin', 'override'])
const ABOVE_COMPOSABLES = new Set<Kind | undefined>(['section', 'block', 'component', 'override'])
const ABOVE_SERVER_UTILS = new Set<Kind | undefined>(['route', 'nitro-plugin', 'orchestr-plugin', 'orchestr-file', 'media-library'])

const BUILDER_USERS = new Set<Kind | undefined>(['handler', 'orchestr-file', 'middleware', 'media-library'])

/**
 * Finds the first layer rule an import breaks.
 *
 * @param importer The importing file.
 * @param target The imported file.
 * @param typeOnly Whether the import only brings in types.
 * @param sharedDomains Domains every other domain may import.
 *
 * @returns The violation, or `undefined` if the import is fine.
 */
function findViolation(importer: FileInfo, target: FileInfo, typeOnly: boolean, sharedDomains: string[]): Violation | undefined {
  if (importer.side === 'app' && target.side === 'server') {
    return { messageId: 'appImportsServer' }
  }

  if (importer.side === 'server' && target.side === 'app') {
    return { messageId: 'serverImportsApp' }
  }

  if (importer.side === 'shared' && (target.side === 'app' || target.side === 'server')) {
    return { messageId: 'sharedImportsSide', data: { side: target.side } }
  }

  if (target.side === 'build' && !typeOnly) {
    return { messageId: 'runtimeImportsBuild' }
  }

  if (target.kind === 'handler') {
    return { messageId: 'handlerImported' }
  }

  if (typeOnly) {
    return undefined
  }

  if (target.kind === 'client' && importer.kind === 'handler') {
    return { messageId: 'clientInHandler' }
  }

  if (target.kind === 'client' && importer.kind === 'server-util') {
    return { messageId: 'clientInUtil' }
  }

  if (target.kind === 'middleware' && !BUILDER_USERS.has(importer.kind)) {
    return { messageId: 'middlewareImported' }
  }

  if (importer.kind === 'server-util' && ABOVE_SERVER_UTILS.has(target.kind)) {
    return { messageId: 'serverUtilImportsUp', data: { kind: LABELS[target.kind!]! } }
  }

  const from = domainOf(importer)
  const to = domainOf(target)

  if (from && to && from !== to && !sharedDomains.includes(to)) {
    return { messageId: 'crossDomain', data: { from, to } }
  }

  if (importer.kind === 'app-util' && ABOVE_APP_UTILS.has(target.kind)) {
    return { messageId: 'appUtilImportsUp', data: { kind: LABELS[target.kind!]! } }
  }

  if (importer.kind === 'composable' && ABOVE_COMPOSABLES.has(target.kind)) {
    return { messageId: 'composableImportsUp', data: { kind: LABELS[target.kind!]! } }
  }

  if (importer.kind === 'component' && target.kind === 'section') {
    return { messageId: 'componentImportsSection' }
  }

  return undefined
}

export const layers: Rule.RuleModule = {
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
      appUtilImportsUp: 'App utils are the bottom layer and can\'t import a {{kind}}. Type imports are fine.',
      composableImportsUp: 'Composables can\'t import a {{kind}}. Type imports are fine.',
      componentImportsSection: 'Components can\'t import sections; sections compose components.',
      nodeBuiltin: '\'{{name}}\' only exists on the server. Keep it in server/.',
    },
  },

  create(context) {
    const importer = classify(context.filename)

    if (!importer || importer.test || (importer.side !== 'app' && importer.side !== 'server' && importer.side !== 'shared')) {
      return {}
    }

    const { sharedDomains = [] } = (context.options[0] ?? {}) as Options
    const reporter = createReporter(context, importer)

    const checkImport = (node: Node, source: unknown, typeOnly: boolean) => {
      if (typeof source !== 'string') {
        return
      }

      if (source.startsWith('node:')) {
        if (importer.side !== 'server' && !typeOnly) {
          reporter.report({ node, messageId: 'nodeBuiltin', data: { name: source } })
        }

        return
      }

      const path = resolveImport(context.filename, source)
      const target = path ? classify(path) : undefined
      const violation = target && findViolation(importer, target, typeOnly, sharedDomains)

      if (violation) {
        reporter.report({ node, ...violation })
      }
    }

    return {
      'ImportDeclaration': (node) => {
        checkImport(node, node.source.value, isTypeOnly(node))
      },

      'ExportNamedDeclaration': (node) => {
        if (node.source) {
          checkImport(node, node.source.value, isTypeOnly(node))
        }
      },

      'ExportAllDeclaration': (node) => {
        checkImport(node, node.source.value, isTypeOnly(node))
      },

      'ImportExpression': (node) => {
        if (node.source.type === 'Literal') {
          checkImport(node, node.source.value, false)
        }
      },

      'Program:exit': () => {
        reporter.flush()
      },
    }
  },
}
