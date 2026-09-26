import { statSync } from 'node:fs'
import { dirname, resolve } from 'pathe'

const directories = new Map<string, boolean>()

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
