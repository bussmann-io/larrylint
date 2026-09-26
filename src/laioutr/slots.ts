import { readdirSync } from 'node:fs'
import { join } from 'pathe'
import { cachedReader } from '../utils/fs'

const PROP_READ = /\.props\??\.([A-Z_$][\w$]*)|\.props\??\.?\[\s*['"]([^'"]+)['"]\s*\]|['"]([^'"]+)['"]\s+in\s+[\w$.?]+\.props\b/gi

const PROPS_ALIAS = /\b(?:const|let|var)\s+([\w$]+)\s*=\s*[\w$.?]+\.props\b(?!\s*(?:\?\.|[.[]))/g

const PROPS_DESTRUCTURING = /\{([^{}]*)\}\s*=\s*[\w$.?]+\.props\b(?!\s*(?:\?\.|[.[]))/g

const PROPS_SPREAD = /\.\.\.\s*[\w$.?]+\.props\b(?!\s*(?:\?\.|[.[]))/

export interface SlotProps {
  /** The prop names read. */
  names: Set<string>
  /** Whether some code spreads a block's props, so any prop may be read. */
  all: boolean
}

const readSlotProps = cachedReader((text) => {
  const names = [...text.matchAll(PROP_READ)].map(match => match[1] ?? match[2] ?? match[3]!)
  let all = PROPS_SPREAD.test(text)

  for (const [, alias] of text.matchAll(PROPS_ALIAS)) {
    const name = alias!.replaceAll('$', '\\$')
    const reads = new RegExp(`\\b${name}\\??\\.([A-Z_$][\\w$]*)|\\b${name}\\??\\.?\\[\\s*['"]([^'"]+)['"]\\s*\\]`, 'gi')

    for (const match of text.matchAll(reads)) {
      names.push(match[1] ?? match[2]!)
    }
  }

  for (const [, list] of text.matchAll(PROPS_DESTRUCTURING)) {
    for (const entry of list!.split(',').map(item => item.trim()).filter(Boolean)) {
      all ||= entry.startsWith('...')
      names.push(entry.split(/[:=]/)[0]!.trim())
    }
  }

  return { names, all }
})

/**
 * Lists the props app code reads from blocks through a slot, e.g. `slug` in `block.props.slug`.
 *
 * @param root Absolute path of the package root.
 *
 * @returns The prop names, and whether any prop may be read.
 */
export function slotProps(root: string): SlotProps {
  const folder = join(root, 'src/runtime/app')
  const result: SlotProps = { names: new Set(), all: false }
  let files: string[]

  try {
    files = readdirSync(folder, { recursive: true, encoding: 'utf8' }).filter(file => /\.(?:vue|[cm]?[jt]s)$/.test(file))
  }
  catch {
    return result
  }

  for (const file of files) {
    const read = readSlotProps(join(folder, file))

    read?.names.forEach(name => result.names.add(name))
    result.all ||= read?.all ?? false
  }

  return result
}
