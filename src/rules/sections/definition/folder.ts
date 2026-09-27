import type { Definer } from '../../../lib/laioutr/definition'

import { DEFINERS, expectedDefiner, readDefinition } from '../../../lib/laioutr/definition'
import { entryFolder, isReferenced, readRegistration } from '../../../lib/laioutr/registration'
import { defineRule } from '../../../lib/rule'
import { FILE_START } from '../../../utils/ast/location'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require sections and blocks in the folders `module.ts` registers for them, and a definition in every `.vue` registered there',
    },
    schema: [],
    messages: {
      notDefined: 'This file is registered as a {{kind}}, so it needs {{definer}}(). Add it, or move the file to components/.',
      wrongFolder: '{{definer}}() belongs in {{folder}}/. Move the file there.',
      notRegistered: 'module.ts registers no {{kind}}s, so this {{kind}} never shows up in Studio. Add its folder to registerLaioutrApp().',
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

        const { kind, option } = DEFINERS[definition.definer]

        definers.add(definition.definer)

        if (file.kind === kind || isReferenced(file)) {
          return
        }

        const [entry] = readRegistration(file.root)[option]

        report(entry
          ? { node: node.callee, messageId: 'wrongFolder', data: { definer: definition.definer, folder: entryFolder(entry) } }
          : { node: node.callee, messageId: 'notRegistered', data: { kind } })
      },

      'Program:exit': () => {
        const expected = expectedDefiner(file.kind)

        if (expected && file.path.endsWith('.vue') && !definers.has(expected)) {
          report({ loc: FILE_START, messageId: 'notDefined', data: { kind: DEFINERS[expected].kind, definer: expected } })
        }
      },
    }
  },
})
