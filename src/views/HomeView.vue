<script setup lang="ts">
import { computed, onMounted, watch, ref, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCryptoStore } from '@/stores/cryptoStore';
import { storeToRefs } from 'pinia';
import CoinCard from '@/components/CoinCard.vue';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const route = useRoute();
const router = useRouter();
const { coins, currentPage, totalPages, error } = storeToRefs(useCryptoStore());
const { fetchCryptoData, setCurrentPage } = useCryptoStore();
const loading = ref(true);
const localError = ref<string | null>(null);

const chartInstance = ref<Chart | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const paginatedCoins = computed(() => {
  const start = (currentPage.value - 1) * 10;
  const end = currentPage.value * 10;
  return coins.value.slice(start, end);
});

const renderChart = async () => {
  await nextTick();
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  if (chartInstance.value) {
    chartInstance.value.destroy();
  }

  const labels = paginatedCoins.value.map((coin) => coin.symbol.toUpperCase());
  const data = paginatedCoins.value.map((coin) => coin.market_cap || 0);

  chartInstance.value = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Market Cap (USD)',
          data,
          backgroundColor: 'rgba(99, 102, 241, 0.4)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top' },
      },
      scales: {
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45,
          },
        },
        y: {
          ticks: {
            callback(this: any, tickValue: string | number): string {
              return `$${Number(tickValue).toLocaleString()}`;
            },
          },
        },
      },
    },
  });
};

const loadPage = async (page: number) => {
  loading.value = true;
  try {
    setCurrentPage(page);
    await fetchCryptoData();
    if (!coins.value?.length) {
      localError.value = error.value || 'No coin data available';
    } else {
      await nextTick();
      await renderChart();
    }
  } catch (err) {
    console.error('Error loading data:', err);
    localError.value = 'Failed to load coin data';
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  const pageFromUrl = parseInt(route.query.page as string) || 1;
  await loadPage(pageFromUrl);
});

watch(() => route.query.page, async (newPage) => {
  const page = parseInt(newPage as string) || 1;
  if (page !== currentPage.value) {
    await loadPage(page);
  }
});

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    router.push({ query: { ...route.query, page: page > 1 ? page : undefined } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const handleFirstPage = () => goToPage(1);
const handleLastPage = () => goToPage(totalPages.value);
const handleNextPage = () => {
  if (currentPage.value < totalPages.value) goToPage(currentPage.value + 1);
};
const handlePrevPage = () => {
  if (currentPage.value > 1) goToPage(currentPage.value - 1);
};

const displayedPages = computed(() => {
  const maxPages = 5;
  const start = Math.max(currentPage.value - Math.floor(maxPages / 2), 1);
  const end = Math.min(start + maxPages - 1, totalPages.value);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});
</script>


<template>
  <v-container fluid max-width="1200px">
    <div class="p-4">
      <h2 class="text-2xl font-bold mb-4">Top Cryptocurrencies</h2>

      <v-skeleton-loader
        v-if="loading"
        type="card, list-item-two-line@3"
        class="mx-auto rounded-lg"
        max-width="1200"
      />

      <v-alert v-else-if="localError" type="error" class="mb-6">
        {{ localError }}
      </v-alert>

      <canvas
        ref="canvasRef"
        id="cryptoChart"
        class="mb-6"
        height="300"
        v-show="!loading && !localError"
      />

      <ul>
        <li
          v-for="coin in paginatedCoins"
          :key="coin.id"
          class="border-b py-2"
        >
          <div class="flex justify-between">
            <router-link
              :to="`/coin/${coin.id}`"
              class="font-semibold text-blue-500 hover:underline"
            >
              {{ coin.name }} ({{ coin.symbol.toUpperCase() }})
            </router-link>
            <span>${{ coin.current_price.toLocaleString() }}</span>
          </div>
        </li>
      </ul>

      <div class="pagination">
        <v-btn
          @click="handleFirstPage"
          :disabled="currentPage === 1"
          color="primary"
          variant="text"
        >
          First
        </v-btn>
        <v-btn
          @click="handlePrevPage"
          :disabled="currentPage === 1"
          color="primary"
          variant="text"
        >
          Previous
        </v-btn>
        <div class="page-numbers">
          <v-btn
            v-for="page in displayedPages"
            :key="page"
            @click="goToPage(page)"
            :color="page === currentPage ? 'secondary' : 'primary'"
            class="btn"
            variant="text"
          >
            {{ page }}
          </v-btn>
        </div>
        <v-btn
          @click="handleNextPage"
          :disabled="currentPage === totalPages"
          color="primary"
          variant="text"
        >
          Next
        </v-btn>
        <v-btn
          @click="handleLastPage"
          :disabled="currentPage === totalPages"
          color="primary"
          variant="text"
        >
          Last
        </v-btn>
      </div>
    </div>

    <v-row v-if="!loading && !localError" class="mt-10 mb-10">
      <v-col
        v-for="coin in coins"
        :key="coin.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <CoinCard :coin="coin" />
      </v-col>
    </v-row>

    <p>Total coins: {{ coins.length }}</p>
  </v-container>
</template>

<style scoped lang="scss">
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
    flex-direction: row;
    justify-content: center;
  }
  .page-numbers {
    padding: 0 1em;
  }
}
ul {
  list-style: none;
}
#cryptoChart {
  max-height: 300px;
  width: 100%;
}
</style>
