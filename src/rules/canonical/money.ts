import { defineRule } from '../../lib/rule'
import { findProperty } from '../../utils/ast/object'

const ISO_4217 = /^[A-Z]{3}$/

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require money amounts in minor units and ISO 4217 currency codes.',
    },
    schema: [],
    messages: {
      minorUnits: 'Money amounts are in minor units, e.g. 1999 for 19.99, so this price is off by a factor of 100.',
      currency: 'Money currencies are ISO 4217 codes like \'EUR\', and formatters show \'{{currency}}\' as it is.',
    },
  },

  applies: file => file.side === 'app' || file.side === 'server' || file.side === 'shared',

  create: ({ report }) => ({
    ObjectExpression: (node) => {
      const amount = findProperty(node, 'amount')
      const currency = findProperty(node, 'currency')

      if (!amount || !currency) {
        return
      }

      if (amount.type === 'Literal' && typeof amount.value === 'number' && !Number.isInteger(amount.value)) {
        report({ node: amount, messageId: 'minorUnits' })
      }

      if (currency.type === 'Literal' && typeof currency.value === 'string' && !ISO_4217.test(currency.value)) {
        report({ node: currency, messageId: 'currency', data: { currency: currency.value } })
      }
    },
  }),
})
