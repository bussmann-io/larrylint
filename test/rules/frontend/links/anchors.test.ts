import rule from '../../../../src/rules/frontend/links/anchors'
import { runtime, vueTester } from '../../../utils'

const filename = runtime('app/sections/SectionFooter.vue')

vueTester.run('internal-anchors', rule, {
  valid: [
    { filename, code: `<template><NuxtLink to="/cart">Cart</NuxtLink></template>` },
    { filename, code: `<template><a href="https://laioutr.com">Laioutr</a><a href="mailto:hi@karls.de">Mail</a><a href="#top">Top</a></template>` },
    { filename, code: `<template><a href="/api/auth/login">Log in</a><a href="/imprint.pdf" target="_blank">Imprint</a></template>` },
    { filename, code: `<template><a :href="url">Link</a></template>` },
  ],

  invalid: [
    { filename, code: `<template><a href="/cart">Cart</a></template>`, errors: [{ messageId: 'anchor' }] },
    { filename, code: `<template><a :href="\`/standort/\${slug}\`">Standort</a></template>`, errors: [{ messageId: 'anchor' }] },
  ],
})
