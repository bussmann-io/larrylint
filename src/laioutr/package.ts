import { join } from 'pathe'
import { readFileCached } from '../utils/fs'

export interface PackageInfo {
  name?: string
  /** Names of every dependency, including peer, dev and optional ones. */
  dependencies: Set<string>
}

interface PackageJson {
  name?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
}

/**
 * Reads the package.json of a Laioutr app, cached until it changes.
 *
 * @param root Absolute path of the package root.
 *
 * @returns The package's name and dependencies, or `undefined` without a package.json.
 */
export function readPackage(root: string) {
  return readFileCached(join(root, 'package.json'), (text): PackageInfo => {
    const json = JSON.parse(text) as PackageJson

    return {
      name: json.name,
      dependencies: new Set([json.dependencies, json.devDependencies, json.peerDependencies, json.optionalDependencies].flatMap(deps => Object.keys(deps ?? {}))),
    }
  })
}
