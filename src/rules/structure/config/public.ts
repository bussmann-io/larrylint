import type { Rule } from 'eslint'
import type { Node } from 'estree'

import { defineRule } from '../../../lib/rule'
import { isFunction } from '../../../utils/ast/functions'
import { walk } from '../../../utils/ast/walk'

/**
 * Lists the property names of a member chain, e.g. `nuxt, options, runtimeConfig, public` for
 * `nuxt.options.runtimeConfig.public[key]`.
 *
 * @param node The member expression.
 *
 * @returns The names, with `*` for computed parts.
 */
function memberPath(node: Node): string[] {
  if (node.type === 'Identifier') {
    return [node.name]
  }

  if (node.type !== 'MemberExpression') {
    return []
  }

  const property = !node.computed && node.property.type === 'Identifier' ? node.property.name : '*'

  return [...memberPath(node.object), property]
}

/**
 * Finds the options parameter of the Nuxt module's `setup(options, nuxt)` around a node.
 *
 * @param node The node.
 *
 * @returns The parameter's name, or `undefined` outside `setup`.
 */
function setupOptions(node: Rule.Node) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    const [options] = isFunction(parent) ? parent.params : []
    const owner = parent.parent

    if (options?.type === 'Identifier' && owner?.type === 'Property' && owner.key.type === 'Identifier' && owner.key.name === 'setup') {
      return options.name
    }
  }

  return undefined
}

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow copying module options into the public runtime config, which reaches the browser.',
    },
    schema: [],
    messages: {
      options: 'runtimeConfig.public reaches the browser, and with it every token or secret among the module options. Copy only the options meant to be public.',
    },
  },

  applies: file => file.side === 'build',

  create: ({ report }) => ({
    AssignmentExpression: (node) => {
      const path = memberPath(node.left)
      const index = path.indexOf('runtimeConfig')
      const options = index !== -1 && path[index + 1] === 'public' ? setupOptions(node as Rule.Node) : undefined

      if (!options) {
        return
      }

      walk(node.right, (child) => {
        const parent = (child as Rule.Node).parent

        const name = parent?.type === 'MemberExpression' && parent.property === child && !parent.computed

        if (child.type === 'Identifier' && child.name === options && !name) {
          const publicOnly = parent?.type === 'MemberExpression' && parent.object === child && !parent.computed && parent.property.type === 'Identifier' && parent.property.name === 'public'

          if (!publicOnly) {
            report({ node: child, messageId: 'options' })
          }
        }
      })
    },
  }),
})
