import { defineRule } from '../../lib/rule'
import { isTypeOnly } from '../../utils/ast/module'

interface Options {
  packages?: string[]
}

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow static imports of heavy packages in sections, blocks and plugins, which every page loads.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          packages: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      heavy: 'Laioutr registers sections, blocks and plugins globally, so \'{{name}}\' lands in the chunk every page loads. Load it with import() or defineAsyncComponent() instead.',
    },
  },

  applies: file => file.kind === 'section' || file.kind === 'block' || file.kind === 'app-plugin',

  create: ({ context, report }) => {
    const { packages = [] } = (context.options[0] ?? {}) as Options

    return {
      ImportDeclaration: (node) => {
        const source = String(node.source.value)

        if (!isTypeOnly(node) && packages.some(name => source === name || source.startsWith(`${name}/`))) {
          report({ node, messageId: 'heavy', data: { name: source } })
        }
      },
    }
  },
})
