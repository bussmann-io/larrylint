<template>
  <Card v-for="item in items" :key="item.id" v-bind="{ ...item.props }" />
</template>
