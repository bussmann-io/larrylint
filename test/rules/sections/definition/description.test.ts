import rule from '../../../../src/rules/sections/definition/description'
import { runtime, vueTester, withDefinition } from '../../../utils'

const filename = runtime('app/sections/SectionHero.vue')

vueTester.run('definition-description', rule, {
  valid: [
    { filename, code: withDefinition(`defineSection({ component: 'SectionHero', studio: { label: 'Hero', description: 'A big image with a heading.' }, schema: [] })`) },
    { filename, code: withDefinition(`defineSection({ component: 'SectionHero', studio: heroStudio, schema: [] })`) },
    { filename, code: withDefinition(`defineSection(heroDefinition)`) },
  ],

  invalid: [
    { filename, code: withDefinition(`defineSection({ component: 'SectionHero', schema: [] })`), errors: [{ messageId: 'description', data: { kind: 'section' } }] },
    { filename, code: withDefinition(`defineSection({ component: 'SectionHero', studio: { label: 'Hero' }, schema: [] })`), errors: [{ messageId: 'description' }] },
    { filename, code: withDefinition(`defineBlock({ component: 'BlockCard', studio: { label: 'Card', description: '  ' }, schema: [] })`), errors: [{ messageId: 'description', data: { kind: 'block' } }] },
  ],
})
