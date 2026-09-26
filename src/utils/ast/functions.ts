import type { ArrowFunctionExpression, CallExpression, Directive, FunctionDeclaration, FunctionExpression, ModuleDeclaration, Node, Program, Statement } from 'estree'

import { resolveModule } from '../fs'
import { parseFile } from './parse'
import { children } from './walk'

export type FunctionNode = FunctionDeclaration | FunctionExpression | ArrowFunctionExpression

export interface ResolvedFunction {
  node: FunctionNode
  /** Absolute path of the file that declares the function. */
  file: string
}

/**
 * Checks whether a node is a function.
 *
 * @param node The node.
 *
 * @returns `true` for function declarations, function expressions and arrow functions.
 */
export function isFunction(node: Node): node is FunctionNode {
  return node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression'
}

/**
 * Finds the function a call runs, when the callee is declared in the same file or exported
 * from a relative import.
 *
 * @param call The call.
 * @param program The AST of the calling file.
 * @param filename Absolute path of the calling file.
 *
 * @returns The function and its file, or `undefined` for anything else, e.g. methods and package imports.
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

  for (const statement of program.body) {
    if (statement.type !== 'ImportDeclaration' || typeof statement.source.value !== 'string') {
      continue
    }

    const specifier = statement.specifiers.find(item => item.local.name === name)

    if (!specifier || specifier.type === 'ImportNamespaceSpecifier') {
      continue
    }

    const file = resolveModule(filename, statement.source.value)
    const module = file ? parseFile(file) : undefined
    const exported = specifier.type === 'ImportDefaultSpecifier' ? 'default' : specifier.imported.type === 'Identifier' ? specifier.imported.name : String(specifier.imported.value)
    const node = module && findExport(module, exported)

    return file && node ? { node, file } : undefined
  }

  return undefined
}

/**
 * Visits the nodes a function runs itself. Nested functions are skipped, since they run later or not at all.
 *
 * @param fn The function.
 * @param enter Called with each node, and whether a try/catch in the function catches what the node throws.
 */
export function walkBody(fn: FunctionNode, enter: (node: Node, caught: boolean) => void) {
  const visit = (node: Node, caught: boolean) => {
    enter(node, caught)

    if (isFunction(node)) {
      return
    }

    if (node.type === 'TryStatement') {
      visit(node.block, caught || Boolean(node.handler))

      if (node.handler) {
        visit(node.handler, caught)
      }

      if (node.finalizer) {
        visit(node.finalizer, caught)
      }

      return
    }

    for (const child of children(node)) {
      visit(child, caught)
    }
  }

  for (const child of children(fn.body)) {
    visit(child, false)
  }
}

/**
 * Finds a function declared at the top level of a module.
 *
 * @param statements The module's statements.
 * @param name The function's name.
 *
 * @returns The function, or `undefined`.
 */
function findFunction(statements: (Statement | ModuleDeclaration | Directive)[], name: string): FunctionNode | undefined {
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
 * Finds an exported function by the name it's exported as.
 *
 * @param program The module.
 * @param name The exported name, or `default`.
 *
 * @returns The function, or `undefined`.
 */
function findExport(program: Program, name: string): FunctionNode | undefined {
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
