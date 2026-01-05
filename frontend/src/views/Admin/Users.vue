<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-3xl font-bold">Users</h2>
      <button @click="openAddModal" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-2xl shadow-md" title="Add User">
        <font-awesome-icon :icon="['fas', 'plus']" />
      </button>
    </div>

    <!-- Search Bar -->
    <div class="mb-6">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="Search by username or role..." 
        class="w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
    </div>

    <div class="bg-white rounded-2xl shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white relative">
          <thead class="bg-gray-200">
            <tr>
              <th @click="sortTable('username')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
                Username
                <span v-if="sortColumn === 'username'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th @click="sortTable('role')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
                Role
                <span v-if="sortColumn === 'role'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th @click="sortTable('store')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
                Store
                <span v-if="sortColumn === 'store'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th class="px-6 py-3 text-center text-sm font-bold sticky right-0 bg-gray-200 shadow-[-2px_0_4px_rgba(0,0,0,0.1)] min-w-[100px]">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in paginatedUsers" :key="user._id" class="border-t hover:bg-gray-50">
            <td class="px-6 py-4">{{ user.username }}</td>
            <td class="px-6 py-4">
              <span :class="getRoleClass(user.role)" class="px-3 py-1 rounded-full text-xs font-bold">
                {{ user.role }}
              </span>
            </td>
            <td class="px-6 py-4">{{ user.store?.storeName || 'N/A' }}</td>
            <td class="px-6 py-4 text-center sticky right-0 bg-white shadow-[-2px_0_4px_rgba(0,0,0,0.1)] whitespace-nowrap min-w-[100px]">
              <button @click="openEditModal(user)" class="text-blue-500 hover:text-blue-700 mr-2" title="Edit">
                <font-awesome-icon :icon="['fas', 'edit']" class="text-lg" />
              </button>
              <button v-if="canDeleteUser(user)" @click="deleteUser(user._id)" class="text-red-500 hover:text-red-700" title="Delete">
                <font-awesome-icon :icon="['fas', 'trash']" class="text-lg" />
              </button>
            </td>
          </tr>
          <tr v-if="filteredUsers.length === 0">
            <td colspan="4" class="px-6 py-4 text-center text-gray-500">No users found</td>
          </tr>
        </tbody>
      </table>
      </div>
      
      <!-- Pagination Controls -->
      <div class="flex justify-between items-center px-6 py-4 bg-gray-50 border-t">
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600">Items per page:</label>
          <select v-model.number="itemsPerPage" @change="currentPage = 1" class="border border-gray-300 rounded px-2 py-1 text-sm">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
          <span class="text-sm text-gray-600 ml-4">
            Showing {{ Math.min((currentPage - 1) * itemsPerPage + 1, filteredUsers.length) }} 
            to {{ Math.min(currentPage * itemsPerPage, filteredUsers.length) }} 
            of {{ filteredUsers.length }} users
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button 
            @click="currentPage = 1" 
            :disabled="currentPage === 1"
            class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
            First
          </button>
          <button 
            @click="currentPage--" 
            :disabled="currentPage === 1"
            class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
            Previous
          </button>
          <span class="text-sm text-gray-600">Page {{ currentPage }} of {{ totalPages }}</span>
          <button 
            @click="currentPage++" 
            :disabled="currentPage >= totalPages"
            class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
            Next
          </button>
          <button 
            @click="currentPage = totalPages" 
            :disabled="currentPage >= totalPages"
            class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
            Last
          </button>
        </div>
      </div>
    </div>

    <Modal :is-open="isModalOpen" :title="editingUser ? 'Edit User' : 'Add User'" @close="closeModal">
      <form @submit.prevent="submitForm">
        <div class="mb-4">
          <label class="block text-sm font-bold mb-2">Username</label>
          <input v-model="form.username" type="text" required class="w-full p-3 rounded-xl border border-gray-300" />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-bold mb-2">Password</label>
          <input v-model="form.password" type="password" :required="!editingUser" :placeholder="editingUser ? 'Leave blank to keep current' : ''" class="w-full p-3 rounded-xl border border-gray-300" />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-bold mb-2">RFID <span class="text-gray-500 text-xs">(Optional)</span></label>
          <input v-model="form.rfid" type="text" placeholder="Scan or enter RFID" class="w-full p-3 rounded-xl border border-gray-300" />
        </div>
        <div class="mb-4" v-if="currentUserRole === 'Admin'">
          <label class="block text-sm font-bold mb-2">Role</label>
          <select v-model="form.role" required class="w-full p-3 rounded-xl border border-gray-300">
            <option value="Admin">Admin</option>
            <option value="Co-Admin">Co-Admin</option>
            <option value="Cashier">Cashier</option>
            <option value="Accounting">Accounting</option>
          </select>
        </div>
        <div class="mb-4" v-if="currentUserRole === 'Co-Admin'">
          <label class="block text-sm font-bold mb-2">Role</label>
          <input type="text" value="Cashier" disabled class="w-full p-3 rounded-xl border border-gray-300 bg-gray-100" />
        </div>
        <div class="mb-4" v-if="currentUserRole === 'Admin'">
          <label class="block text-sm font-bold mb-2">Assign to Store</label>
          <select v-model="form.store" required class="w-full p-3 rounded-xl border border-gray-300">
            <option value="">Select a store</option>
            <option v-for="store in stores" :key="store._id" :value="store._id">
              {{ store.storeName }}
            </option>
          </select>
        </div>
        <div class="mb-4" v-if="currentUserRole === 'Co-Admin'">
          <label class="block text-sm font-bold mb-2">Assigned Store</label>
          <input type="text" :value="stores.find(s => s._id === currentUserStore)?.storeName || 'N/A'" disabled class="w-full p-3 rounded-xl border border-gray-300 bg-gray-100" />
        </div>
        <div class="flex gap-4">
          <button type="button" @click="closeModal" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
          <button type="submit" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-2xl">Save</button>
        </div>
      </form>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal :is-open="isDeleteModalOpen" title="Confirm Delete" size="sm" @close="closeDeleteModal">
      <div class="text-center py-2">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-3">
          <font-awesome-icon :icon="['fas', 'exclamation-circle']" class="text-red-600 text-2xl" />
        </div>
        <p class="text-sm font-semibold text-gray-900 mb-2">Are you sure you want to delete this user?</p>
        <p class="text-xs text-gray-600 mb-4">This action cannot be undone.</p>
        <div class="flex gap-3">
          <button @click="closeDeleteModal" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl text-sm">Cancel</button>
          <button @click="confirmDelete" class="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-2xl text-sm">Delete</button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import Modal from '../../components/Modal.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faEdit, faTrash, faPlus, faExclamationCircle } from '@fortawesome/free-solid-svg-icons'
import { api } from '@/utils/api'
import { auth } from '@/utils/auth'

library.add(faEdit, faTrash, faPlus, faExclamationCircle)
const toast = inject('toast')

const users = ref([])
const stores = ref([])
const searchQuery = ref('')
const isModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const userToDelete = ref(null)
const editingUser = ref(null)
const sortColumn = ref('')
const sortDirection = ref('asc')
const currentUserRole = ref('')
const currentUserStore = ref(null)
const isLoading = ref(false)

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)

const form = ref({
  username: '',
  password: '',
  rfid: '',
  role: 'Cashier',
  store: ''
})

const getRoleClass = (role) => {
  const classes = {
    'Admin': 'bg-purple-100 text-purple-800',
    'Co-Admin': 'bg-blue-100 text-blue-800',
    'Cashier': 'bg-green-100 text-green-800'
  }
  return classes[role] || 'bg-gray-100 text-gray-800'
}

const canAddUser = computed(() => {
  return currentUserRole.value === 'Admin' || currentUserRole.value === 'Co-Admin'
})

const availableRoles = computed(() => {
  if (currentUserRole.value === 'Admin') {
    return ['Admin', 'Co-Admin', 'Cashier']
  } else if (currentUserRole.value === 'Co-Admin') {
    return ['Cashier']
  }
  return []
})

const canDeleteUser = (user) => {
  // Admin can delete anyone except themselves
  if (currentUserRole.value === 'Admin') return true
  // Co-admin can only delete cashiers in their store
  if (currentUserRole.value === 'Co-Admin' && user.role === 'Cashier' && user.store?._id === currentUserStore.value) {
    return true
  }
  return false
}

const sortedUsers = computed(() => {
  if (!sortColumn.value) return users.value

  return [...users.value].sort((a, b) => {
    let aVal = a[sortColumn.value]
    let bVal = b[sortColumn.value]

    // Handle nested store.storeName
    if (sortColumn.value === 'store') {
      aVal = a.store?.storeName || ''
      bVal = b.store?.storeName || ''
    }

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }

    if (sortDirection.value === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
    }
  })
})

const filteredUsers = computed(() => {
  let filtered = sortedUsers.value
  
  // Apply role-based filtering
  if (currentUserRole.value === 'Admin') {
    filtered = sortedUsers.value
  } else if (currentUserRole.value === 'Co-Admin') {
    filtered = sortedUsers.value.filter(u => u.store?._id === currentUserStore.value)
  } else {
    filtered = []
  }
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(user => 
      user.username?.toLowerCase().includes(query) ||
      user.role?.toLowerCase().includes(query) ||
      user.store?.storeName?.toLowerCase().includes(query)
    )
  }
  
  return filtered
})

const totalPages = computed(() => {
  return Math.ceil(filteredUsers.value.length / itemsPerPage.value)
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredUsers.value.slice(start, end)
})

const availableStores = computed(() => {
  // Admin can assign to any store
  if (currentUserRole.value === 'Admin') return stores.value
  // Co-admin can only assign to their own store
  if (currentUserRole.value === 'Co-Admin' && currentUserStore.value) {
    return stores.value.filter(s => s._id === currentUserStore.value)
  }
  return []
})

const fetchUsers = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/users')
    if (response.data.success) {
      users.value = response.data.users
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    if (toast) {
      toast('Failed to load users', 'error')
    }
  } finally {
    isLoading.value = false
  }
}

const fetchStores = async () => {
  try {
    const response = await api.get('/stores')
    if (response.data.success) {
      stores.value = response.data.stores
    }
  } catch (error) {
    console.error('Error fetching stores:', error)
  }
}

const openAddModal = () => {
  editingUser.value = null
  // Set default store based on role
  const defaultStoreId = currentUserRole.value === 'Co-Admin' ? currentUserStore.value : ''
  form.value = { 
    username: '', 
    password: '', 
    rfid: '',
    role: 'Cashier', // Default role is always Cashier
    store: defaultStoreId
  }
  isModalOpen.value = true
}

const openEditModal = (user) => {
  editingUser.value = user
  form.value = { 
    username: user.username,
    password: '',
    rfid: user.rfid || '',
    role: user.role,
    store: user.store?._id || ''
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  editingUser.value = null
}

const submitForm = async () => {
  try {
    if (editingUser.value) {
      // Update user - prepare data without empty password
      const updateData = { ...form.value }
      if (!updateData.password) {
        delete updateData.password
      }
      
      const response = await api.put(`/users/${editingUser.value._id}`, updateData)
      if (response.data.success) {
        // Refetch users to get properly populated data
        await fetchUsers()
        if (toast) {
          toast('User updated successfully', 'success')
        }
      }
    } else {
      // Add user
      const response = await api.post('/users', form.value)
      if (response.data.success) {
        // Refetch users to get properly populated data
        await fetchUsers()
        if (toast) {
          toast('User added successfully', 'success')
        }
      }
    }
    closeModal()
  } catch (error) {
    console.error('Error saving user:', error)
    if (toast) {
      toast(error.response?.data?.message || 'Failed to save user', 'error')
    }
  }
}

const deleteUser = (id) => {
  userToDelete.value = id
  isDeleteModalOpen.value = true
}

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false
  userToDelete.value = null
}

const confirmDelete = async () => {
  if (!userToDelete.value) return
  
  try {
    const response = await api.delete(`/users/${userToDelete.value}`)
    if (response.data.success) {
      const index = users.value.findIndex(u => u._id === userToDelete.value)
      if (index !== -1) {
        users.value.splice(index, 1)
      }
      if (toast) {
        toast('User deleted successfully', 'success')
      }
    }
    closeDeleteModal()
  } catch (error) {
    console.error('Error deleting user:', error)
    if (toast) {
      toast(error.response?.data?.message || 'Failed to delete user', 'error')
    }
  }
}

onMounted(() => {
  // Get current user info from auth
  const currentUser = auth.getUser() || {}
  currentUserRole.value = currentUser.role || 'Admin'
  currentUserStore.value = currentUser.store?._id || null

  fetchStores()
  fetchUsers()
})
</script>
