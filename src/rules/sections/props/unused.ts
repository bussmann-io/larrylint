import type { Rule } from 'eslint'
import type { Identifier, Literal, Node, Program } from 'estree'
import type { AST } from 'vue-eslint-parser'

import { readDefinition, readFields } from '../../../laioutr/definition'
import { slotProps } from '../../../laioutr/slots'
import { defineRule } from '../../../lib/rule'
import { isReference } from '../../../utils/ast/values'
import { findPropsVariable, isDefineProps, usedProps } from '../../../utils/vue/script'

const NOT_READ = new Set(['info', 'separator', 'query'])

export default defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow schema fields the section or block never reads.',
    },
    schema: [],
    messages: {
      unused: 'Studio shows \'{{name}}\' to editors, but the component never reads it. Use the field or remove it.',
    },
  },

  applies: file => file.side === 'app' && file.path.endsWith('.vue'),

  create: ({ context, file, report, visitTemplate }) => {
    const fields = new Map<string, Literal>()
    const used = new Set<string>()
    const propsVariable = findPropsVariable(context.sourceCode.ast as Program)
    let hasProps = false
    let escapes = false

    const track = (node: Identifier & { parent: Node }) => {
      const names = usedProps(node)

      if (names) {
        names.forEach(name => used.add(name))
      }
      else {
        escapes = true
      }
    }

    visitTemplate({
      VExpressionContainer: (node: AST.VExpressionContainer) => {
        for (const { id } of node.references) {
          used.add(id.name)
        }
      },

      Identifier: (node: Identifier & { parent: Node }) => {
        if ((node.name === '$props' || node.name === propsVariable) && isReference(node)) {
          track(node)
        }
      },
    })

    return {
      'CallExpression': (node) => {
        hasProps ||= isDefineProps(node)

        const definition = readDefinition(node)

        for (const { name, type, as } of definition ? readFields(definition) : []) {
          if (name && !as && !NOT_READ.has(type ?? '')) {
            fields.set(name.value, name.node)
          }
        }
      },

      'Identifier': (node: Identifier & Rule.NodeParentExtension) => {
        const declaration = node.parent.type === 'VariableDeclarator' && node.parent.id === node

        if (node.name === propsVariable && !declaration && isReference(node)) {
          track(node)
        }
      },

      'Program:exit': () => {
        if (!hasProps || escapes) {
          return
        }

        const unused = [...fields].filter(([name]) => !used.has(name))
        const readBySection = unused.length > 0 && file.kind === 'block' ? slotProps(file.root) : new Set<string>()

        for (const [name, node] of unused) {
          if (!readBySection.has(name)) {
            report({ node, messageId: 'unused', data: { name } })
          }
        }
      },
    }
  },
})
