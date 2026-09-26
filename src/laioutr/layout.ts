import { normalize } from 'pathe'
import { isDirectory } from '../utils/fs'

export type Side = 'app' | 'server' | 'shared' | 'build' | 'other'

export type Kind
  = | 'section'
    | 'block'
    | 'component'
    | 'composable'
    | 'app-util'
    | 'app-plugin'
    | 'override'
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

export interface FileInfo {
  /** Absolute path of the package that holds `src/`. */
  root: string
  /** Path relative to `root`, e.g. `src/runtime/server/utils/foo.ts`. */
  path: string
  /** Side of the file, e.g. `app`, `server`, `shared`, `build` or `other`. */
  side: Side
  /** Kind of the file, e.g. `section`, `block`, `component`, `composable`, `app-util`, `app-plugin`, `override`, `handler`, `orchestr-plugin`, `orchestr-file`, `middleware`, `client`, `server-util`, `route`, `nitro-plugin`, `media-library`, `shared` or `other`. */
  kind?: Kind
  /** Domain folder of a handler or server util, e.g. `ticketing` for `server/utils/ticketing/foo.ts`. */
  domain?: string
  /** Whether the file is a test file, e.g. `foo.test.ts` or `foo.spec.ts`. */
  test: boolean
}

const HANDLER_FILE = /\.(?:query|resolver|link|action|template|page-index)(?:\.[cm]?[jt]s)?$/
const TEST_FILE = /\.(?:test|spec)\.[cm]?[jt]sx?$/

const APP_FOLDERS: Record<string, Kind> = {
  sections: 'section',
  blocks: 'block',
  components: 'component',
  composables: 'composable',
  utils: 'app-util',
  plugins: 'app-plugin',
  overrides: 'override',
}

const SERVER_FOLDERS: Record<string, Kind> = {
  'middleware': 'middleware',
  'client': 'client',
  'utils': 'server-util',
  'api': 'route',
  'routes': 'route',
  'plugins': 'nitro-plugin',
  // Laioutr's own apps use both names.
  'media-library': 'media-library',
  'media-libraries': 'media-library',
}

/**
 * Classifies a file of a Laioutr app by where it lives in the fixed folder layout.
 *
 * @param file Absolute path of the file, or of an import target without extension.
 *
 * @returns The file's side, kind and domain, or `undefined` for files outside `src/`.
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
 * Finds the business domain of a file. Folders in orchestr/ are domains; a folder in server/utils/
 * only is one when orchestr/ has a folder of the same name, otherwise it holds shared helpers.
 *
 * @param file The classified file.
 *
 * @returns The domain, or `undefined` for code every domain may use.
 */
export function domainOf(file: FileInfo) {
  if (!file.domain || file.kind === 'handler' || file.kind === 'orchestr-file') {
    return file.domain
  }

  return isDirectory(`${file.root}/src/runtime/server/orchestr/${file.domain}`) ? file.domain : undefined
}

/**
 * Classifies a path below `src/runtime/`.
 *
 * @param parts The path segments below `src/runtime/`.
 *
 * @returns The side, kind and domain of the file.
 */
function classifyRuntime(parts: string[]): Pick<FileInfo, 'side' | 'kind' | 'domain'> {
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

  const nested = rest.length > 1

  if (folder === 'orchestr') {
    if (nested && rest[0] === 'plugins') {
      return { side, kind: 'orchestr-plugin' }
    }

    return { side, kind: HANDLER_FILE.test(parts.at(-1)!) ? 'handler' : 'orchestr-file', domain: nested ? rest[0] : undefined }
  }

  const kind = SERVER_FOLDERS[folder] ?? 'other'

  return { side, kind, domain: kind === 'server-util' && nested ? rest[0] : undefined }
}
