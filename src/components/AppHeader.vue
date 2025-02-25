<template>
  <div class="app-header">
    <v-container max-width="1200px" fluid class="app-header-container">
      <div class="app-title">
        <RouterLink style="text-decoration: none; color: inherit;" to="/">
          <Logo />
        </RouterLink>
      </div>

    </v-container>
  </div>
</template>
<script setup lang="ts">
import Logo from "@/components/Logo.vue";
</script>


<style lang="scss" scoped>
.app-header-container {
  display: block;

}
@media (min-width: 768px) {
  .app-header-container {
    display: flex;
    position: relative;
    justify-content: space-between;
  }
}
.app-title {
  position: relative;
  margin: 0 auto;
  width: fit-content;
  text-align: center;
  padding: 0 0 1rem;
}


.right-div {
  display: flex;
  margin-left: auto;
}

.v-list-item {
  display: flex;
  align-items: center;
}

.logo {
  font-size: 2.25rem;
  .sup {
    position: relative;
    top: -0.35em;
    margin: 0 -0.05em 0 0;
    color: rgba(var(--v-theme-primary), 1);
    font-size: 0.75em;
  }
}

.search-bar {
  width: 300px;
  margin-right: 1rem;
}

.hover-card {
  display: flex;
  padding: 1rem;
  gap: 5px;
  border-radius: 0;
}

.search-auto-item {

  align-self: initial;
  text-align: left;
}

</style>
