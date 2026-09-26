import rule from '../../../src/rules/canonical/money'
import { runtime, tsTester } from '../../utils'

const filename = runtime('server/utils/prices.ts')

tsTester.run('money', rule, {
  valid: [
    { filename, code: `export const price = { amount: 1999, currency: 'EUR' }` },
    { filename, code: `export const price = (cents, currency) => ({ amount: cents, currency })` },
    { filename, code: `export const size = { amount: 1.5, unit: 'l' }` },
  ],

  invalid: [
    { filename, code: `export const price = { amount: 19.99, currency: 'EUR' }`, errors: [{ messageId: 'minorUnits' }] },
    { filename, code: `export const price = { amount: 1999, currency: '€' }`, errors: [{ messageId: 'currency', data: { currency: '€' } }] },
    { filename, code: `export const price = { amount: 1999, currency: 'eur' }`, errors: [{ messageId: 'currency' }] },
  ],
})
