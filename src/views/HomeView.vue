<script setup lang="ts">
import { computed, onMounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCryptoStore } from '@/stores/cryptoStore';

const route = useRoute();
const router = useRouter();
const { 
  coins, 
  currentPage, 
  totalPages, 
  fetchCryptoData, 
  updateChart,
  setCurrentPage
} = useCryptoStore();

// Sync URL with pagination
const updateRoute = (page) => {
  router.push({ 
    query: { ...route.query, page: page > 1 ? page : undefined } 
  });
};

// Handle page changes
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    setCurrentPage(page);
    updateRoute(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// Handle next/prev page
const handleNextPage = () => {
  if (currentPage.value < totalPages.value) {
    const nextPage = currentPage.value + 1;
    goToPage(nextPage);
  }
};

const handlePrevPage = () => {
  if (currentPage.value > 1) {
    const prevPage = currentPage.value - 1;
    goToPage(prevPage);
  }
};

// Initialize from URL on mount
onMounted(async () => {
  const pageFromUrl = parseInt(route.query.page) || 1;
  if (pageFromUrl !== currentPage.value) {
    setCurrentPage(pageFromUrl);
  }
  
  await fetchCryptoData();
  // Ensure the chart is updated after data is loaded
  nextTick(() => {
    updateChart();
  });
});

// Watch for URL changes
watch(() => route.query.page, (newPage) => {
  const page = parseInt(newPage) || 1;
  if (page !== currentPage.value) {
    setCurrentPage(page);
    fetchCryptoData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

// Computed pagination numbers
const displayedPages = computed(() => {
  const maxPages = 5; // Show up to 5 pages
  const start = Math.max(currentPage.value - Math.floor(maxPages / 2), 1);
  const end = Math.min(start + maxPages - 1, totalPages.value);

  if (end - start < maxPages - 1) {
    start = Math.max(end - maxPages + 1, 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});


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
            <router-link :to="`/coin/${coin.id}`" class="font-semibold text-blue-500 hover:underline">
              {{ coin.name }} ({{ coin.symbol.toUpperCase() }})
            </router-link>
            <span>${{ coin.current_price.toLocaleString() }}</span>
          </div>
        </li>
      </ul>

      <!-- Pagination controls -->
      <div class="pagination">
        <v-btn @click="handlePrevPage" :disabled="currentPage === 1" color="primary" class="prev" variant="text">
          Previous
        </v-btn>
        <div class="page-numbers">
          <v-btn v-for="page in displayedPages" :key="page"
                 @click="goToPage(page)"
                 :color="page === currentPage ? 'secondary' : 'primary'"
                 :class="{'active-page': page === currentPage}"
                 class="btn" variant="text">
            {{ page }}
          </v-btn>
        </div>
        <v-btn @click="handleNextPage" :disabled="currentPage === totalPages" color="primary" class="next" variant="text">
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
