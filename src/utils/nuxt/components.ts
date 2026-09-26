import { kebabCase } from '../string'

/**
 * Builds the name Nuxt gives a component in a folder, e.g. `SheetClose` for `Sheet/SheetClose.vue`.
 *
 * @param folders The folders below `components/`.
 * @param stem The file name without extension.
 *
 * @returns The component name, without prefix.
 */
export function nuxtName(folders: string[], stem: string) {
  const parts = [...folders]

  while (parts.length > 0 && kebabCase(stem).startsWith(kebabCase(parts.at(-1)!))) {
    parts.pop()
  }

  return [...parts, stem].join('')
}
