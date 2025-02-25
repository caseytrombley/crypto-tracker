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

import AppHeader from "@/components/AppHeader.vue";


</script>
