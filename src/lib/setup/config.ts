import process from 'node:process'
import { loadConfig } from 'c12'

export interface LarrylintConfig {
  /** Packages too heavy for the chunk every page loads, e.g. `leaflet`. */
  heavyPackages?: string[]
}

/**
 * Defines the larrylint configuration of a Laioutr app.
 *
 * @param config The configuration.
 *
 * @returns The configuration, typed.
 *
 * @example
 * ```ts
 * // larrylint.config.ts
 * import { defineLarrylintConfig } from 'larrylint'
 *
 * export default defineLarrylintConfig({
 *   heavyPackages: ['leaflet'],
 * })
 * ```
 */
export function defineLarrylintConfig(config: LarrylintConfig): LarrylintConfig {
  return config
}

/**
 * Loads the configuration from `larrylint.config.*` or the `larrylint` key in package.json.
 *
 * @param cwd The folder of the Laioutr app.
 *
 * @returns The configuration with defaults applied.
 */
export async function loadLarrylintConfig(cwd = process.cwd()): Promise<Required<LarrylintConfig>> {
  const { config } = await loadConfig<LarrylintConfig>({
    name: 'larrylint',
    cwd,
    packageJson: true,
    rcFile: false,
    globalRc: false,
    dotenv: false,
  })

  return {
    heavyPackages: config.heavyPackages ?? [],
  }
}
