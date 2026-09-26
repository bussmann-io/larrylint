import { existsSync } from 'node:fs'
import process from 'node:process'
import { defineCommand } from 'citty'
import { consola } from 'consola'
import { addDevDependency, detectPackageManager } from 'nypm'
import { join, relative, resolve } from 'pathe'
import { readPackageJSON } from 'pkg-types'
import { BASELINE_FILE, countViolations, writeBaseline } from '../../lib/baseline'
import { check } from '../../lib/check'
import { cwdArgs } from '../utils/args'
import { MANUAL_SNIPPET, wireEslintConfig } from '../utils/eslint'

export default defineCommand({
  meta: {
    name: 'init',
    description: 'Set up larrylint in the Laioutr app in the current folder.',
  },

  args: cwdArgs,

  run: async ({ args }) => {
    const cwd = resolve(args.cwd)

    if (!existsSync(join(cwd, 'package.json')) || !existsSync(join(cwd, 'src/runtime'))) {
      consola.error(`${cwd} doesn't look like a Laioutr app: it needs a package.json and a src/runtime/ folder.`)

      process.exitCode = 1

      return
    }

    const pkg = await readPackageJSON(cwd)

    if (pkg.dependencies?.larrylint || pkg.devDependencies?.larrylint) {
      consola.info('larrylint is already installed.')
    }
    else {
      const packageManager = await detectPackageManager(cwd)
      const workspace = packageManager?.name === 'pnpm' ? existsSync(join(cwd, 'pnpm-workspace.yaml')) : packageManager?.name === 'yarn' && Boolean(pkg.workspaces)

      consola.start('Installing larrylint...')

      await addDevDependency('larrylint', { cwd, packageManager, workspace, silent: true })

      consola.success('Installed larrylint.')
    }

    const wired = wireEslintConfig(cwd)
    const file = relative(cwd, wired.file)

    if (wired.status === 'created') {
      consola.success(`Created ${file} with the larrylint rules.`)
    }
    else if (wired.status === 'updated') {
      consola.success(`Added the larrylint rules to ${file}.`)
    }
    else if (wired.status === 'present') {
      consola.info(`${file} already uses larrylint.`)
    }
    else {
      consola.warn(`Couldn't add larrylint to ${file} automatically. Add it like this:\n\n${MANUAL_SNIPPET}\n`)
    }

    const { violations } = await check(cwd)

    writeBaseline(cwd, violations)

    const total = countViolations(violations)

    if (total > 0) {
      consola.info(`Recorded ${total} existing violations in ${Object.keys(violations).length} files in ${BASELINE_FILE}. New code has to follow the rules; run larrylint --baseline after fixing old violations.`)
    }
    else {
      consola.success('No violations found.')
    }
  },
})
