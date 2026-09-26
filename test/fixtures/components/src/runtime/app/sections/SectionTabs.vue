<script setup lang="ts">
const tabs = computed(() => slots.default().map(block => ({ slug: block.props.slug, label: block.props['tabLabel'] })))
</script>
