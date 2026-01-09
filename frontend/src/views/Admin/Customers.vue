<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-3xl font-bold">Customers</h2>
      <div class="flex gap-2">
        <button @click="openImportModal" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-2xl shadow-md" title="Import Customers">
          <font-awesome-icon :icon="['fas', 'file-import']" class="mr-2" />
          Import
        </button>
        <button @click="exportCustomers" class="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-2xl shadow-md" title="Export Customers">
          <font-awesome-icon :icon="['fas', 'file-export']" class="mr-2" />
          Export
        </button>
        <button @click="openAddModal" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-2xl shadow-md" title="Add Customer">
          <font-awesome-icon :icon="['fas', 'plus']" />
        </button>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="mb-6">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="Search by name, username, or RFID..." 
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
            <th @click="sortTable('username')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
              Username
              <span v-if="sortColumn === 'username'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortTable('rfid')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
              RFID
              <span v-if="sortColumn === 'rfid'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortTable('birthday')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
              Birthday
              <span v-if="sortColumn === 'birthday'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortTable('balance')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
              Balance
              <span v-if="sortColumn === 'balance'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortTable('status')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
              Status
              <span v-if="sortColumn === 'status'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th class="px-6 py-3 text-center text-sm font-bold sticky right-0 bg-gray-50 shadow-[-2px_0_4px_rgba(0,0,0,0.1)] min-w-[100px]">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="customer in paginatedCustomers" :key="customer._id" class="border-t hover:bg-gray-50">
            <td class="px-6 py-4">{{ customer.fullName }}</td>
            <td class="px-6 py-4">{{ customer.username }}</td>
            <td class="px-6 py-4">{{ customer.rfid }}</td>
            <td class="px-6 py-4">{{ formatDate(customer.birthday) }}</td>
            <td class="px-6 py-4">₱{{ customer.balance?.toFixed(2) || '0.00' }}</td>
            <td class="px-6 py-4">
              <span :class="customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" class="px-3 py-1 rounded-full text-xs font-bold">
                {{ customer.status }}
              </span>
            </td>
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
            <td colspan="7" class="px-6 py-4 text-center text-gray-500">No customers found</td>
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
          <label class="block text-sm font-bold mb-2">Username</label>
          <input v-model="form.username" type="text" required class="w-full p-3 rounded-xl border border-gray-300" />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-bold mb-2">Password</label>
          <input v-model="form.password" type="password" :required="!editingCustomer" :placeholder="editingCustomer ? 'Leave blank to keep current' : ''" class="w-full p-3 rounded-xl border border-gray-300" />
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
        <div class="mb-4">
          <label class="block text-sm font-bold mb-2">Status</label>
          <select v-model="form.status" required class="w-full p-3 rounded-xl border border-gray-300">
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
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

    <!-- Import Customers Modal -->
    <Modal :is-open="isImportModalOpen" title="Import Customers" @close="closeImportModal" size="lg">
      <div class="space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 class="font-bold text-blue-800 mb-2">Import Instructions</h3>
          <ul class="text-sm text-blue-700 space-y-1 ml-4 list-disc">
            <li>Upload a CSV file with customer data</li>
            <li>Required columns: fullName, birthdate</li>
            <li>Optional columns: rfid, username, password, balance, status</li>
            <li>Username and password will be auto-generated if not provided</li>
            <li>Download the sample file for reference</li>
          </ul>
          <button @click="downloadSampleFile" class="mt-3 text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
            <font-awesome-icon :icon="['fas', 'download']" class="mr-2" />
            Download Sample CSV
          </button>
        </div>

        <div v-if="!importValidation.checked">
          <label class="block text-sm font-bold mb-2">Select CSV File</label>
          <input ref="fileInput" type="file" accept=".csv" @change="handleFileSelect" class="w-full p-2 border border-gray-300 rounded-lg" />
        </div>

        <div v-if="importValidation.checked && !importValidation.valid" class="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 class="font-bold text-red-800 mb-2">Validation Errors</h3>
          <p class="text-sm text-red-700 mb-2">{{ importValidation.message }}</p>
          <ul class="text-sm text-red-600 space-y-1 ml-4 list-disc max-h-48 overflow-y-auto">
            <li v-for="(error, idx) in importValidation.errors" :key="idx">{{ error }}</li>
          </ul>
          <button @click="resetImport" class="mt-3 text-sm bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">
            Select Different File
          </button>
        </div>

        <div v-if="importValidation.checked && importValidation.valid && !importProgress.importing && !importResults.completed">
          <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h3 class="font-bold text-green-800 mb-2">✓ Validation Passed</h3>
            <p class="text-sm text-green-700">{{ importValidation.message }}</p>
          </div>

          <div class="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
            <table class="w-full text-sm">
              <thead class="bg-gray-100 sticky top-0">
                <tr>
                  <th class="px-3 py-2 text-left">Full Name</th>
                  <th class="px-3 py-2 text-left">Username</th>
                  <th class="px-3 py-2 text-left">Birthday</th>
                  <th class="px-3 py-2 text-left">RFID</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(customer, idx) in importPreview" :key="idx" class="border-t">
                  <td class="px-3 py-2">{{ customer.fullName }}</td>
                  <td class="px-3 py-2">{{ customer.username }}</td>
                  <td class="px-3 py-2">{{ customer.birthday }}</td>
                  <td class="px-3 py-2">{{ customer.rfid || 'N/A' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex gap-4 mt-4">
            <button @click="closeImportModal" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">
              Cancel
            </button>
            <button @click="processImport" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-2xl">
              Import {{ importPreview.length }} Customers
            </button>
          </div>
        </div>

        <div v-if="importProgress.importing">
          <div class="text-center py-8">
            <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto mb-4"></div>
            <p class="text-lg font-semibold text-gray-700">Importing Customers...</p>
            <p class="text-sm text-gray-600 mt-2">{{ importProgress.current }} / {{ importProgress.total }}</p>
          </div>
        </div>

        <div v-if="importResults.completed">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 class="font-bold text-blue-800 mb-2">Import Complete</h3>
            <p class="text-sm text-blue-700 mb-2">
              Successfully imported {{ importResults.success }} customers.
              <span v-if="importResults.failed > 0">{{ importResults.failed }} failed.</span>
            </p>
            <div v-if="importResults.errors.length > 0" class="mt-3">
              <p class="text-sm font-semibold text-red-700 mb-1">Errors:</p>
              <ul class="text-sm text-red-600 space-y-1 ml-4 list-disc max-h-32 overflow-y-auto">
                <li v-for="(error, idx) in importResults.errors" :key="idx">{{ error }}</li>
              </ul>
            </div>
          </div>
          <button @click="closeImportModal" class="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-2xl">
            Close
          </button>
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
import { faEdit, faTrash, faPlus, faFileImport, faFileExport, faDownload } from '@fortawesome/free-solid-svg-icons'
import { api } from '@/utils/api'
import Papa from 'papaparse'

library.add(faEdit, faTrash, faPlus, faFileImport, faFileExport, faDownload)
const toast = inject('toast')

const customers = ref([])
const searchQuery = ref('')
const sortColumn = ref('')
const sortDirection = ref('asc')
const isModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const customerToDelete = ref(null)
const editingCustomer = ref(null)
const isImportModalOpen = ref(false)
const fileInput = ref(null)
const importValidation = ref({ checked: false, valid: false, message: '', errors: [] })
const importPreview = ref([])
const importProgress = ref({ importing: false, current: 0, total: 0 })
const importResults = ref({ completed: false, success: 0, failed: 0, errors: [] })

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)

const form = ref({
  fullName: '',
  username: '',
  password: '',
  rfid: '',
  birthday: '',
  balance: 0,
  status: 'active'
})

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

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
    customer.username?.toLowerCase().includes(query) ||
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

const fetchCustomers = async () => {
  try {
    const response = await api.get('/customers')
    if (response.data.success) {
      customers.value = response.data.customers
    }
  } catch (error) {
    console.error('Error fetching customers:', error)
    if (toast) {
      toast(error.response?.data?.message || 'Failed to fetch customers', 'error')
    }
  }
}

const openAddModal = () => {
  editingCustomer.value = null
  form.value = { 
    fullName: '', 
    username: '', 
    password: '', 
    rfid: '', 
    birthday: '', 
    balance: 0,
    status: 'active'
  }
  isModalOpen.value = true
}

const openEditModal = (customer) => {
  editingCustomer.value = customer
  form.value = { 
    ...customer, 
    password: '',
    birthday: customer.birthday ? customer.birthday.split('T')[0] : ''
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  editingCustomer.value = null
}

const submitForm = async () => {
  try {
    if (editingCustomer.value) {
      // Update customer
      const updateData = { ...form.value }
      if (!updateData.password) {
        delete updateData.password
      }
      
      const response = await api.put(`/customers/${editingCustomer.value._id}`, updateData)
      if (response.data.success) {
        await fetchCustomers()
        if (toast) {
          toast('Customer updated successfully', 'success')
        }
      }
    } else {
      // Add customer
      const response = await api.post('/customers', form.value)
      if (response.data.success) {
        await fetchCustomers()
        if (toast) {
          toast('Customer added successfully', 'success')
        }
      }
    }
    closeModal()
  } catch (error) {
    console.error('Error saving customer:', error)
    if (toast) {
      toast(error.response?.data?.message || 'Failed to save customer', 'error')
    }
  }
}

const deleteCustomer = (id) => {
  customerToDelete.value = id
  isDeleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!customerToDelete.value) return
  
  try {
    const response = await api.delete(`/customers/${customerToDelete.value}`)
    if (response.data.success) {
      await fetchCustomers()
      if (toast) {
        toast('Customer deleted successfully', 'success')
      }
    }
    isDeleteModalOpen.value = false
    customerToDelete.value = null
  } catch (error) {
    console.error('Error deleting customer:', error)
    if (toast) {
      toast(error.response?.data?.message || 'Failed to delete customer', 'error')
    }
  }
}

const cancelDelete = () => {
  customerToDelete.value = null
  isDeleteModalOpen.value = false
}

// Import/Export functions
const openImportModal = () => {
  isImportModalOpen.value = true
  importValidation.value = { checked: false, valid: false, message: '', errors: [] }
  importPreview.value = []
  importProgress.value = { importing: false, current: 0, total: 0 }
  importResults.value = { completed: false, success: 0, failed: 0, errors: [] }
}

const closeImportModal = () => {
  isImportModalOpen.value = false
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  if (importResults.value.completed && importResults.value.success > 0) {
    fetchCustomers()
  }
}

const resetImport = () => {
  importValidation.value = { checked: false, valid: false, message: '', errors: [] }
  importPreview.value = []
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const generateUsername = (fullName, birthdate) => {
  try {
    const cleanName = fullName.toLowerCase().replace(/[^a-z]/g, '')
    const date = new Date(birthdate)
    const day = String(date.getDate()).padStart(2, '0')
    return `${cleanName}${day}`
  } catch (error) {
    return ''
  }
}

const generatePassword = (fullName, birthdate) => {
  try {
    const cleanName = fullName.toLowerCase().replace(/[^a-z]/g, '')
    const date = new Date(birthdate)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const year = String(date.getFullYear()).slice(-2)
    return `${cleanName}${month}${day}${year}`
  } catch (error) {
    return ''
  }
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      validateAndPreviewImport(results.data)
    },
    error: (error) => {
      if (toast) {
        toast('Failed to parse CSV file', 'error')
      }
    }
  })
}

const validateAndPreviewImport = async (data) => {
  const errors = []
  const preview = []

  if (!data || data.length === 0) {
    importValidation.value = {
      checked: true,
      valid: false,
      message: 'The CSV file is empty',
      errors: []
    }
    return
  }

  const firstRow = data[0]
  const requiredHeaders = ['fullName', 'birthdate']
  const missingHeaders = requiredHeaders.filter(header => !(header in firstRow))

  if (missingHeaders.length > 0) {
    importValidation.value = {
      checked: true,
      valid: false,
      message: `Missing required columns: ${missingHeaders.join(', ')}`,
      errors: []
    }
    return
  }

  const existingUsernames = new Set(customers.value.map(c => c.username.toLowerCase()))
  const existingRFIDs = new Set(customers.value.filter(c => c.rfid).map(c => c.rfid.toLowerCase()))
  const importUsernames = new Set()
  const importRFIDs = new Set()

  data.forEach((row, index) => {
    const rowNum = index + 2
    const rowErrors = []

    if (!row.fullName || row.fullName.trim() === '') {
      rowErrors.push(`Row ${rowNum}: Full name is required`)
    }

    if (!row.birthdate || row.birthdate.trim() === '') {
      rowErrors.push(`Row ${rowNum}: Birthdate is required`)
    } else {
      const date = new Date(row.birthdate)
      if (isNaN(date.getTime())) {
        rowErrors.push(`Row ${rowNum}: Invalid birthdate format`)
      }
    }

    const username = row.username || generateUsername(row.fullName, row.birthdate)
    const password = row.password || generatePassword(row.fullName, row.birthdate)

    if (username) {
      const usernameLower = username.toLowerCase()
      if (existingUsernames.has(usernameLower)) {
        rowErrors.push(`Row ${rowNum}: Username "${username}" already exists`)
      } else if (importUsernames.has(usernameLower)) {
        rowErrors.push(`Row ${rowNum}: Duplicate username "${username}" in import file`)
      } else {
        importUsernames.add(usernameLower)
      }
    }

    if (row.rfid && row.rfid.trim() !== '') {
      const rfidLower = row.rfid.toLowerCase()
      if (existingRFIDs.has(rfidLower)) {
        rowErrors.push(`Row ${rowNum}: RFID "${row.rfid}" already exists`)
      } else if (importRFIDs.has(rfidLower)) {
        rowErrors.push(`Row ${rowNum}: Duplicate RFID "${row.rfid}" in import file`)
      } else {
        importRFIDs.add(rfidLower)
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors)
    } else {
      preview.push({
        fullName: row.fullName,
        username: username,
        password: password,
        birthdate: row.birthdate,
        rfid: row.rfid || '',
        balance: parseFloat(row.balance) || 0,
        status: row.status || 'active'
      })
    }
  })

  if (errors.length > 0) {
    importValidation.value = {
      checked: true,
      valid: false,
      message: `Found ${errors.length} validation error(s)`,
      errors: errors
    }
    importPreview.value = []
  } else {
    importValidation.value = {
      checked: true,
      valid: true,
      message: `Ready to import ${preview.length} customer(s)`,
      errors: []
    }
    importPreview.value = preview
  }
}

const processImport = async () => {
  if (importPreview.value.length === 0) return

  importProgress.value = {
    importing: true,
    current: 0,
    total: importPreview.value.length
  }

  importResults.value = {
    completed: false,
    success: 0,
    failed: 0,
    errors: []
  }

  for (const customer of importPreview.value) {
    try {
      const response = await api.post('/customers', customer)
      if (response.data.success) {
        importResults.value.success++
      }
    } catch (error) {
      importResults.value.failed++
      importResults.value.errors.push(
        `${customer.fullName}: ${error.response?.data?.message || 'Failed to import'}`
      )
    }
    importProgress.value.current++
  }

  importProgress.value.importing = false
  importResults.value.completed = true

  if (importResults.value.success > 0) {
    await fetchCustomers()
  }

  if (importResults.value.failed > 0 && toast) {
    toast(`Imported ${importResults.value.success} customers, ${importResults.value.failed} failed`, 'warning')
  } else if (toast) {
    toast(`Successfully imported ${importResults.value.success} customers`, 'success')
  }
}

const exportCustomers = () => {
  if (customers.value.length === 0) {
    if (toast) {
      toast('No customers to export', 'warning')
    }
    return
  }

  const csvData = customers.value.map(customer => ({
    fullName: customer.fullName,
    username: customer.username,
    birthdate: customer.birthday ? new Date(customer.birthday).toISOString().split('T')[0] : '',
    rfid: customer.rfid || '',
    balance: customer.balance || 0,
    status: customer.status
  }))

  const csv = Papa.unparse(csvData)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  if (toast) {
    toast(`Exported ${customers.value.length} customers`, 'success')
  }
}

const downloadSampleFile = () => {
  const sampleData = [
    {
      fullName: 'John Doe',
      birthdate: '2000-01-15',
      rfid: '1234567890',
      username: 'johndoe15',
      password: 'johndoe01152000',
      balance: 100,
      status: 'active'
    },
    {
      fullName: 'Jane Smith',
      birthdate: '1995-06-20',
      rfid: '0987654321',
      username: 'janesmith20',
      password: 'janesmith06201995',
      balance: 50,
      status: 'active'
    }
  ]

  const csv = Papa.unparse(sampleData)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', 'customer_import_sample.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  if (toast) {
    toast('Sample file downloaded', 'success')
  }
}

onMounted(() => {
  fetchCustomers()
})
</script>
