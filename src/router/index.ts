import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import UserRatedAnime from '../views/UserRatedAnime.vue'
import ActiveUsers from '../views/ActiveUsers.vue'  // <-- НОВЫЙ ИМПОРТ
import EpisodeSelectView from '../components/EpisodeSelectView.vue'
import AnimeEpisodeRatings from '../components/AnimeEpisodeRatings.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/user/anime/:userId', component: UserRatedAnime, props: true },
  { path: '/active-users', component: ActiveUsers },  // <-- НОВЫЙ РОУТ
  {
    path: '/anime/:id',
    name: 'AnimeEpisodes',
    component: EpisodeSelectView,
    props: route => ({
      animeId: Number(route.params.id),
      ratedEpisodeNumbers: [] 
    })
  },
  {
    path: '/user/anime/:userId/:animeId',
    name: 'AnimeEpisodeRatings',
    component: AnimeEpisodeRatings,
  }
]

export default createRouter({
  history: createWebHistory(),
  routes
})