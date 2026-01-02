<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-3xl font-bold">Customers</h2>
      <button @click="openAddModal" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-2xl shadow-md" title="Add Customer">
        <font-awesome-icon :icon="['fas', 'plus']" />
      </button>
    </div>

    <!-- Search Bar -->
    <div class="mb-6">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="Search by name, email, or RFID..." 
        class="w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
    </div>

    <div class="bg-white rounded-2xl shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full relative">
        <thead class="bg-gray-50">
          <tr>
            <th @click="sortTable('fullName')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
              Name
              <span v-if="sortColumn === 'fullName'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortTable('email')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
              Email
              <span v-if="sortColumn === 'email'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortTable('rfid')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
              RFID
              <span v-if="sortColumn === 'rfid'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortTable('balance')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
              Balance
              <span v-if="sortColumn === 'balance'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th class="px-6 py-3 text-center text-sm font-bold sticky right-0 bg-gray-50 shadow-[-2px_0_4px_rgba(0,0,0,0.1)] min-w-[100px]">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="customer in paginatedCustomers" :key="customer._id" class="border-t hover:bg-gray-50">
            <td class="px-6 py-4">{{ customer.fullName }}</td>
            <td class="px-6 py-4">{{ customer.email }}</td>
            <td class="px-6 py-4">{{ customer.rfid }}</td>
            <td class="px-6 py-4">₱{{ customer.balance.toFixed(2) }}</td>
            <td class="px-6 py-4 text-center sticky right-0 bg-white group-hover:bg-gray-50 shadow-[-2px_0_4px_rgba(0,0,0,0.1)] whitespace-nowrap min-w-[100px]">
              <button @click="openEditModal(customer)" class="text-blue-500 hover:text-blue-700 mr-2" title="Edit">
                <font-awesome-icon :icon="['fas', 'edit']" class="text-lg" />
              </button>
              <button @click="deleteCustomer(customer._id)" class="text-red-500 hover:text-red-700" title="Delete">
                <font-awesome-icon :icon="['fas', 'trash']" class="text-lg" />
              </button>
            </td>
          </tr>
          <tr v-if="filteredCustomers.length === 0">
            <td colspan="5" class="px-6 py-4 text-center text-gray-500">No customers found</td>
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
            Showing {{ Math.min((currentPage - 1) * itemsPerPage + 1, filteredCustomers.length) }} 
            to {{ Math.min(currentPage * itemsPerPage, filteredCustomers.length) }} 
            of {{ filteredCustomers.length }} customers
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

    <Modal :is-open="isModalOpen" :title="editingCustomer ? 'Edit Customer' : 'Add Customer'" @close="closeModal">
      <form @submit.prevent="submitForm">
        <div class="mb-4">
          <label class="block text-sm font-bold mb-2">Full Name</label>
          <input v-model="form.fullName" type="text" required class="w-full p-3 rounded-xl border border-gray-300" />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-bold mb-2">Email</label>
          <input v-model="form.email" type="email" required class="w-full p-3 rounded-xl border border-gray-300" />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-bold mb-2">Password</label>
          <input v-model="form.password" type="password" :required="!editingCustomer" class="w-full p-3 rounded-xl border border-gray-300" />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-bold mb-2">RFID</label>
          <input v-model="form.rfid" type="text" required class="w-full p-3 rounded-xl border border-gray-300" />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-bold mb-2">Birthday</label>
          <input v-model="form.birthday" type="date" required class="w-full p-3 rounded-xl border border-gray-300" />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-bold mb-2">Balance</label>
          <input v-model="form.balance" type="number" step="0.01" required class="w-full p-3 rounded-xl border border-gray-300" />
        </div>
        <div class="flex gap-4">
          <button type="button" @click="closeModal" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
          <button type="submit" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-2xl">Save</button>
        </div>
      </form>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal :is-open="isDeleteModalOpen" title="Confirm Delete" @close="cancelDelete">
      <div class="text-center py-4">
        <div class="mb-4">
          <font-awesome-icon icon="trash" class="text-6xl text-red-500" />
        </div>
        <p class="text-lg text-gray-700 mb-2">Are you sure you want to delete this customer?</p>
        <p class="text-sm text-gray-500">This action cannot be undone.</p>
      </div>
      <div class="flex gap-4 mt-6">
        <button @click="cancelDelete" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
        <button @click="confirmDelete" class="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-2xl">Delete</button>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import Modal from '../../components/Modal.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faEdit, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons'

library.add(faEdit, faTrash, faPlus)

const customers = ref([])
const searchQuery = ref('')
const sortColumn = ref('')
const sortDirection = ref('asc')
const isModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const customerToDelete = ref(null)
const editingCustomer = ref(null)

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)
const form = ref({
  fullName: '',
  email: '',
  password: '',
  rfid: '',
  birthday: '',
  balance: 0
})

const sortTable = (column) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

const sortedCustomers = computed(() => {
  if (!sortColumn.value) return customers.value
  
  return [...customers.value].sort((a, b) => {
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

const filteredCustomers = computed(() => {
  if (!searchQuery.value) return sortedCustomers.value
  
  const query = searchQuery.value.toLowerCase().trim()
  return sortedCustomers.value.filter(customer =>
    customer.fullName?.toLowerCase().includes(query) ||
    customer.email?.toLowerCase().includes(query) ||
    customer.rfid?.toLowerCase().includes(query)
  )
})

const totalPages = computed(() => {
  return Math.ceil(filteredCustomers.value.length / itemsPerPage.value)
})

const paginatedCustomers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredCustomers.value.slice(start, end)
})

const openAddModal = () => {
  editingCustomer.value = null
  form.value = { fullName: '', email: '', password: '', rfid: '', birthday: '', balance: 0 }
  isModalOpen.value = true
}

const openEditModal = (customer) => {
  editingCustomer.value = customer
  form.value = { ...customer, password: '' }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  editingCustomer.value = null
}

const submitForm = () => {
  if (editingCustomer.value) {
    const index = customers.value.findIndex(c => c._id === editingCustomer.value._id)
    if (index !== -1) {
      customers.value[index] = { ...editingCustomer.value, ...form.value }
    }
  } else {
    customers.value.push({ _id: Date.now(), ...form.value })
  }
  closeModal()
}

const deleteCustomer = (id) => {
  customerToDelete.value = id
  isDeleteModalOpen.value = true
}

const confirmDelete = () => {
  if (customerToDelete.value) {
    customers.value = customers.value.filter(c => c._id !== customerToDelete.value)
    customerToDelete.value = null
  }
  isDeleteModalOpen.value = false
}

const cancelDelete = () => {
  customerToDelete.value = null
  isDeleteModalOpen.value = false
}

onMounted(() => {
  // Fetch customers from API
})
</script>
