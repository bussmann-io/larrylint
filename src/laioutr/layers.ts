import type { FileInfo, Kind } from './layout'

import { domainOf } from './layout'

export interface Violation {
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
export function findViolation(importer: FileInfo, target: FileInfo, typeOnly: boolean, sharedDomains: string[]): Violation | undefined {
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

  if (importer.kind === 'server-util' && !from && to && !sharedDomains.includes(to)) {
    return { messageId: 'sharedImportsDomain', data: { to } }
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
