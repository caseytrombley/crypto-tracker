// src/stores/cryptoStore.ts
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import api from '@/utils/api';

export const useCryptoStore = defineStore('crypto', () => {
  const CACHE_TIME = 10 * 60 * 1000;
  const COIN_CHART_CACHE_TIME = 10 * 60 * 1000;

  const coins = ref<any[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const currentPage = ref(1);
  const perPage = ref(10);
  const totalPages = computed(() => Math.ceil(coins.value.length / perPage.value));

  const coinListCache = ref<Map<string, { data: any[]; timestamp: number }>>(new Map());
  const coinChartCache = ref<Map<string, { data: any[]; timestamp: number }>>(new Map());

  const setCurrentPage = (newPage: number) => {
    currentPage.value = Math.max(1, Math.min(newPage, totalPages.value));
  };

  const fetchCryptoData = async () => {
    const cacheKey = 'coins-all';
    const now = Date.now();

    const cached = coinListCache.value.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TIME) {
      console.log('Cache hit for', cacheKey, 'Data length:', cached.data.length);
      coins.value = cached.data;
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      console.log('Fetching all coins');
      const response = await api.get('/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 250,
          page: 1,
          sparkline: true,
        },
      });

      const responseData = Array.isArray(response.data)
        ? response.data.map((coin: any) => ({
          ...coin,
          image: coin.image ? { large: coin.image } : { large: 'https://via.placeholder.com/80' },
        }))
        : [];

      coins.value = responseData;

      if (!coins.value.length) {
        error.value = 'No coins returned from API';
      }

      coinListCache.value.set(cacheKey, { data: coins.value, timestamp: now });

      if (coinListCache.value.size > 10) {
        const firstKey = coinListCache.value.keys().next().value;
        if (firstKey !== undefined) {
          coinListCache.value.delete(firstKey);
        }
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch crypto data';
      coins.value = [];
      console.error('Fetch error:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
    } finally {
      loading.value = false;
    }
  };

  const fetchCoinChartData = async (id: string) => {
    const now = Date.now();

    const cached = coinChartCache.value.get(id);
    if (cached && now - cached.timestamp < COIN_CHART_CACHE_TIME) {
      return cached.data;
    }

    try {
      const response = await api.get(`/coins/${id}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: 7,
          interval: 'hourly',
        },
      });

      const chartData = response.data?.prices || [];
      coinChartCache.value.set(id, { data: chartData, timestamp: now });

      return chartData;
    } catch (err: any) {
      console.error(`Chart data fetch failed for ${id}:`, err.message);
      return [];
    }
  };

  const getCoinById = (id: string) => coins.value.find((coin) => coin.id === id);

  return {
    coins,
    loading,
    error,
    currentPage,
    perPage,
    totalPages,
    fetchCryptoData,
    fetchCoinChartData,
    setCurrentPage,
    getCoinById,
  };
});
