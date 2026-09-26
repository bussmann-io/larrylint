import rule from '../../../../src/rules/orchestr/actions/errors'
import { runtime, tsTester } from '../../../utils'

const filename = runtime('server/orchestr/account/UpdateProfile.action.ts')

tsTester.run('action-errors', rule, {
  valid: [
    { filename, code: `export default defineAccountAction(UpdateProfileAction, async ({ context }) => {\n  if (!context.identity) return { status: 'unauthenticated' }\n  return { status: 'updated' }\n})` },
    { filename, code: `export default defineAccountAction(UpdateProfileAction, async () => {\n  throw createError({ status: 502, message: 'Upstream failed' })\n})` },
    { filename, code: `export default defineAccountAction(UpdateProfileAction, async () => {\n  try {\n    return await save()\n  }\n  catch (error) {\n    throw error\n  }\n})` },
    { filename: runtime('server/orchestr/account/Profile.query.ts'), code: `export default defineAccountQuery(ProfileQuery, async () => {\n  throw createError({ status: 404 })\n})` },
  ],

  invalid: [
    {
      filename,
      code: `export default defineAccountAction(UpdateProfileAction, async ({ context }) => {\n  if (!context.identity) {\n    throw createError({ status: 401, message: 'Not authenticated' })\n  }\n})`,
      errors: [{ messageId: 'status', data: { status: '401' } }],
    },
    {
      filename,
      code: `export default defineAccountAction(UpdateProfileAction, async () => {\n  throw new HTTPError({ statusCode: 409 })\n})`,
      errors: [{ messageId: 'status', data: { status: '409' } }],
    },
  ],
})
