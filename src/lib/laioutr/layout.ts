import { normalize } from 'pathe'

export type Side = 'app' | 'server' | 'shared' | 'build' | 'other'

export type Kind
  = | 'section'
    | 'block'
    | 'component'
    | 'composable'
    | 'app-util'
    | 'app-plugin'
    | 'override'
    | 'theme'
    | 'shared-field'
    | 'handler'
    | 'orchestr-plugin'
    | 'orchestr-file'
    | 'middleware'
    | 'client'
    | 'server-util'
    | 'route'
    | 'nitro-plugin'
    | 'media-library'
    | 'shared'
    | 'other'

export type HandlerType = 'query' | 'resolver' | 'link' | 'action' | 'template' | 'page-index'

export interface FileInfo {
  /** Absolute path of the package that holds `src/`. */
  root: string
  /** Path relative to `root`, e.g. `src/runtime/server/utils/foo.ts`. */
  path: string
  /** Side of the file, e.g. `app` or `server`. */
  side: Side
  /** Kind of the file, from its folder, e.g. `section` or `handler`. */
  kind?: Kind
  /** Type of an orchestr handler, e.g. `action` for `Order.action.ts`. */
  handler?: HandlerType
  /** Whether the file is a test, e.g. `foo.test.ts`. */
  test: boolean
}

const HANDLER_FILE = /\.(query|resolver|link|action|templates?|page-index)(?:\.[cm]?[jt]s)?$/
const TEST_FILE = /\.(?:test|spec)\.[cm]?[jt]sx?$/

const APP_FOLDERS: Record<string, Kind> = {
  'sections': 'section',
  'section': 'section',
  'blocks': 'block',
  'block': 'block',
  'components': 'component',
  'composables': 'composable',
  'utils': 'app-util',
  'plugins': 'app-plugin',
  'overrides': 'override',
  'theme': 'theme',
  'shared-fields': 'shared-field',
}

const SERVER_FOLDERS: Record<string, Kind> = {
  'middleware': 'middleware',
  'client': 'client',
  'utils': 'server-util',
  'api': 'route',
  'routes': 'route',
  'plugins': 'nitro-plugin',
  'media-library': 'media-library',
  'media-libraries': 'media-library',
}

/**
 * Classifies a file of a Laioutr app by where it lives in the folder layout.
 *
 * @param file Absolute path of the file, or of an import target without extension.
 *
 * @returns The file's side and kind, or `undefined` for files outside `src/`.
 */
export function classify(file: string): FileInfo | undefined {
  const absolute = normalize(file)
  const test = TEST_FILE.test(absolute)

  const runtimeIndex = absolute.lastIndexOf('/src/runtime/')

  if (runtimeIndex !== -1) {
    const root = absolute.slice(0, runtimeIndex)

    return { root, path: absolute.slice(root.length + 1), test, ...classifyRuntime(absolute.slice(runtimeIndex + '/src/runtime/'.length).split('/')) }
  }

  const srcIndex = absolute.lastIndexOf('/src/')

  if (srcIndex === -1) {
    return undefined
  }

  const root = absolute.slice(0, srcIndex)
  const path = absolute.slice(root.length + 1)

  return { root, path, side: path.startsWith('src/types/') ? 'other' : 'build', test }
}

/**
 * Classifies a path below `src/runtime/`.
 *
 * @param parts The path segments below `src/runtime/`.
 *
 * @returns The side and kind of the file.
 */
export function classifyRuntime(parts: string[]): Pick<FileInfo, 'side' | 'kind' | 'handler'> {
  const [side, folder = '', ...rest] = parts

  if (parts.length < 2 || (side !== 'app' && side !== 'server' && side !== 'shared')) {
    return { side: 'other' }
  }

  if (side === 'shared') {
    return { side, kind: 'shared' }
  }

  if (side === 'app') {
    return { side, kind: APP_FOLDERS[folder] ?? 'other' }
  }

  if (folder === 'orchestr') {
    if (rest.length > 1 && rest[0] === 'plugins') {
      return { side, kind: 'orchestr-plugin' }
    }

    const handler = HANDLER_FILE.exec(parts.at(-1)!)?.[1]?.replace('templates', 'template') as HandlerType | undefined

    return { side, kind: handler ? 'handler' : 'orchestr-file', handler }
  }

  return { side, kind: SERVER_FOLDERS[folder] ?? 'other' }
}
