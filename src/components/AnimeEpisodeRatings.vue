<!-- components/AnimeEpisodeRatings.vue -->

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getTokenFromCookies, hostUrl } from '../composables/getToken'
import { getRatingColor, RatingValue, colors, getRatingColorFromFloat } from '../composables/buttonColors'
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
  rating: string
}

const episodes = ref<EpisodeRating[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const sortMode = ref<'number' | 'rating' | null>('number')
const userId = route.params.userId as string
const animeId = route.params.animeId as string

// ===== Episode Average Rates =====
interface EpisodeAvgRate {
  episode_number: number
  episode_name: string
  avg_rate: string
  rating: string
}
const episodeAvgRates = ref<EpisodeAvgRate[]>([])
const episodeAvgRatesLoading = ref(true)
const episodeAvgRatesError = ref<string | null>(null)
const hoveredEpisode = ref<EpisodeAvgRate | null>(null)
const tooltipPosition = ref({ x: 0, y: 0 })

const loadEpisodeAvgRates = async () => {
  episodeAvgRatesLoading.value = true
  episodeAvgRatesError.value = null
  try {
    const url = `${hostUrl}/api/v1/episode/${animeId}/${userId}/?orders=${encodeURIComponent('{"number": true}')}`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getTokenFromCookies()
      }
    })
    if (!response.ok) throw new Error('Error loading episode averages')
    const data: EpisodeRating[] = await response.json()
    episodeAvgRates.value = data.map(item => ({
      episode_number: item.episode.number,
      episode_name: item.episode.name,
      avg_rate: item.episode.user_avg_rate,
      rating: item.rating
    }))
  } catch (err) {
    episodeAvgRatesError.value = err instanceof Error ? err.message : 'Ошибка загрузки'
  } finally {
    episodeAvgRatesLoading.value = false
  }
}

const showTooltip = (event: MouseEvent, episode: EpisodeAvgRate) => {
  hoveredEpisode.value = episode
  // Position tooltip with some offset to avoid covering the cursor
  tooltipPosition.value = { 
    x: event.clientX, 
    y: event.clientY - 10 
  }
}

const hideTooltip = () => {
  hoveredEpisode.value = null
}

// ===== Criteria Averages =====
interface CriteriaAvg {
  criteria_name: string
  average_score: number
}
const criteriaAverages = ref<CriteriaAvg[]>([])
const criteriaAveragesLoading = ref(true)
const criteriaAveragesError = ref<string | null>(null)

const loadCriteriaAverages = async () => {
  criteriaAveragesLoading.value = true
  criteriaAveragesError.value = null
  try {
    const url = `${hostUrl}/api/v1/anime/${animeId}/criteria-avg/`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getTokenFromCookies()
      }
    })
    if (!response.ok) throw new Error('Error loading criteria averages')
    criteriaAverages.value = await response.json()
  } catch (err) {
    criteriaAveragesError.value = err instanceof Error ? err.message : 'Ошибка загрузки'
  } finally {
    criteriaAveragesLoading.value = false
  }
}

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

const getEpisodeAvgRateColor = (avgRate: string): string => {
  const match = avgRate.match(/^(\w+)/)
  const word = match ? (match[1] as RatingValue) : 'whatever'
  return getRatingColor(word)
}

// ===== Модалка =====
const isModalOpen = ref(false)
const selectedEpisode = ref<Episode | null>(null)

const openRatingModal = (episode: Episode) => {
  selectedEpisode.value = episode
  isModalOpen.value = true
}

const closeRatingModal = () => {
  isModalOpen.value = false
  selectedEpisode.value = null
}

const handleRateSaved = () => {
  closeRatingModal()
  Promise.all([loadEpisodes(), loadTotalRates(), loadEpisodeAvgRates(), loadCriteriaAverages()])
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
  await Promise.all([loadEpisodes(), loadTotalRates(), loadEpisodeAvgRates(), loadCriteriaAverages()])
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

      <!-- Episode Average Rates Grid -->
      <div class="episode-avg-rates-section">
        <h2 class="section-title">Episode Average Rates</h2>
        <template v-if="episodeAvgRatesLoading">Загрузка средних оценок...</template>
        <template v-else-if="episodeAvgRatesError">
          <span class="error">{{ episodeAvgRatesError }}</span>
        </template>
        <template v-else-if="episodeAvgRates.length === 0">
          <span class="empty">Нет данных о средних оценках эпизодов</span>
        </template>
        <template v-else>
          <div class="episode-grid">
            <div
              v-for="item in episodeAvgRates"
              :key="item.episode_number"
              class="episode-square"
              :style="{ backgroundColor: getEpisodeAvgRateColor(item.avg_rate) }"
              @mouseenter="showTooltip($event, item)"
              @mouseleave="hideTooltip"
              @mousemove="tooltipPosition = { x: $event.clientX, y: $event.clientY }"
            >
              <span class="episode-number">{{ item.episode_number }}</span>
            </div>
          </div>
          <!-- Tooltip -->
          <div
            v-if="hoveredEpisode"
            class="episode-tooltip"
            :style="{ left: tooltipPosition.x + 'px', top: tooltipPosition.y + 'px' }"
          >
            <div class="tooltip-header">
              <strong>Episode {{ hoveredEpisode.episode_number }}</strong>
            </div>
            <div class="tooltip-name">{{ hoveredEpisode.episode_name }}</div>
            <div class="tooltip-rating">
              <span class="tooltip-label">Rating:</span>
              <span class="tooltip-value">{{ hoveredEpisode.rating }}</span>
            </div>
            <div class="tooltip-avg-rate">
              <span class="tooltip-label">Avg. Rate:</span>
              <span 
                class="tooltip-value"
                :style="{ color: getEpisodeAvgRateColor(hoveredEpisode.avg_rate) }"
              >
                {{ hoveredEpisode.avg_rate }}
              </span>
            </div>
          </div>
        </template>
      </div>

      <!-- Criteria Averages -->
      <div class="criteria-averages-section">
        <h2 class="section-title">Criteria Average Scores</h2>
        <template v-if="criteriaAveragesLoading">Загрузка средних оценок критериев...</template>
        <template v-else-if="criteriaAveragesError">
          <span class="error">{{ criteriaAveragesError }}</span>
        </template>
        <template v-else-if="criteriaAverages.length === 0">
          <span class="empty">Нет данных о средних оценках критериев</span>
        </template>
        <template v-else>
          <div class="criteria-averages-grid">
            <div
              v-for="item in criteriaAverages"
              :key="item.criteria_name"
              class="criteria-avg-item"
              :style="{ '--rating-color': getRatingColorFromFloat(item.average_score) }"
            >
              <span class="criteria-avg-name">{{ item.criteria_name }}</span>
              <span
                class="criteria-avg-score"
                :style="{ 
                  color: getRatingColorFromFloat(item.average_score),
                  textShadow: `0 0 8px ${getRatingColorFromFloat(item.average_score)}40`
                }"
              >
                {{ item.average_score.toFixed(2) }}
              </span>
            </div>
          </div>
        </template>
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
              <div class="episode-rating">
              <strong>Rating: </strong>
              <span class="rating-value">{{ item.rating }}</span>
            </div>
                <strong>Avg. score:</strong>
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
  background: var(--bg-primary);
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
  color: var(--text-primary);
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
  background: var(--bg-card);
  color: var(--text-primary);
  border: 2px solid transparent;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.sort-btn:hover {
  background: var(--bg-secondary);
}
.sort-btn.active {
  background: var(--text-primary);
  color: var(--bg-card);
  border-color: var(--text-primary);
}

/* Episode Average Rates Grid */
.episode-avg-rates-section {
  margin-bottom: 32px;
}

/* Criteria Averages */
.criteria-averages-section {
  margin-bottom: 32px;
}
.criteria-averages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.criteria-avg-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-card);
  border-radius: 12px;
  border-left: 4px solid var(--rating-color);
  box-shadow: 0 2px 8px var(--shadow);
  transition: all 0.2s ease;
}
.criteria-avg-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--shadow);
}
.criteria-avg-name {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 1rem;
}
.criteria-avg-score {
  font-weight: 700;
  font-size: 1.1rem;
  transition: all 0.3s ease;
}
.section-title {
  color: var(--text-primary);
  font-size: 1.3rem;
  margin: 0 0 16px 4px;
  font-weight: 600;
}
.episode-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  gap: 8px;
  max-width: 100%;
}
.episode-square {
  aspect-ratio: 1;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  position: relative;
  min-height: 50px;
}
.episode-square:hover {
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  z-index: 1;
}
.episode-number {
  color: rgb(30, 30, 30);
  font-weight: 700;
  font-size: 0.9rem;
  text-shadow: 0 1px 3px rgba(255, 255, 255, 0.5), 0 0 2px rgba(0, 0, 0, 0.2);
}
.episode-tooltip {
  position: fixed;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  pointer-events: none;
  transform: translate(-50%, -100%);
  margin-top: -8px;
  min-width: 200px;
  max-width: 300px;
}
.tooltip-header {
  color: var(--text-primary);
  font-size: 1.1rem;
  margin-bottom: 6px;
}
.tooltip-name {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 8px;
  font-style: italic;
}
.tooltip-rating,
.tooltip-avg-rate {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 0.9rem;
}
.tooltip-label {
  color: var(--text-secondary);
  margin-right: 8px;
}
.tooltip-value {
  color: var(--text-primary);
  font-weight: 600;
}
@media (max-width: 768px) {
  .episode-grid {
    grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
    gap: 6px;
  }
  .episode-square {
    min-height: 40px;
  }
  .episode-number {
    font-size: 0.8rem;
  }
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
  background: var(--bg-card);
  border-radius: 16px;
  padding: 3px 10px 3px 6px;
  font-size: 1rem;
  margin-bottom: 4px;
  opacity: 0.85;
  filter: brightness(0.9);
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
  color: var(--text-secondary);
  font-size: 0.9em;
}

.loading, .error, .empty {
  text-align: center;
  padding: 40px;
  font-size: 1.1rem;
  color: var(--text-secondary);
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
  background: var(--bg-card);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px var(--shadow);
  border: 1px solid var(--border-color);
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
  color: var(--text-primary);
}
.avg-rate {
  font-size: 1.1rem;
  color: var(--text-primary);
  font-weight: 500;
  background: var(--bg-secondary);
  padding: 6px 12px;
  border-radius: 8px;
  display: inline-block;
  border-left: 4px solid var(--avg-rate-color);
}
.avg-rate-value {
  margin-left: 6px;
  font-weight: 600;
  color: var(--text-primary);
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
  background: var(--bg-secondary);
  border-radius: 12px;
  border-left: 4px solid var(--rating-color);
  font-size: 0.95rem;
}
.criteria-name {
  font-weight: 500;
  color: var(--text-secondary);
}
.criteria-score {
  padding: 4px 12px;
  border-radius: 8px;
  background: var(--rating-color);
  color: rgb(54, 54, 54);
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