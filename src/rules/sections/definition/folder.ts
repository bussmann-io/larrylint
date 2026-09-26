import type { Definer } from '../../../laioutr/definition'

import { DEFINERS, expectedDefiner, readDefinition } from '../../../laioutr/definition'
import { defineRule } from '../../../lib/rule'
import { FILE_START } from '../../../utils/ast/location'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Keep defineSection() in app/sections/ and defineBlock() in app/blocks/, and every .vue there defined.',
    },
    schema: [],
    messages: {
      notDefined: 'Laioutr loads every .vue in {{folder}}/ as a {{kind}}, but this file has no {{definer}}(), so frontend-core warns about it. Move it to components/.',
      wrongFolder: '{{definer}}() belongs in app/{{folder}}/.',
    },
  },

  applies: file => file.side === 'app',

  create: ({ file, report }) => {
    const definers = new Set<Definer>()

    return {
      'CallExpression': (node) => {
        const definition = readDefinition(node)

        if (!definition) {
          return
        }

        const { kind, folder } = DEFINERS[definition.definer]

        definers.add(definition.definer)

        if (file.kind !== kind && file.kind !== 'override') {
          report({ node: node.callee, messageId: 'wrongFolder', data: { definer: definition.definer, folder } })
        }
      },

      'Program:exit': () => {
        const expected = expectedDefiner(file.kind)

        if (expected && file.path.endsWith('.vue') && !definers.has(expected)) {
          const { kind, folder } = DEFINERS[expected]

          report({ loc: FILE_START, messageId: 'notDefined', data: { folder, kind, definer: expected } })
        }
      },
    }
  },
})
