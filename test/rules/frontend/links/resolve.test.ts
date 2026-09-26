import rule from '../../../../src/rules/frontend/links/resolve'
import { runtime, vueTester } from '../../../utils'

const filename = runtime('app/components/TicketBanner.vue')

vueTester.run('resolve-result', rule, {
  valid: [
    { filename, code: `<script setup lang="ts">\nconst href = computed(() => linkResolver.resolve(props.link))\n</script>\n<template><NuxtLink :to="href">Tickets</NuxtLink></template>` },
    { filename, code: `<script setup lang="ts">\nconst href = computed(() => resolveHref(props.link))\n</script>\n<template><NuxtLink v-if="href" :to="href">Tickets</NuxtLink></template>` },
    { filename, code: `<script setup lang="ts">\nconst { resolve } = linkResolver\nconst links = props.items.map(item => resolve(item.link))\n</script>` },
  ],

  invalid: [
    { filename, code: `<script setup lang="ts">\nconst resolvedLink = computed(() => linkResolver.resolve(props.link))\n</script>\n<template><component :is="resolvedLink ? 'a' : 'div'" /></template>`, errors: [{ messageId: 'tested' }] },
    { filename, code: `<script setup lang="ts">\nconst href = computed(() => {\n  return linkResolver.resolve(props.link)\n})\n</script>\n<template><a v-if="href" :href="href" /></template>`, errors: [{ messageId: 'tested' }] },
    { filename, code: `<script setup lang="ts">\nconst cta = { href: linkResolver.resolve(props.link) ?? undefined }\n</script>`, errors: [{ messageId: 'tested' }] },
    { filename, code: `<script setup lang="ts">\nconst href = computed(() => linkResolver.resolve(props.link))\nconst show = computed(() => !!href.value)\n</script>`, errors: [{ messageId: 'tested' }] },
    { filename, code: `<script setup lang="ts">\nconst { resolve: toHref } = linkResolver\nif (toHref(props.link)) open()\n</script>`, errors: [{ messageId: 'tested' }] },
  ],
})
