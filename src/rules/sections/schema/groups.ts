import { readDefinition, readGroups } from '../../../laioutr/definition'
import { defineRule } from '../../../lib/rule'

const PANELS = ['Content', 'Design', 'Rules']

export default defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require schema groups to be Studio\'s panels, in the order Content, Design, Rules.',
    },
    schema: [],
    messages: {
      panel: 'Studio\'s schema has the panels Content, Design and Rules. Move these fields into one of them.',
      order: '\'{{label}}\' goes before \'{{previous}}\': the panels are Content, Design, Rules.',
    },
  },

  applies: file => file.side === 'app',

  create: ({ report }) => ({
    CallExpression: (node) => {
      const definition = readDefinition(node)
      let previous: string | undefined

      for (const { label } of definition ? readGroups(definition) : []) {
        if (!label) {
          continue
        }

        if (!PANELS.includes(label.value)) {
          report({ node: label.node, messageId: 'panel' })
        }
        else if (previous && PANELS.indexOf(label.value) < PANELS.indexOf(previous)) {
          report({ node: label.node, messageId: 'order', data: { label: label.value, previous } })
        }
        else {
          previous = label.value
        }
      }
    },
  }),
})
