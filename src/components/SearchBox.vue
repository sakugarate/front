<script setup lang="ts">
interface Props {
  modelValue: string
  isLoading?: boolean
  placeholder?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'search'): void
  (e: 'keydown', event: KeyboardEvent): void
  (e: 'focus'): void
  (e: 'blur'): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  placeholder: 'Search for an anime...',
})

const emit = defineEmits<Emits>()

const handleInput = (event: Event): void => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const handleSearch = (): void => {
  emit('search')
}

const handleKeyDown = (event: KeyboardEvent): void => {
  emit('keydown', event)
}

const handleFocus = (): void => {
  emit('focus')
}

const handleBlur = (): void => {
  emit('blur')
}
</script>

<template>
  <div class="search-box">
    <input
      type="text"
      :value="modelValue"
      @input="handleInput"
      @keydown="handleKeyDown"
      @focus="handleFocus"
      @blur="handleBlur"
      :placeholder="placeholder"
      class="search-input"
    />
    <button @click="handleSearch" class="search-button" :disabled="isLoading">
      <svg
        v-if="!isLoading"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      <span v-else class="loader"></span>
    </button>
  </div>
</template>

<style scoped>
.search-box {
  display: flex;
  gap: 12px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50px;
  padding: 8px 8px 8px 24px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 160%;
  margin-left: -80px; 
}

.search-box:focus-within {
  border-color: #646cff;
  box-shadow: 0 0 20px rgba(100, 108, 255, 0.3);
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #213547;
  font-size: 1.1rem;
  padding: 12px 0;
}

.search-input::placeholder {
  color: rgba(33, 53, 71, 0.5);
}

.search-button {
  background: #646cff;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  flex-shrink: 0;
}

.search-button:hover {
  background: #535bf2;
  transform: scale(1.05);
}

.search-button:active {
  transform: scale(0.95);
}

.search-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loader {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Адаптивность для мобильных устройств */
@media (max-width: 768px) {
  .search-box {
    padding: 6px 6px 6px 20px;
    border-radius: 40px;
  }

  .search-input {
    font-size: 1rem;
    padding: 10px 0;
  }

  .search-button {
    width: 44px;
    height: 44px;
  }
}

@media (max-width: 480px) {
  .search-box {
    padding: 5px 5px 5px 16px;
    border-radius: 35px;
    gap: 8px;
  }

  .search-input {
    font-size: 0.95rem;
    padding: 8px 0;
  }

  .search-input::placeholder {
    font-size: 0.9rem;
  }

  .search-button {
    width: 40px;
    height: 40px;
  }

  .search-button svg {
    width: 18px;
    height: 18px;
  }
}
</style>
