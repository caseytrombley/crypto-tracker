import { ref, watch, nextTick } from 'vue';
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
          per_page: 100, // Fetch all pages upfront for smooth pagination
          page: 1,
          sparkline: true,
        },
      });

      coins.value = response.data;
      totalPages.value = Math.ceil(coins.value.length / 10); // Update total pages

      updateChart();
    } catch (error) {
      console.error('Error fetching crypto data:', error);
    }
  };

  const updateChart = () => {
    const ctx = document.getElementById('cryptoChart');
    if (!ctx) return;

    if (chartInstance) {
      chartInstance.destroy();
    }

    const currentCoins = coins.value.slice((currentPage.value - 1) * 10, currentPage.value * 10);

    chartInstance = new Chart(ctx, {
      type: 'bar', // Base chart type
      data: {
        labels: currentCoins.map(coin => coin.name),
        datasets: [
          {
            type: 'bar', // Market cap as bars
            label: 'Market Cap (USD)',
            data: currentCoins.map(coin => coin.market_cap),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            yAxisID: 'y1',
          },
          {
            type: 'line', // Price trend as a line
            label: 'Price (7d Trend)',
            data: currentCoins.map(coin => coin.sparkline_in_7d.price.slice(-1)[0]),
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: false,
            yAxisID: 'y',
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: 'Price (USD)' },
            ticks: {
              callback: (value) => `$${value.toLocaleString()}`,
            },
            suggestedMin: 0,
            suggestedMax: Math.max(...coins.value.map(c => c.current_price)) * 1.2,
          },
          y1: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: 'Market Cap (USD)' },
            ticks: {
              callback: (value) => {
                if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
                if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
                return `$${value.toLocaleString()}`;
              },
            },
            suggestedMin: 0,
            suggestedMax: Math.max(...coins.value.map(c => c.market_cap)) * 1.2,
            grid: { drawOnChartArea: false }, // Avoid overlapping with price axis
          },
        },
      },
    });

  };


  // Watch for page changes and update the chart
  watch(currentPage, () => {
    updateChart();
  });

  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value++;
    }
  };

  const prevPage = () => {
    if (currentPage.value > 1) {
      currentPage.value--;
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
