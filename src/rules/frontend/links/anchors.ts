import type { AST } from 'vue-eslint-parser'

import { defineRule } from '../../../lib/rule'
import { isInternalPath } from '../../../utils/nuxt/routes'
import { findAttribute, valueStart } from '../../../utils/vue/template'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow plain `<a>` tags for internal links, which reload the page and break Studio\'s navigation sync.',
    },
    schema: [],
    messages: {
      anchor: 'A plain <a> reloads the whole page and breaks Studio\'s navigation sync. Use <NuxtLink> for internal links.',
    },
  },

  applies: file => file.side === 'app' && file.path.endsWith('.vue'),

  create: ({ report, visitTemplate }) => {
    visitTemplate({
      VElement: (node: AST.VElement) => {
        if (node.rawName !== 'a') {
          return
        }

        const href = findAttribute(node, 'href')
        const target = findAttribute(node, 'target')
        const external = target && !target.directive && target.value?.value === '_blank'

        if (href && isInternalPath(valueStart(href)) && !external) {
          report({ loc: href.loc, messageId: 'anchor' })
        }
      },
    })

    return {}
  },
})
