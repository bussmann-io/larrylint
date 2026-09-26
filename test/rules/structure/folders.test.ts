import rule from '../../../src/rules/structure/folders'
import { runtime, tsTester } from '../../utils'

tsTester.run('known-folders', rule, {
  valid: [
    { filename: runtime('app/theme/classic.ts'), code: `export default defineTheme({})` },
    { filename: runtime('app/shared-fields/button.ts'), code: `export const buttonFields = []` },
    { filename: runtime('server/orchestr/brunch/Brunch.query.ts'), code: `export default handler` },
    { filename: runtime('shared/tokens/Brunch.ts'), code: `export const BrunchQuery = token` },
  ],

  invalid: [
    { filename: runtime('server/search/reindex.ts'), code: `export async function reindex() {}`, errors: [{ messageId: 'unknown', data: { folder: 'server/search/' } }] },
    { filename: runtime('app/tracking/client.ts'), code: `export const track = () => {}`, errors: [{ messageId: 'unknown', data: { folder: 'app/tracking/' } }] },
  ],
})
