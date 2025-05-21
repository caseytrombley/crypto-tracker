<script setup lang="ts">
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Chart, registerables } from 'chart.js';
import { useCryptoStore } from '@/stores/cryptoStore';
import api from '@/utils/api';

Chart.register(...registerables);

const route = useRoute();
const router = useRouter();
const cryptoStore = useCryptoStore();
const coin = ref<any>(null);
const chartInstance = ref<Chart | null>(null);
const loading = ref<boolean>(true);
const currentCoinIndex = ref<number>(-1);
const chartCanvas = ref<HTMLCanvasElement | null>(null);
const isCanvasVisible = ref<boolean>(false);
const coinCache = ref<Map<string, { data: any; timestamp: number }>>(new Map());
const COIN_CACHE_TIME = 2 * 60 * 1000;

const updateCurrentCoinIndex = () => {
  if (!coin.value || !cryptoStore.coins.length) return;
  currentCoinIndex.value = cryptoStore.coins.findIndex((c) => c.id === coin.value.id);
};

const navigateToCoin = (direction: 'prev' | 'next') => {
  if (!cryptoStore.coins.length || currentCoinIndex.value === -1) return;
  const newIndex =
    direction === 'prev'
      ? Math.max(0, currentCoinIndex.value - 1)
      : Math.min(cryptoStore.coins.length - 1, currentCoinIndex.value + 1);
  if (newIndex !== currentCoinIndex.value) {
    const nextCoin = cryptoStore.coins[newIndex];
    router.push({ name: 'CoinDetail', params: { id: nextCoin.id } });
  }
};

const fetchCoinData = async () => {
  const coinId = route.params.id as string;
  const now = Date.now();

  if (coinCache.value.has(coinId)) {
    const cached = coinCache.value.get(coinId);
    if (cached && now - cached.timestamp < COIN_CACHE_TIME) {
      coin.value = cached.data;
      loading.value = false;
      updateCurrentCoinIndex();
      return;
    }
  }

  loading.value = true;
  try {
    const response = await api.get(`/coins/${coinId}`, {
      params: {
        localization: false,
        tickers: false,
        market_data: true,
        community_data: false,
        developer_data: false,
        sparkline: true,
      },
    });

    coinCache.value.set(coinId, {
      data: response.data,
      timestamp: now,
    });

    if (coinCache.value.size > 50) {
      const firstKey = coinCache.value.keys().next().value;
      coinCache.value.delete(firstKey);
    }

    coin.value = response.data;
  } catch (error) {
    console.error('Error fetching coin data:', error);
    if (coinCache.value.has(coinId)) {
      coin.value = coinCache.value.get(coinId)!.data;
    }
  } finally {
    loading.value = false;
    updateCurrentCoinIndex();
  }
};

const updateChart = () => {
  if (!chartCanvas.value || !isCanvasVisible.value || !coin.value?.market_data?.sparkline_7d?.price) return;

  const ctx = chartCanvas.value.getContext('2d');
  if (!ctx) return;

  if (chartInstance.value) chartInstance.value.destroy();

  const prices = coin.value.market_data.sparkline_7d.price;
  const now = new Date();
  const interval = (7 * 24 * 60 * 60 * 1000) / prices.length;

  const dates = prices.map((_, i) => {
    const date = new Date(now.getTime() - (prices.length - 1 - i) * interval);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric' });
  });

  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
  gradient.addColorStop(1, 'rgba(99, 102, 241, 0.05)');

  chartInstance.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Price (USD)',
          data: prices,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: gradient,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 6,
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.9)',
          titleFont: { size: 14, weight: '500' },
          bodyFont: { size: 14 },
          padding: 12,
          displayColors: false,
          callbacks: {
            label: (context) => `$${context.parsed.y.toLocaleString()}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false, drawBorder: false },
          ticks: { color: '#9CA3AF', font: { size: 12 } },
        },
        y: {
          grid: { color: 'rgba(156, 163, 175, 0.1)', drawBorder: false },
          ticks: {
            color: '#9CA3AF',
            font: { size: 12 },
            callback: (value: number) => `$${value}`,
          },
        },
      },
    },
  });
};

let observer: IntersectionObserver | null = null;

onMounted(() => {
  fetchCoinData();
  nextTick(() => {
    if (chartCanvas.value) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              isCanvasVisible.value = true;
              updateChart();
            }
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(chartCanvas.value);
    }
  });
});

onUnmounted(() => {
  if (chartInstance.value) {
    chartInstance.value.destroy();
    chartInstance.value = null;
  }
  if (observer) {
    observer.disconnect();
    observer = null;
  }
});

watch(
  [() => coin.value, () => isCanvasVisible.value],
  ([newCoin, canvasVisible]) => {
    if (newCoin?.market_data?.sparkline_7d?.price && canvasVisible) {
      updateChart();
    }
  },
  { immediate: true }
);

watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      loading.value = true;
      coin.value = null;
      fetchCoinData();
    }
  }
);
</script>


<template>
  <v-container max-width="1200px" fluid class="py-6 px-4">
    <v-skeleton-loader
      v-if="loading"
      type="card, article, image"
      class="mx-auto rounded-lg"
      max-width="1200"
    ></v-skeleton-loader>

    <v-container max-width="1200px" class="pa-0" fluid>
      <v-card v-show="!loading" class="mb-6 rounded-lg" variant="flat">
        <v-card-text class="pa-6">
          <v-row align="center" justify="center" class="text-center">
            <v-col cols="12" md="auto" class="d-flex justify-center">
              <v-avatar size="80" class="mr-4">
                <v-img
                  :src="coin?.image?.large || 'https://via.placeholder.com/80'"
                  :alt="coin?.name || 'Coin'"
                  contain
                ></v-img>
              </v-avatar>
              <div class="text-left">
                <h1 class="text-h4 font-weight-bold">
                  {{ coin?.name || 'Unknown Coin' }}
                  <span class="text-h6 grey--text">({{ coin?.symbol?.toUpperCase() || 'N/A' }})</span>
                </h1>
                <v-chip density="compact" size="small" color="primary" class="mt-1">
                  Rank #{{ coin?.market_cap_rank || 'N/A' }}
                </v-chip>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-row class="mb-6" v-show="!loading">
        <v-col cols="12" md="6" lg="3">
          <v-card class="h-100 rounded-lg" variant="flat">
            <v-card-text class="text-center pa-4">
              <div class="text-subtitle-1 grey--text">Current Price</div>
              <div class="text-h4 font-weight-bold primary--text mt-2">
                ${{ coin?.market_data?.current_price?.usd?.toLocaleString() || coin?.current_price?.toLocaleString() || 'N/A' }}
              </div>
              <div class="text-caption grey--text mt-1">
                {{ coin?.market_data?.current_price?.btc?.toFixed(8) || 'N/A' }} BTC
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6" lg="3">
          <v-card class="h-100 rounded-lg" variant="flat">
            <v-card-text class="text-center pa-4">
              <div class="text-subtitle-1 grey--text">24h Change</div>
              <div
                :class="[
                  'text-h4',
                  'font-weight-bold',
                  'mt-2',
                  coin?.market_data?.price_change_percentage_24h > 0 ? 'success--text' : 'error--text',
                ]"
              >
                {{ coin?.market_data?.price_change_percentage_24h > 0 ? '+' : '' }}{{
                  coin?.market_data?.price_change_percentage_24h?.toFixed(2) ||
                  coin?.price_change_percentage_24h?.toFixed(2) ||
                  '0'
                }}%
                <v-icon
                  :color="coin?.market_data?.price_change_percentage_24h > 0 ? 'success' : 'error'"
                  size="24"
                >
                  {{ coin?.market_data?.price_change_percentage_24h > 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
                </v-icon>
              </div>
              <div class="text-caption grey--text mt-1">
                24h High: ${{ coin?.market_data?.high_24h?.usd?.toLocaleString() || 'N/A' }}
              </div>
              <div class="text-caption grey--text">
                24h Low: ${{ coin?.market_data?.low_24h?.usd?.toLocaleString() || 'N/A' }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6" lg="3">
          <v-card class="h-100 rounded-lg" variant="flat">
            <v-card-text class="text-center pa-4">
              <div class="text-subtitle-1 grey--text">Market Cap</div>
              <div class="text-h5 font-weight-bold mt-2">
                ${{ coin?.market_data?.market_cap?.usd?.toLocaleString() || coin?.market_cap?.toLocaleString() || 'N/A' }}
              </div>
              <div class="text-caption grey--text mt-1">
                {{ coin?.market_data?.market_cap_change_percentage_24h?.toFixed(2) || '0' }}% (24h)
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6" lg="3">
          <v-card class="h-100 rounded-lg" variant="flat">
            <v-card-text class="text-center pa-4">
              <div class="text-subtitle-1 grey--text">Volume (24h)</div>
              <div class="text-h5 font-weight-bold mt-2">
                ${{ coin?.market_data?.total_volume?.usd?.toLocaleString() || coin?.total_volume?.toLocaleString() || 'N/A' }}
              </div>
              <div class="text-caption grey--text mt-1">
                {{
                  ((coin?.market_data?.total_volume?.usd / coin?.market_data?.market_cap?.usd) * 100)?.toFixed(2) ||
                  ((coin?.total_volume / coin?.market_cap) * 100)?.toFixed(2) ||
                  '0'
                }}% of Market Cap
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mb-6">
        <v-col cols="12">
          <v-card class="rounded-lg" variant="flat">
            <v-card-title class="text-h6 font-weight-bold pa-4">
              <v-icon left>mdi-chart-line</v-icon>
              Price Performance (7 Days)
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text class="pa-4">
              <div style="height: 400px; width: 100%; position: relative">
                <canvas ref="chartCanvas" id="coinChart" style="width: 100%; height: 100%"></canvas>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row v-show="!loading">
        <v-col cols="12" md="6">
          <v-card class="rounded-lg mb-4" variant="flat">
            <v-card-title class="text-h6 font-weight-bold pa-4">
              <v-icon left>mdi-chart-bar</v-icon>
              Market Stats
            </v-card-title>
            <v-divider></v-divider>
            <v-list density="compact" class="pa-0">
              <v-list-item class="px-4 py-3">
                <v-list-item-title>Market Cap Rank</v-list-item-title>
                <v-list-item-subtitle class="font-weight-bold">
                  #{{ coin?.market_cap_rank || 'N/A' }}
                </v-list-item-subtitle>
              </v-list-item>
              <v-divider></v-divider>
              <v-list-item class="px-4 py-3">
                <v-list-item-title>Circulating Supply</v-list-item-title>
                <v-list-item-subtitle>
                  {{
                    (coin?.market_data?.circulating_supply / 1000000)?.toFixed(2) ||
                    (coin?.circulating_supply / 1000000)?.toFixed(2) ||
                    '0'
                  }}M
                  {{ coin?.symbol?.toUpperCase() || 'N/A' }}
                </v-list-item-subtitle>
                <v-list-item-subtitle class="font-weight-bold">
                  {{
                    ((coin?.market_data?.circulating_supply / coin?.market_data?.total_supply) * 100)?.toFixed(2) ||
                    ((coin?.circulating_supply / coin?.total_supply) * 100)?.toFixed(2) ||
                    '0'
                  }}% of Total
                </v-list-item-subtitle>
              </v-list-item>
              <v-divider></v-divider>
              <v-list-item class="px-4 py-3">
                <v-list-item-title>Total Supply</v-list-item-title>
                <v-list-item-subtitle class="font-weight-bold">
                  {{
                    (coin?.market_data?.total_supply / 1000000)?.toFixed(2) ||
                    (coin?.total_supply / 1000000)?.toFixed(2) ||
                    '∞'
                  }}M
                  {{ coin?.symbol?.toUpperCase() || 'N/A' }}
                </v-list-item-subtitle>
              </v-list-item>
              <v-divider></v-divider>
              <v-list-item class="px-4 py-3">
                <v-list-item-title>All-Time High</v-list-item-title>
                <v-list-item-subtitle>
                  {{ coin?.market_data?.ath_date?.usd ? new Date(coin.market_data.ath_date.usd).toLocaleDateString() : 'N/A' }}
                </v-list-item-subtitle>
                <v-list-item-subtitle class="font-weight-bold">
                  ${{ coin?.market_data?.ath?.usd?.toLocaleString() || 'N/A' }}
                  <div
                    :class="[
                      'text-caption',
                      coin?.market_data?.ath_change_percentage?.usd > 0 ? 'success--text' : 'error--text',
                    ]"
                  >
                    {{
                      coin?.market_data?.ath_change_percentage?.usd > 0 ? '+' : ''
                    }}{{
                      coin?.market_data?.ath_change_percentage?.usd?.toFixed(2) || '0'
                    }}%
                  </div>
                </v-list-item-subtitle>
              </v-list-item>
              <v-divider></v-divider>
              <v-list-item class="px-4 py-3">
                <v-list-item-title>All-Time Low</v-list-item-title>
                <v-list-item-subtitle>
                  {{ coin?.market_data?.atl_date?.usd ? new Date(coin.market_data.atl_date.usd).toLocaleDateString() : 'N/A' }}
                </v-list-item-subtitle>
                <v-list-item-subtitle class="font-weight-bold">
                  ${{ coin?.market_data?.atl?.usd?.toLocaleString() || 'N/A' }}
                  <div
                    :class="[
                      'text-caption',
                      coin?.market_data?.atl_change_percentage?.usd > 0 ? 'success--text' : 'error--text',
                    ]"
                  >
                    {{
                      coin?.market_data?.atl_change_percentage?.usd > 0 ? '+' : ''
                    }}{{
                      coin?.market_data?.atl_change_percentage?.usd?.toFixed(2) || '0'
                    }}%
                  </div>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card class="rounded-lg" variant="flat">
            <v-card-title class="text-h6 font-weight-bold pa-4">
              <v-icon left>mdi-information</v-icon>
              Additional Information
            </v-card-title>
            <v-divider></v-divider>
            <v-list density="compact" class="pa-0">
              <v-list-item class="px-4 py-3">
                <v-list-item-title>24h Trading Volume</v-list-item-title>
                <v-list-item-subtitle class="font-weight-bold">
                  ${{ coin?.market_data?.total_volume?.usd?.toLocaleString() || coin?.total_volume?.toLocaleString() || 'N/A' }}
                </v-list-item-subtitle>
              </v-list-item>
              <v-divider></v-divider>
              <v-list-item class="px-4 py-3">
                <v-list-item-title>Fully Diluted Valuation</v-list-item-title>
                <v-list-item-subtitle class="font-weight-bold">
                  ${{ coin?.market_data?.fully_diluted_valuation?.usd?.toLocaleString() || 'N/A' }}
                </v-list-item-subtitle>
              </v-list-item>
              <v-divider></v-divider>
              <v-list-item class="px-4 py-3">
                <v-list-item-title>Max Supply</v-list-item-title>
                <v-list-item-subtitle class="font-weight-bold">
                  {{
                    coin?.market_data?.max_supply
                      ? (coin.market_data.max_supply / 1000000).toFixed(2) + 'M ' + coin.symbol?.toUpperCase()
                      : '∞'
                  }}
                </v-list-item-subtitle>
              </v-list-item>
              <v-divider></v-divider>
              <v-list-item class="px-4 py-3">
                <v-list-item-title>Official Links</v-list-item-title>
                <v-list-item-subtitle>
                  <v-btn
                    v-if="coin?.links?.homepage?.[0]"
                    :href="coin.links.homepage[0]"
                    target="_blank"
                    icon
                    density="compact"
                    size="small"
                    class="mr-2"
                    color="primary"
                  >
                    <v-icon size="20">mdi-web</v-icon>
                  </v-btn>
                  <v-btn
                    v-if="coin?.links?.blockchain_site?.[0]"
                    :href="coin.links.blockchain_site[0]"
                    target="_blank"
                    icon
                    density="compact"
                    size="small"
                    class="mr-2"
                    color="primary"
                  >
                    <v-icon size="20">mdi-link</v-icon>
                  </v-btn>
                  <v-btn
                    v-if="coin?.links?.repos_url?.github?.[0]"
                    :href="coin.links.repos_url.github[0]"
                    target="_blank"
                    icon
                    density="compact"
                    size="small"
                    class="mr-2"
                    color="primary"
                  >
                    <v-icon size="20">mdi-github</v-icon>
                  </v-btn>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>

<!--      <v-row class="mt-6 mb-4" v-show="!loading && cryptoStore.coins.length > 0">-->
<!--        <v-col cols="12" class="d-flex justify-space-between">-->
<!--          <v-btn-->
<!--            :disabled="currentCoinIndex <= 0"-->
<!--            @click="navigateToCoin('prev')"-->
<!--            color="primary"-->
<!--            variant="outlined"-->
<!--            prepend-icon="mdi-chevron-left"-->
<!--          >-->
<!--            Previous Coin-->
<!--          </v-btn>-->
<!--          <v-btn-->
<!--            :disabled="currentCoinIndex >= cryptoStore.coins.length - 1"-->
<!--            @click="navigateToCoin('next')"-->
<!--            color="primary"-->
<!--            variant="outlined"-->
<!--            append-icon="mdi-chevron-right"-->
<!--          >-->
<!--            Next Coin-->
<!--          </v-btn>-->
<!--        </v-col>-->
<!--      </v-row>-->
    </v-container>
  </v-container>
</template>

<style scoped>
.v-application a {
  text-decoration: none;
}

.v-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.chart-container {
  position: relative;
  margin: auto;
  height: 400px;
  width: 100%;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

@media (max-width: 960px) {
  .v-container {
    padding: 12px;
  }

  .v-card {
    margin-bottom: 16px;
  }
}

@keyframes pulseGreen {
  0% {
    background-color: rgba(76, 175, 80, 0.1);
  }
  50% {
    background-color: rgba(76, 175, 80, 0.3);
  }
  100% {
    background-color: rgba(76, 175, 80, 0.1);
  }
}

@keyframes pulseRed {
  0% {
    background-color: rgba(244, 67, 54, 0.1);
  }
  50% {
    background-color: rgba(244, 67, 54, 0.3);
  }
  100% {
    background-color: rgba(244, 67, 54, 0.1);
  }
}

.price-up {
  animation: pulseGreen 2s ease-in-out;
}

.price-down {
  animation: pulseRed 2s ease-in-out;
}
</style>
