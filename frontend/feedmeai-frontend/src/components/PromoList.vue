<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    
    <h1 class="text-3xl font-bold tracking-tight text-gray-900 mb-6">
      Credit Card Food Promos
    </h1>
    
    <p v-if="isLoading" class="text-center text-lg text-gray-500">
      Loading promos from the database...
    </p>
    
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      
      <div v-for="promo in promos" :key="promo._id" class="bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col">
        
        <h2 class="text-xl font-semibold text-gray-800 mb-1">
          {{ promo.title }}
        </h2>
        
        <p class="text-sm text-gray-500 italic mb-4">
          {{ promo.promoPeriod }}
        </p>
        
        <div class="flex-grow">
          <strong class="text-gray-700">Offer:</strong>
          <p class="bg-gray-50 p-3 rounded-md text-sm text-gray-600 mt-2">{{ promo.offer.header }}</p>
        </div>
        
        <a :href="promo.link" target="_blank" rel="noopener noreferrer" class="mt-4 font-bold text-blue-600 hover:text-blue-800 self-start">
          View Original Promo &rarr;
        </a>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const promos = ref([]);
const isLoading = ref(true);

onMounted(async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/promos');
    promos.value = response.data;
  } catch (error) {
    console.error('Failed to fetch promos:', error);
  } finally {
    isLoading.value = false;
  }
});
</script>