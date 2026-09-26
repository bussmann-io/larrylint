import { readdirSync } from 'node:fs'
import { join, parse } from 'pathe'
import { findPackage } from '../utils/fs'
import { nuxtName } from '../utils/nuxt/components'
import { kebabCase } from '../utils/string'

const PACKAGES = ['@laioutr-core/ui-kit', '@laioutr-core/ui']

const cache = new Map<string, Set<string>>()

/**
 * Lists the `<l-*>` tags of the installed ui-kit and ui components, e.g. `l-sheet-close`.
 *
 * @param root Absolute path of the package root.
 *
 * @returns The kebab-case tags.
 *
 * @throws {Error} When a package isn't installed.
 */
export function uiKitTags(root: string) {
  let tags = cache.get(root)

  if (!tags) {
    tags = new Set()

    for (const name of PACKAGES) {
      const folder = findPackage(root, name)

      if (!folder) {
        throw new Error(`larrylint can't find ${name} from ${root}, which it reads the <l-*> components from. Install the app's dependencies first.`)
      }

      for (const file of readdirSync(join(folder, 'dist/runtime'), { recursive: true, encoding: 'utf8' })) {
        if (!file.endsWith('.vue')) {
          continue
        }

        const { dir, name: stem } = parse(file)
        const segments = dir.split('/')
        const folders = segments.slice(segments.lastIndexOf('components') + 1)

        tags.add(`l-${kebabCase(stem)}`)
        tags.add(`l-${kebabCase(nuxtName(folders, stem))}`)
      }
    }

    cache.set(root, tags)
  }

  return tags
}
