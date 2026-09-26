import { readdirSync } from 'node:fs'
import { join } from 'pathe'
import { cachedReader } from '../utils/fs'

const PROP_READ = /\.props\??\.([A-Z_$][\w$]*)|\.props\??\.?\[\s*['"]([^'"]+)['"]\s*\]|['"]([^'"]+)['"]\s+in\s+[\w$.?]+\.props\b/gi

const readPropNames = cachedReader(text => [...text.matchAll(PROP_READ)].map(match => match[1] ?? match[2] ?? match[3]!))

/**
 * Lists the props app code reads from blocks through a slot, e.g. `slug` in `block.props.slug`.
 *
 * @param root Absolute path of the package root.
 *
 * @returns The prop names.
 */
export function slotProps(root: string) {
  const folder = join(root, 'src/runtime/app')
  const names = new Set<string>()
  let files: string[]

  try {
    files = readdirSync(folder, { recursive: true, encoding: 'utf8' }).filter(file => /\.(?:vue|[cm]?[jt]s)$/.test(file))
  }
  catch {
    return names
  }

  for (const file of files) {
    readPropNames(join(folder, file))?.forEach(name => names.add(name))
  }

  return names
}
