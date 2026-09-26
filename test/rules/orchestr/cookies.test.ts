import rule from '../../../src/rules/orchestr/cookies'
import { runtime, tsTester } from '../../utils'

const middleware = runtime('server/middleware/ticketApi.ts')

tsTester.run('orchestr-cookies', rule, {
  valid: [
    { filename: middleware, code: `export const defineTicketApi = defineOrchestr.extendRequest(async (args) => {\n  const appId = getCookie(args.event, 'guest-app-id')\n  return { context: { client: createClient(appId) } }\n})` },
    { filename: runtime('server/middleware/refreshToken.ts'), code: `export default defineEventHandler((event) => {\n  setCookie(event, 'token', refresh(event))\n})` },
    { filename: runtime('server/api/login.get.ts'), code: `export default defineEventHandler(event => sendRedirect(event, '/account'))` },
    { filename: runtime('server/orchestr/cart/Cart.query.ts'), code: `export default defineShopwareQuery(CartQuery, async ({ event }) => ({ id: getCookie(event, 'cart') }))` },
  ],

  invalid: [
    {
      filename: middleware,
      code: `export const defineTicketApi = defineOrchestr.extendRequest(async (args) => {\n  setCookie(args.event, 'guest-app-id', randomUUID())\n  return { context: {} }\n})`,
      errors: [{ messageId: 'cookie' }],
    },
    {
      filename: middleware,
      code: `export const defineTicketApi = defineOrchestr.meta({ app: 'app' }).use(async (ctx, next) => {\n  setResponseHeader(ctx.event, 'Set-Cookie', 'a=b')\n  return next()\n})`,
      errors: [{ messageId: 'cookie' }],
    },
    {
      filename: runtime('server/orchestr/checkout/Checkout.page-index.ts'),
      code: `export default defineShopwarePageIndex(Checkout, async ({ event }) => {\n  sendRedirect(event, '/cart')\n  return { entries: [] }\n})`,
      errors: [{ messageId: 'redirect' }],
    },
  ],
})
