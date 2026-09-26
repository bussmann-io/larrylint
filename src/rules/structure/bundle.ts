import { defineRule } from '../../lib/rule'
import { isTypeOnly } from '../../utils/ast/module'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow static imports of heavy packages in sections, blocks and plugins',
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
      heavy: 'This loads \'{{name}}\' on every page. Load it with import() or defineAsyncComponent() instead.',
    },
  },

  applies: file => file.kind === 'section' || file.kind === 'block' || file.kind === 'app-plugin',

  create: ({ context, report }) => {
    const { packages = [] } = (context.options[0] ?? {}) as { packages?: string[] }

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
