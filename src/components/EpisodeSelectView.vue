<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { AnimeItem } from '../composables/useAnimeSearch'
import EpisodeRatingPanel, { type EpisodeRating } from './EpisodeRatingPanel.vue'
import { getTokenFromCookies, hostUrl } from '../composables/getToken'
import router from '../router'

interface Episode {
  mal_id: number
  title: string
  aired?: string
  filler?: boolean
  recap?: boolean
  [key: string]: any
}

interface EpisodeResponse {
  data: Episode[]
}

interface SingleAnimeResponse {
  data: AnimeItem
}

interface Props {
  animeId: number
}

const ratedEpisodeNumbers = ref<number[]>([]);

interface Emits {
  (e: 'back'): void
  (e: 'updateRatedEpisodes', newList: number[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const anime = ref<AnimeItem | null>(null)
const episodes = ref<Episode[]>([])
const isLoading = ref<boolean>(true)
const selectedEpisode = ref<number | null>(null)
const showRatingPanel = ref<boolean>(false)
const ratingEpisodeId = ref<number | null>(null)
const ratingEpisodeTitle = ref<string>('')


onMounted(async () => {
  const animeData = await loadAnimeInfo()
  await Promise.all([loadRatedEpisodes(), loadEpisodes(animeData)])
})

const loadAnimeInfo = async (): Promise<AnimeItem> => {
    const response = await fetch(`https://api.jikan.moe/v4/anime/${props.animeId}`)
    if (!response.ok) {
      throw new Error('Не удалось загрузить информацию об аниме')
    }
    const data: SingleAnimeResponse = await response.json()
    anime.value = data.data
    return data.data
}

const loadEpisodes = async (animeData: AnimeItem): Promise<void> => {
  try {
    console.log('blah blah', animeData)
    if (animeData.type === "Movie" || animeData.type === "TV Special") {
        episodes.value = [{
          mal_id: 1,
          title: animeData.title_english || animeData.title || 'Anime.'
        }]
        return
    }
    isLoading.value = true
    const response = await fetch(`https://api.jikan.moe/v4/anime/${props.animeId}/episodes`)
    if (!response.ok) {
      throw new Error('Error while fetching episode data')
    }
    const data: EpisodeResponse = await response.json()
    episodes.value = data.data || []
  } catch (error) {
    console.error('Ошибка загрузки эпизодов:', error)
  } finally {
    isLoading.value = false
  }
}

const loadRatedEpisodes = async () => {
  const response = await fetch(
    `${hostUrl}/api/v1/episode/${props.animeId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getTokenFromCookies()
      },
    }
  )
  if (!response.ok) {
    throw new Error('Не удалось получить список оценённых эпизодов')
  }
  const data: number[] = await response.json()
  //emit('updateRatedEpisodes', data)
  ratedEpisodeNumbers.value = data
}

const selectEpisode = (episodeNumber: number): void => {
  selectedEpisode.value = episodeNumber
  const episode = episodes.value.find((ep) => ep.mal_id === episodeNumber)
  if (episode) {
    ratingEpisodeId.value = episode.mal_id
    ratingEpisodeTitle.value = episode.title || 'Без названия'
    showRatingPanel.value = true
  }
}

const handleRatingClose = (): void => {
  showRatingPanel.value = false
  ratingEpisodeId.value = null
  ratingEpisodeTitle.value = ''
}

const handleRate = (rating: EpisodeRating): void => {
  console.log('Rating submitted:', rating)
  // await submitRating(rating)
  
  // Закрываем панель после оценки
  handleRatingClose()
  selectedEpisode.value = null
}


const getAnimeTitle = (): string => {
  return anime.value?.title_english || anime.value?.title || 'Loading...'
}
</script>

<template>
  <div class="episode-select-page">
    <div class="container">


      <div v-if="isLoading" class="loading">
        <div class="loader"></div>
        <p>Collecting episodes data...</p>
      </div>

      <div v-else class="content">
        <h1 class="anime-title">{{ getAnimeTitle() }}</h1>

        <div v-if="episodes.length === 0" class="no-episodes">
          <p>Episodes not found</p>
        </div>

        <div v-else class="episodes-grid">
          <div
            v-for="episode in episodes"
            :key="episode.mal_id"
            @click="selectEpisode(episode.mal_id)"
            :class="['episode-card', { selected: selectedEpisode === episode.mal_id }]"
          >
            <div class="episode-number">
              Episode {{ episode.mal_id }}
              <span v-if="ratedEpisodeNumbers.includes(episode.mal_id)" class="rated-check">
                ✔️
              </span>
            </div>
            <div class="episode-title">
              {{ episode.title || 'Без названия' }}
            </div>
            <div v-if="episode.filler || episode.recap" class="episode-badges">
              <span v-if="episode.filler" class="badge filler">Филлер</span>
              <span v-if="episode.recap" class="badge recap">Резюме</span>
            </div>
          </div>
        </div>

      </div>
    </div>

    <EpisodeRatingPanel
      v-if="showRatingPanel && ratingEpisodeId !== null"
      :episode-id="ratingEpisodeId"
      :episode-title="ratingEpisodeTitle"
      :anime-id="anime?.mal_id"
      :anime-title="anime?.title_english"
      @updateRatedEpisodes="val => ratedEpisodeNumbers.push(val)"
      @close="handleRatingClose"
      @rate="handleRate"
    />
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.episode-select-page {
  min-height: 100vh;
  background: linear-gradient(-45deg, #F8E8F2, #E6F0FA, #F0E6F5, #E0F0F8);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  padding: 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.back-button {
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 500;
  color: #213547;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
}

.back-button:hover {
  background: rgba(255, 255, 255, 1);
  border-color: #646cff;
  transform: translateX(-4px);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #213547;
}

.loader {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(100, 108, 255, 0.2);
  border-top-color: #646cff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

.content {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 24px;
  padding: 32px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.anime-title {
  font-size: 2.5rem;
  font-weight: 600;
  color: #213547;
  margin-bottom: 32px;
  text-align: center;
}

.no-episodes {
  text-align: center;
  padding: 48px;
  color: #666;
}

.episodes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.episode-card {
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.episode-card:hover {
  border-color: #646cff;
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(100, 108, 255, 0.2);
}

.episode-card.selected {
  border-color: #646cff;
  background: rgba(100, 108, 255, 0.1);
  box-shadow: 0 0 20px rgba(100, 108, 255, 0.3);
}

.episode-number {
  font-weight: 600;
  color: #646cff;
  font-size: 1.1rem;
  margin-bottom: 8px;
}

.episode-title {
  color: #213547;
  font-size: 0.95rem;
  line-height: 1.4;
  margin-bottom: 8px;
}

.episode-badges {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.badge {
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge.filler {
  background: rgba(255, 193, 7, 0.2);
  color: #f57c00;
}

.badge.recap {
  background: rgba(158, 158, 158, 0.2);
  color: #616161;
}

.selected-info {
  text-align: center;
  padding: 24px;
  background: rgba(100, 108, 255, 0.1);
  border-radius: 16px;
  border: 2px solid #646cff;
}

.selected-info p {
  font-size: 1.1rem;
  font-weight: 500;
  color: #213547;
  margin-bottom: 16px;
}

.rate-button {
  background: #646cff;
  border: none;
  border-radius: 12px;
  padding: 12px 32px;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.rate-button:hover {
  background: #535bf2;
  transform: scale(1.05);
}

/* Адаптивность */
@media (max-width: 768px) {
  .anime-title {
    font-size: 2rem;
  }

  .episodes-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
  }

  .content {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .anime-title {
    font-size: 1.5rem;
  }

  .episodes-grid {
    grid-template-columns: 1fr;
  }

  .episode-select-page {
    padding: 16px;
  }
}
</style>
