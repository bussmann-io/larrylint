import rule from '../../../../src/rules/frontend/links/anchors'
import { runtime, vueTester } from '../../../utils'

const filename = runtime('app/sections/SectionFooter.vue')

vueTester.run('internal-anchors', rule, {
  valid: [
    { filename, code: `<template><NuxtLink to="/cart">Cart</NuxtLink></template>` },
    { filename, code: `<template><a href="https://laioutr.com">Laioutr</a><a href="mailto:hi@karls.de">Mail</a><a href="#top">Top</a></template>` },
    { filename, code: `<template><a href="/api/auth/login">Log in</a><a href="/imprint.pdf" target="_blank">Imprint</a><a href="/app-shopware/checkout">Checkout</a></template>` },
    { filename, code: `<template><a :href="url">Link</a></template>` },
    { filename, code: `<script setup lang="ts">\nconst href = useResolvedLink(props.link)\n</script>\n<template><a :href="href" target="_blank">Open</a><a :href="href" download>Save</a><NuxtLink :to="href">Go</NuxtLink></template>` },
  ],

  invalid: [
    { filename, code: `<template><a href="/cart">Cart</a></template>`, errors: [{ messageId: 'anchor' }] },
    { filename, code: `<template><a :href="\`/standort/\${slug}\`">Standort</a></template>`, errors: [{ messageId: 'anchor' }] },
    { filename, code: `<script setup lang="ts">\nconst href = computed(() => linkResolver.resolve(props.link))\n</script>\n<template><a :href="href">Product</a></template>`, errors: [{ messageId: 'anchor' }] },
    { filename, code: `<script setup lang="ts">\nconst href = useResolvedLink(props.link)\n</script>\n<template><component :is="href ? 'a' : 'div'" :href="href">Tickets</component></template>`, errors: [{ messageId: 'anchor' }] },
    { filename, code: `<script setup lang="ts">\nconst { resolve } = linkResolver\n</script>\n<template><a :href="resolve(props.link)">Product</a></template>`, errors: [{ messageId: 'anchor' }] },
  ],
})
