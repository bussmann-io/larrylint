import type { Program } from 'estree'

import { parse } from '@typescript-eslint/parser'
import { readFileCached } from '../fs'

/**
 * Parses a TypeScript or JavaScript file from disk, cached until the file changes.
 *
 * @param path Absolute path of the file.
 *
 * @returns The AST, or `undefined` if the file is missing or doesn't parse.
 */
export function parseFile(path: string) {
  return readFileCached(path, (text) => {
    try {
      return parse(text, { range: true, loc: true }) as unknown as Program
    }
    catch {
      return undefined
    }
  })
}
