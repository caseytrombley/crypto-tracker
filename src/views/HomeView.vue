<script setup>
import { computed, onMounted } from 'vue';
import { useCryptoStore } from '@/stores/cryptoStore';

const { coins, currentPage, totalPages, fetchCryptoData, nextPage, prevPage } = useCryptoStore();

// Fetch data on mount
onMounted(() => {
  fetchCryptoData();
});

// Computed pagination numbers
const displayedPages = computed(() => {
  const maxPages = 5; // Show up to 5 pages
  let start = Math.max(currentPage.value - Math.floor(maxPages / 2), 1);
  let end = Math.min(start + maxPages - 1, totalPages.value);

  if (end - start < maxPages - 1) {
    start = Math.max(end - maxPages + 1, 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

// Function to go to a specific page
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchCryptoData(); // Ensure data updates
  }
};
</script>


<template>
  <v-container fluid max-width="1200px">
    <div class="p-4">
      <h2 class="text-2xl font-bold mb-4">Top Cryptocurrencies</h2>

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
      <div class="flex justify-center items-center mt-4 space-x-2">
        <!-- Previous Button -->
        <button @click="prevPage" :disabled="currentPage === 1"
                class="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">
          Previous
        </button>

        <!-- Page Numbers -->
        <button v-for="page in displayedPages" :key="page"
                @click="goToPage(page)"
                class="px-3 py-1 rounded"
                :class="page === currentPage ? 'bg-blue-500 text-white' : 'bg-gray-200'">
          {{ page }}
        </button>

        <!-- Next Button -->
        <button @click="nextPage" :disabled="currentPage === totalPages"
                class="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">
          Next
        </button>
      </div>


    </div>

  </v-container>
</template>
<style lang="scss" scoped>
ul {
  list-style: none;
}
</style>
