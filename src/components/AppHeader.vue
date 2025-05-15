<template>
  <div
    class="app-header"
    :class="theme.name.value === 'dark' ? 'bg-surface-variant' : 'bg-surface-light'"
  >
    <v-container max-width="1200px" fluid class="app-header-container">
      <div class="app-title">
        <RouterLink style="text-decoration: none; color: inherit" to="/">
          <Logo />
        </RouterLink>
      </div>
      <!--        <div class="app-header-controls right-div">-->

      <!--          &lt;!&ndash; Theme switcher &ndash;&gt;-->
      <!--          <v-menu offset-y max-width="300px">-->
      <!--            <template #activator="{ props }">-->
      <!--              <v-btn icon v-bind="props" elevation="0" variant="plain">-->
      <!--                <v-icon :icon="currentThemeIcon"></v-icon>-->
      <!--                <v-tooltip activator="parent" location="end">-->
      <!--                  <template #default>-->
      <!--                    <span>{{ themeLabels[currentTheme] }}</span>-->
      <!--                  </template>-->
      <!--                </v-tooltip>-->
      <!--              </v-btn>-->
      <!--            </template>-->
      <!--            <v-list>-->
      <!--              <v-list-item-->
      <!--                v-for="theme in themes"-->
      <!--                :key="theme"-->
      <!--                @click="setTheme(theme)"-->
      <!--                :class="[{ 'v-list-item&#45;&#45;active': currentTheme === theme }, 'd-flex']"-->
      <!--              >-->
      <!--                <v-list-item-title>-->
      <!--                  <v-icon :icon="themeIcons[theme]" class="me-3"></v-icon>-->
      <!--                  {{ themeLabels[theme] }}-->
      <!--                </v-list-item-title>-->
      <!--              </v-list-item>-->
      <!--            </v-list>-->
      <!--          </v-menu>-->
      <!--        </div>-->
    </v-container>
  </div>
</template>
<script setup lang="ts">
import { useTheme } from 'vuetify'
import Logo from '@/components/Logo.vue'

const theme = useTheme()
</script>

<style lang="scss" scoped>
.app-header {
  padding: 0.5rem 0 1rem;
  margin: 0 0 1rem;
}

.bg-surface-variant {
  background-color: var(--vt-c-divider-light-2) !important;
}

.bg-surface-light {
  background-color: var(--vt-c-white) !important;
}

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
  //padding: 0 0 1rem;
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
