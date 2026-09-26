import { existsSync } from 'node:fs'
import process from 'node:process'
import { defineCommand } from 'citty'
import { consola } from 'consola'
import { join, resolve } from 'pathe'
import { BASELINE_FILE, countViolations, writeBaseline } from '../../lib/baseline'
import { check } from '../../lib/check'
import { cwdArgs } from '../utils/args'

export default defineCommand({
  meta: {
    name: 'check',
    description: 'Check the Laioutr app in the current folder.',
  },

  args: {
    ...cwdArgs,

    fix: {
      type: 'boolean',
      description: 'Fix what can be fixed automatically.',
    },

    baseline: {
      type: 'boolean',
      description: `Record all current violations in ${BASELINE_FILE}, so only new ones fail.`,
    },
  },

  run: async ({ args }) => {
    const cwd = resolve(args.cwd)

    if (!existsSync(join(cwd, 'src/runtime'))) {
      consola.warn(`No src/runtime/ in ${cwd}. larrylint checks Laioutr apps, run it in the app's folder.`)

      process.exitCode = 1

      return
    }

    const { eslint, results, violations, baselined, improved } = await check(cwd, { fix: args.fix })

    if (args.baseline) {
      writeBaseline(cwd, violations)

      const total = countViolations(violations)

      consola.success(total > 0 ? `Recorded ${total} violations in ${Object.keys(violations).length} files in ${BASELINE_FILE}.` : 'No violations, nothing to record.')

      return
    }

    const output = await (await eslint.loadFormatter('stylish')).format(results)

    if (output) {
      process.stdout.write(`${output}\n`)
    }

    if (baselined > 0) {
      consola.info(`${baselined} known violations are recorded in ${BASELINE_FILE}.`)
    }

    if (improved > 0) {
      consola.info(`${improved} baseline entries have fewer violations now. Run larrylint --baseline to lock that in.`)
    }

    if (results.some(result => result.errorCount > 0)) {
      process.exitCode = 1

      return
    }

    consola.success(baselined > 0 ? 'No new violations.' : 'No violations.')
  },
})
