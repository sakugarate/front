<script setup lang="ts">
interface Props {
  suggestions: string[]
  animeItems: Array<{ mal_id: number; title_english?: string; title?: string; [key: string]: any }>
  show?: boolean
}

interface Emits {
  (e: 'select', animeId: number): void
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
})

const emit = defineEmits<Emits>()

const selectSuggestion = (index: number): void => {

  if (index >= 0 && index < props.animeItems.length) {
    const anime = props.animeItems[index]
    if (anime && anime.mal_id) {
      emit('select', anime.mal_id)
    } else {
      console.warn('Anime item at index', index, 'does not have a mal_id:', anime)
    }
  } else {
    console.warn('Index out of bounds:', index, 'animeItems length:', props.animeItems.length)
  }
}
</script>

<template>
  <div v-if="show && suggestions.length > 0 && animeItems.length > 0 && suggestions.length === animeItems.length" class="suggestions-list">
    <div
      v-for="(suggestion, index) in suggestions"
      :key="index"
      @mousedown.prevent="selectSuggestion(index)"
      class="suggestion-item"
    >
      {{ suggestion }}
    </div>
  </div>
</template>

<style scoped>
.suggestions-list {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  max-height: 300px;
  overflow-y: auto;
  z-index: 100;
  margin-top: 4px;
}

.suggestion-item {
  padding: 12px 24px;
  cursor: pointer;
  color: #213547;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.suggestion-item:first-child {
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}

.suggestion-item:last-child {
  border-bottom: none;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
}

.suggestion-item:hover {
  background-color: rgba(100, 108, 255, 0.1);
}

/* Адаптивность для мобильных устройств */
@media (max-width: 768px) {
  .suggestions-list {
    border-radius: 12px;
    max-height: 250px;
  }

  .suggestion-item {
    padding: 10px 20px;
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .suggestions-list {
    border-radius: 10px;
    max-height: 200px;
  }

  .suggestion-item {
    padding: 8px 16px;
    font-size: 0.9rem;
  }
}
</style>
