import type { Program } from 'estree'
import type { AST } from 'vue-eslint-parser'

import { DEFINERS, readDefinition } from '../../../lib/laioutr/definition'
import { defineRule } from '../../../lib/rule'
import { parseVueFile } from '../../../utils/vue/parse'
import { importedComponent } from '../../../utils/vue/script'
import { renderedRoots } from '../../../utils/vue/template'

const OWN_ATTRS = /inheritAttrs\s*:\s*false/

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require sections and blocks to render one root element',
    },
    schema: [],
    messages: {
      roots: 'Studio can\'t select a {{kind}} with more than one root element. Wrap the content in one element.',
      componentRoots: '<{{name}}> has more than one root element, so Studio can\'t select this {{kind}}. Give it one root, or wrap it here.',
    },
  },

  applies: file => file.side === 'app' && file.path.endsWith('.vue'),

  create: ({ context, report }) => {
    let kind: string | undefined

    return {
      'CallExpression': (node) => {
        const definition = readDefinition(node)

        kind ??= definition && DEFINERS[definition.definer].kind
      },

      'Program:exit': () => {
        const program = context.sourceCode.ast as AST.ESLintProgram
        const template = program.templateBody

        if (!kind || !template || OWN_ATTRS.test(context.sourceCode.text)) {
          return
        }

        const [root, second] = renderedRoots(template)

        if (second) {
          report({ loc: second.startTag.loc, messageId: 'roots', data: { kind } })

          return
        }

        const file = root && importedComponent(program as Program, context.filename, root.rawName)
        const component = file ? parseVueFile(file) : undefined
        const componentTemplate = component?.ast.templateBody

        if (root && componentTemplate && renderedRoots(componentTemplate).length > 1 && !OWN_ATTRS.test(component.text)) {
          report({ loc: root.startTag.loc, messageId: 'componentRoots', data: { name: root.rawName, kind } })
        }
      },
    }
  },
})
