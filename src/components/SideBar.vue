<!-- components/SideBar.vue -->
<script setup lang="ts">
import { useRouter } from 'vue-router'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'openRated'): void
  (e: 'openActiveUsers'): void
  (e: 'openSearch'): void
}>()

const router = useRouter()

// Переход на главную + закрытие сайдбара
const goToSearch = () => {
  router.push('/')
  emit('openSearch')  // Опционально: можно использовать в родителе
  emit('toggle')      // <-- ЗАКРЫВАЕМ САЙДБАР
}
</script>

<template>
  <!-- КНОПКА ВСЕГДА ВИДИМА -->
  <button class="sidebar-toggle" @click="emit('toggle')">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  </button>

  <!-- ПАНЕЛЬ, КОТОРАЯ ВЫЕЗЖАЕТ -->
  <div class="sidebar-panel" :class="{ 'open': isOpen }">
    <!-- SEARCH — ЗАКРЫВАЕТ САЙДБАР -->
    <button class="sidebar-item" @click="goToSearch">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      Search
    </button>

    <button class="sidebar-item" @click="$emit('openRated')">
      My Rated Anime
    </button>

    <button class="sidebar-item" @click="$emit('openActiveUsers')">
      Active Users
    </button>
  </div>

  <!-- Оверлей -->
  <div v-if="isOpen" class="sidebar-overlay" @click="emit('toggle')"></div>
</template>

<style scoped>
/* Кнопка — фиксированная, всегда видима */
.sidebar-toggle {
  position: fixed;
  top: 20px;
  left: 20px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 10px var(--shadow);
  z-index: 1001;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
  color: var(--text-primary);
}

.sidebar-toggle:hover {
  background: var(--bg-card);
  transform: scale(1.1);
  box-shadow: 0 4px 16px var(--shadow);
}

/* Панель — выезжает */
.sidebar-panel {
  position: fixed;
  top: 0;
  left: 0;
  width: 240px;
  height: 100vh;
  background: var(--bg-secondary);
  backdrop-filter: blur(12px);
  padding-top: 80px;
  box-shadow: 2px 0 15px var(--shadow);
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  z-index: 1000;
}

.sidebar-panel.open {
  transform: translateX(0);
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 16px 24px;
  background: none;
  border: none;
  text-align: left;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: background 0.2s;
}

.sidebar-item:hover {
  background: var(--bg-card);
}

.sidebar-item .icon {
  opacity: 0.7;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--overlay);
  z-index: 999;
  backdrop-filter: blur(3px);
}
</style>