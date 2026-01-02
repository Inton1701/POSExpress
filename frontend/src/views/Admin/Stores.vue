<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-3xl font-bold">Stores</h2>
      <button @click="openAddModal" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-2xl shadow-md" title="Add Store">
        <font-awesome-icon :icon="['fas', 'plus']" />
      </button>
    </div>

    <!-- Search Bar -->
    <div class="mb-6">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="Search by store name, address, or contact..." 
        class="w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
    </div>

    <div class="bg-white rounded-2xl shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full relative">
        <thead class="bg-gray-50">
          <tr>
            <th @click="sortTable('storeName')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
              Store Name
              <span v-if="sortColumn === 'storeName'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortTable('address')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
              Address
              <span v-if="sortColumn === 'address'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortTable('contact')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
              Contact
              <span v-if="sortColumn === 'contact'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th class="px-6 py-3 text-center text-sm font-bold sticky right-0 bg-gray-50 shadow-[-2px_0_4px_rgba(0,0,0,0.1)] min-w-[100px]">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="store in paginatedStores" :key="store._id" class="border-t hover:bg-gray-50">
            <td class="px-6 py-4">{{ store.storeName }}</td>
            <td class="px-6 py-4">{{ store.address || 'N/A' }}</td>
            <td class="px-6 py-4">{{ store.contact || 'N/A' }}</td>
            <td class="px-6 py-4 text-center sticky right-0 bg-white group-hover:bg-gray-50 shadow-[-2px_0_4px_rgba(0,0,0,0.1)] whitespace-nowrap min-w-[100px]">
              <button @click="openEditModal(store)" class="text-blue-500 hover:text-blue-700 mr-2" title="Edit">
                <font-awesome-icon :icon="['fas', 'edit']" class="text-lg" />
              </button>
              <button @click="deleteStore(store._id)" class="text-red-500 hover:text-red-700" title="Delete">
                <font-awesome-icon :icon="['fas', 'trash']" class="text-lg" />
              </button>
            </td>
          </tr>
          <tr v-if="filteredStores.length === 0">
            <td colspan="4" class="px-6 py-4 text-center text-gray-500">No stores found</td>
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
            Showing {{ Math.min((currentPage - 1) * itemsPerPage + 1, filteredStores.length) }} 
            to {{ Math.min(currentPage * itemsPerPage, filteredStores.length) }} 
            of {{ filteredStores.length }} stores
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

    <Modal :is-open="isModalOpen" :title="editingStore ? 'Edit Store' : 'Add Store'" @close="closeModal">
      <form @submit.prevent="submitForm">
        <div class="mb-4">
          <label class="block text-sm font-bold mb-2">Store Name</label>
          <input v-model="form.storeName" type="text" required class="w-full p-3 rounded-xl border border-gray-300" />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-bold mb-2">Address</label>
          <input v-model="form.address" type="text" class="w-full p-3 rounded-xl border border-gray-300" />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-bold mb-2">Contact</label>
          <input v-model="form.contact" type="text" class="w-full p-3 rounded-xl border border-gray-300" />
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
        <p class="text-sm font-semibold text-gray-900 mb-2">Are you sure you want to delete this store?</p>
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
import { ref, onMounted, computed, inject } from 'vue'
import Modal from '../../components/Modal.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faEdit, faTrash, faPlus, faExclamationCircle } from '@fortawesome/free-solid-svg-icons'
import { api } from '@/utils/api'
import { auth } from '@/utils/auth'

library.add(faEdit, faTrash, faPlus, faExclamationCircle)
const toast = inject('toast')

const stores = ref([])
const isModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const storeToDelete = ref(null)
const editingStore = ref(null)
const sortColumn = ref('')
const sortDirection = ref('asc')
const isLoading = ref(false)
const searchQuery = ref('')

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)

const form = ref({
  storeName: '',
  address: '',
  contact: ''
})

const sortTable = (column) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

const sortedStores = computed(() => {
  if (!sortColumn.value) return stores.value
  
  return [...stores.value].sort((a, b) => {
    let aVal = a[sortColumn.value]
    let bVal = b[sortColumn.value]
    
    if (aVal === null || aVal === undefined) aVal = ''
    if (bVal === null || bVal === undefined) bVal = ''
    
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

const filteredStores = computed(() => {
  if (!searchQuery.value) return sortedStores.value
  
  const query = searchQuery.value.toLowerCase().trim()
  return sortedStores.value.filter(store =>
    store.storeName?.toLowerCase().includes(query) ||
    store.address?.toLowerCase().includes(query) ||
    store.contact?.toLowerCase().includes(query)
  )
})

const totalPages = computed(() => {
  return Math.ceil(filteredStores.value.length / itemsPerPage.value)
})

const paginatedStores = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredStores.value.slice(start, end)
})

const fetchStores = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/stores')
    if (response.data.success) {
      stores.value = response.data.stores
    }
  } catch (error) {
    console.error('Error fetching stores:', error)
    if (toast) {
      toast('Failed to load stores', 'error')
    }
  } finally {
    isLoading.value = false
  }
}

const openAddModal = () => {
  editingStore.value = null
  form.value = { storeName: '', address: '', contact: '' }
  isModalOpen.value = true
}

const openEditModal = (store) => {
  editingStore.value = store
  form.value = { 
    storeName: store.storeName,
    address: store.address,
    contact: store.contact
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  editingStore.value = null
}

const submitForm = async () => {
  try {
    if (editingStore.value) {
      // Update store
      const response = await api.put(`/stores/${editingStore.value._id}`, form.value)
      if (response.data.success) {
        const index = stores.value.findIndex(s => s._id === editingStore.value._id)
        if (index !== -1) {
          stores.value[index] = response.data.store
        }
        if (toast) {
          toast('Store updated successfully', 'success')
        }
      }
    } else {
      // Add store
      const response = await api.post('/stores', form.value)
      if (response.data.success) {
        stores.value.push(response.data.store)
        if (toast) {
          toast('Store added successfully', 'success')
        }
      }
    }
    closeModal()
  } catch (error) {
    console.error('Error saving store:', error)
    if (toast) {
      toast(error.response?.data?.message || 'Failed to save store', 'error')
    }
  }
}

const deleteStore = (id) => {
  storeToDelete.value = id
  isDeleteModalOpen.value = true
}

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false
  storeToDelete.value = null
}

const confirmDelete = async () => {
  if (!storeToDelete.value) return
  
  try {
    const response = await api.delete(`/stores/${storeToDelete.value}`)
    if (response.data.success) {
      const index = stores.value.findIndex(s => s._id === storeToDelete.value)
      if (index !== -1) {
        stores.value.splice(index, 1)
      }
      if (toast) {
        toast('Store deleted successfully', 'success')
      }
    }
    closeDeleteModal()
  } catch (error) {
    console.error('Error deleting store:', error)
    if (toast) {
      toast(error.response?.data?.message || 'Failed to delete store', 'error')
    }
  }
}

onMounted(() => {
  fetchStores()
})
</script>
