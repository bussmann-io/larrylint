import type { CallExpression, Directive, ExportAllDeclaration, ExportNamedDeclaration, Expression, ImportDeclaration, ModuleDeclaration, Node, Program, Statement } from 'estree'
import type { FunctionNode } from './functions'

import { resolveModule } from '../fs'
import { isFunction } from './functions'
import { parseFile } from './parse'

interface TypeScriptKinds {
  importKind?: 'type' | 'value'
  exportKind?: 'type' | 'value'
}

export interface Import {
  /** The import specifier, e.g. `./Foo.vue`. */
  source: string
  /** The imported name: `default`, `*` for a namespace, or the exported name. */
  name: string
}

export interface ResolvedFunction {
  /** The function node itself. */
  node: FunctionNode
  /** Absolute path of the file that declares the function. */
  file: string
}

/**
 * Checks whether an import or re-export only brings in types, so it disappears from the bundle.
 *
 * @param node The import or export declaration.
 *
 * @returns `true` for `import type`, `export type` and imports whose specifiers are all `type`.
 */
export function isTypeOnly(node: ImportDeclaration | ExportNamedDeclaration | ExportAllDeclaration) {
  const { importKind, exportKind } = node as TypeScriptKinds

  if (importKind === 'type' || exportKind === 'type') {
    return true
  }

  return node.type === 'ImportDeclaration' && node.specifiers.length > 0 && node.specifiers.every(specifier => (specifier as TypeScriptKinds).importKind === 'type')
}

/**
 * Finds the import of a local name, e.g. `Foo` in `import Foo from './Foo.vue'`.
 *
 * @param program The module.
 * @param local The local name.
 *
 * @returns Where the name comes from, or `undefined` if the module doesn't import it.
 */
export function findImport(program: Program, local: string): Import | undefined {
  for (const statement of program.body) {
    const specifier = statement.type === 'ImportDeclaration' ? statement.specifiers.find(item => item.local.name === local) : undefined

    if (!specifier || statement.type !== 'ImportDeclaration' || typeof statement.source.value !== 'string') {
      continue
    }

    const source = statement.source.value

    if (specifier.type === 'ImportSpecifier') {
      return { source, name: specifier.imported.type === 'Identifier' ? specifier.imported.name : String(specifier.imported.value) }
    }

    return { source, name: specifier.type === 'ImportDefaultSpecifier' ? 'default' : '*' }
  }

  return undefined
}

/**
 * Finds a function declared at the top level of a module.
 *
 * @param statements The module's statements.
 * @param name The function's name.
 *
 * @returns The function, or `undefined`.
 */
export function findFunction(statements: (Statement | ModuleDeclaration | Directive)[], name: string): FunctionNode | undefined {
  for (const statement of statements) {
    const declaration = statement.type === 'ExportNamedDeclaration' && statement.declaration ? statement.declaration : statement

    if (declaration.type === 'FunctionDeclaration' && declaration.id?.name === name) {
      return declaration
    }

    if (declaration.type === 'VariableDeclaration') {
      for (const declarator of declaration.declarations) {
        if (declarator.id.type === 'Identifier' && declarator.id.name === name && declarator.init && isFunction(declarator.init)) {
          return declarator.init
        }
      }
    }
  }

  return undefined
}

/**
 * Finds the value a constant is declared with at the top level of a module.
 *
 * @param statements The module's statements.
 * @param name The constant's name.
 *
 * @returns The initializer, or `undefined`.
 */
export function findConstant(statements: (Statement | ModuleDeclaration | Directive)[], name: string): Expression | undefined {
  for (const statement of statements) {
    const declaration = statement.type === 'ExportNamedDeclaration' && statement.declaration ? statement.declaration : statement

    if (declaration.type !== 'VariableDeclaration' || declaration.kind !== 'const') {
      continue
    }

    const declarator = declaration.declarations.find(item => item.id.type === 'Identifier' && item.id.name === name)

    if (declarator?.init) {
      return declarator.init
    }
  }

  return undefined
}

/**
 * Finds the value a constant is declared with, in the same module or exported from a relative import.
 *
 * @param name The constant's local name.
 * @param program The module that uses it.
 * @param filename Absolute path of that module.
 *
 * @returns The initializer, or `undefined` if it can't be found.
 */
export function resolveConstant(name: string, program: Program, filename: string) {
  const local = findConstant(program.body, name)

  if (local) {
    return local
  }

  const imported = findImport(program, name)
  const file = imported && imported.name !== '*' ? resolveModule(filename, imported.source) : undefined
  const module = file ? parseFile(file) : undefined

  return module && imported ? findConstant(module.body, imported.name) : undefined
}

/**
 * Finds an exported function by the name it's exported as.
 *
 * @param program The module.
 * @param name The exported name, or `default`.
 *
 * @returns The function, or `undefined`.
 */
export function findExport(program: Program, name: string): FunctionNode | undefined {
  for (const statement of program.body) {
    if (statement.type === 'ExportDefaultDeclaration' && name === 'default') {
      const { declaration } = statement

      return isFunction(declaration as Node) ? declaration as FunctionNode : declaration.type === 'Identifier' ? findFunction(program.body, declaration.name) : undefined
    }

    if (statement.type !== 'ExportNamedDeclaration') {
      continue
    }

    const declared = statement.declaration && findFunction([statement.declaration], name)

    if (declared) {
      return declared
    }

    const specifier = statement.source ? undefined : statement.specifiers.find(item => (item.exported.type === 'Identifier' ? item.exported.name : item.exported.value) === name)

    if (specifier?.local.type === 'Identifier') {
      return findFunction(program.body, specifier.local.name)
    }
  }

  return undefined
}

/**
 * Finds the function a call runs, if it's declared in the same file or exported from a relative import.
 *
 * @param call The call.
 * @param program The AST of the calling file.
 * @param filename Absolute path of the calling file.
 *
 * @returns The function and its file, or `undefined` for methods and package imports.
 */
export function resolveCallee(call: CallExpression, program: Program, filename: string): ResolvedFunction | undefined {
  if (call.callee.type !== 'Identifier') {
    return undefined
  }

  const { name } = call.callee
  const local = findFunction(program.body, name)

  if (local) {
    return { node: local, file: filename }
  }

  const imported = findImport(program, name)
  const file = imported && imported.name !== '*' ? resolveModule(filename, imported.source) : undefined
  const module = file ? parseFile(file) : undefined
  const node = module && imported && findExport(module, imported.name)

  return file && node ? { node, file } : undefined
}
