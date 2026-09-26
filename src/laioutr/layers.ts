import type { FileInfo, Kind } from './layout'

export interface Violation {
  messageId: string
  data?: Record<string, string>
}

const LABELS: Partial<Record<Kind, string>> = {
  'section': 'sections',
  'block': 'blocks',
  'component': 'components',
  'composable': 'composables',
  'app-plugin': 'plugins',
  'override': 'overrides',
  'route': 'API routes',
  'nitro-plugin': 'Nitro plugins',
  'orchestr-plugin': 'orchestr plugins',
  'orchestr-file': 'orchestr files',
  'media-library': 'media libraries',
}

const ABOVE_APP_UTILS = new Set<Kind | undefined>(['section', 'block', 'component', 'composable', 'app-plugin', 'override'])
const ABOVE_COMPOSABLES = new Set<Kind | undefined>(['section', 'block', 'component', 'override'])
const ABOVE_SERVER_UTILS = new Set<Kind | undefined>(['route', 'nitro-plugin', 'orchestr-plugin', 'orchestr-file', 'media-library'])

/**
 * Finds the first layer rule an import breaks.
 *
 * @param importer The importing file.
 * @param target The imported file.
 * @param typeOnly Whether the import only brings in types.
 *
 * @returns The violation, or `undefined` if the import is fine.
 */
export function findViolation(importer: FileInfo, target: FileInfo, typeOnly: boolean): Violation | undefined {
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

  if (importer.kind === 'server-util' && ABOVE_SERVER_UTILS.has(target.kind)) {
    return { messageId: 'serverUtilImportsUp', data: { kind: LABELS[target.kind!]! } }
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
