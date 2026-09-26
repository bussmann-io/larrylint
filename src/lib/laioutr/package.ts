import { join } from 'pathe'
import { cachedReader } from '../../utils/fs'

export interface PackageInfo {
  /** The name of the package, if specified. */
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

const readPackageFile = cachedReader((text): PackageInfo => {
  const json = JSON.parse(text) as PackageJson

  return {
    name: json.name,
    dependencies: new Set([json.dependencies, json.devDependencies, json.peerDependencies, json.optionalDependencies].flatMap(deps => Object.keys(deps ?? {}))),
  }
})

/**
 * Reads the package.json of a Laioutr app, cached until it changes.
 *
 * @param root Absolute path of the package root.
 *
 * @returns The package's name and dependencies, or `undefined` without a package.json.
 */
export function readPackage(root: string) {
  return readPackageFile(join(root, 'package.json'))
}
