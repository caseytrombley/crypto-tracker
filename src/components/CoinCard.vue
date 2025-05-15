<template>
  <v-card
    class="coin-card"
    @click="goToCoinDetail"
    variant="flat"
    :class="theme.name.value === 'dark' ? 'bg-surface-dark' : 'bg-surface-light'"
  >
    <v-card-title>
      <div class="coin-name">{{ coin.name }} ({{ coin.symbol.toUpperCase() }})</div>
    </v-card-title>
    <v-card-subtitle>
      <div class="coin-price">${{ coin.current_price.toLocaleString() }}</div>
    </v-card-subtitle>
    <v-card-actions>
      <v-btn color="primary">View Details</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from 'vuetify'

const theme = useTheme()

const props = defineProps({
  coin: Object,
})

const router = useRouter()

const goToCoinDetail = () => {
  router.push(`/coin/${props.coin.id}`)
}
</script>

<style scoped>
.coin-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.coin-card:hover {
  transform: translateY(-1px);
}
</style>
