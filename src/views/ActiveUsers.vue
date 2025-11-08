<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { hostUrl } from '../composables/getToken'

interface User {
  id: number
  username: string
  total_episodes_rated: number
  created_at: string
}

interface ApiResponse {
  pagination: {
    limit: number
    total: number
    offset: number
  }
  data: User[]
}

const itemsPerPage = 20;
const router = useRouter()
const users = ref<User[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const pagination = ref<ApiResponse['pagination']>({ limit: itemsPerPage, total: 0, offset: 0 })
const currentPage = ref(1)
const totalPages = ref(1)

onMounted(() => {
  loadUsers(1)
})

const loadUsers = async (page: number = 1) => {
  isLoading.value = true
  error.value = null

  try {
    const offset = (page - 1) * itemsPerPage
    const url = `${hostUrl}/api/v1/user/active/?limit=${itemsPerPage}&offset=${offset}`
    const response = await fetch(url)

    if (!response.ok) {
      error.value = 'Не удалось загрузить пользователей'
      return
    }

    const data: ApiResponse = await response.json()
    users.value = data.data
    pagination.value = data.pagination
    currentPage.value = page
    totalPages.value = Math.ceil(data.pagination.total / itemsPerPage)
  } catch {
    error.value = 'Ошибка сети'
  } finally {
    isLoading.value = false
  }
}

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  loadUsers(page)
}

const goToUserProfile = (userId: number) => {
  router.push(`/user/anime/${userId}`)
}

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="active-users-page">
    <div class="container">
      <div class="header">
        <h1>Active Users</h1>
        <button @click="goHome" class="back-btn">Back</button>
      </div>

      <!-- Загрузка / Ошибка -->
      <div v-if="isLoading" class="loading">Загрузка...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="users.length === 0" class="empty">Нет активных пользователей</div>

      <!-- Список пользователей -->
      <div v-else class="users-grid">
        <div
          v-for="user in users"
          :key="user.id"
          class="user-card"
          @click="goToUserProfile(user.id)"
        >
          <h3>{{ user.username }}</h3>
          <p><strong>Rated episodes:</strong> {{ user.total_episodes_rated }}</p>
          <p><strong>Joined:</strong> {{ new Date(user.created_at).toLocaleDateString('ru-RU') }}</p>
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

        <!-- Номера страниц (ограничим до 5) -->
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

      <!-- Инфо о количестве -->
      <div class="pagination-info" v-if="!isLoading && !error">
        Showed {{ users.length }} out of {{ pagination.total }} users
      </div>
    </div>
  </div>
</template>

<style scoped>
.active-users-page {
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
  margin-bottom: 2rem;
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

.loading, .error, .empty {
  text-align: center;
  padding: 40px;
  font-size: 1.2rem;
  color: #666;
}

.error { color: #e74c3c; }

.users-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  margin-bottom: 2rem;
}

.user-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transition: transform 0.2s, background 0.2s;
  cursor: pointer;
}

.user-card:hover {
  transform: translateY(-6px);
  background: #f8f9ff;
}

.user-card h3 {
  margin: 0 0 12px;
  font-size: 1.3rem;
  color: #1a1a1a;
}

.user-card p {
  margin: 8px 0;
  font-size: 1rem;
  color: #444;
}

.user-card p strong {
  color: #213547;
}

/* Пагинация */
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
  font-size: 0.9 Ising;
  margin-top: 1rem;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
</style>