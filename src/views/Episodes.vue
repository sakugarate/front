<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { hostUrl } from '../composables/getToken'
import { getRatingColorFromFloat } from '../composables/buttonColors'

interface Episode {
  id: number
  name: string
  number: number
  score: number
  created_at: string
}

interface Anime {
  id: number
  name: string
}

interface EpisodeData {
  episode: Episode
  anime: Anime
  count_rated: number
}

interface ApiResponse {
  pagination: {
    limit: number
    total: number
    offset: number
  }
  data: EpisodeData[]
}

interface Criteria {
  id: number
  name: string
}

const episodes = ref<EpisodeData[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const sortMode = ref<'popular' | 'rating'>('popular')
const pagination = ref<ApiResponse['pagination'] | null>(null)
const currentOffset = ref(0)
const limit = ref(8)

// New ordering fields
const recentOrder = ref<boolean | null>(null)
const criteriaOrders = ref<Record<string, boolean>>({})
const criteria = ref<Criteria[]>([])
const criteriaLoading = ref(false)
const showCriteriaOrders = ref(false)

const currentPage = computed(() => {
  if (!pagination.value) return 1
  return Math.floor(pagination.value.offset / pagination.value.limit) + 1
})

const totalPages = computed(() => {
  if (!pagination.value) return 1
  return Math.ceil(pagination.value.total / pagination.value.limit)
})

const loadCriteria = async () => {
  criteriaLoading.value = true
  try {
    const response = await fetch(`${hostUrl}/api/v1/criteria/`)
    if (!response.ok) {
      throw new Error('Error loading criteria')
    }
    const data: Criteria[] = await response.json()
    criteria.value = data
    // Initialize criteria orders as empty
    criteriaOrders.value = {}
  } catch (err) {
    console.error('Error loading criteria:', err)
    criteria.value = []
  } finally {
    criteriaLoading.value = false
  }
}

const toggleCriteriaOrder = (criteriaId: number) => {
  const idStr = criteriaId.toString()
  if (criteriaOrders.value[idStr] === undefined) {
    criteriaOrders.value[idStr] = false
  } else if (criteriaOrders.value[idStr] === false) {
    criteriaOrders.value[idStr] = true
  } else {
    delete criteriaOrders.value[idStr]
  }
  currentOffset.value = 0
  loadEpisodes()
}

const toggleRecentOrder = () => {
  if (recentOrder.value === null) {
    recentOrder.value = false
  } else if (recentOrder.value === false) {
    recentOrder.value = true
  } else {
    recentOrder.value = null
  }
  currentOffset.value = 0
  loadEpisodes()
}

const loadEpisodes = async () => {
  loading.value = true
  error.value = null
  try {
    let orders: Record<string, boolean> = {}
    
    // Add existing sort mode
    if (sortMode.value === 'rating') {
      orders.rating = false
    } else {
      orders.popular = false
    }
    
    // Add recent order if set
    if (recentOrder.value !== null) {
      orders.recent = recentOrder.value
    }
    
    // Build URL with orders
    let url = `${hostUrl}/api/v1/episode/?orders=${encodeURIComponent(JSON.stringify(orders))}`
    
    // Add criteria_orders if any are set
    const activeCriteriaOrders = Object.keys(criteriaOrders.value).length > 0
      ? criteriaOrders.value
      : null
    
    if (activeCriteriaOrders) {
      url += `&criteria_orders=${encodeURIComponent(JSON.stringify(activeCriteriaOrders))}`
    }
    
    url += `&offset=${currentOffset.value}&limit=${limit.value}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('Error while getting episode data')
    }
    
    const data: ApiResponse = await response.json()
    episodes.value = data.data
    pagination.value = data.pagination
    currentOffset.value = data.pagination.offset
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Произошла ошибка'
  } finally {
    loading.value = false
  }
}

const setSortMode = (mode: 'rating' | 'popular') => {
  sortMode.value = mode
  currentOffset.value = 0
  loadEpisodes()
}

const goToPage = (page: number) => {
  if (!pagination.value) return
  const newOffset = (page - 1) * pagination.value.limit
  currentOffset.value = newOffset
  loadEpisodes()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const goToPreviousPage = () => {
  if (currentPage.value > 1) {
    goToPage(currentPage.value - 1)
  }
}

const goToNextPage = () => {
  if (currentPage.value < totalPages.value) {
    goToPage(currentPage.value + 1)
  }
}

const getPageNumbers = () => {
  const pages: (number | string)[] = []
  const total = totalPages.value
  const current = currentPage.value
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    pages.push(1)
    
    if (current <= 3) {
      for (let i = 2; i <= 4; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 2) {
      pages.push('...')
      for (let i = total - 3; i <= total; i++) {
        pages.push(i)
      }
    } else {
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    }
  }
  
  return pages
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

onMounted(async () => {
  await loadCriteria()
  loadEpisodes()
})

const getCriteriaOrderIcon = (criteriaId: number): string => {
  const idStr = criteriaId.toString()
  if (criteriaOrders.value[idStr] === undefined) {
    return '○'
  } else if (criteriaOrders.value[idStr] === false) {
    return '↓'
  } else {
    return '↑'
  }
}

const getRecentOrderIcon = (): string => {
  if (recentOrder.value === null) {
    return '○'
  } else if (recentOrder.value === false) {
    return '↓'
  } else {
    return '↑'
  }
}
</script>

<template>
  <div class="episodes-page">
    <div class="container">
      <div class="header">
        <h1>Episodes</h1>
      </div>

      <!-- Filter buttons -->
      <div class="filter-controls">
        <button
          @click="setSortMode('popular')"
          :class="{ active: sortMode === 'popular' }"
          class="filter-btn"
        >
          Popular
        </button>
        <button
          @click="setSortMode('rating')"
          :class="{ active: sortMode === 'rating' }"
          class="filter-btn"
        >
          Rating
        </button>
        <button
          @click="toggleRecentOrder"
          :class="{ active: recentOrder !== null }"
          class="filter-btn"
        >
          Recent {{ getRecentOrderIcon() }}
        </button>
        <button
          @click="showCriteriaOrders = !showCriteriaOrders"
          :class="{ active: showCriteriaOrders || Object.keys(criteriaOrders).length > 0 }"
          class="filter-btn"
        >
          Criteria Orders
        </button>
      </div>

      <!-- Criteria Orders Panel -->
      <div v-if="showCriteriaOrders" class="criteria-orders-panel">
        <div class="criteria-orders-header">
          <h3>Order by Criteria</h3>
          <button @click="showCriteriaOrders = false" class="close-btn">×</button>
        </div>
        <div v-if="criteriaLoading" class="criteria-loading">Loading criteria...</div>
        <div v-else-if="criteria.length === 0" class="criteria-empty">No criteria available</div>
        <div v-else class="criteria-list">
          <button
            v-for="criterion in criteria"
            :key="criterion.id"
            @click="toggleCriteriaOrder(criterion.id)"
            :class="[
              'criteria-order-btn',
              { active: criteriaOrders[criterion.id.toString()] !== undefined }
            ]"
          >
            <span class="criteria-name">{{ criterion.name }}</span>
            <span class="criteria-icon">{{ getCriteriaOrderIcon(criterion.id) }}</span>
          </button>
        </div>
      </div>

      <!-- Pagination info -->
      <div v-if="pagination" class="pagination-info">
        Showing {{ pagination.offset + 1 }}-{{ Math.min(pagination.offset + pagination.limit, pagination.total) }} of {{ pagination.total }} episodes
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading">Loading episodes...</div>

      <!-- Error state -->
      <div v-else-if="error" class="error">{{ error }}</div>

      <!-- Empty state -->
      <div v-else-if="episodes.length === 0" class="empty">No rated episodes found</div>

      <!-- Episodes list -->
      <div v-else class="episodes-list">
        <div
          v-for="item in episodes"
          :key="item.episode.id"
          class="episode-card"
        >
          <div class="episode-content">
            <div class="episode-header">
              <div class="episode-title-section">
                <h3 class="episode-title">
                  Episode {{ item.episode.number }}: {{ item.episode.name }}
                </h3>
                <p class="anime-name">{{ item.anime.name }}</p>
              </div>
              <div class="episode-meta">
                <div
                  class="average-rating"
                  :style="{
                    'border-left-color': getRatingColorFromFloat(item.episode.score),
                    'box-shadow': `0 0 12px ${getRatingColorFromFloat(item.episode.score)}20`
                  }"
                >
                  <span class="rating-label">Average Rating:</span>
                  <span
                    class="rating-score"
                    :style="{
                      color: getRatingColorFromFloat(item.episode.score),
                      textShadow: `0 0 8px ${getRatingColorFromFloat(item.episode.score)}20`
                    }"
                  >
                    {{ item.episode.score.toFixed(1) }}
                  </span>
                </div>
                <div class="rated-count">
                  <span class="rated-label">Rated users:</span>
                  <span class="rated-value">{{ item.count_rated }}</span>
                </div>
                <div class="episode-date">
                  {{ formatDate(item.episode.created_at) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination controls -->
      <div v-if="pagination && totalPages > 1" class="pagination-controls">
        <button
          @click="goToPreviousPage"
          :disabled="currentPage === 1"
          class="pagination-btn"
          :class="{ disabled: currentPage === 1 }"
        >
          Previous
        </button>
        
        <div class="page-numbers">
          <button
            v-for="page in getPageNumbers()"
            :key="page"
            @click="typeof page === 'number' && goToPage(page)"
            :class="[
              'page-btn',
              { active: page === currentPage, ellipsis: page === '...' }
            ]"
            :disabled="page === '...'"
          >
            {{ page }}
          </button>
        </div>
        
        <button
          @click="goToNextPage"
          :disabled="currentPage === totalPages"
          class="pagination-btn"
          :class="{ disabled: currentPage === totalPages }"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.episodes-page {
  min-height: 100vh;
  background: var(--bg-primary);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  padding: 24px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.header {
  margin-bottom: 32px;
}

.header h1 {
  color: var(--text-primary);
  margin: 0;
  font-size: 2.5rem;
  font-weight: 600;
}

/* Filter controls */
.filter-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.filter-btn {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 2px solid transparent;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: var(--bg-secondary);
  transform: translateY(-2px);
}

.filter-btn.active {
  background: var(--text-primary);
  color: var(--bg-card);
  border-color: var(--text-primary);
}

/* Criteria Orders Panel */
.criteria-orders-panel {
  background: var(--bg-card);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px var(--shadow);
}

.criteria-orders-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.criteria-orders-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.2rem;
  font-weight: 600;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.criteria-loading,
.criteria-empty {
  color: var(--text-secondary);
  text-align: center;
  padding: 20px;
}

.criteria-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.criteria-order-btn {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.criteria-order-btn:hover {
  background: var(--bg-card);
  border-color: var(--text-primary);
  transform: translateY(-2px);
}

.criteria-order-btn.active {
  background: var(--text-primary);
  color: var(--bg-card);
  border-color: var(--text-primary);
}

.criteria-name {
  flex: 1;
}

.criteria-icon {
  font-weight: 700;
  font-size: 1rem;
}

/* Pagination info */
.pagination-info {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 24px;
  padding-left: 4px;
}

/* Pagination controls */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 40px;
  flex-wrap: wrap;
}

.pagination-btn {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
}

.pagination-btn:hover:not(.disabled) {
  background: var(--bg-secondary);
  border-color: var(--text-primary);
  transform: translateY(-2px);
}

.pagination-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
  align-items: center;
}

.page-btn {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 40px;
}

.page-btn:hover:not(.ellipsis):not(.active) {
  background: var(--bg-secondary);
  border-color: var(--text-primary);
}

.page-btn.active {
  background: var(--text-primary);
  color: var(--bg-card);
  border-color: var(--text-primary);
}

.page-btn.ellipsis {
  border: none;
  background: transparent;
  cursor: default;
  min-width: auto;
  padding: 8px 4px;
}

.page-btn:disabled {
  cursor: default;
}

/* Loading, error, empty states */
.loading, .error, .empty {
  text-align: center;
  padding: 60px 20px;
  font-size: 1.2rem;
  color: var(--text-secondary);
}

.error {
  color: #ef4444;
}

/* Episodes list */
.episodes-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.episode-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px var(--shadow);
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.episode-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
  border-color: #646cff;
}

.episode-content {
  width: 100%;
}

.episode-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  flex-wrap: wrap;
}

.episode-title-section {
  flex: 1;
  min-width: 250px;
}

.episode-title {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
}

.anime-name {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.episode-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
  text-align: right;
}

.average-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-secondary);
  padding: 6px 12px;
  border-radius: 8px;
  border-left: 4px solid;
  transition: all 0.3s ease;
}

.rating-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.rating-score {
  font-weight: 700;
  font-size: 1.1rem;
  transition: all 0.3s ease;
}

.rated-count {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-secondary);
  padding: 6px 12px;
  border-radius: 8px;
}

.rated-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.rated-value {
  color: var(--text-primary);
  font-weight: 600;
  font-size: 1rem;
}

.episode-date {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .header h1 {
    font-size: 2rem;
  }

  .episode-header {
    flex-direction: column;
  }

  .episode-meta {
    align-items: flex-start;
    text-align: left;
    flex-direction: row;
    width: 100%;
    justify-content: space-between;
  }

  .episode-title {
    font-size: 1.3rem;
  }

  .filter-controls {
    justify-content: stretch;
  }

  .filter-btn {
    flex: 1;
  }
}
</style>