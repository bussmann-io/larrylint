import rule from '../../../../src/rules/frontend/data/mutations'
import { runtime, tsTester, vueTester } from '../../../utils'

const filename = runtime('app/blocks/BlockProductGrid.vue')

function block(script: string, template = '<div />') {
  return `<script setup lang="ts">\nconst addToCart = useMutationAction(CartAddItemsAction)\n${script}\n</script>\n\n<template>${template}</template>\n`
}

vueTester.run('mutation-errors', rule, {
  valid: [
    { filename, code: block(`async function add(item) {\n  try {\n    await addToCart.mutateAsync([item])\n  }\n  catch {\n    toaster.error()\n  }\n}`) },
    { filename, code: block(`async function add(item) {\n  await addToCart.mutateAsync([item]).catch(revert)\n}`) },
    { filename, code: block(`function add(item) {\n  addToCart.mutateAsync([item]).then(refresh).catch(revert).finally(done)\n}`) },
    { filename, code: block(`function add(item) {\n  addToCart.mutateAsync([item]).then(refresh, revert)\n}`) },
    { filename, code: block(`const add = item => runMutation(() => addToCart.mutateAsync([item]))`) },
    { filename, code: block(`function add(item) {\n  return addToCart.mutateAsync([item])\n}`) },
    { filename, code: block('', `<button @click="addToCart.mutateAsync([item]).catch(revert)" />`) },
  ],

  invalid: [
    {
      filename,
      code: block(`async function add(item) {\n  await addToCart.mutateAsync([item])\n}`),
      errors: [{ messageId: 'unhandled', line: 4 }],
    },
    {
      filename,
      code: block(`async function add(item) {\n  try {\n    await addToCart.mutateAsync([item])\n  }\n  finally {\n    pending.value = false\n  }\n}`),
      errors: [{ messageId: 'unhandled' }],
    },
    {
      filename,
      code: block(`async function add(items) {\n  try {\n    items.forEach(async item => await addToCart.mutateAsync([item]))\n  }\n  catch {}\n}`),
      errors: [{ messageId: 'unhandled' }],
    },
    {
      filename,
      code: block(`function add(item) {\n  try {\n    addToCart.mutateAsync([item]).then(refresh)\n  }\n  catch {}\n}`),
      errors: [{ messageId: 'unhandled' }],
    },
    {
      filename,
      code: block(`const { mutateAsync } = useMutationAction(SetSaveAction)\n\nasync function save(entry) {\n  await mutateAsync(entry)\n}`),
      errors: [{ messageId: 'unhandled' }],
    },
    {
      filename,
      code: block('', `<button @click="addToCart.mutateAsync([item])" />`),
      errors: [{ messageId: 'unhandled', line: 6 }],
    },
  ],
})

tsTester.run('mutation-errors', rule, {
  valid: [
    { filename: runtime('server/utils/cart.ts'), code: `export async function add(item) {\n  await client.mutateAsync(item)\n}` },
  ],

  invalid: [
    {
      filename: runtime('app/composables/useWishlist.ts'),
      code: `export function useWishlist() {\n  async function add(productId) {\n    await addMutation.mutateAsync({ productId })\n  }\n\n  return { add }\n}`,
      errors: [{ messageId: 'unhandled' }],
    },
  ],
})
