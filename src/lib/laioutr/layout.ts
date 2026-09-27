import type { Registration } from './registration'

import { normalize } from 'pathe'
import { withoutExtension } from '../../utils/fs'
import { isRegistered, readRegistration } from './registration'

export type Side = 'app' | 'server' | 'shared' | 'build' | 'other'

export type Kind
  = | 'section'
    | 'block'
    | 'component'
    | 'app-plugin'
    | 'handler'
    | 'orchestr-plugin'
    | 'orchestr-file'
    | 'middleware'
    | 'client'
    | 'other'

export type HandlerType = 'query' | 'resolver' | 'link' | 'action' | 'template' | 'page-index'

export interface FileInfo {
  /** Absolute path of the package that holds `src/`. */
  root: string
  /** Path relative to `root`, e.g. `src/runtime/server/utils/foo.ts`. */
  path: string
  /** Side of the file, e.g. `app` or `server`. */
  side: Side
  /** Kind of the file, from what `module.ts` registers and its folder, e.g. `section` or `handler`. */
  kind?: Kind
  /** Type of an orchestr handler, e.g. `action` for `Order.action.ts`. */
  handler?: HandlerType
  /** Whether the file is a test, e.g. `foo.test.ts`. */
  test: boolean
}

const HANDLER_FILE = /\.(query|resolver|link|action|templates?|page-index)(?:\.[cm]?[jt]s)?$/
const TEST_FILE = /\.(?:test|spec)\.[cm]?[jt]sx?$/

const APP_FOLDERS: Record<string, Kind> = {
  components: 'component',
}

const SERVER_FOLDERS: Record<string, Kind> = {
  middleware: 'middleware',
  client: 'client',
}

/**
 * Classifies a file of a Laioutr app by what its `module.ts` registers and where it lives.
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

    return { root, path: absolute.slice(root.length + 1), test, ...classifyRuntime(absolute.slice(runtimeIndex + '/src/runtime/'.length), readRegistration(root)) }
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
 * @param path The path relative to `src/runtime/`.
 * @param registration What the app's `module.ts` registers.
 *
 * @returns The side and kind of the file.
 */
export function classifyRuntime(path: string, registration: Registration): Pick<FileInfo, 'side' | 'kind' | 'handler'> {
  const [side, folder] = path.split('/')

  if (!folder || (side !== 'app' && side !== 'server' && side !== 'shared')) {
    return { side: 'other' }
  }

  if (side === 'shared') {
    return { side }
  }

  if (side === 'app') {
    if (isRegistered(path, registration.sections)) {
      return { side, kind: 'section' }
    }

    if (isRegistered(path, registration.blocks)) {
      return { side, kind: 'block' }
    }

    return { side, kind: registration.plugins.has(withoutExtension(path)) ? 'app-plugin' : APP_FOLDERS[folder] ?? 'other' }
  }

  const orchestr = registration.orchestr.find(dir => path.startsWith(`${dir}/`))

  if (!orchestr) {
    return { side, kind: SERVER_FOLDERS[folder] ?? 'other' }
  }

  const [first, ...rest] = path.slice(orchestr.length + 1).split('/')

  if (first === 'plugins' && rest.length > 0) {
    return { side, kind: 'orchestr-plugin' }
  }

  const handler = HANDLER_FILE.exec(path)?.[1]?.replace('templates', 'template') as HandlerType | undefined

  return { side, kind: handler ? 'handler' : 'orchestr-file', handler }
}
