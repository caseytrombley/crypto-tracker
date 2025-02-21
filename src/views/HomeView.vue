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
      <div class="pagination">
        <!-- Previous Button -->
        <v-btn @click="prevPage" :disabled="currentPage === 1" color="primary" class="prev" variant="text">
          Previous
        </v-btn>

        <!-- Page Numbers -->
        <div class="page-numbers">
          <v-btn v-for="page in displayedPages" :key="page"
                 @click="goToPage(page)"
                 :color="page === currentPage ? 'secondary' : 'primary'"
                 :class="{'active-page': page === currentPage}"
                 class="btn" variant="text">
            {{ page }}
          </v-btn>
        </div>

        <!-- Next Button -->
        <v-btn @click="nextPage" :disabled="currentPage === totalPages" color="primary" class="next" variant="text">
          Next
        </v-btn>
      </div>
    </div>
  </v-container>
</template>

<style lang="scss" scoped>
.pagination {
  display: flex;
  flex-direction: column;
  margin: 2rem 0;
}
.page-numbers {
  display: flex;
  justify-content: center;
}

@media (min-width: 500px) {
  .pagination {
    display: flex;
    flex-direction: row;
    justify-content: center;
    justify-items: center;
  }
  .page-numbers {
    padding: 0 1em;
  }
}
ul {
  list-style: none;
}
</style>
