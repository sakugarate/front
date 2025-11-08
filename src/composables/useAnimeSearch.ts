import { ref, watch, onBeforeUnmount } from 'vue'

type AnimeType = 'TV' | 'Movie' | 'TV Special'
export interface AnimeItem {
  title_english?: string
  title?: string
  type: AnimeType
  mal_id: number;
  episodes?: number;
  [key: string]: any
}

export interface ApiResponse {
  data: AnimeItem[]
}

export const useAnimeSearch = () => {
  const searchQuery = ref<string>('')
  const suggestions = ref<string[]>([])
  const animeItems = ref<AnimeItem[]>([])
  const isLoading = ref<boolean>(false)
  const showSuggestions = ref<boolean>(false)

  let searchTimeout: ReturnType<typeof setTimeout> | null = null

  const handleSearch = async (): Promise<void> => {
    if (searchQuery.value.trim().length < 2) {
      suggestions.value = []
      animeItems.value = []
      showSuggestions.value = false
      return
    }

    isLoading.value = true
    try {
      const data = await animeSearch(searchQuery.value)

      // Фильтруем только те, у которых есть название и извлекаем названия одновременно
      const filtered = data.data
        .filter((item: AnimeItem) => {
          const title = item.title_english || item.title
          return Boolean(title && title.trim())
        })
        .slice(0, 10)

      // Сохраняем полные объекты
      animeItems.value = filtered

      // Извлекаем title_english, если нет - используем title для отображения
      // Массивы теперь всегда синхронизированы - один индекс = один элемент
      suggestions.value = filtered.map((item: AnimeItem) => {
        return item.title_english || item.title || ''
      })

      showSuggestions.value = suggestions.value.length > 0
    } catch (error) {
      console.error('Ошибка при поиске:', error)
      suggestions.value = []
      animeItems.value = []
      showSuggestions.value = false
    } finally {
      isLoading.value = false
    }
  }

  const selectSuggestion = (suggestion: string): void => {
    searchQuery.value = suggestion
    showSuggestions.value = false
  }

  const hideSuggestions = (): void => {
    showSuggestions.value = false
  }

  const showSuggestionsList = (): void => {
    if (suggestions.value.length > 0) {
      showSuggestions.value = true
    }
  }

  // Автоматический поиск при вводе с задержкой (debounce)
  watch(searchQuery, () => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    searchTimeout = setTimeout(() => {
      handleSearch()
    }, 300) // Задержка 300мс
  })

  // Очистка таймера при размонтировании компонента
  onBeforeUnmount(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
  })

  return {
    searchQuery,
    suggestions,
    animeItems,
    isLoading,
    showSuggestions,
    handleSearch,
    selectSuggestion,
    hideSuggestions,
    showSuggestionsList,
  }
}


async function animeSearch(query: string): Promise<ApiResponse> {
  const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=10`)
  if (!response.ok) {
    throw new Error('Проблема с сетевым запросом')
  }
  return await response.json()
}