<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getTokenFromCookies, getUserIdFromCookies, hostUrl } from '../composables/getToken'
import { getRatingColorFromStr, colors } from '../composables/buttonColors'; // импортируем colors

interface RatedAnime {
  id: number
  title: string
  rated_episodes_quantity: number
  total_episodes?: number
  user_avg_score: string
  avg_community_rating: string
  total_rated_users: number
  rating_place: string
}

interface ApiResponse {
  pagination: {
    limit: number
    total: number
    offset: number
  }
  data: RatedAnime[]
}

// === Новая структура для total ===
interface AnimeTotalRate {
  rate_category: string
  quantity: number
}

const route = useRoute()
const router = useRouter()
const userId = route.params.userId as string

const animes = ref<RatedAnime[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const isOwnProfile = ref(false)
const canGoBack = ref(true)

const pagination = ref<ApiResponse['pagination']>({ limit: 20, total: 0, offset: 0 })
const currentPage = ref(1)
const itemsPerPage = 20
const totalPages = computed(() => Math.ceil(pagination.value.total / itemsPerPage))

// Состояние сортировки
const sortMode = ref<'rating' | 'alphabet' | null>(null)

// === Total Rates по аниме ===
const totalAnimeRates = ref<AnimeTotalRate[]>([])
const totalAnimeRatesLoading = ref(true)
const totalAnimeRatesError = ref<string | null>(null)

const loadTotalAnimeRates = async () => {
  totalAnimeRatesLoading.value = true
  totalAnimeRatesError.value = null
  try {
    const url = `${hostUrl}/api/v1/anime/${userId}/total/`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getTokenFromCookies()
      }
    })
    if (!response.ok) throw new Error('Error loading anime category totals')
    totalAnimeRates.value = await response.json()
  } catch (err) {
    totalAnimeRatesError.value = err instanceof Error ? err.message : 'Ошибка загрузки статистики'
  } finally {
    totalAnimeRatesLoading.value = false
  }
}

onMounted(async () => {
  const currentUserId = getUserIdFromCookies()
  isOwnProfile.value = currentUserId === userId
  canGoBack.value = window.history.length > 1

  // Читаем orders из URL
  const orders = route.query.orders
  if (orders) {
    try {
      const parsed = JSON.parse(orders as string)
      if (parsed.rating === false) sortMode.value = 'rating'
      else if (parsed.alphabet === true) sortMode.value = 'alphabet'
    } catch {}
  }

  await Promise.all([loadUserAnime(1), loadTotalAnimeRates()])
})

// Сброс страницы при смене сортировки
watch(sortMode, () => {
  currentPage.value = 1
  loadUserAnime(1)
  loadTotalAnimeRates() // обновляем статистику при сортировке (на всякий случай)
})

const loadUserAnime = async (page: number = 1) => {
  isLoading.value = true
  error.value = null

  try {
    const offset = (page - 1) * itemsPerPage
    let url = `${hostUrl}/api/v1/anime/${userId}/?limit=${itemsPerPage}&offset=${offset}`

    if (sortMode.value === 'rating') {
      url += `&orders=${encodeURIComponent('{"rating": false}')}`
    } else if (sortMode.value === 'alphabet') {
      url += `&orders=${encodeURIComponent('{"alphabet": true}')}`
    }

    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    const token = getTokenFromCookies()
    if (token) headers['Authorization'] = token

    const response = await fetch(url, { method: 'GET', headers })

    if (!response.ok) {
      if (response.status === 404) {
        error.value = 'Пользователь не найден'
      } else {
        error.value = 'Не удалось загрузить данные'
      }
      return
    }

    const result: ApiResponse = await response.json()
    animes.value = result.data
    pagination.value = result.pagination
    currentPage.value = page

    // Обновляем URL
    const newQuery: any = { ...route.query }
    if (sortMode.value === 'rating') {
      newQuery.orders = '{"rating": false}'
    } else if (sortMode.value === 'alphabet') {
      newQuery.orders = '{"alphabet": true}'
    } else {
      delete newQuery.orders
    }
    router.replace({ query: newQuery }).catch(() => {})
  } catch {
    error.value = 'Ошибка сети'
  } finally {
    isLoading.value = false
  }
}

const goBack = () => {
  router.push('/')
}

const goToAnimeDetails = (animeId: number) => {
  router.push(`/user/anime/${userId}/${animeId}`)
}

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  loadUserAnime(page)
}

const sortByRating = () => {
  sortMode.value = 'rating'
}

const sortByAlphabet = () => {
  sortMode.value = 'alphabet'
}
</script>

<template>
  <div class="user-rated-page">
    <div class="container">
      <div class="header">
        <h1>
          {{ isOwnProfile ? 'My Rated Anime' : `User #${userId}'s Anime` }}
        </h1>
        <button @click="goBack" class="back-btn">
          ← Back
        </button>
      </div>

      <!-- Кнопки сортировки -->
      <div class="sort-buttons">
        <button
          @click="sortByRating"
          :class="{ active: sortMode === 'rating' }"
          class="sort-btn"
        >
          Sort by rating
        </button>
        <button
          @click="sortByAlphabet"
          :class="{ active: sortMode === 'alphabet' }"
          class="sort-btn"
        >
          Sort by alphabet
        </button>
      </div>

      <!-- Total Anime Rate Categories -->
      <div class="total-rates-row">
        <template v-if="totalAnimeRatesLoading">Загрузка категорий...</template>
        <template v-else-if="totalAnimeRatesError">
          <span class="error">{{ totalAnimeRatesError }}</span>
        </template>
        <template v-else-if="totalAnimeRates.length === 0">
          <span class="empty">Нет статистики по категориям</span>
        </template>
        <template v-else>
          <div
            class="rate-category-chip"
            v-for="item in totalAnimeRates"
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
      <div v-if="isLoading" class="loading">Загрузка...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="animes.length === 0" class="empty">
        {{ isOwnProfile ? 'Вы ещё не оценили ни одного аниме' : 'У пользователя нет оценок' }}
      </div>

      <!-- Аниме -->
      <div v-else class="anime-grid">
        <div
          v-for="anime in animes"
          :key="anime.id"
          class="anime-card"
          @click="goToAnimeDetails(anime.id)"
        >
          <h3>{{ anime.title }}</h3>
          <p class="rating-line" v-if="anime.rated_episodes_quantity > 1">
            <strong>Rated episodes:</strong>{{ anime.rated_episodes_quantity }} / {{  anime?.total_episodes }}
          </p>
            
          <p class="rating-line">
            <strong>Personal rating:</strong> {{ anime.user_avg_score }}
            <span
              class="rating-dot"
              :style="{ backgroundColor: getRatingColorFromStr(anime.user_avg_score) }"
            ></span>
          </p>
          
          <p class="rating-line">
            <strong>Community rating:</strong> {{ anime.avg_community_rating }}
            <span
              class="rating-dot"
              :style="{ backgroundColor: getRatingColorFromStr(anime.avg_community_rating) }"
            ></span>
          </p>
          
          <p><strong>Total user rates:</strong> {{ anime.total_rated_users }}</p>
          <p><strong>Ranked:</strong> {{ anime.rating_place }}</p>
        </div>
      </div>

      <!-- Пагинация -->
      <div v-if="!isLoading && !error && pagination.total > 0" class="pagination">
        <button
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="pag-btn"
        >
          Prev
        </button>

        <div class="page-numbers">
          <button
            v-for="page in Math.min(5, totalPages)"
            :key="page"
            @click="goToPage(page)"
            :class="{ active: page === currentPage }"
            class="page-num"
          >
            {{ page }}
          </button>
          <span v-if="totalPages > 5" class="ellipsis">...</span>
          <button
            v-if="totalPages > 5"
            @click="goToPage(totalPages)"
            :class="{ active: totalPages === currentPage }"
            class="page-num"
          >
            {{ totalPages }}
          </button>
        </div>

        <button
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="pag-btn"
        >
          Next
        </button>
      </div>

      <div class="pagination-info" v-if="!isLoading && !error">
        Showed {{ animes.length }} out of {{ pagination.total }} anime
      </div>
    </div>
  </div>
</template>

<style scoped>
/* === Стили для total-rates-row (взято из EpisodeRatings) === */
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

/* Остальные стили без изменений */
.user-rated-page {
  min-height: 100vh;
  background: linear-gradient(-45deg, #F8E8F2, #E6F0FA, #F0E6F5, #E0F8F0);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  padding: 40px 20px;
}

.container {
  max-width: 900px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

h1 {
  font-size: 2.2rem;
  color: #213547;
  margin: 0;
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

.sort-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.sort-btn {
  background: #f0f0f0;
  color: #213547;
  border: 2px solid transparent;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.95rem;
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

.loading, .error, .empty {
  text-align: center;
  padding: 40px;
  font-size: 1.2rem;
  color: #666;
}

.error { color: #e74c3c; }

.anime-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  margin-bottom: 2rem;
}

.anime-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transition: transform 0.2s, background 0.2s;
  cursor: pointer;
}

.anime-card:hover {
  transform: translateY(-6px);
  background: #f8f9ff;
}

.anime-card h3 {
  margin: 0 0 12px;
  font-size: 1.3rem;
  color: #1a1a1a;
}

.anime-card p {
  margin: 8px 0;
  font-size: 1rem;
  color: #444;
}

.anime-card p strong {
  color: #213547;
}

.rating-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
  font-size: 1rem;
  color: #444;
}

.rating-line strong {
  color: #213547;
  min-width: 140px;
  flex-shrink: 0;
}

.rating-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin: 2rem 0;
  flex-wrap: wrap;
}

.pag-btn, .page-num {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: 0.2s;
  min-width: 40px;
}

.pag-btn:hover:not(:disabled), .page-num:hover:not(.active) {
  background: #45a049;
}

.pag-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 6px;
  align-items: center;
}

.page-num {
  background: #f0f0f0;
  color: #213547;
  font-weight: 500;
}

.page-num.active {
  background: #213547;
  color: white;
  font-weight: 600;
}

.ellipsis {
  color: #666;
  font-weight: 500;
  padding: 0 4px;
}

.pagination-info {
  text-align: center;
  color: #666;
  font-size: 0.9rem;
  margin-top: 1rem;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
</style>