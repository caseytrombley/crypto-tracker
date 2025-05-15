<template>
  <v-card class="coin-card" @click="goToCoinDetail">
    <v-card-title>
      <div class="coin-name">
        {{ coin.name }} ({{ coin.symbol.toUpperCase() }})
      </div>
    </v-card-title>
    <v-card-subtitle>
      <div class="coin-price">
        ${{ coin.current_price.toLocaleString() }}
      </div>
    </v-card-subtitle>
    <v-card-actions>
      <v-btn color="primary">View Details</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { defineProps } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  coin: Object
});

const router = useRouter();

const goToCoinDetail = () => {
  router.push(`/coin/${props.coin.id}`);
};
</script>

<style scoped>
.coin-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.coin-card:hover {
  transform: scale(1.05);
}
</style>
