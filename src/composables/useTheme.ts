import { ref, computed, onMounted } from 'vue'

type Theme = 'light' | 'dark'

const theme = ref<Theme>('light')

const applyTheme = (newTheme: Theme): void => {
  theme.value = newTheme
  document.documentElement.setAttribute('data-theme', newTheme)
  localStorage.setItem('theme', newTheme)
}

const initTheme = (): void => {
  // Проверяем сохранённую тему или системные настройки
  const savedTheme = localStorage.getItem('theme') as Theme | null
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  
  if (savedTheme) {
    theme.value = savedTheme
  } else if (prefersDark) {
    theme.value = 'dark'
  } else {
    theme.value = 'light'
  }
  
  applyTheme(theme.value)
}

// Инициализируем тему сразу
if (typeof document !== 'undefined') {
  initTheme()
}

export const useTheme = () => {
  const toggleTheme = (): void => {
    const newTheme = theme.value === 'light' ? 'dark' : 'light'
    applyTheme(newTheme)
  }

  return {
    theme,
    toggleTheme,
    isDark: computed(() => theme.value === 'dark'),
  }
}
