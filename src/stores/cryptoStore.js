// src/stores/cryptoStore.js
import { ref } from 'vue';
import axios from 'axios';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export const useCryptoStore = () => {
  const coins = ref([]);
  const currentPage = ref(1);
  const totalPages = ref(10);
  let chartInstance = null;

  const fetchCryptoData = async () => {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 100, // Increase to fetch more coins (for pagination handling)
          page: 1, // Always fetch from the first page
          sparkline: true,
        },
      });
      coins.value = response.data;
      totalPages.value = Math.ceil(coins.value.length / 10); // Update total pages based on fetched data
      updateChart();
    } catch (error) {
      console.error('Error fetching crypto data:', error);
    }
  };

  const updateChart = () => {
    const ctx = document.getElementById('cryptoChart');
    if (!ctx) return;

    if (chartInstance) {
      chartInstance.destroy(); // Destroy the previous chart instance
    }

    // Get the coins for the current page (pagination logic)
    const currentCoins = coins.value.slice((currentPage.value - 1) * 10, currentPage.value * 10);

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: currentCoins.map(coin => coin.name),
        datasets: [
          {
            label: 'Price (7d Trend)',
            data: currentCoins.map(coin => coin.sparkline_in_7d.price.slice(-1)[0]),
            borderColor: 'rgba(75, 192, 192, 1)',
            fill: false,
          },
        ],
      },
    });
  };

  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value++;
      updateChart(); // Update chart for new page
    }
  };

  const prevPage = () => {
    if (currentPage.value > 1) {
      currentPage.value--;
      updateChart(); // Update chart for new page
    }
  };

  return {
    coins,
    currentPage,
    totalPages,
    fetchCryptoData,
    nextPage,
    prevPage,
  };
};
