import type { Program } from 'estree'
import type { AST } from 'vue-eslint-parser'

import { readDefinition } from '../../../laioutr/definition'
import { defineRule } from '../../../lib/rule'
import { parseVueFile } from '../../../utils/vue/parse'
import { importedComponent } from '../../../utils/vue/script'
import { renderedRoots } from '../../../utils/vue/template'

const OWN_ATTRS = /inheritAttrs\s*:\s*false/

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require sections and blocks to render one root element, which carries frontend-core\'s data-lfc-* markers.',
    },
    schema: [],
    messages: {
      roots: 'frontend-core adds its data-lfc-* markers to the root element of a section or block, and Vue drops them when there\'s more than one root. Wrap the content in one element.',
      componentRoots: '<{{name}}> renders more than one root element, so Vue drops the data-lfc-* markers frontend-core adds to this section or block. Give {{name}} one root, or wrap it here.',
    },
  },

  applies: file => file.side === 'app' && file.path.endsWith('.vue'),

  create: ({ context, report }) => {
    let defined = false

    return {
      'CallExpression': (node) => {
        defined ||= readDefinition(node) !== undefined
      },

      'Program:exit': () => {
        const program = context.sourceCode.ast as AST.ESLintProgram
        const template = program.templateBody

        if (!defined || !template || OWN_ATTRS.test(context.sourceCode.text)) {
          return
        }

        const [root, second] = renderedRoots(template)

        if (second) {
          report({ loc: second.startTag.loc, messageId: 'roots' })

          return
        }

        const file = root && importedComponent(program as Program, context.filename, root.rawName)
        const component = file ? parseVueFile(file) : undefined
        const componentTemplate = component?.ast.templateBody

        if (root && componentTemplate && renderedRoots(componentTemplate).length > 1 && !OWN_ATTRS.test(component.text)) {
          report({ loc: root.startTag.loc, messageId: 'componentRoots', data: { name: root.rawName } })
        }
      },
    }
  },
})
