import type { AST } from 'vue-eslint-parser'

import { defineRule } from '../../../lib/rule'
import { kebabCase } from '../../../utils/string'

const UI_KIT_BUTTON = /(?:^#ui-kit|@laioutr-core\/ui-kit)\/.*\/Button\.vue$/

export default defineRule({
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: {
      description: 'Disallow `type` on the ui-kit button, which silently renders its `button-type` prop instead.',
    },
    schema: [],
    messages: {
      buttonType: 'l-button ignores type and always renders its button-type prop, which defaults to "button". Use button-type.',
    },
  },

  applies: file => file.path.endsWith('.vue'),

  create: ({ report, visitTemplate }) => {
    const buttons = new Set(['LButton', 'l-button'])

    visitTemplate({
      VElement: (node: AST.VElement) => {
        if (!buttons.has(node.rawName)) {
          return
        }

        for (const attribute of node.startTag.attributes) {
          if (!attribute.directive && attribute.key.rawName === 'type') {
            const key = attribute.key

            report({ loc: key.loc, messageId: 'buttonType', fix: fixer => fixer.replaceTextRange(key.range, 'button-type') })
          }

          const argument = attribute.directive ? attribute.key.argument : null

          if (attribute.directive && attribute.key.name.name === 'bind' && argument?.type === 'VIdentifier' && argument.rawName === 'type') {
            report({ loc: argument.loc, messageId: 'buttonType', fix: fixer => fixer.replaceTextRange(argument.range, 'button-type') })
          }
        }
      },
    })

    return {
      ImportDeclaration: (node) => {
        if (typeof node.source.value !== 'string' || !UI_KIT_BUTTON.test(node.source.value)) {
          return
        }

        for (const specifier of node.specifiers) {
          if (specifier.type === 'ImportDefaultSpecifier') {
            const kebab = kebabCase(specifier.local.name)

            buttons.add(specifier.local.name)

            if (kebab.includes('-')) {
              buttons.add(kebab)
            }
          }
        }
      },
    }
  },
})
