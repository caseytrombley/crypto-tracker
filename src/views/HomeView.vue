<script setup>
import { onMounted } from 'vue';
import { useCryptoStore } from '@/stores/cryptoStore';

const { coins, currentPage, totalPages, fetchCryptoData, nextPage, prevPage } = useCryptoStore();

// Fetch data on mount
onMounted(() => {
  fetchCryptoData();
});
</script>

<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Top Cryptocurrencies</h1>

    <!-- Chart display -->
    <canvas id="cryptoChart" class="mb-6"></canvas>

    <!-- Coin list display -->
    <ul>
      <li v-for="coin in coins.slice((currentPage - 1) * 10, currentPage * 10)" :key="coin.id" class="border-b py-2">
        <div class="flex justify-between">
          <span class="font-semibold">{{ coin.name }} ({{ coin.symbol.toUpperCase() }})</span>
          <span>${{ coin.current_price.toLocaleString() }}</span>
        </div>
      </li>
    </ul>

    <!-- Pagination controls -->
    <div class="flex justify-between mt-4">
      <button @click="prevPage" :disabled="currentPage === 1" class="px-4 py-2 bg-gray-200 rounded">Previous</button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages" class="px-4 py-2 bg-gray-200 rounded">Next</button>
    </div>
  </div>
</template>
