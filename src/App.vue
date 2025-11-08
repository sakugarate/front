<script setup lang="ts">
import { ref } from 'vue'
import SideBar from './components/SideBar.vue'
import LoginModal from './components/LoginModal.vue'
import { getUserIdFromCookies, getUsernameFromCookies } from './composables/getToken'
import { useRouter } from 'vue-router'

const router = useRouter()

const isSidebarOpen = ref(false)
const isLoginModalOpen = ref(false)
const userName = ref(getUsernameFromCookies())

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const openRatedAnime = () => {
  const userId = getUserIdFromCookies()
  if (userId) {
    router.push(`/user/anime/${userId}`)
  }
  isSidebarOpen.value = false
}

// <-- НОВЫЙ ОБРАБОТЧИК
const openActiveUsers = () => {
  router.push('/active-users')
  isSidebarOpen.value = false
}

const openLoginModal = () => {
  isLoginModalOpen.value = true
}

const closeLoginModal = (email: string) => {
  isLoginModalOpen.value = false
  userName.value = email.split('@')[0]
}
</script>

<template>
  <div id="app">
    <router-view />

    <SideBar
      :is-open="isSidebarOpen"
      @toggle="toggleSidebar"
      @open-rated="openRatedAnime"
      @open-active-users="openActiveUsers" 
    />

    <button @click="openLoginModal" class="login-button">
      {{ userName }}
    </button>

    <LoginModal
      :isOpen="isLoginModalOpen"
      :close-modal="closeLoginModal"
      :userName="userName"
      @closeModal="closeLoginModal"
    />
  </div>
</template>

<style scoped>
.login-button {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  z-index: 1001;
  cursor: pointer;
}
</style>