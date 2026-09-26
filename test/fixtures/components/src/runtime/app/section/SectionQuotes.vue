<script setup lang="ts">
const quotes = computed(() => slots.default().map((quote) => {
  const p = quote.props
  const { author } = quote.props

  return { rating: p.starRating, author }
}))
</script>
