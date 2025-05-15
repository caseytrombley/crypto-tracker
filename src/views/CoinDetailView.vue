<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const route = useRoute();
const router = useRouter();
const coin = ref(null);
const chartInstance = ref(null);
const loading = ref(true);
const coinList = ref([]);
const currentCoinIndex = ref(-1);

// Cache for API responses
const coinCache = ref(new Map());
const coinListCache = ref(null);
const lastCoinListFetch = ref(0);
const lastCoinFetch = ref({});

// Rate limiting constants
const COIN_LIST_CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const COIN_CACHE_TIME = 1 * 60 * 1000; // 1 minute
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

const fetchCoinList = async () => {
  const now = Date.now();
  
  // Return cached data if it's still fresh
  if (coinListCache.value && (now - lastCoinListFetch.value < COIN_LIST_CACHE_TIME)) {
    coinList.value = coinListCache.value;
    updateCurrentCoinIndex();
    return;
  }

  try {
    console.log('Fetching fresh coin list...');
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 100,
        page: 1,
        sparkline: false
      }
    });
    
    // Update cache
    coinListCache.value = response.data;
    lastCoinListFetch.value = now;
    coinList.value = response.data;
    updateCurrentCoinIndex();
  } catch (error) {
    console.error('Error fetching coin list:', error);
    // If we have cached data, use it even if it's stale
    if (coinListCache.value) {
      coinList.value = coinListCache.value;
      updateCurrentCoinIndex();
    }
  }
};

const updateCurrentCoinIndex = () => {
  if (!coin.value || !coinList.value.length) return;
  currentCoinIndex.value = coinList.value.findIndex(c => c.id === coin.value.id);
};

const navigateToCoin = (direction) => {
  if (!coinList.value.length || currentCoinIndex.value === -1) return;
  
  let newIndex;
  if (direction === 'prev') {
    newIndex = Math.max(0, currentCoinIndex.value - 1);
  } else {
    newIndex = Math.min(coinList.value.length - 1, currentCoinIndex.value + 1);
  }
  
  if (newIndex !== currentCoinIndex.value) {
    const nextCoin = coinList.value[newIndex];
    router.push({ name: 'CoinDetail', params: { id: nextCoin.id } });
  }
};

const fetchCoinData = async () => {
  const coinId = route.params.id;
  const now = Date.now();
  
  // Check if we have this coin in cache and it's still fresh
  if (coinCache.value.has(coinId)) {
    const cached = coinCache.value.get(coinId);
    if (now - cached.timestamp < COIN_CACHE_TIME) {
      console.log('Using cached data for coin:', coinId);
      coin.value = cached.data;
      updateChart();
      return;
    }
  }

  // Rate limiting: Don't make requests too frequently
  if (lastCoinFetch.value[coinId] && (now - lastCoinFetch.value[coinId] < MIN_REQUEST_INTERVAL)) {
    console.log('Rate limiting: Too soon to fetch data for', coinId);
    return;
  }

  loading.value = true;
  lastCoinFetch.value[coinId] = now;
  
  try {
    console.log('Fetching data for coin ID:', coinId);
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}`, {
      params: {
        localization: false,
        tickers: false,
        market_data: true,
        community_data: false,
        developer_data: false,
        sparkline: true
      }
    });
    
    console.log('API Response for', coinId, ':', response.data);
    
    // Update cache
    coinCache.value.set(coinId, {
      data: response.data,
      timestamp: now
    });
    
    // Keep cache size reasonable
    if (coinCache.value.size > 50) {
      // Remove the oldest entry
      const firstKey = coinCache.value.keys().next().value;
      coinCache.value.delete(firstKey);
    }
    
    coin.value = response.data;
    
    // Only fetch coin list if we don't have it yet or it's very old
    if (!coinListCache.value || (now - lastCoinListFetch.value > COIN_LIST_CACHE_TIME)) {
      await fetchCoinList();
    } else {
      updateCurrentCoinIndex();
    }
    
    // Small delay to ensure DOM is ready
    setTimeout(updateChart, 100);
  } catch (error) {
    console.error('Error fetching coin data for', coinId, ':', error);
    
    // If we have cached data, use it even if it's stale
    if (coinCache.value.has(coinId)) {
      console.log('Using stale cache due to error');
      coin.value = coinCache.value.get(coinId).data;
      updateChart();
    }
  } finally {
    loading.value = false;
  }
};

const updateChart = () => {
  console.log('updateChart called'); // Debug log
  // Use nextTick to ensure the DOM is updated
  nextTick(() => {
    console.log('Next tick - checking data'); // Debug log
    if (!coin.value?.market_data?.sparkline_7d?.price) {
      console.error('No price data available in sparkline_7d.price');
      console.log('Available market_data keys:', Object.keys(coin.value?.market_data || {}));
      return;
    }
    
    console.log('Price data found:', coin.value.market_data.sparkline_7d.price); // Debug log
    const ctx = document.getElementById('coinChart');
    console.log('Canvas element:', ctx); // Debug log
    if (!ctx) {
      console.error('Canvas element with id "coinChart" not found');
      return;
    }
    if (!(ctx instanceof HTMLCanvasElement)) {
      console.error('Element with id "coinChart" is not a canvas element');
      return;
    }

    // Destroy previous chart instance if it exists
    if (chartInstance.value) {
      chartInstance.value.destroy();
    }

    const prices = coin.value.market_data.sparkline_7d.price;
    const dates = [];
    const now = new Date();
    
    // Generate date labels for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }

    // Create gradient for the chart
    const ctx2d = ctx.getContext('2d');
    let gradient = null;
    if (ctx2d) {
      gradient = ctx2d.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0.05)');
    }

    console.log('Creating new chart instance with data:', prices); // Debug log
    
    try {
      // Create new chart instance
      chartInstance.value = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Price (USD)',
          data: prices,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: gradient || 'rgba(99, 102, 241, 0.2)',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 6,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            titleFont: { size: 14, weight: '500' },
            bodyFont: { size: 14 },
            padding: 12,
            displayColors: false,
            callbacks: {
              label: (context) => `$${context.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              color: '#9CA3AF',
              font: {
                size: 12
              }
            }
          },
          y: {
            grid: {
              color: 'rgba(156, 163, 175, 0.1)',
              drawBorder: false
            },
            ticks: {
              color: '#9CA3AF',
              font: {
                size: 12
              },
              callback: (value) => `$${value}`
            }
          }
        }
      }
    });
    console.log('Chart instance created:', chartInstance.value); // Debug log
  } catch (error) {
    console.error('Error creating chart:', error);
  }
  });
};

onMounted(() => {
  fetchCoinData();
});

// Use a debounced watch to prevent rapid fetches
let fetchTimeout = null;
watch(() => route.params.id, (newId, oldId) => {
  if (newId !== oldId) {
    if (fetchTimeout) clearTimeout(fetchTimeout);
    fetchTimeout = setTimeout(() => {
      fetchCoinData();
    }, 300); // Small delay to handle rapid navigation
  }
});
</script>

<template>
  <v-container fluid class="py-6 px-4">
    <v-skeleton-loader
      v-if="loading"
      type="card, article, image"
      class="mx-auto rounded-lg"
      max-width="1200"
    ></v-skeleton-loader>

    <v-container v-else class="pa-0" fluid>
      <!-- Header Section -->
      <v-card class="mb-6 rounded-lg" elevation="2">
        <v-card-text class="pa-6">
          <v-row align="center" justify="center" class="text-center">
            <v-col cols="12" md="auto" class="d-flex justify-center">
              <v-avatar size="80" class="mr-4">
                <v-img :src="coin.image.large" :alt="coin.name" contain></v-img>
              </v-avatar>
              <div class="text-left">
                <h1 class="text-h4 font-weight-bold">{{ coin.name }} <span class="text-h6 grey--text">({{ coin.symbol.toUpperCase() }})</span></h1>
                <v-chip color="primary" small class="mt-1">
                  Rank #{{ coin.market_cap_rank }}
                </v-chip>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Price Cards -->
      <v-row class="mb-6">
        <v-col cols="12" md="6" lg="3">
          <v-card class="h-100 rounded-lg" elevation="2">
            <v-card-text class="text-center pa-4">
              <div class="text-subtitle-1 grey--text">Current Price</div>
              <div class="text-h4 font-weight-bold primary--text mt-2">
                ${{ coin.market_data.current_price.usd.toLocaleString() }}
              </div>
              <div class="text-caption grey--text mt-1">
                {{ coin.market_data.current_price.btc?.toFixed(8) }} BTC
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6" lg="3">
          <v-card class="h-100 rounded-lg" elevation="2">
            <v-card-text class="text-center pa-4">
              <div class="text-subtitle-1 grey--text">24h Change</div>
              <div 
                :class="[
                  'text-h4', 'font-weight-bold', 'mt-2',
                  coin.market_data.price_change_percentage_24h > 0 ? 'success--text' : 'error--text'
                ]"
              >
                {{ coin.market_data.price_change_percentage_24h > 0 ? '+' : '' }}{{ coin.market_data.price_change_percentage_24h.toFixed(2) }}%
                <v-icon :color="coin.market_data.price_change_percentage_24h > 0 ? 'success' : 'error'">
                  {{ coin.market_data.price_change_percentage_24h > 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
                </v-icon>
              </div>
              <div class="text-caption grey--text mt-1">
                24h High: ${{ coin.market_data.high_24h?.usd?.toLocaleString() || 'N/A' }}
              </div>
              <div class="text-caption grey--text">
                24h Low: ${{ coin.market_data.low_24h?.usd?.toLocaleString() || 'N/A' }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6" lg="3">
          <v-card class="h-100 rounded-lg" elevation="2">
            <v-card-text class="text-center pa-4">
              <div class="text-subtitle-1 grey--text">Market Cap</div>
              <div class="text-h5 font-weight-bold mt-2">
                ${{ coin.market_data.market_cap?.usd?.toLocaleString() || 'N/A' }}
              </div>
              <div class="text-caption grey--text mt-1">
                {{ coin.market_data.market_cap_change_percentage_24h?.toFixed(2) || 0 }}% (24h)
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6" lg="3">
          <v-card class="h-100 rounded-lg" elevation="2">
            <v-card-text class="text-center pa-4">
              <div class="text-subtitle-1 grey--text">Volume (24h)</div>
              <div class="text-h5 font-weight-bold mt-2">
                ${{ coin.market_data.total_volume?.usd?.toLocaleString() || 'N/A' }}
              </div>
              <div class="text-caption grey--text mt-1">
                {{ ((coin.market_data.total_volume?.usd / coin.market_data.market_cap?.usd) * 100).toFixed(2) || 0 }}% of Market Cap
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Chart Section -->
      <v-row class="mb-6">
        <v-col cols="12">
          <v-card class="rounded-lg" elevation="2">
            <v-card-title class="text-h6 font-weight-bold pa-4">
              <v-icon left>mdi-chart-line</v-icon>
              Price Performance (7 Days)
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text class="pa-4">
              <div style="height: 400px; width: 100%; position: relative;">
                <canvas id="coinChart" style="width: 100%; height: 100%;"></canvas>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Stats Section -->
      <v-row>
        <v-col cols="12" md="6">
          <v-card class="rounded-lg mb-4" elevation="2">
            <v-card-title class="text-h6 font-weight-bold pa-4">
              <v-icon left>mdi-chart-bar</v-icon>
              Market Stats
            </v-card-title>
            <v-divider></v-divider>
            <v-list dense class="pa-0">
              <v-list-item class="px-4 py-3">
                <v-list-item-content>
                  <v-list-item-title>Market Cap Rank</v-list-item-title>
                </v-list-item-content>
                <v-list-item-action-text class="font-weight-bold">
                  #{{ coin.market_cap_rank }}
                </v-list-item-action-text>
              </v-list-item>
              
              <v-divider></v-divider>
              
              <v-list-item class="px-4 py-3">
                <v-list-item-content>
                  <v-list-item-title>Circulating Supply</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ (coin.market_data.circulating_supply / 1000000).toFixed(2) }}M {{ coin.symbol.toUpperCase() }}
                  </v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action-text class="font-weight-bold">
                  {{ ((coin.market_data.circulating_supply / coin.market_data.total_supply) * 100).toFixed(2) || 0 }}% of Total
                </v-list-item-action-text>
              </v-list-item>

              <v-divider></v-divider>

              <v-list-item class="px-4 py-3">
                <v-list-item-content>
                  <v-list-item-title>Total Supply</v-list-item-title>
                </v-list-item-content>
                <v-list-item-action-text class="font-weight-bold">
                  {{ (coin.market_data.total_supply / 1000000).toFixed(2) || '∞' }}M {{ coin.symbol.toUpperCase() }}
                </v-list-item-action-text>
              </v-list-item>

              <v-divider></v-divider>

              <v-list-item class="px-4 py-3">
                <v-list-item-content>
                  <v-list-item-title>All-Time High</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ new Date(coin.market_data.ath_date.usd).toLocaleDateString() }}
                  </v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action-text class="font-weight-bold">
                  ${{ coin.market_data.ath.usd.toLocaleString() }}
                  <div :class="['text-caption', coin.market_data.ath_change_percentage.usd > 0 ? 'success--text' : 'error--text']">
                    {{ coin.market_data.ath_change_percentage.usd > 0 ? '+' : '' }}{{ coin.market_data.ath_change_percentage.usd.toFixed(2) }}%
                  </div>
                </v-list-item-action-text>
              </v-list-item>

              <v-divider></v-divider>

              <v-list-item class="px-4 py-3">
                <v-list-item-content>
                  <v-list-item-title>All-Time Low</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ new Date(coin.market_data.atl_date.usd).toLocaleDateString() }}
                  </v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action-text class="font-weight-bold">
                  ${{ coin.market_data.atl.usd.toLocaleString() }}
                  <div :class="['text-caption', coin.market_data.atl_change_percentage.usd > 0 ? 'success--text' : 'error--text']">
                    {{ coin.market_data.atl_change_percentage.usd > 0 ? '+' : '' }}{{ coin.market_data.atl_change_percentage.usd.toFixed(2) }}%
                  </div>
                </v-list-item-action-text>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card class="rounded-lg" elevation="2">
            <v-card-title class="text-h6 font-weight-bold pa-4">
              <v-icon left>mdi-information</v-icon>
              Additional Information
            </v-card-title>
            <v-divider></v-divider>
            <v-list dense class="pa-0">
              <v-list-item class="px-4 py-3">
                <v-list-item-content>
                  <v-list-item-title>24h Trading Volume</v-list-item-title>
                </v-list-item-content>
                <v-list-item-action-text class="font-weight-bold">
                  ${{ coin.market_data.total_volume?.usd?.toLocaleString() || 'N/A' }}
                </v-list-item-action-text>
              </v-list-item>

              <v-divider></v-divider>

              <v-list-item class="px-4 py-3">
                <v-list-item-content>
                  <v-list-item-title>Fully Diluted Valuation</v-list-item-title>
                </v-list-item-content>
                <v-list-item-action-text class="font-weight-bold">
                  ${{ coin.market_data.fully_diluted_valuation?.usd?.toLocaleString() || 'N/A' }}
                </v-list-item-action-text>
              </v-list-item>

              <v-divider></v-divider>

              <v-list-item class="px-4 py-3">
                <v-list-item-content>
                  <v-list-item-title>Max Supply</v-list-item-title>
                </v-list-item-content>
                <v-list-item-action-text class="font-weight-bold">
                  {{ coin.market_data.max_supply ? (coin.market_data.max_supply / 1000000).toFixed(2) + 'M ' + coin.symbol.toUpperCase() : '∞' }}
                </v-list-item-action-text>
              </v-list-item>


              <v-divider></v-divider>

              <v-list-item class="px-4 py-3">
                <v-list-item-content>
                  <v-list-item-title>Official Links</v-list-item-title>
                </v-list-item-content>
                <v-list-item-action>
                  <v-btn
                    v-if="coin.links?.homepage?.[0]"
                    :href="coin.links.homepage[0]"
                    target="_blank"
                    icon
                    small
                    class="mr-2"
                    color="primary"
                  >
                    <v-icon>mdi-web</v-icon>
                  </v-btn>
                  <v-btn
                    v-if="coin.links?.blockchain_site?.[0]"
                    :href="coin.links.blockchain_site[0]"
                    target="_blank"
                    icon
                    small
                    class="mr-2"
                    color="primary"
                  >
                    <v-icon>mdi-link</v-icon>
                  </v-btn>
                  <v-btn
                    v-if="coin.links?.repos_url?.github?.[0]"
                    :href="coin.links.repos_url.github[0]"
                    target="_blank"
                    icon
                    small
                    class="mr-2"
                    color="primary"
                  >
                    <v-icon>mdi-github</v-icon>
                  </v-btn>
                </v-list-item-action>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>

      <!-- Navigation Buttons -->
      <v-row class="mt-6 mb-4" v-if="coinList.length > 0">
        <v-col cols="12" class="d-flex justify-space-between">
          <v-btn 
            :disabled="currentCoinIndex <= 0"
            @click="navigateToCoin('prev')"
            color="primary"
            variant="outlined"
            prepend-icon="mdi-chevron-left"
          >
            Previous Coin
          </v-btn>
          <v-btn 
            :disabled="currentCoinIndex >= coinList.length - 1"
            @click="navigateToCoin('next')"
            color="primary"
            variant="outlined"
            append-icon="mdi-chevron-right"
          >
            Next Coin
          </v-btn>
        </v-col>
      </v-row>
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

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1) !important;
}

.chart-container {
  position: relative;
  margin: auto;
  height: 400px;
  width: 100%;
}

/* Custom scrollbar */
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

/* Responsive adjustments */
@media (max-width: 960px) {
  .v-container {
    padding: 12px;
  }
  
  .v-card {
    margin-bottom: 16px;
  }
}

/* Animation for price changes */
@keyframes pulseGreen {
  0% { background-color: rgba(76, 175, 80, 0.1); }
  50% { background-color: rgba(76, 175, 80, 0.3); }
  100% { background-color: rgba(76, 175, 80, 0.1); }
}

@keyframes pulseRed {
  0% { background-color: rgba(244, 67, 54, 0.1); }
  50% { background-color: rgba(244, 67, 54, 0.3); }
  100% { background-color: rgba(244, 67, 54, 0.1); }
}

.price-up {
  animation: pulseGreen 2s ease-in-out;
}

.price-down {
  animation: pulseRed 2s ease-in-out;
}
</style>
