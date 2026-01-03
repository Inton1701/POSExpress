<template>
  <aside :class="isCollapsed ? 'w-20' : 'w-64'" class="bg-white shadow-lg min-h-screen transition-all duration-300">
    <div class="p-6">
      <div class="mb-8">
        <div v-if="!isCollapsed" class="flex items-center justify-between">
          <img src="/logo.png" alt="PosXpress" class="h-12 w-auto" />
          <button @click="toggleSidebar" class="p-2 hover:bg-gray-100 rounded-lg transition" title="Toggle Sidebar">
            <font-awesome-icon :icon="['fas', 'times']" class="text-gray-600" />
          </button>
        </div>
        <div v-else class="flex flex-col items-center gap-2">
          <img src="/logo-small.png" alt="PosXpress" class="h-10 w-auto" />
          <button @click="toggleSidebar" class="p-2 hover:bg-gray-100 rounded-lg transition" title="Toggle Sidebar">
            <font-awesome-icon :icon="['fas', 'bars']" class="text-gray-600" />
          </button>
        </div>
      </div>
      <nav class="space-y-2">
        <router-link 
          v-for="item in visibleMenuItems" 
          :key="item.name" 
          :to="item.path" 
          class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-green-50 transition" 
          :class="{ 'bg-green-500 text-white': isActive(item.path), 'justify-center': isCollapsed }"
          :title="isCollapsed ? item.name : ''"
        >
          <font-awesome-icon :icon="item.icon" :class="isActive(item.path) ? 'text-white' : 'text-gray-400'" />
          <span v-if="!isCollapsed">{{ item.name }}</span>
        </router-link>
        
        <!-- POS Link for Co-Admin -->
        <router-link 
          v-if="userRole === 'Co-Admin'" 
          to="/pos" 
          class="flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-blue-600 transition bg-blue-500 text-white mt-4" 
          :class="isCollapsed ? 'justify-center' : 'justify-center'"
          :title="isCollapsed ? 'Open POS' : ''"
        >
          <font-awesome-icon :icon="['fas', 'cash-register']" />
          <span v-if="!isCollapsed">Open POS</span>
        </router-link>
      </nav>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { 
  faTachometerAlt, 
  faChartLine, 
  faStore, 
  faBox, 
  faBoxes,
  faTags, 
  faLayerGroup, 
  faExchangeAlt, 
  faUsers, 
  faUserFriends,
  faCashRegister,
  faBars,
  faTimes,
  faPuzzlePiece,
  faCog
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faTachometerAlt, 
  faChartLine, 
  faStore, 
  faBox, 
  faBoxes,
  faTags, 
  faLayerGroup, 
  faExchangeAlt, 
  faUsers, 
  faUserFriends,
  faCashRegister,
  faBars,
  faTimes,
  faPuzzlePiece,
  faCog
)

const route = useRoute()
const userRole = ref('')
const isCollapsed = ref(false)

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

const panelTitle = computed(() => {
  return userRole.value === 'Co-Admin' ? 'Store Panel' : 'Admin Panel'
})

// All menu items with role restrictions
const allMenuItems = [
  { name: 'Dashboards', path: '/admin/dashboard', icon: ['fas', 'tachometer-alt'], roles: ['Admin', 'Co-Admin'] },
  { name: 'Sales', path: '/admin/sales', icon: ['fas', 'chart-line'], roles: ['Admin', 'Co-Admin'] },
  { name: 'Stores', path: '/admin/stores', icon: ['fas', 'store'], roles: ['Admin'] },
  { name: 'Products', path: '/admin/products', icon: ['fas', 'box'], roles: ['Admin', 'Co-Admin'] },
  { name: 'Manage Stocks', path: '/admin/manage-stocks', icon: ['fas', 'boxes'], roles: ['Admin', 'Co-Admin'] },
  { name: 'Categories', path: '/admin/categories', icon: ['fas', 'tags'], roles: ['Admin', 'Co-Admin'] },
  { name: 'Add-ons', path: '/admin/addons', icon: ['fas', 'puzzle-piece'], roles: ['Admin', 'Co-Admin'] },
  { name: 'Transactions', path: '/admin/transactions', icon: ['fas', 'exchange-alt'], roles: ['Admin', 'Co-Admin'] },
  { name: 'Users', path: '/admin/users', icon: ['fas', 'users'], roles: ['Admin', 'Co-Admin'] },
  { name: 'Customers', path: '/admin/customers', icon: ['fas', 'user-friends'], roles: ['Admin'] },
  { name: 'Settings', path: '/admin/settings', icon: ['fas', 'cog'], roles: ['Admin', 'Co-Admin'] }
]

const visibleMenuItems = computed(() => {
  return allMenuItems.filter(item => item.roles.includes(userRole.value))
})

onMounted(() => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  userRole.value = user.role || ''
})

const isActive = (path) => {
  return route.path === path
}
</script>
