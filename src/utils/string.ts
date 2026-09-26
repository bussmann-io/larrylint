/**
 * Turns a PascalCase name into kebab-case.
 *
 * @param name The PascalCase name, e.g. `LButton`.
 *
 * @returns The kebab-case name, e.g. `l-button`.
 */
export function kebabCase(name: string) {
  return name.replace(/([a-z\d])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase()
}

/**
 * Puts a prefix in front of a name, moving it there if the name ends with it.
 *
 * @param name The name, e.g. `ContactFormSection`.
 * @param prefix The prefix, e.g. `Section`.
 *
 * @returns The prefixed name, e.g. `SectionContactForm`.
 */
export function prefixName(name: string, prefix: string) {
  return `${prefix}${name.endsWith(prefix) ? name.slice(0, -prefix.length) : name}`
}
