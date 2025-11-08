<template>
  <div class="modal" v-if="isOpen">
    <div class="modal-content">
      <span class="close" @click="closeModal">&times;</span>
      <h2> Login </h2>
      <form @submit.prevent="handleLogin">
        <input type="email" v-model="email" placeholder="Email" required />
        <input type="password" v-model="password" placeholder="Password" required />
        <button type="submit">Login</button>
      </form>
      <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref } from 'vue';
import { hostUrl } from '../composables/getToken';

const props = defineProps({
  isOpen: Boolean,
  closeModal: Function,
  userName: String
});

const email = ref('');
const password = ref('');
const errorMessage = ref('');

const handleLogin = async () => {
    const response = await fetch(`${hostUrl}/api/v1/auth/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value
      })
    });
    if (!response.ok) {
      throw new Error('Invalid email or password.');
    }
    const data = await response.json();
    document.cookie = `token=${data.token}; path=/;`;
    document.cookie = `username=${email.value.split('@')[0]}; path=/;`;
    document.cookie = `user_id=${data.user_id}; path=/;`;
    props?.closeModal(email.value)
};
</script>


<style scoped>
.modal {
  position: fixed;
  z-index: 2000;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: relative;
}
.close {
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
}
</style>