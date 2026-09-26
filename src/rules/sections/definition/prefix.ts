import { parse } from 'pathe'
import { DEFINERS, readDefinition } from '../../../laioutr/definition'
import { defineRule } from '../../../lib/rule'
import { prefixName } from '../../../utils/string'

export default defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Name sections Section*.vue and blocks Block*.vue.',
    },
    schema: [],
    messages: {
      prefix: 'Name {{kind}}s {{prefix}}*.vue, e.g. {{suggestion}}.vue.',
    },
  },

  applies: file => file.kind === 'section' || file.kind === 'block',

  create: ({ file, report }) => ({
    CallExpression: (node) => {
      const definition = readDefinition(node)

      if (!definition) {
        return
      }

      const { kind, prefix } = DEFINERS[definition.definer]
      const { name } = parse(file.path)

      if (file.kind === kind && !name.startsWith(prefix)) {
        report({ node: node.callee, messageId: 'prefix', data: { kind, prefix, suggestion: prefixName(name, prefix) } })
      }
    },
  }),
})
