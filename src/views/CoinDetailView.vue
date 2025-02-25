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
  <v-container fluid class="py-6">
    <v-skeleton-loader v-if="loading" type="card, article, image" class="mx-auto" max-width="800"></v-skeleton-loader>

    <v-card v-else class="mx-auto" max-width="800" elevation="4">
      <v-card-title class="text-h5 font-weight-bold text-center">
        {{ coin.name }} ({{ coin.symbol.toUpperCase() }})
      </v-card-title>

      <v-card-subtitle class="text-center">Market Rank: #{{ coin.market_cap_rank }}</v-card-subtitle>

      <v-container class="d-flex justify-center">
        <v-img :src="coin.image.large" :alt="coin.name" width="100" height="100"></v-img>
      </v-container>

      <v-card-text>
        <v-row>
          <v-col cols="6">
            <v-card color="primary" class="pa-4 text-center white--text">
              <div class="text-h6 font-weight-bold">Current Price</div>
              <div class="text-h5">${{ coin.market_data.current_price.usd.toLocaleString() }}</div>
            </v-card>
          </v-col>
          <v-col cols="6">
            <v-card color="secondary" class="pa-4 text-center white--text">
              <div class="text-h6 font-weight-bold">24h Change</div>
              <div :class="coin.market_data.price_change_percentage_24h > 0 ? 'text-green' : 'text-red'">
                {{ coin.market_data.price_change_percentage_24h.toFixed(2) }}%
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-title class="text-h6 font-weight-bold">Price Trend (Last 7 Days)</v-card-title>
      <v-card-text>
        <canvas id="coinChart" class="mb-6" style="height: 300px;"></canvas>
      </v-card-text>

      <v-card-title class="text-h6 font-weight-bold">Market Stats</v-card-title>
      <v-list dense>
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>All-Time High</v-list-item-title>
            <v-list-item-subtitle>
              ${{ coin.market_data.ath.usd.toLocaleString() }} ({{ new Date(coin.market_data.ath_date.usd).toLocaleDateString() }})
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>All-Time Low</v-list-item-title>
            <v-list-item-subtitle>
              ${{ coin.market_data.atl.usd.toLocaleString() }} ({{ new Date(coin.market_data.atl_date.usd).toLocaleDateString() }})
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>Total Supply</v-list-item-title>
            <v-list-item-subtitle>
              {{ coin.market_data.total_supply?.toLocaleString() ?? 'N/A' }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>Circulating Supply</v-list-item-title>
            <v-list-item-subtitle>
              {{ coin.market_data.circulating_supply?.toLocaleString() }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>

<style scoped>
.text-green {
  color: #4caf50;
}
.text-red {
  color: #e53935;
}
</style>
