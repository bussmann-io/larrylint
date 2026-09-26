import rule from '../../../../src/rules/frontend/links/paths'
import { runtime, vueTester } from '../../../utils'

const filename = runtime('app/components/LocationList.vue')

vueTester.run('hand-built-links', rule, {
  valid: [
    { filename, code: `<script setup lang="ts">\nconst data = await $fetch(\`/api/locations/\${slug}\`)\nnavigateTo(linkResolver.resolve(link))\n</script>\n<template><NuxtLink :to="href">Go</NuxtLink></template>` },
    { filename, code: `<template><NuxtLink to="/cart">Cart</NuxtLink><NuxtLink :to="\`https://\${host}/cart\`">Cart</NuxtLink></template>` },
    { filename, code: `<script setup lang="ts">\nconst paths = []\npaths.push(\`/standort/\${slug}\`)\nnavigateTo(\`/app-shopware/checkout/\${id}\`, { external: true })\nnavigateTo('/_laioutr/reflect/' + id)\n</script>` },
  ],

  invalid: [
    { filename, code: `<template><NuxtLink :to="\`/standort/\${option.slug}\`">Go</NuxtLink></template>`, errors: [{ messageId: 'path' }] },
    { filename, code: `<template><nuxt-link :href="'/standort/' + standort.slug">Go</nuxt-link></template>`, errors: [{ messageId: 'path' }] },
    { filename, code: `<script setup lang="ts">\nfunction open(slug) {\n  navigateTo(\`/standort/\${slug}\`, { external: true })\n}\n</script>`, errors: [{ messageId: 'path' }] },
    { filename, code: `<script setup lang="ts">\nconst cta = { text: 'Brunches', link: \`/standort/\${slug}/brunches\` }\n</script>`, errors: [{ messageId: 'path' }] },
    { filename, code: `<script setup lang="ts">\nconst router = useRouter()\nrouter.push(\`/standort/\${slug}\`)\nuseRouter().replace('/standort/' + slug)\n</script>`, errors: [{ messageId: 'path' }, { messageId: 'path' }] },
  ],
})
