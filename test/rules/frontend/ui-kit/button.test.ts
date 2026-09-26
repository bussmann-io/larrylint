import rule from '../../../../src/rules/frontend/ui-kit/button'
import { runtime, vueTester } from '../../../utils'

const filename = runtime('app/sections/SectionContactForm.vue')
const uiKitButton = `<script setup lang="ts">\nimport Button from '#ui-kit/components/Button/Button.vue'\n</script>\n`

vueTester.run('button-type', rule, {
  valid: [
    { filename, code: `<template><l-button button-type="submit">Send</l-button></template>` },
    { filename, code: `${uiKitButton}<template><button type="submit">Send</button></template>` },
    { filename, code: `<script setup lang="ts">\nimport Button from '../components/Button.vue'\n</script>\n<template><Button type="submit">Send</Button></template>` },
  ],

  invalid: [
    {
      filename,
      code: `<template><l-button size="l" type="submit">Send</l-button></template>`,
      output: `<template><l-button size="l" button-type="submit">Send</l-button></template>`,
      errors: [{ messageId: 'buttonType' }],
    },
    {
      filename,
      code: `<template><LButton :type="kind">Send</LButton></template>`,
      output: `<template><LButton :button-type="kind">Send</LButton></template>`,
      errors: [{ messageId: 'buttonType' }],
    },
    {
      filename,
      code: `<template><l-button v-bind:type="kind">Send</l-button></template>`,
      output: `<template><l-button v-bind:button-type="kind">Send</l-button></template>`,
      errors: [{ messageId: 'buttonType' }],
    },
    {
      filename,
      code: `${uiKitButton}<template><Button type="submit">Send</Button></template>`,
      output: `${uiKitButton}<template><Button button-type="submit">Send</Button></template>`,
      errors: [{ messageId: 'buttonType' }],
    },
  ],
})
