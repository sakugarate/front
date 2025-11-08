<!-- components/AnimeEpisodeRatings.vue -->

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getTokenFromCookies, hostUrl } from '../composables/getToken'
import { getRatingColor, RatingValue, colors } from '../composables/buttonColors'
import router from '../router'
import EpisodeRatingPanel from './EpisodeRatingPanel.vue' // <-- ваш компонент с панелью оценки

const route = useRoute()
const routerInstance = useRouter()

interface Rate {
  criteria: string
  score: RatingValue
}
interface Episode {
  id: number
  number: number
  name: string
  user_avg_rate: string
}
interface EpisodeRating {
  episode: Episode
  rates: Rate[]
}

const episodes = ref<EpisodeRating[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const sortMode = ref<'number' | 'rating' | null>('number')
const userId = route.params.userId as string
const animeId = route.params.animeId as string

// ===== Total Rates =====
const totalRates = ref<{ rate_category: RatingValue, quantity: number }[]>([])
const totalRatesLoading = ref(true)
const totalRatesError = ref<string | null>(null)

const loadTotalRates = async () => {
  totalRatesLoading.value = true
  totalRatesError.value = null
  try {
    const url = `${hostUrl}/api/v1/episode/${animeId}/${userId}/total/`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getTokenFromCookies()
      }
    })
    if (!response.ok) throw new Error('Error loading category totals')
    totalRates.value = await response.json()
  } catch (err) {
    totalRatesError.value = err instanceof Error ? err.message : 'Ошибка загрузки'
  } finally {
    totalRatesLoading.value = false
  }
}

// ===== Episodes =====
const loadEpisodes = async () => {
  loading.value = true
  error.value = null
  try {
    let url = `${hostUrl}/api/v1/episode/${animeId}/${userId}/`
    if (sortMode.value === 'number') {
      url += `?orders=${encodeURIComponent('{"number": true}')}`
    } else if (sortMode.value === 'rating') {
      url += `?orders=${encodeURIComponent('{"rating": false}')}`
    }
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getTokenFromCookies()
      }
    })
    if (!response.ok) {
      throw new Error('Error while getting episode data')
    }
    const data: EpisodeRating[] = await response.json()
    episodes.value = data

    const newQuery: any = { ...route.query }
    if (sortMode.value === 'number') {
      newQuery.orders = '{"number": true}'
    } else if (sortMode.value === 'rating') {
      newQuery.orders = '{"rating": false}'
    } else {
      delete newQuery.orders
    }
    routerInstance.replace({ query: newQuery }).catch(() => {})
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Произошла ошибка'
  } finally {
    loading.value = false
  }
}

const goToAnimeDetails = () => {
  router.push(`/user/anime/${userId}`)
}
const sortByNumber = () => {
  sortMode.value = 'number'
}
const sortByRating = () => {
  sortMode.value = 'rating'
}

const getAvgRateInfo = (avgRate: string) => {
  const match = avgRate.match(/^(\w+)/)
  const word = match ? (match[1] as RatingValue) : 'whatever'
  const color = getRatingColor(word)
  return { word, color, full: avgRate }
}

// ===== Модалка =====
const isModalOpen = ref(false)
const selectedEpisode = ref<Episode | null>(null)

const openRatingModal = (episode: Episode) => {
  console.log('Opening modal for episode:', episode) // отладка
  selectedEpisode.value = episode
  isModalOpen.value = true
}

const closeRatingModal = () => {
  isModalOpen.value = false
  selectedEpisode.value = null
}

const handleRateSaved = () => {
  closeRatingModal()
  Promise.all([loadEpisodes(), loadTotalRates()])
}

// ===== Жизненный цикл =====
onMounted(async () => {
  const orders = route.query.orders
  if (orders) {
    try {
      const parsed = JSON.parse(orders as string)
      if (parsed.number === true) sortMode.value = 'number'
      else if (parsed.rating === false) sortMode.value = 'rating'
    } catch {}
  }
  await Promise.all([loadEpisodes(), loadTotalRates()])
})

watch(sortMode, () => {
  loadEpisodes()
  loadTotalRates()
})
</script>

<template>
  <div class="episode-ratings-page">
    <div class="container">
      <div class="header">
        <h1>Episode Ratings</h1>
        <button @click="goToAnimeDetails" class="back-btn">Back</button>
      </div>

      <!-- Кнопки сортировки -->
      <div class="sort-controls">
        <button
          @click="sortByNumber"
          :class="{ active: sortMode === 'number' }"
          class="sort-btn"
        >Sort by number</button>
        <button
          @click="sortByRating"
          :class="{ active: sortMode === 'rating' }"
          class="sort-btn"
        >Sort by rating</button>
      </div>

      <!-- Total Rate Categories -->
      <div class="total-rates-row">
        <template v-if="totalRatesLoading">Загрузка категорий...</template>
        <template v-else-if="totalRatesError">
          <span class="error">{{ totalRatesError }}</span>
        </template>
        <template v-else-if="totalRates.length === 0">
          <span class="empty">Нет статистики по категориям оценок</span>
        </template>
        <template v-else>
          <div
            class="rate-category-chip"
            v-for="item in totalRates"
            :key="item.rate_category"
          >
            <span
              class="dot"
              :style="{ backgroundColor: colors[item.rate_category] || '#ccc' }"
            ></span>
            <span class="rate-name">{{ item.rate_category }}</span>
            <span class="rate-quantity">({{ item.quantity }})</span>
          </div>
        </template>
      </div>

      <!-- Статусы -->
      <div v-if="loading" class="loading">Загрузка...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="episodes.length === 0" class="empty">No rates for this anime</div>

      <!-- Список эпизодов -->
      <div v-else class="episodes-list">
        <div
          v-for="item in episodes"
          :key="item.episode.id"
          class="episode-card"
          @click="openRatingModal(item.episode)"
        >
          <div class="episode-content">
            <div class="episode-header">
              <h3>Episode {{ item.episode.number }}: {{ item.episode.name }}</h3>
              <div
                class="avg-rate"
                :style="{ '--avg-rate-color': getAvgRateInfo(item.episode.user_avg_rate).color }"
              >
                <strong>Avg. Rate:</strong>
                <span class="avg-rate-value">
                  {{ getAvgRateInfo(item.episode.user_avg_rate).full }}
                </span>
              </div>
            </div>
            <div class="criteria-grid">
              <div
                v-for="rate in item.rates"
                :key="rate.criteria"
                class="criteria-item"
                :style="{ '--rating-color': getRatingColor(rate.score) }"
              >
                <span class="criteria-name">{{ rate.criteria }}</span>
                <span
                  class="criteria-score"
                  :style="{ backgroundColor: getRatingColor(rate.score) }"
                >
                  {{ rate.score }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Модальное окно -->
      <teleport to="body">
        <EpisodeRatingPanel
          v-if="isModalOpen && selectedEpisode"
          :episodeId="selectedEpisode.number"
          :episodeTitle="selectedEpisode.name"
          :animeId="Number(animeId)"
          @close="closeRatingModal"
          @rate="handleRateSaved"
          @updateRatedEpisodes="() => {}"
        />
      </teleport>
    </div>
  </div>
</template>

<style scoped>
.episode-ratings-page {
  padding: 24px 0;
  min-height: 100vh;
  background: #f4f6f9;
}
.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 1rem;
}
h1 {
  color: #213547;
  margin: 0;
  font-size: 2rem;
}
.back-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: 0.2s;
}
.back-btn:hover {
  background: #45a049;
}

/* Кнопки сортировки */
.sort-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  justify-content: center;
}
.sort-btn {
  background: #f0f0f0;
  color: #213547;
  border: 2px solid transparent;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.sort-btn:hover {
  background: #e0e0e0;
}
.sort-btn.active {
  background: #213547;
  color: white;
  border-color: #213547;
}

/* Total Rate Categories */
.total-rates-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 18px;
  margin-bottom: 18px;
  min-height: 34px;
  padding-left: 4px;
}
.rate-category-chip {
  display: flex;
  align-items: center;
  background: #f6fafd;
  border-radius: 16px;
  padding: 3px 10px 3px 6px;
  font-size: 1rem;
  margin-bottom: 4px;
}
.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 7px;
  background: #aaa;
  display: inline-block;
  box-shadow: 0 0 2px #ccc;
}
.rate-name {
  font-weight: 500;
  text-transform: capitalize;
  margin-right: 5px;
}
.rate-quantity {
  color: #6b7280;
  font-size: 0.9em;
}

.loading, .error, .empty {
  text-align: center;
  padding: 40px;
  font-size: 1.1rem;
  color: #666;
}
.error {
  color: #ef4444;
}

.episodes-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.episode-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
  cursor: pointer;
}
.episode-card:hover {
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  transform: translateY(-4px);
  border-color: #646cff;
}

/* Отключаем клики на внутреннем контенте */
.episode-content * {
  pointer-events: none;
}

.episode-header {
  margin-bottom: 16px;
}
.episode-header h3 {
  margin: 0 0 8px;
  font-size: 1.4rem;
  color: #1a1a1a;
}
.avg-rate {
  font-size: 1.1rem;
  color: #213547;
  font-weight: 500;
  background: #f0f9ff;
  padding: 6px 12px;
  border-radius: 8px;
  display: inline-block;
  border-left: 4px solid var(--avg-rate-color);
}
.avg-rate-value {
  margin-left: 6px;
  font-weight: 600;
  color: #213547;
}
.criteria-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.criteria-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid var(--rating-color);
  font-size: 0.95rem;
}
.criteria-name {
  font-weight: 500;
  color: #444;
}
.criteria-score {
  padding: 4px 12px;
  border-radius: 8px;
  background: var(--rating-color);
  color: white;
  font-weight: 600;
  text-transform: capitalize;
  font-size: 0.9rem;
}

/* Адаптивность */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: stretch;
  }
  .back-btn {
    align-self: flex-end;
  }
  .sort-controls {
    justify-content: stretch;
  }
  .sort-btn {
    flex: 1;
  }
  .avg-rate {
    font-size: 1rem;
  }
}
</style>