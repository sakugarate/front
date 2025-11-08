<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getTokenFromCookies, hostUrl } from '../composables/getToken';
import { ratingOptionsToNums, ratingOptions, getRatingColor, RatingValue } from '../composables/buttonColors';



interface Rate {
  criteria_id: number;
  score: number;
}
interface Anime {
  mal_id: number;
  name: string;
}
interface Episode {
  title: string;
  number: number;
  anime_id: number;
}
export interface EpisodeRating {
  anime: Anime;
  episode: Episode;
  rates: Rate[];
}

interface Props {
  episodeId: number
  episodeTitle: string
  animeId?: number
  animeTitle?: string
}

interface Emits {
  (e: 'close'): void
  (e: 'rate', rating: EpisodeRating): void
  (e: 'updateRatedEpisodes', newList: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

interface CriteriaResponse {
  id: number
  name: string
}

async function getDefaultRatings(): Promise<{ ratings: Record<string, RatingValue>, nameCriteriaToId: Record<string, number> }> {
  const response: CriteriaResponse[] = await fetch(`${hostUrl}/api/v1/criteria/`)
    .then(res => res.json());
  const ratings: Record<string, RatingValue> = {};
  const nameCriteriaToId: Record<string, number> = {};
  for (const criterion of response) {
    ratings[criterion.name] = 'whatever';
    nameCriteriaToId[criterion.name] = criterion.id;
  }
  return { ratings, nameCriteriaToId };
}

/* ---------- Состояние ---------- */
let ratings = ref<Record<string, RatingValue>>({});
let nameCriteriaToId = ref<Record<string, number>>({});
let criteria = ref<string[]>([]);           
let activeCriteria = ref<string[]>([]);    
const showMessage = ref(false);


/* ---------- Инициализация ---------- */
onMounted(async () => {
  const { ratings: fetchedRatings, nameCriteriaToId: fetchedNameCriteriaToId } = await getDefaultRatings();

  ratings.value = fetchedRatings;
  nameCriteriaToId.value = fetchedNameCriteriaToId;

  const keys: string[] = Object.keys(ratings.value);
  criteria.value = keys;
  activeCriteria.value = [...keys];   // изначально все активны

  console.log('Ratings:', ratings.value);
  console.log('Name to ID mapping:', nameCriteriaToId.value);
});


/* Удаление критерия из UI и из отправки */
const removeCriterion = (criterion: string) => {
  activeCriteria.value = activeCriteria.value.filter(c => c !== criterion);
}

/* ---------- Отправка оценки ---------- */
const handleRate = async (): Promise<void> => {
  const reqBody: EpisodeRating = {
    anime: { mal_id: props.animeId || 0, name: props.animeTitle || '' },
    episode: { number: props.episodeId, anime_id: props.animeId || 0, title: props.episodeTitle },
    rates: []
  };

  // Отправляем только активные критерии
  for (const criterion of activeCriteria.value) {
    const value = ratings.value[criterion];
    reqBody.rates.push({
      criteria_id: nameCriteriaToId.value[criterion],
      score: ratingOptionsToNums[value]
    });
  }

  console.log('Sending rating:', reqBody);

  try {
    const response = await fetch(`${hostUrl}/api/v1/rate/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getTokenFromCookies()
      },
      body: JSON.stringify(reqBody),
    });

    if (!response.ok) throw new Error('Network response was not ok');

    emit('rate', reqBody);
    emit('updateRatedEpisodes', props.episodeId);

    showMessage.value = true;
    setTimeout(() => { showMessage.value = false; }, 3000);
  } catch (error) {
    console.error('Error submitting rating:', error);
  }
};

const handleClose = (): void => {
  emit('close')
}

</script>

<template>
  <div class="rating-overlay" @click.self="handleClose">
    <div class="rating-panel">
      <div class="panel-header">
        <h2>Rate Episode {{ episodeId }}</h2>
        <p v-if="episodeTitle" class="episode-title">{{ episodeTitle }}</p>
        <button @click="handleClose" class="close-button">×</button>
      </div>

      <div class="rating-content">
        <!-- Перебираем только активные критерии -->
        <div v-for="criterion in activeCriteria" :key="criterion" class="rating-item">
          <div class="criterion-header">
            <label class="criterion-label">{{ criterion }}</label>
            <button @click="removeCriterion(criterion)" class="remove-criterion">×</button>
          </div>
          <div class="slider-container">
            <input
              type="range"
              :min="0"
              :max="8"
              :value="ratingOptions.indexOf(ratings[criterion])"
              @input="(e) => ratings[criterion] = ratingOptions[parseInt((e.target as HTMLInputElement).value)]"
              class="slider"
              :style="{ '--slider-color': getRatingColor(ratings[criterion]) }"
            />
            <div class="slider-labels">
              <span
                v-for="(option, index) in ratingOptions"
                :key="option"
                :class="['slider-label', { active: ratings[criterion] === option }]"
                @click="ratings[criterion] = option"
              >
                {{ option }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-footer">
        <button @click="handleClose" class="cancel-button">Cancel</button>
        <button @click="handleRate" class="rate-button">Rate</button>
      </div>

      <div v-if="showMessage" class="popup-message">
        Saved successfully
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ----------------- Общие стили (не изменялись) ----------------- */
.rating-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.rating-panel {
  background: linear-gradient(-45deg, #F8E8F2, #E6F0FA, #F0E6F5, #E0F0F8);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  border-radius: 24px;
  padding: 32px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
}
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.5);
}
.panel-header h2 { margin: 0; font-size: 1.75rem; font-weight: 600; color: #213547; flex: 1; }
.episode-title { margin: 8px 0 0 0; font-size: 0.95rem; color: #666; font-weight: normal; }

.close-button {
  background: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 24px;
  line-height: 1;
  color: #213547;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.close-button:hover { background: rgba(255, 255, 255, 1); transform: rotate(90deg); }

.rating-content { margin-bottom: 24px; }
.rating-item { margin-bottom: 32px; }

/* ----------------- Новый блок: заголовок критерия + крестик ----------------- */
.criterion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.criterion-label {
  font-weight: 600;
  color: #213547;
  font-size: 1.1rem;
}
.remove-criterion {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.remove-criterion:hover {
  background: rgba(239, 68, 68, 0.4);
  transform: scale(1.1);
}

/* ----------------- Слайдер (без изменений) ----------------- */
.slider-container { position: relative; }
.slider {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.5);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  margin-bottom: 16px;
  cursor: pointer;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--slider-color, #646cff);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}
.slider::-webkit-slider-thumb:hover { transform: scale(1.2); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
.slider::-moz-range-thumb {
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--slider-color, #646cff);
  cursor: pointer; border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}
.slider::-moz-range-thumb:hover { transform: scale(1.2); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
.slider::-moz-range-track { height: 8px; border-radius: 4px; background: rgba(255, 255, 255, 0.5); }

.slider-labels { display: flex; justify-content: space-between; gap: 8px; }
.slider-label {
  flex: 1;
  text-align: center;
  padding: 8px 4px;
  border-radius: 8px;
  font-size: 0.75rem;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.3);
  text-transform: capitalize;
}
.slider-label:hover { background: rgba(255, 255, 255, 0.5); transform: translateY(-2px); }
.slider-label.active {
  background: rgba(255, 255, 255, 0.9);
  color: #213547;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* ----------------- Футер ----------------- */
.panel-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 2px solid rgba(255, 255, 255, 0.5);
}
.cancel-button, .rate-button {
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}
.cancel-button { background: rgba(255, 255, 255, 0.8); color: #213547; }
.cancel-button:hover { background: rgba(255, 255, 255, 1); transform: translateY(-2px); }
.rate-button { background: #646cff; color: white; }
.rate-button:hover {
  background: #535bf2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(100, 108, 255, 0.4);
}
.rate-button:active { transform: translateY(0); }

/* ----------------- Уведомление ----------------- */
.popup-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  pointer-events: none;
  animation: pop 0.4s ease forwards;
}
@keyframes pop {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

/* ----------------- Адаптивность ----------------- */
@media (max-width: 768px) {
  .rating-panel { padding: 24px; max-width: 100%; }
  .panel-header h2 { font-size: 1.5rem; }
  .slider-label { font-size: 0.7rem; padding: 6px 2px; }
}
@media (max-width: 480px) {
  .rating-panel { padding: 20px; border-radius: 16px; }
  .panel-header h2 { font-size: 1.25rem; }
  .criterion-label { font-size: 1rem; }
  .slider-labels { flex-wrap: wrap; gap: 4px; }
  .slider-label { font-size: 0.65rem; padding: 4px 2px; flex: 1 1 calc(50% - 4px); }
  .panel-footer { flex-direction: column; }
  .cancel-button, .rate-button { width: 100%; }
}
</style>
