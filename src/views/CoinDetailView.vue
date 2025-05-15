<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const route = useRoute();
const coin = ref(null);
const chartInstance = ref(null);
const loading = ref(true);

const fetchCoinData = async () => {
  loading.value = true;
  try {
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${route.params.id}`);
    coin.value = response.data;
    updateChart();
  } catch (error) {
    console.error('Error fetching coin data:', error);
  }
  loading.value = false;
};

const updateChart = () => {
  if (!coin.value || !coin.value.market_data) return;
  const ctx = document.getElementById('coinChart');
  if (!ctx) return;

  if (chartInstance.value) {
    chartInstance.value.destroy();
  }

  chartInstance.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array.from({ length: 7 }, (_, i) => `Day ${i + 1}`),
      datasets: [
        {
          label: 'Price Trend (7 Days)',
          data: coin.value.market_data.sparkline_7d.price,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          title: { display: true, text: 'Price (USD)' },
        },
      },
    },
  });
};

onMounted(fetchCoinData);
watch(() => route.params.id, fetchCoinData);
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
              <div style="height: 400px; width: 100%;">
                <canvas id="coinChart"></canvas>
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
