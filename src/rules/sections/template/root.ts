import type { Program } from 'estree'
import type { AST } from 'vue-eslint-parser'

import { readDefinition } from '../../../laioutr/definition'
import { defineRule } from '../../../lib/rule'
import { resolveModule } from '../../../utils/fs'
import { parseVueFile, renderedRoots } from '../../../utils/vue'

/**
 * Finds the `.vue` file a component tag is imported from.
 *
 * @param program The component's script.
 * @param filename Absolute path of the component.
 * @param tag The tag, e.g. `BurgerMenu`.
 *
 * @returns The imported file, or `undefined` for global and package components.
 */
function importedComponent(program: Program, filename: string, tag: string) {
  for (const statement of program.body) {
    const local = statement.type === 'ImportDeclaration' ? statement.specifiers.find(specifier => specifier.type === 'ImportDefaultSpecifier')?.local.name : undefined

    if (statement.type === 'ImportDeclaration' && local === tag && typeof statement.source.value === 'string' && statement.source.value.endsWith('.vue')) {
      return resolveModule(filename, statement.source.value)
    }
  }

  return undefined
}

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

        if (!defined || !template) {
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

        if (root && componentTemplate && renderedRoots(componentTemplate).length > 1 && !/inheritAttrs\s*:\s*false/.test(component.text)) {
          report({ loc: root.startTag.loc, messageId: 'componentRoots', data: { name: root.rawName } })
        }
      },
    }
  },
})
