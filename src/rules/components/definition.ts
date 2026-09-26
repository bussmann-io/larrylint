import type { Rule } from 'eslint'
import type { CallExpression } from 'estree'

import { basename } from 'pathe'
import { createReporter } from '../../lib/baseline'
import { classify } from '../../lib/layout'
import { FILE_START } from '../../utils/ast/location'
import { findProperty, findStringProperty, objectElements } from '../../utils/ast/object'
import { prefixName } from '../../utils/string'

const DEFINERS = {
  defineSection: { kind: 'section', folder: 'sections', prefix: 'Section' },
  defineBlock: { kind: 'block', folder: 'blocks', prefix: 'Block' },
} as const

type Definer = keyof typeof DEFINERS

const FORBIDDEN_FIELD_NAMES = new Set(['style', 'class', 'key', 'ref', 'is', 'slot', 'refFor', 'refKey'])

export const definition: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Keep defineSection() in app/sections/Section*.vue and defineBlock() in app/blocks/Block*.vue, with a matching component name and schema fields that reach the component.',
    },
    schema: [],
    messages: {
      notDefined: 'Laioutr registers every .vue in {{folder}}/ as a Studio {{kind}}, but this file has no {{definer}}(). Move it to components/.',
      wrongFolder: '{{definer}}() belongs in app/{{folder}}/.',
      prefix: 'Name {{kind}}s {{prefix}}*.vue, e.g. {{suggestion}}.vue.',
      componentName: 'component: \'{{actual}}\' must match the file name \'{{expected}}\'.',
      forbiddenFieldName: 'Vue consumes \'{{name}}\' before it reaches the component, so this field never arrives as a prop. Pick another name, e.g. variant for a style selector.',
    },
  },

  create(context) {
    const file = classify(context.filename)

    if (!file || file.test || file.side !== 'app') {
      return {}
    }

    const reporter = createReporter(context, file)
    const name = basename(file.path).replace(/\.[^.]+$/, '')
    const calls: { definer: Definer, node: CallExpression }[] = []

    return {
      'CallExpression': (node) => {
        if (node.callee.type === 'Identifier' && Object.hasOwn(DEFINERS, node.callee.name)) {
          calls.push({ definer: node.callee.name as Definer, node })
        }
      },

      'Program:exit': () => {
        const expected = (Object.keys(DEFINERS) as Definer[]).find(definer => DEFINERS[definer].kind === file.kind)

        if (expected && file.path.endsWith('.vue') && !calls.some(call => call.definer === expected)) {
          const { kind, folder } = DEFINERS[expected]

          reporter.report({ loc: FILE_START, messageId: 'notDefined', data: { folder, kind, definer: expected } })
        }

        for (const { definer, node } of calls) {
          const { kind, folder, prefix } = DEFINERS[definer]

          if (file.kind !== kind && file.kind !== 'override') {
            reporter.report({ node: node.callee, messageId: 'wrongFolder', data: { definer, folder } })
          }
          else if (file.kind === kind && !name.startsWith(prefix)) {
            reporter.report({ node: node.callee, messageId: 'prefix', data: { kind, prefix, suggestion: prefixName(name, prefix) } })
          }

          const [options] = node.arguments

          if (options?.type !== 'ObjectExpression') {
            continue
          }

          const component = findStringProperty(options, 'component')

          if (component && component.value !== name) {
            reporter.report({ node: component.node, messageId: 'componentName', data: { actual: component.value, expected: name } })
          }

          for (const group of objectElements(findProperty(options, 'schema'))) {
            for (const field of objectElements(findProperty(group, 'fields'))) {
              const fieldName = findStringProperty(field, 'name')

              if (fieldName && FORBIDDEN_FIELD_NAMES.has(fieldName.value)) {
                reporter.report({ node: fieldName.node, messageId: 'forbiddenFieldName', data: { name: fieldName.value } })
              }
            }
          }
        }

        reporter.flush()
      },
    }
  },
}
