<template>
  <v-app>
    <AppHeader />
    <v-main>
      <RouterView />
    </v-main>

    <v-footer class="bg-grey-darken-4">
      <v-container max-width="1200px" fluid>
        <div>
          &copy; {{ new Date().getFullYear() }}
          <a href="https://www.caseytrombley.com" target="_blank" rel="noopener noreferrer">
            caseytrombley
          </a>
        </div>
      </v-container>
    </v-footer>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useTheme } from 'vuetify';
import AppHeader from "@/components/AppHeader.vue";

const theme = useTheme();

// Handle system theme detection
onMounted(() => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  
  // Set initial theme
  theme.global.name.value = prefersDark.matches ? 'dark' : 'light';
  
  // Listen for changes
  prefersDark.addEventListener('change', (e) => {
    theme.global.name.value = e.matches ? 'dark' : 'light';
  });
});
</script>
