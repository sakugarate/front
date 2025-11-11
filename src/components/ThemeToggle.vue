<script setup lang="ts">
import { useTheme } from '../composables/useTheme'

const { theme, toggleTheme, isDark } = useTheme()
</script>

<template>
  <button @click="toggleTheme" class="theme-toggle" :title="theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'">
    <svg v-if="theme === 'light'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
    <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
  </button>
</template>

<style>
.theme-toggle {
  position: fixed !important;
  top: 80px !important;
  right: 80px !important;
  background: var(--bg-secondary) !important;
  border: 2px solid var(--border-color) !important;
  border-radius: 50% !important;
  width: 44px !important;
  height: 44px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  z-index: 1002 !important;
  backdrop-filter: blur(10px) !important;
  color: var(--text-primary) !important;
  box-shadow: 0 2px 8px var(--shadow) !important;
  padding: 0 !important;
  margin: 0 !important;
}

.theme-toggle:hover {
  background: var(--bg-card) !important;
  transform: scale(1.1) !important;
  box-shadow: 0 4px 12px var(--shadow) !important;
}

.theme-toggle svg {
  width: 20px !important;
  height: 20px !important;
  display: block !important;
}
</style>
