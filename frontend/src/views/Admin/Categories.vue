<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-3xl font-bold">Categories</h2>
      <button @click="openAddModal" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-2xl shadow-md" title="Add Category">
        <font-awesome-icon :icon="['fas', 'plus']" />
      </button>
    </div>

    <!-- Search Bar -->
    <div class="mb-6">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="Search categories by name..." 
        class="w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
    </div>

    <div class="bg-white rounded-2xl shadow overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th @click="sortTable('name')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
              Name
              <span v-if="sortColumn === 'name'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortTable('status')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
              Status
              <span v-if="sortColumn === 'status'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th class="px-6 py-3 text-center text-sm font-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="3" class="px-6 py-8 text-center text-gray-500">
              <div class="flex items-center justify-center">
                <svg class="animate-spin h-5 w-5 mr-3 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading categories...
              </div>
            </td>
          </tr>
          <tr v-else-if="filteredCategories.length === 0">
            <td colspan="3" class="px-6 py-4 text-center text-gray-500">No categories found</td>
          </tr>
          <tr v-else v-for="category in paginatedCategories" :key="category._id" class="border-t hover:bg-gray-50">
            <td class="px-6 py-4">{{ category.name }}</td>
            <td class="px-6 py-4">
              <span :class="getStatusClass(category.status)" class="px-3 py-1 rounded-full text-xs font-bold">
                {{ category.status }}
              </span>
            </td>
            <td class="px-6 py-4 text-center">
              <button v-if="canEditCategory(category)" @click="openEditModal(category)" class="text-blue-500 hover:text-blue-700 mr-3" title="Edit">
                <font-awesome-icon :icon="['fas', 'edit']" />
              </button>
              <span v-else class="text-gray-400 mr-3" title="You cannot edit this category">
                <font-awesome-icon :icon="['fas', 'edit']" />
              </span>
              <button v-if="canDeleteCategory(category)" @click="deleteCategory(category._id)" class="text-red-500 hover:text-red-700" title="Delete">
                <font-awesome-icon :icon="['fas', 'trash']" />
              </button>
              <span v-else class="text-gray-400" title="You cannot delete this category">
                <font-awesome-icon :icon="['fas', 'trash']" />
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      
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
            Showing {{ Math.min((currentPage - 1) * itemsPerPage + 1, filteredCategories.length) }} 
            to {{ Math.min(currentPage * itemsPerPage, filteredCategories.length) }} 
            of {{ filteredCategories.length }} categories
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

    <Modal :is-open="isModalOpen" :title="editingCategory ? 'Edit Category' : 'Add Category'" @close="closeModal">
      <div v-if="isEditingGlobalCategory" class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
        <div class="flex items-start gap-2">
          <font-awesome-icon :icon="['fas', 'exclamation-triangle']" class="text-yellow-600 mt-0.5" />
          <div>
            <p class="text-sm font-bold text-yellow-800">Limited Editing</p>
            <p class="text-xs text-yellow-700">This is a global category. You can only change its status.</p>
          </div>
        </div>
      </div>
      <form @submit.prevent="submitForm">
        <div class="mb-4">
          <label class="block text-sm font-bold mb-2">Name</label>
          <input v-model="form.name" type="text" required :disabled="isEditingGlobalCategory" class="w-full p-3 rounded-xl border border-gray-300" :class="{ 'bg-gray-100': isEditingGlobalCategory }" />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-bold mb-2">Status</label>
          <select v-model="form.status" required class="w-full p-3 rounded-xl border border-gray-300">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
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
        <p class="text-sm font-semibold text-gray-900 mb-2">Are you sure you want to delete this category?</p>
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
import { faEdit, faTrash, faPlus, faExclamationCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'
import axios from 'axios'

library.add(faEdit, faTrash, faPlus, faExclamationCircle, faExclamationTriangle)

const API_URL = import.meta.env.VITE_API_URL
const toast = inject('toast')

const categories = ref([])
const searchQuery = ref('')
const isModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const categoryToDelete = ref(null)
const editingCategory = ref(null)
const form = ref({ name: '', status: 'active' })
const sortColumn = ref('')
const sortDirection = ref('asc')
const isLoading = ref(false)
const currentUserRole = ref('')
const currentUserStore = ref(null)

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)

const canEditCategory = (category) => {
  if (currentUserRole.value === 'Admin') return true
  if (currentUserRole.value === 'Co-Admin') {
    return !category.isGlobal
  }
  return false
}

const canDeleteCategory = (category) => {
  if (currentUserRole.value === 'Admin') return true
  if (currentUserRole.value === 'Co-Admin') {
    return !category.isGlobal
  }
  return false
}

const isEditingGlobalCategory = computed(() => {
  return currentUserRole.value === 'Co-Admin' && editingCategory.value?.isGlobal === true
})

const getStatusClass = (status) => {
  const classes = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const sortedCategories = computed(() => {
  let filtered = categories.value
  
  // Apply role-based filtering
  if (currentUserRole.value === 'Co-Admin' && currentUserStore.value) {
    filtered = filtered.filter(category => {
      // Show global categories (created by Admin)
      if (category.isGlobal) return true
      // Show categories assigned to this Co-Admin's store
      if (category.stores && Array.isArray(category.stores)) {
        return category.stores.some(store => {
          const storeId = typeof store === 'object' ? store._id : store
          return storeId === currentUserStore.value
        })
      }
      return false
    })
  }
  
  if (!sortColumn.value) return filtered
  
  return [...filtered].sort((a, b) => {
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

const filteredCategories = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return sortedCategories.value
  
  return sortedCategories.value.filter(category => {
    return category.name?.toLowerCase().includes(query)
  })
})

const totalPages = computed(() => {
  return Math.ceil(filteredCategories.value.length / itemsPerPage.value)
})

const paginatedCategories = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredCategories.value.slice(start, end)
})

const sortTable = (column) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

const fetchCategories = async () => {
  try {
    isLoading.value = true
    const response = await axios.get(`${API_URL}/categories`)
    if (response.data.success) {
      categories.value = response.data.categories
    }
  } catch (error) {
    console.error('Error fetching categories:', error)
    if (toast) {
      toast('Failed to load categories', 'error')
    }
  } finally {
    isLoading.value = false
  }
}

const openAddModal = () => {
  editingCategory.value = null
  form.value = { name: '', status: 'active' }
  isModalOpen.value = true
}

const openEditModal = (category) => {
  editingCategory.value = category
  form.value = { name: category.name, status: category.status }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  editingCategory.value = null
}

const submitForm = async () => {
  try {
    isLoading.value = true
    
    if (editingCategory.value) {
      // If Co-Admin is editing a global category, only allow status change
      if (isEditingGlobalCategory.value) {
        const response = await axios.put(
          `${API_URL}/categories/${editingCategory.value._id}`,
          { status: form.value.status }
        )
        
        if (response.data.success) {
          const index = categories.value.findIndex(c => c._id === editingCategory.value._id)
          if (index !== -1) {
            categories.value[index] = response.data.category
          }
          if (toast) {
            toast('Category status updated successfully', 'success')
          }
        }
        closeModal()
        return
      }
      
      // Update existing category (full edit)
      const response = await axios.put(
        `${API_URL}/categories/${editingCategory.value._id}`,
        { name: form.value.name, status: form.value.status }
      )
      
      if (response.data.success) {
        const index = categories.value.findIndex(c => c._id === editingCategory.value._id)
        if (index !== -1) {
          categories.value[index] = response.data.category
        }
        if (toast) {
          toast('Category updated successfully', 'success')
        }
      }
    } else {
      // Create new category
      const categoryData = {
        name: form.value.name,
        status: form.value.status
      }
      
      // Add store assignment based on role
      if (currentUserRole.value === 'Co-Admin' && currentUserStore.value) {
        categoryData.stores = [currentUserStore.value]
        categoryData.isGlobal = false
      } else if (currentUserRole.value === 'Admin') {
        // Admin creates global categories by default (no store assignment)
        categoryData.stores = []
        categoryData.isGlobal = true
      }
      
      const response = await axios.post(`${API_URL}/categories`, categoryData)
      
      if (response.data.success) {
        categories.value.push(response.data.category)
        if (toast) {
          toast('Category created successfully', 'success')
        }
      }
    }
    
    closeModal()
  } catch (error) {
    console.error('Error saving category:', error)
    if (toast) {
      toast(error.response?.data?.message || 'Failed to save category', 'error')
    }
  } finally {
    isLoading.value = false
  }
}

const deleteCategory = (id) => {
  const category = categories.value.find(c => c._id === id)
  if (!canDeleteCategory(category)) {
    toast('You cannot delete this category', 'error')
    return
  }
  categoryToDelete.value = id
  isDeleteModalOpen.value = true
}

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false
  categoryToDelete.value = null
}

const confirmDelete = async () => {
  if (!categoryToDelete.value) return
  
  try {
    isLoading.value = true
    const response = await axios.delete(`${API_URL}/categories/${categoryToDelete.value}`)
    
    if (response.data.success) {
      const index = categories.value.findIndex(c => c._id === categoryToDelete.value)
      if (index !== -1) {
        categories.value.splice(index, 1)
      }
      if (toast) {
        toast('Category deleted successfully', 'success')
      }
    }
    closeDeleteModal()
  } catch (error) {
    console.error('Error deleting category:', error)
    if (toast) {
      toast(error.response?.data?.message || 'Failed to delete category', 'error')
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  // Get current user info from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  currentUserRole.value = currentUser.role || 'Admin'
  currentUserStore.value = currentUser.store?._id || null
  
  fetchCategories()
})
</script>
