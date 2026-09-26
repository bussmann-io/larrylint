import type { Definer } from '../../../laioutr/definition'

import { DEFINERS, expectedDefiner, readDefinition } from '../../../laioutr/definition'
import { defineRule } from '../../../lib/rule'
import { FILE_START } from '../../../utils/ast/location'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require sections in `app/sections/` and blocks in `app/blocks/`, and a definition in every `.vue` there',
    },
    schema: [],
    messages: {
      notDefined: 'Every .vue file in this folder needs {{definer}}(). Add it, or move the file to components/.',
      wrongFolder: '{{definer}}() belongs in app/{{folder}}/. Move the file there.',
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
          report({ loc: FILE_START, messageId: 'notDefined', data: { definer: expected } })
        }
      },
    }
  },
})
