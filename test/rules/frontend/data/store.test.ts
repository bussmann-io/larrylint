import rule from '../../../../src/rules/frontend/data/store'
import { runtime, tsTester, vueTester } from '../../../utils'

vueTester.run('orchestr-store', rule, {
  valid: [
    { filename: runtime('app/sections/SectionCart.vue'), code: `<script setup lang="ts">\nconst { items } = useCart()\n</script>` },
  ],

  invalid: [
    { filename: runtime('app/sections/SectionCart.vue'), code: `<script setup lang="ts">\nconst store = useOrchestrStore()\n</script>`, errors: [{ messageId: 'store' }] },
    { filename: runtime('app/blocks/BlockCartButton.vue'), code: `<script setup lang="ts">\nconst store = useOrchestrStore()\n</script>`, errors: [{ messageId: 'store' }] },
  ],
})

tsTester.run('orchestr-store', rule, {
  valid: [
    { filename: runtime('app/composables/useCart.ts'), code: `export function useCart() {\n  const store = useOrchestrStore()\n  return store\n}` },
  ],
  invalid: [],
})
