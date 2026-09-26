import { readdirSync } from 'node:fs'
import { join, parse } from 'pathe'
import { findPackage } from '../utils/fs'
import { kebabCase } from '../utils/string'

/** The packages whose components Nuxt registers with the `L` prefix. */
const PACKAGES = ['@laioutr-core/ui-kit', '@laioutr-core/ui']

const cache = new Map<string, Set<string>>()

/**
 * Builds the name Nuxt gives a component in a folder, e.g. `SheetClose` for `Sheet/SheetClose.vue`:
 * folder names the file name already starts with are left out.
 *
 * @param folders The folders below `components/`.
 * @param stem The file name without extension.
 *
 * @returns The component name, without prefix.
 */
function nuxtName(folders: string[], stem: string) {
  const parts = [...folders]

  while (parts.length > 0 && kebabCase(stem).startsWith(kebabCase(parts.at(-1)!))) {
    parts.pop()
  }

  return [...parts, stem].join('')
}

/**
 * Lists the tags of the ui-kit and ui components, e.g. `l-button` or `l-sheet-close`, read from
 * the components the app's installed packages ship.
 *
 * @param root Absolute path of the package root.
 *
 * @returns The kebab-case tags.
 *
 * @throws {Error} When a package isn't installed, since its components can't be known without it.
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
