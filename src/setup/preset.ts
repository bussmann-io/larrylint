import type { Linter } from 'eslint'

import { loadLarrylintConfig } from './config'
import { plugin } from './plugin'

export interface LarrylintOptions {
  /** Folder of the Laioutr app, defaults to the current working directory. */
  cwd?: string
}

/**
 * Creates the larrylint rules as ESLint flat config. The rules come without parsers,
 * so they run on top of the project's own config, e.g. `@nuxt/eslint-config`.
 *
 * @param options Where to load the larrylint configuration from.
 *
 * @returns The flat config items.
 *
 * @example
 * ```js
 * // eslint.config.mjs
 * import larrylint from 'larrylint'
 *
 * export default createConfigForNuxt().append(larrylint())
 * ```
 */
export async function larrylint(options: LarrylintOptions = {}): Promise<Linter.Config[]> {
  const { sharedDomains, heavyPackages } = await loadLarrylintConfig(options.cwd)

  return [
    {
      name: 'larrylint',
      files: ['**/src/**/*.{ts,mts,cts,js,mjs,cjs,vue}'],
      plugins: { larrylint: plugin },
      rules: {
        ...Object.fromEntries(Object.keys(plugin.rules).map(id => [`larrylint/${id}`, 'error'] as const)),
        'larrylint/layers': ['error', { sharedDomains }],
        'larrylint/heavy-imports': ['error', { packages: heavyPackages }],
      },
    },
  ]
}
