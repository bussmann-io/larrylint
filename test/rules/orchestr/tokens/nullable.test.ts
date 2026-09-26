import rule from '../../../../src/rules/orchestr/tokens/nullable'
import { runtime, tsTester } from '../../../utils'

const filename = runtime('shared/tokens/Gastronomy.ts')

function token(fields: string) {
  return `export const GastronomyBase = defineEntityComponentToken('base', {\n  entityType: 'Gastronomy',\n  schema: z.object({\n${fields}\n  }),\n})`
}

tsTester.run('token-nullable', rule, {
  valid: [
    { filename, code: token(`    title: z.string(),\n    tags: z.array(z.string()),\n    description: z.object({ html: z.string().nullable() }),`) },
    { filename, code: `export const GastronomyQuery = defineQueryToken('karls/gastronomy', {\n  input: z.object({ slug: z.string().nullable() }),\n})` },
  ],

  invalid: [
    {
      filename,
      code: token(`    title: z.string(),\n    badge: z.string().nullable(),\n    cuisine: z.string().nullish(),\n    teaser: z.string().nullable().optional(),`),
      errors: [{ messageId: 'nullable', line: 5 }, { messageId: 'nullable', line: 6 }, { messageId: 'nullable', line: 7 }],
    },
  ],
})
