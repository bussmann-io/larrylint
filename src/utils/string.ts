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
 * Turns a dash-case, snake_case or PascalCase name into camelCase.
 *
 * @param name The name, e.g. `show-heading`.
 *
 * @returns The camelCase name, e.g. `showHeading`.
 */
export function camelCase(name: string) {
  return name.replace(/[-_\s]+(.)?/g, (_, char: string | undefined) => char?.toUpperCase() ?? '').replace(/^[A-Z]/, char => char.toLowerCase())
}
