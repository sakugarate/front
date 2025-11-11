<!-- src/views/Home.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useAnimeSearch } from '../composables/useAnimeSearch'
import SearchBox from '../components/SearchBox.vue'
import SuggestionsList from '../components/SuggestionsList.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const selectedAnimeId = ref<number | null>(null)

const {
  searchQuery,
  suggestions,
  animeItems,
  isLoading,
  showSuggestions,
  handleSearch,
  hideSuggestions,
  showSuggestionsList,
} = useAnimeSearch()

const handleKeyPress = (event: KeyboardEvent): void => {
  if (event.key === 'Enter') {
    hideSuggestions()
    handleSearch()
  } else if (event.key === 'Escape') {
    hideSuggestions()
  }
}

const handleInputFocus = (): void => {
  showSuggestionsList()
}

const handleInputBlur = (): void => {
  setTimeout(() => hideSuggestions(), 200)
}

const handleAnimeSelect = (animeId: number): void => {
  selectedAnimeId.value = animeId
  hideSuggestions()

  router.push(`/anime/${animeId}`)
}

</script>

<template>
  <div class="homepage">
    <div class="search-container">
      <h1 class="title">sakurate</h1>
      <div class="search-wrapper">
        <SearchBox
          v-model="searchQuery"
          :is-loading="isLoading"
          @search="handleSearch"
          @keydown="handleKeyPress"
          @focus="handleInputFocus"
          @blur="handleInputBlur"
        />
        <SuggestionsList
          :suggestions="suggestions"
          :anime-items="animeItems"
          :show="showSuggestions"
          @select="handleAnimeSelect"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>

.homepage {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--bg-primary);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
}

.title {
  color: var(--text-primary);
}
.search-wrapper {
  position: relative;
  /* другие стили, если есть */
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* ... остальной CSS */
</style>