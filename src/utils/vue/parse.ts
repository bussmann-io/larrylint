import type { AST } from 'vue-eslint-parser'

import tsParser from '@typescript-eslint/parser'
import { parse } from 'vue-eslint-parser'
import { cachedReader } from '../fs'

/**
 * Parses a Vue single-file component from disk, cached until the file changes.
 *
 * @param path Absolute path of the `.vue` file.
 *
 * @returns The AST and the source, or `undefined` if the file is missing or doesn't parse.
 */
export const parseVueFile = cachedReader((text): { ast: AST.ESLintProgram, text: string } | undefined => {
  try {
    return { ast: parse(text, { parser: tsParser, sourceType: 'module', ecmaVersion: 'latest' }), text }
  }
  catch {
    return undefined
  }
})
