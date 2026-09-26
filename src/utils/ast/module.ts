import type { ExportAllDeclaration, ExportNamedDeclaration, ImportDeclaration } from 'estree'

interface TypeScriptKinds {
  importKind?: 'type' | 'value'
  exportKind?: 'type' | 'value'
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
