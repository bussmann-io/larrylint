import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'pathe'

/** The namespaces of canonical-types 0.34, used when the app's copy can't be read. */
const KNOWN = ['b2b', 'blog', 'core', 'ecommerce', 'location', 'newsletter', 'suggested-search']

const TOKEN_ID = /define\w*Token\(\s*["'`]([a-z0-9-]+)\//g

const cache = new Map<string, Set<string>>()

/**
 * Lists the token namespaces Laioutr's canonical types use, read from the app's installed
 * `@laioutr-core/canonical-types` so new namespaces are picked up.
 *
 * @param root Absolute path of the package root.
 *
 * @returns Namespaces like `ecommerce`, without the slash.
 */
export function canonicalNamespaces(root: string) {
  let namespaces = cache.get(root)

  if (!namespaces) {
    namespaces = new Set(KNOWN)

    for (const file of listFiles(join(root, 'node_modules/@laioutr-core/canonical-types/dist'))) {
      for (const [, namespace] of readFileSync(file, 'utf8').matchAll(TOKEN_ID)) {
        namespaces.add(namespace!)
      }
    }

    cache.set(root, namespaces)
  }

  return namespaces
}

/**
 * Lists the JavaScript files in a folder and its subfolders.
 *
 * @param folder Absolute path of the folder.
 *
 * @returns The files' paths, empty if the folder doesn't exist.
 */
function listFiles(folder: string): string[] {
  try {
    return readdirSync(folder, { recursive: true, encoding: 'utf8' }).filter(file => /\.[cm]?js$/.test(file)).map(file => join(folder, file))
  }
  catch {
    return []
  }
}
