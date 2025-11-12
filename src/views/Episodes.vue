<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { hostUrl } from '../composables/getToken'

const router = useRouter()

interface Episode {
  id: number
  name: string
  number: number
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

const episodes = ref<EpisodeData[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const sortMode = ref<'recent' | 'popular'>('recent')
const pagination = ref<ApiResponse['pagination'] | null>(null)

const loadEpisodes = async () => {
  loading.value = true
  error.value = null
  try {
    const orders = sortMode.value === 'recent' 
      ? { recent: false } 
      : { popular: false }
    
    const url = `${hostUrl}/api/v1/episode/?orders=${encodeURIComponent(JSON.stringify(orders))}`
    
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
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Произошла ошибка'
  } finally {
    loading.value = false
  }
}

const setSortMode = (mode: 'recent' | 'popular') => {
  sortMode.value = mode
  loadEpisodes()
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

onMounted(() => {
  loadEpisodes()
})
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
          @click="setSortMode('recent')"
          :class="{ active: sortMode === 'recent' }"
          class="filter-btn"
        >
          Recent
        </button>
        <button
          @click="setSortMode('popular')"
          :class="{ active: sortMode === 'popular' }"
          class="filter-btn"
        >
          Popular
        </button>
      </div>

      <!-- Pagination info -->
      <div v-if="pagination" class="pagination-info">
        Showing {{ episodes.length }} of {{ pagination.total }} episodes
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
                <div class="rated-count">
                  <span class="rated-label">Rated:</span>
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

/* Pagination info */
.pagination-info {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 24px;
  padding-left: 4px;
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

