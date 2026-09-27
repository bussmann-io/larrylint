import type { Node, ObjectExpression, Program } from 'estree'
import type { FileInfo } from './layout'

import { join, matchesGlob, normalize } from 'pathe'
import { findProperty } from '../../utils/ast/object'
import { parseFile } from '../../utils/ast/parse'
import { walk } from '../../utils/ast/walk'
import { withoutExtension } from '../../utils/fs'

export interface Registration {
  /** Folders and globs of the section components, relative to `src/runtime/`. */
  sections: string[]
  /** Folders and globs of the block components, relative to `src/runtime/`. */
  blocks: string[]
  /** Folders whose scripts orchestr loads as Nitro plugins, relative to `src/runtime/`. */
  orchestr: string[]
  /** Files registered with `addPlugin()`, relative to `src/runtime/` and without extension. */
  plugins: Set<string>
  /** Every runtime file `module.ts` names, relative to `src/runtime/` and without extension. */
  references: Set<string>
}

const STARTER: Registration = {
  sections: ['app/sections'],
  blocks: ['app/blocks'],
  orchestr: ['server/orchestr'],
  plugins: new Set(),
  references: new Set(),
}

const registrations = new WeakMap<Program, Registration>()

/**
 * Reads what an app's `src/module.ts` registers, cached until it changes.
 *
 * @param root Absolute path of the package root.
 *
 * @returns The registration, or the app starter's if there is no `module.ts`.
 */
export function readRegistration(root: string): Registration {
  const program = parseFile(join(root, 'src/module.ts'))

  if (!program) {
    return STARTER
  }

  let registration = registrations.get(program)

  if (!registration) {
    registration = readModule(program)
    registrations.set(program, registration)
  }

  return registration
}

/**
 * Collects what a Nuxt module registers with `registerLaioutrApp()` and `addPlugin()`.
 *
 * @param program The AST of `module.ts`.
 *
 * @returns The registration, with the app starter's folders where `registerLaioutrApp()` can't be read.
 */
export function readModule(program: Program): Registration {
  const apps: ObjectExpression[] = []
  const plugins = new Set<string>()
  const references = new Set<string>()

  walk(program, (node) => {
    const reference = node.type === 'Literal' || node.type === 'TemplateLiteral' ? runtimePath(node) : undefined

    if (reference) {
      references.add(withoutExtension(reference))
    }

    if (node.type !== 'CallExpression' || node.callee.type !== 'Identifier') {
      return
    }

    const [argument] = node.arguments

    if (node.callee.name === 'registerLaioutrApp' && argument?.type === 'ObjectExpression') {
      apps.push(argument)
    }

    if (node.callee.name === 'addPlugin' && argument && argument.type !== 'SpreadElement') {
      const src = argument.type === 'ObjectExpression' ? findProperty(argument, 'src') : argument
      const plugin = src && runtimePath(src)

      if (plugin) {
        plugins.add(withoutExtension(plugin))
      }
    }
  })

  const [app] = apps

  return {
    sections: app ? readEntries(app, 'sections', STARTER.sections) : STARTER.sections,
    blocks: app ? readEntries(app, 'blocks', STARTER.blocks) : STARTER.blocks,
    orchestr: app ? readEntries(app, 'orchestrDirs', STARTER.orchestr) : STARTER.orchestr,
    plugins,
    references,
  }
}

/**
 * Reads the paths of a `registerLaioutrApp()` option, like `sections`.
 *
 * @param app The object passed to `registerLaioutrApp()`.
 * @param option The option.
 * @param fallback The paths to assume if the option can't be read.
 *
 * @returns The paths relative to `src/runtime/`, empty if the option is missing.
 */
export function readEntries(app: ObjectExpression, option: string, fallback: string[]) {
  const value = findProperty(app, option)

  if (!value) {
    return []
  }

  const paths = value.type === 'ArrayExpression' ? value.elements.map(element => element && element.type !== 'SpreadElement' ? runtimePath(element) : undefined) : [undefined]
  const known = paths.filter(path => path !== undefined)

  return known.length > 0 || paths.length === 0 ? known : fallback
}

/**
 * Reads the runtime path an expression points to, e.g. `app/sections` for `resolve('./runtime/app/sections')`.
 *
 * @param node The expression, e.g. a call of `resolve()` or of a helper like `resolveRuntimeModule()`.
 *
 * @returns The path relative to `src/runtime/`, or `undefined` if it points elsewhere.
 */
export function runtimePath(node: Node) {
  const parts: string[] = []

  walk(node, (child) => {
    if (child.type === 'Literal' && typeof child.value === 'string') {
      parts.push(child.value)
    }
    else if (child.type === 'TemplateElement' && child.value.cooked) {
      parts.push(child.value.cooked)
    }
  })

  const path = normalize(parts.join('/')).replace(/^(?:.*\/)?runtime\//, '').replace(/^\/|\/$/g, '')

  return /^(?:app|server|shared)\//.test(path) ? path : undefined
}

/**
 * Checks whether a file is registered as a section or block, turning folders into globs the way the kit does.
 *
 * @param path The file's path relative to `src/runtime/`.
 * @param entries Folders and globs from `registerLaioutrApp()`.
 *
 * @returns `true` if an entry covers the file.
 */
export function isRegistered(path: string, entries: string[]) {
  return entries.some(entry => matchesGlob(path, entry.includes('.vue') ? entry : `${entry}/**/*.vue`))
}

/**
 * Reads the folder of a registered entry, e.g. `app/section` for a glob inside it.
 *
 * @param entry A folder or glob from `registerLaioutrApp()`.
 *
 * @returns The path up to the first wildcard or file name.
 */
export function entryFolder(entry: string) {
  const parts = entry.split('/')
  const end = parts.findIndex(part => /[*?{[]/.test(part) || part.endsWith('.vue'))

  return (end === -1 ? parts : parts.slice(0, end)).join('/')
}

/**
 * Checks whether `module.ts` names a file, e.g. to put it in place of an upstream component.
 *
 * @param file The file.
 *
 * @returns `true` if `module.ts` points to the file.
 */
export function isReferenced(file: FileInfo) {
  return readRegistration(file.root).references.has(withoutExtension(file.path.replace(/^src\/runtime\//, '')))
}
