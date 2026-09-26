import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'pathe'

/** Extensions tried, in order, when an import leaves them out. */
const EXTENSIONS = ['', '.ts', '.mts', '.cts', '.js', '.mjs', '.cjs', '/index.ts', '/index.js']

const directories = new Map<string, boolean>()

const files = new Map<string, { mtimeMs: number, value: unknown }>()

/**
 * Reads and parses a file, cached until the file changes.
 *
 * @param path Absolute path of the file.
 * @param parse Turns the file's text into a value.
 *
 * @returns The parsed value, or `undefined` if the file doesn't exist.
 */
export function readFileCached<T>(path: string, parse: (text: string) => T): T | undefined {
  let mtimeMs: number

  try {
    mtimeMs = statSync(path).mtimeMs
  }
  catch {
    return undefined
  }

  const cached = files.get(path)

  if (cached?.mtimeMs === mtimeMs) {
    return cached.value as T
  }

  const value = parse(readFileSync(path, 'utf8'))

  files.set(path, { mtimeMs, value })

  return value
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
