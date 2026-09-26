import { describe, expect, it } from 'vitest'
import { addLarrylint } from '../../../src/cli/utils/eslint'

describe('addLarrylint', () => {
  it('appends to a composer chain on its own line', () => {
    const code = `import { createConfigForNuxt } from '@nuxt/eslint-config/flat';

export default createConfigForNuxt({
  features: { tooling: true },
})
  .append({
    rules: { 'vue/no-v-html': 'off' },
  });
`

    expect(addLarrylint(code)).toBe(`import { createConfigForNuxt } from '@nuxt/eslint-config/flat';
import larrylint from 'larrylint';

export default createConfigForNuxt({
  features: { tooling: true },
})
  .append({
    rules: { 'vue/no-v-html': 'off' },
  })
  .append(larrylint());
`)
  })

  it('appends to a composer call in the same line', () => {
    expect(addLarrylint(`import antfu from '@antfu/eslint-config'\n\nexport default antfu({\n  ignores: ['dist'],\n})\n`))
      .toBe(`import antfu from '@antfu/eslint-config'\nimport larrylint from 'larrylint'\n\nexport default antfu({\n  ignores: ['dist'],\n}).append(larrylint())\n`)
  })

  it('spreads into a config array', () => {
    expect(addLarrylint(`import laioutr from '@laioutr/eslint-config/nuxt-module'\n\nexport default [\n  ...laioutr,\n  { rules: {} },\n]\n`))
      .toBe(`import laioutr from '@laioutr/eslint-config/nuxt-module'\nimport larrylint from 'larrylint'\n\nexport default [\n  ...laioutr,\n  { rules: {} },\n  ...(await larrylint()),\n]\n`)

    expect(addLarrylint(`export default [{ rules: {} }]\n`))
      .toBe(`import larrylint from 'larrylint'\n\nexport default [{ rules: {} }, ...(await larrylint())]\n`)
  })

  it('adds an argument to defineConfig', () => {
    expect(addLarrylint(`import { defineConfig } from 'eslint/config'\n\nexport default defineConfig(\n  { rules: {} }\n)\n`))
      .toBe(`import { defineConfig } from 'eslint/config'\nimport larrylint from 'larrylint'\n\nexport default defineConfig(\n  { rules: {} },\n  await larrylint()\n)\n`)
  })

  it('extends a config exported by name, like laioutr\'s app starter', () => {
    expect(addLarrylint(`import config from '@laioutr/eslint-config/nuxt-module';\nexport default config;\n`))
      .toBe(`import config from '@laioutr/eslint-config/nuxt-module';\nimport larrylint from 'larrylint';\nexport default [...config, ...(await larrylint())];\n`)

    expect(addLarrylint(`import { createConfigForNuxt } from '@nuxt/eslint-config/flat'\n\nconst config = createConfigForNuxt()\n\nexport default config\n`))
      .toBe(`import { createConfigForNuxt } from '@nuxt/eslint-config/flat'\nimport larrylint from 'larrylint'\n\nconst config = createConfigForNuxt()\n\nexport default config.append(larrylint())\n`)
  })

  it('leaves configs alone that it already covers or can\'t extend', () => {
    expect(addLarrylint(`import larrylint from 'larrylint'\n\nexport default larrylint()\n`)).toBe('present')
    expect(addLarrylint(`export default { rules: {} }\n`)).toBe('unknown')
  })
})
