import rule from '../../../src/rules/orchestr/cookies'
import { runtime, tsTester } from '../../utils'

const middleware = runtime('server/middleware/ticketApi.ts')

tsTester.run('orchestr-cookies', rule, {
  valid: [
    { filename: middleware, code: `export const defineTicketApi = defineOrchestr.extendRequest(async (args) => {\n  setManagedCookie(args.event, 'guest-app-id', randomUUID())\n  return { context: {} }\n})` },
    { filename: middleware, code: `export const defineTicketApi = defineOrchestr.extendRequest(async (args) => {\n  const appId = getCookie(args.event, 'guest-app-id')\n  return { context: { client: createClient(appId) } }\n})` },
    { filename: runtime('server/orchestr/account/Login.action.ts'), code: `export default defineShopwareAction(Login, async ({ event }) => {\n  setManagedCookie(event, 'token', 'abc')\n  setResponseHeader(event, 'X-Login', '1')\n})` },
    { filename: runtime('server/orchestr/cart/Cart.query.ts'), code: `export default defineShopwareQuery(CartQuery, async ({ event }) => ({ id: getCookie(event, 'cart') }))` },
    { filename: runtime('server/middleware/refreshToken.ts'), code: `export default defineEventHandler((event) => {\n  setCookie(event, 'token', refresh(event))\n})` },
    { filename: runtime('server/orchestr/cart/Cart.query.ts'), code: `export default defineShopwareQuery(CartQuery, async () => {\n  request.setHeader('Authorization', 'Bearer x')\n  return { id: 'cart' }\n})` },
  ],

  invalid: [
    {
      filename: runtime('server/orchestr/cart/Cart.query.ts'),
      code: `export default defineShopwareQuery(CartQuery, async ({ event }) => {\n  setCookie(event, 'cart', 'abc')\n  return { id: 'abc' }\n})`,
      errors: [{ messageId: 'streamed', data: { name: 'setCookie' } }],
    },
    {
      filename: runtime('server/orchestr/product/Product.resolver.ts'),
      code: `export default defineShopwareComponentResolver({ resolve: ({ event }) => {\n  setManagedCookie(event, 'seen', '1')\n  return {}\n} })`,
      errors: [{ messageId: 'streamed', data: { name: 'setManagedCookie' } }],
    },
    {
      filename: middleware,
      code: `export const defineTicketApi = defineOrchestr.meta({ app: 'app' }).use(async (ctx, next) => {\n  setResponseHeader(ctx.event, 'Set-Cookie', 'a=b')\n  return next()\n})`,
      errors: [{ messageId: 'streamed', data: { name: 'setResponseHeader' } }],
    },
    {
      filename: middleware,
      code: `export const defineTicketApi = defineOrchestr.extendRequest(async (args) => {\n  setCookie(args.event, 'guest-app-id', randomUUID())\n  return { context: {} }\n})`,
      errors: [{ messageId: 'managed', data: { name: 'setCookie', managed: 'setManagedCookie' } }],
    },
    {
      filename: runtime('server/orchestr/account/Logout.action.ts'),
      code: `export default defineShopwareAction(Logout, async ({ event }) => {\n  deleteCookie(event, 'token')\n})`,
      errors: [{ messageId: 'managed', data: { name: 'deleteCookie', managed: 'deleteManagedCookie' } }],
    },
  ],
})
