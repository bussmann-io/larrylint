import type { FileInfo } from './layout'

export interface Violation {
  messageId: string
  data?: Record<string, string>
}

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
  if (typeOnly) {
    return undefined
  }

  if (importer.side === 'app' && target.side === 'server') {
    return { messageId: 'appImportsServer' }
  }

  if (importer.side === 'server' && target.side === 'app') {
    return { messageId: 'serverImportsApp' }
  }

  if (importer.side === 'shared' && (target.side === 'app' || target.side === 'server')) {
    return { messageId: 'sharedImportsSide', data: { side: target.side } }
  }

  if (target.side === 'build') {
    return { messageId: 'runtimeImportsBuild' }
  }

  if (target.kind === 'handler') {
    return { messageId: 'handlerImported' }
  }

  if (target.kind === 'client' && importer.kind === 'handler') {
    return { messageId: 'clientInHandler' }
  }

  if (importer.kind === 'component' && (target.kind === 'section' || target.kind === 'block')) {
    return { messageId: 'schemaInComponent', data: { kind: target.kind } }
  }

  return undefined
}
