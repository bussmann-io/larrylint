import { readMetaApp } from '../../../laioutr/orchestr'
import { readPackage } from '../../../laioutr/package'
import { defineRule } from '../../../lib/rule'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require `meta({ app })` of an orchestr builder to be the package name.',
    },
    schema: [],
    messages: {
      app: 'meta({ app }) is \'{{actual}}\', but the package is \'{{expected}}\'. Traces use this name to tell which app\'s middleware ran.',
    },
  },

  applies: file => file.side === 'server',

  create: ({ file, report }) => ({
    CallExpression: (node) => {
      const app = readMetaApp(node)
      const expected = app && readPackage(file.root)?.name

      if (app && expected && app.value !== expected) {
        report({ node: app.node, messageId: 'app', data: { actual: app.value, expected } })
      }
    },
  }),
})
