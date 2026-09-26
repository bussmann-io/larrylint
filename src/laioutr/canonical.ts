import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'pathe'
import { findPackage } from '../utils/fs'

const PACKAGE = '@laioutr-core/canonical-types'

const TOKEN_ID = /define\w*Token\(\s*["'`]([a-z0-9-]+)\//g

const cache = new Map<string, Set<string>>()

/**
 * Lists the token namespaces of the installed `@laioutr-core/canonical-types`.
 *
 * @param root Absolute path of the package root.
 *
 * @returns Namespaces like `ecommerce`, without the slash.
 *
 * @throws {Error} When the package isn't installed.
 */
export function canonicalNamespaces(root: string) {
  let namespaces = cache.get(root)

  if (!namespaces) {
    const frontendCore = findPackage(root, '@laioutr-core/frontend-core')
    const folder = findPackage(root, PACKAGE) ?? (frontendCore && findPackage(frontendCore, PACKAGE))

    if (!folder) {
      throw new Error(`larrylint can't find ${PACKAGE} from ${root}, which it reads the canonical token namespaces from. Install the app's dependencies first.`)
    }

    namespaces = new Set()

    for (const file of readdirSync(join(folder, 'dist'), { recursive: true, encoding: 'utf8' }).filter(file => /\.[cm]?js$/.test(file))) {
      for (const [, namespace] of readFileSync(join(folder, 'dist', file), 'utf8').matchAll(TOKEN_ID)) {
        namespaces.add(namespace!)
      }
    }

    cache.set(root, namespaces)
  }

  return namespaces
}
