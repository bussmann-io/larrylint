import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'pathe'

/** Extensions tried, in order, when an import leaves them out. */
const EXTENSIONS = ['', '.ts', '.mts', '.cts', '.js', '.mjs', '.cjs', '/index.ts', '/index.js']

const directories = new Map<string, boolean>()

/**
 * Creates a reader that parses files and caches the result until a file changes. Each reader
 * has its own cache, so the same file can be read by different readers.
 *
 * @param parse Turns a file's text into a value.
 *
 * @returns A function that reads a file by its absolute path, `undefined` if it doesn't exist.
 */
export function cachedReader<T>(parse: (text: string) => T) {
  const cache = new Map<string, { mtimeMs: number, value: T }>()

  return (path: string): T | undefined => {
    let mtimeMs: number

    try {
      mtimeMs = statSync(path).mtimeMs
    }
    catch {
      return undefined
    }

    const cached = cache.get(path)

    if (cached?.mtimeMs === mtimeMs) {
      return cached.value
    }

    const value = parse(readFileSync(path, 'utf8'))

    cache.set(path, { mtimeMs, value })

    return value
  }
}

/**
 * Checks whether a path is a directory, cached for the lint run.
 *
 * @param path Absolute path.
 *
 * @returns `true` for an existing directory.
 */
export function isDirectory(path: string) {
  let result = directories.get(path)

  if (result === undefined) {
    try {
      result = statSync(path).isDirectory()
    }
    catch {
      result = false
    }

    directories.set(path, result)
  }

  return result
}

/**
 * Resolves a relative import to the path of its target, without extension probing.
 *
 * @param importer Absolute path of the importing file.
 * @param source The import specifier.
 *
 * @returns The target path, or `undefined` for package imports.
 */
export function resolveImport(importer: string, source: string) {
  if (!source.startsWith('./') && !source.startsWith('../')) {
    return undefined
  }

  const target = resolve(dirname(importer), source.split('?')[0]!)

  return isDirectory(target) ? `${target}/index` : target
}

/**
 * Resolves a relative import to an existing file, trying the extensions a bundler would.
 *
 * @param importer Absolute path of the importing file.
 * @param source The import specifier.
 *
 * @returns The file's path, or `undefined` for package imports and missing files.
 */
export function resolveModule(importer: string, source: string) {
  if (!source.startsWith('./') && !source.startsWith('../')) {
    return undefined
  }

  const target = resolve(dirname(importer), source.split('?')[0]!)

  return EXTENSIONS.map(extension => `${target}${extension}`).find(path => existsSync(path) && !isDirectory(path))
}
