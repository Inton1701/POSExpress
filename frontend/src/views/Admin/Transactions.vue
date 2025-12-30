<template>
  <div>
    <h2 class="text-3xl font-bold mb-6">Transactions</h2>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-2xl shadow p-4">
        <p class="text-sm text-gray-600">Total Transactions</p>
        <p class="text-2xl font-bold">{{ filteredTransactions.length }}</p>
      </div>
      <div class="bg-white rounded-2xl shadow p-4">
        <p class="text-sm text-gray-600">Cash Payments</p>
        <p class="text-2xl font-bold">{{ cashCount }}</p>
      </div>
      <div class="bg-white rounded-2xl shadow p-4">
        <p class="text-sm text-gray-600">E-wallet Payments</p>
        <p class="text-2xl font-bold">{{ ewalletCount }}</p>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="bg-white rounded-2xl shadow p-4 mb-6">
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-lg font-bold text-gray-700">Filters</h3>
        <button @click="openReportModal" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-xl">
          <font-awesome-icon :icon="['fas', 'print']" class="mr-2" />
          Generate Report
        </button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <!-- Date Filter -->
        <div>
          <label class="block text-sm font-bold mb-2">Date Filter</label>
          <select v-model="dateFilter" class="w-full p-2 rounded-xl border border-gray-300">
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        <!-- Custom Date Range -->
        <div v-if="dateFilter === 'custom'">
          <label class="block text-sm font-bold mb-2">Start Date</label>
          <input v-model="startDate" type="date" class="w-full p-2 rounded-xl border border-gray-300" />
        </div>
        <div v-if="dateFilter === 'custom'">
          <label class="block text-sm font-bold mb-2">End Date</label>
          <input v-model="endDate" type="date" class="w-full p-2 rounded-xl border border-gray-300" />
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-bold mb-2">Status Filter</label>
          <select v-model="statusFilter" class="w-full p-2 rounded-xl border border-gray-300">
            <option value="all">All Status</option>
            <option value="Completed">Completed</option>
            <option value="Returned">Returned</option>
            <option value="Voided">Voided</option>
          </select>
        </div>

        <!-- Payment Method Filter -->
        <div>
          <label class="block text-sm font-bold mb-2">Payment Method</label>
          <select v-model="paymentMethodFilter" class="w-full p-2 rounded-xl border border-gray-300">
            <option value="all">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="E-wallet">E-wallet</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="mb-6">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="Search by Transaction ID, Customer, Payment Method, Status, Cashier, or Amount..." 
        class="w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
    </div>

    <!-- Transactions Table -->
    <div class="bg-white rounded-2xl shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th @click="sortTable('transactionId')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
                Transaction ID
                <span v-if="sortColumn === 'transactionId'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th @click="sortTable('createdAt')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
                Date & Time
                <span v-if="sortColumn === 'createdAt'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th @click="sortTable('customerName')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
                Customer
                <span v-if="sortColumn === 'customerName'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th @click="sortTable('paymentMethod')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
                Payment Method
                <span v-if="sortColumn === 'paymentMethod'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th @click="sortTable('totalAmount')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
                Amount
                <span v-if="sortColumn === 'totalAmount'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th @click="sortTable('status')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
                Status
                <span v-if="sortColumn === 'status'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th @click="sortTable('employee')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
                Cashier
                <span v-if="sortColumn === 'employee'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th class="px-6 py-3 text-left text-sm font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="8" class="px-6 py-8 text-center text-gray-500">Loading transactions...</td>
            </tr>
            <tr v-else-if="filteredTransactions.length === 0">
              <td colspan="8" class="px-6 py-4 text-center text-gray-500">
                {{ searchQuery ? 'No transactions found matching your search' : 'No transactions found' }}
              </td>
            </tr>
            <tr v-else v-for="transaction in paginatedTransactions" :key="transaction._id" class="border-t hover:bg-gray-50">
              <td class="px-6 py-4 font-mono text-sm">{{ transaction.transactionId }}</td>
              <td class="px-6 py-4 text-sm">{{ formatDate(transaction.createdAt) }}</td>
              <td class="px-6 py-4 text-sm">{{ getCustomerName(transaction) }}</td>
              <td class="px-6 py-4">
                <span :class="getPaymentMethodClass(transaction.paymentMethod)" class="px-2 py-1 rounded text-xs font-semibold">
                  {{ transaction.paymentMethod }}
                </span>
              </td>
              <td class="px-6 py-4 font-semibold">₱{{ transaction.totalAmount.toFixed(2) }}</td>
              <td class="px-6 py-4">
                <span :class="getStatusClass(transaction.status)" class="px-3 py-1 rounded-full text-xs font-bold">
                  {{ transaction.status }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm">{{ transaction.employee || 'N/A' }}</td>
              <td class="px-6 py-4">
                <div class="flex gap-2">
                  <button @click="viewTransaction(transaction)" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold">
                    View
                  </button>
                  <button @click="editTransaction(transaction)" class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs font-semibold">
                    Edit
                  </button>
                  <button @click="confirmDeleteTransaction(transaction)" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="transactions.length === 0 && !isLoading">
              <td colspan="8" class="px-6 py-8 text-center text-gray-500">No transactions found</td>
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
            Showing {{ Math.min((currentPage - 1) * itemsPerPage + 1, filteredTransactions.length) }} 
            to {{ Math.min(currentPage * itemsPerPage, filteredTransactions.length) }} 
            of {{ filteredTransactions.length }} transactions
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

    <!-- View Transaction Modal -->
    <Modal :is-open="isViewModalOpen" title="Transaction Details" @close="isViewModalOpen = false" size="lg">
      <div v-if="selectedTransaction" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-600">Transaction ID</p>
            <p class="font-semibold">{{ selectedTransaction.transactionId }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Date & Time</p>
            <p class="font-semibold">{{ formatDate(selectedTransaction.createdAt) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Payment Method</p>
            <p class="font-semibold">{{ selectedTransaction.paymentMethod }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Status</p>
            <span :class="getStatusClass(selectedTransaction.status)" class="px-3 py-1 rounded-full text-xs font-bold">
              {{ selectedTransaction.status }}
            </span>
          </div>
          <div>
            <p class="text-sm text-gray-600">Cashier</p>
            <p class="font-semibold">{{ selectedTransaction.employee || 'N/A' }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Customer</p>
            <p class="font-semibold">{{ getCustomerName(selectedTransaction) }}</p>
          </div>
          <div v-if="selectedTransaction.paymentMethod === 'E-wallet' && selectedTransaction.customerId">
            <p class="text-sm text-gray-600">Remaining Balance</p>
            <p class="font-semibold text-blue-600">₱{{ (selectedTransaction.customerId.balance || 0).toFixed(2) }}</p>
          </div>
        </div>

        <div class="border-t pt-4">
          <h4 class="font-bold mb-3">Items</h4>
          <div class="space-y-2">
            <div v-for="(item, index) in selectedTransaction.cart" :key="index" class="bg-gray-50 p-3 rounded">
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-semibold">{{ item.name }}</p>
                  <p class="text-sm text-gray-600">SKU: {{ item.sku || 'N/A' }}</p>
                  <p class="text-sm">{{ item.quantity }} x ₱{{ item.price.toFixed(2) }}</p>
                  <div v-if="item.addons && item.addons.length > 0" class="ml-4 mt-1">
                    <p v-for="addon in item.addons" :key="addon.addonId" class="text-xs text-gray-600 italic">
                      + {{ addon.name }} ({{ addon.quantity }}x ₱{{ addon.price.toFixed(2) }})
                    </p>
                  </div>
                </div>
                <p class="font-bold">₱{{ item.total.toFixed(2) }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="border-t pt-4">
          <div class="space-y-2">
            <div class="flex justify-between">
              <span>Subtotal:</span>
              <span>₱{{ selectedTransaction.netAmount.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Discounts:</span>
              <span>₱{{ selectedTransaction.discounts.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between">
              <span>VAT:</span>
              <span>₱{{ selectedTransaction.VAT.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>₱{{ selectedTransaction.totalAmount.toFixed(2) }}</span>
            </div>
            <div v-if="selectedTransaction.cash > 0" class="flex justify-between text-sm">
              <span>Cash:</span>
              <span>₱{{ selectedTransaction.cash.toFixed(2) }}</span>
            </div>
            <div v-if="selectedTransaction.change > 0" class="flex justify-between text-sm">
              <span>Change:</span>
              <span>₱{{ selectedTransaction.change.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="flex gap-3 justify-end mt-6">
        <button @click="printSingleTransaction" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-2xl">
          <font-awesome-icon :icon="['fas', 'print']" class="mr-2" />
          Print
        </button>
        <button @click="isViewModalOpen = false" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-2xl">Close</button>
      </div>
    </Modal>

    <!-- Edit Transaction Modal -->
    <Modal :is-open="isEditModalOpen" title="Edit Transaction" @close="isEditModalOpen = false" size="lg">
      <div v-if="editForm" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold mb-2">Status</label>
            <select v-model="editForm.status" class="w-full p-3 rounded-xl border border-gray-300">
              <option value="Completed">Completed</option>
              <option value="Voided">Voided</option>
              <option value="Canceled">Canceled</option>
              <option value="Returned">Returned</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-bold mb-2">Payment Method</label>
            <select v-model="editForm.paymentMethod" class="w-full p-3 rounded-xl border border-gray-300">
              <option value="Cash">Cash</option>
              <option value="E-wallet">E-wallet</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-bold mb-2">Cashier</label>
          <input v-model="editForm.employee" type="text" class="w-full p-3 rounded-xl border border-gray-300" />
        </div>

        <div>
          <label class="block text-sm font-bold mb-2">Customer RFID</label>
          <input v-model="editForm.customerRfid" type="text" placeholder="Leave empty for walk-in" class="w-full p-3 rounded-xl border border-gray-300" />
        </div>
      </div>
      <div class="flex gap-4 mt-6">
        <button @click="isEditModalOpen = false" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
        <button @click="saveTransaction" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-2xl">Save Changes</button>
      </div>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal :is-open="isDeleteModalOpen" title="Confirm Delete" @close="isDeleteModalOpen = false">
      <div class="text-center py-4">
        <div class="mb-4">
          <svg class="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </div>
        <p class="text-lg text-gray-700 mb-2">Are you sure you want to delete this transaction?</p>
        <p class="text-sm text-gray-500">Transaction ID: {{ transactionToDelete?.transactionId }}</p>
        <p class="text-sm text-red-600 font-semibold mt-2">This action cannot be undone.</p>
      </div>
      <div class="flex gap-4 mt-6">
        <button @click="isDeleteModalOpen = false" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
        <button @click="deleteTransaction" class="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-2xl">Delete</button>
      </div>
    </Modal>

    <!-- Report Modal -->
    <Modal :is-open="isReportModalOpen" title="Generate Transaction Report" @close="closeReportModal">
      <div class="space-y-4">
        <p class="text-sm text-gray-600">Generate a report based on current filters:</p>
        <div class="bg-gray-50 p-3 rounded">
          <p class="text-sm"><strong>Date Filter:</strong> {{ dateFilter === 'all' ? 'All Time' : dateFilter === 'today' ? 'Today' : `${startDate} to ${endDate}` }}</p>
          <p class="text-sm"><strong>Status Filter:</strong> {{ statusFilter === 'all' ? 'All Status' : statusFilter }}</p>
          <p class="text-sm"><strong>Payment Method:</strong> {{ paymentMethodFilter === 'all' ? 'All Methods' : paymentMethodFilter }}</p>
          <p class="text-sm"><strong>Total Transactions:</strong> {{ filteredTransactions.length }}</p>
        </div>
        <div class="flex gap-4 pt-4">
          <button @click="closeReportModal" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
          <button @click="exportTransactionReportToExcel" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-2xl">
            <font-awesome-icon :icon="['fas', 'file-excel']" class="mr-2" />
            Excel
          </button>
          <button @click="printTransactionReport" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-2xl">
            <font-awesome-icon :icon="['fas', 'print']" class="mr-2" />
            Print
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, inject } from 'vue'
import axios from 'axios'
import Modal from '../../components/Modal.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faPrint, faFileExcel } from '@fortawesome/free-solid-svg-icons'

library.add(faPrint, faFileExcel)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const toast = inject('toast')

const transactions = ref([])
const searchQuery = ref('')
const isLoading = ref(false)
const isViewModalOpen = ref(false)
const isEditModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const isReportModalOpen = ref(false)
const selectedTransaction = ref(null)
const editForm = ref(null)
const transactionToDelete = ref(null)
const sortColumn = ref('createdAt')
const sortDirection = ref('desc')

// New filter refs
const dateFilter = ref('all') // all, today, custom
const startDate = ref('')
const endDate = ref('')
const statusFilter = ref('all') // all, Completed, Returned, Voided
const paymentMethodFilter = ref('all') // all, Cash, E-wallet

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)

const totalPages = computed(() => {
  return Math.ceil(filteredTransactions.value.length / itemsPerPage.value)
})

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredTransactions.value.slice(start, end)
})

const totalRevenue = computed(() => {
  return filteredTransactions.value
    .filter(t => t.status === 'Completed')
    .reduce((sum, t) => sum + t.totalAmount, 0)
})

const sortedTransactions = computed(() => {
  if (!sortColumn.value) return transactions.value
  
  return [...transactions.value].sort((a, b) => {
    let aVal = a[sortColumn.value]
    let bVal = b[sortColumn.value]
    
    // Handle nested customer name
    if (sortColumn.value === 'customerName') {
      aVal = getCustomerName(a)
      bVal = getCustomerName(b)
    }
    
    // Handle date sorting
    if (sortColumn.value === 'createdAt') {
      aVal = new Date(aVal).getTime()
      bVal = new Date(bVal).getTime()
    }
    
    // Handle null/undefined values
    if (aVal === null || aVal === undefined) aVal = ''
    if (bVal === null || bVal === undefined) bVal = ''
    
    // Convert strings to lowercase for comparison
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

const filteredTransactions = computed(() => {
  let filtered = sortedTransactions.value
  
  // Apply date filter
  if (dateFilter.value === 'today') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    filtered = filtered.filter(t => {
      const transactionDate = new Date(t.createdAt)
      return transactionDate >= today && transactionDate < tomorrow
    })
  } else if (dateFilter.value === 'custom' && startDate.value && endDate.value) {
    const start = new Date(startDate.value)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate.value)
    end.setHours(23, 59, 59, 999)
    
    filtered = filtered.filter(t => {
      const transactionDate = new Date(t.createdAt)
      return transactionDate >= start && transactionDate <= end
    })
  }
  
  // Apply status filter
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(t => t.status === statusFilter.value)
  }
  
  // Apply payment method filter
  if (paymentMethodFilter.value !== 'all') {
    filtered = filtered.filter(t => t.paymentMethod === paymentMethodFilter.value)
  }
  
  // Apply search query
  const query = searchQuery.value.toLowerCase().trim()
  if (query) {
    filtered = filtered.filter(transaction => {
      const customerName = getCustomerName(transaction).toLowerCase()
      const transactionId = transaction.transactionId?.toLowerCase() || ''
      const paymentMethod = transaction.paymentMethod?.toLowerCase() || ''
      const status = transaction.status?.toLowerCase() || ''
      const employee = transaction.employee?.toLowerCase() || ''
      const amount = transaction.totalAmount?.toString() || ''
      
      return (
        transactionId.includes(query) ||
        customerName.includes(query) ||
        paymentMethod.includes(query) ||
        status.includes(query) ||
        employee.includes(query) ||
        amount.includes(query)
      )
    })
  }
  
  return filtered
})

const cashCount = computed(() => {
  return filteredTransactions.value.filter(t => t.paymentMethod === 'Cash' && t.status === 'Completed').length
})

const ewalletCount = computed(() => {
  return filteredTransactions.value.filter(t => t.paymentMethod === 'E-wallet' && t.status === 'Completed').length
})

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getPaymentMethodClass = (method) => {
  if (method === 'Cash') {
    return 'bg-green-100 text-green-800'
  } else if (method === 'E-wallet') {
    return 'bg-blue-100 text-blue-800'
  }
  return 'bg-gray-100 text-gray-800'
}

const getStatusClass = (status) => {
  switch(status) {
    case 'Completed':
      return 'bg-green-100 text-green-800'
    case 'Voided':
    case 'Canceled':
    case 'Deleted':
      return 'bg-red-100 text-red-800'
    case 'Returned':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getCustomerName = (transaction) => {
  if (transaction.customerId && transaction.customerId.fullName) {
    return transaction.customerId.fullName
  }
  return 'Walk-in Customer'
}

const sortTable = (column) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = column === 'createdAt' ? 'desc' : 'asc'
  }
}

const fetchTransactions = async () => {
  try {
    isLoading.value = true
    const response = await axios.get(`${API_URL}/transactions`)
    if (response.data.success) {
      // Sort by date, newest first
      transactions.value = response.data.transactions.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )
    }
  } catch (error) {
    console.error('Error fetching transactions:', error)
  } finally {
    isLoading.value = false
  }
}

const viewTransaction = (transaction) => {
  selectedTransaction.value = transaction
  isViewModalOpen.value = true
}

const editTransaction = (transaction) => {
  editForm.value = {
    _id: transaction._id,
    status: transaction.status,
    paymentMethod: transaction.paymentMethod,
    employee: transaction.employee,
    customerRfid: transaction.customerRfid || ''
  }
  isEditModalOpen.value = true
}

const saveTransaction = async () => {
  try {
    const response = await axios.put(`${API_URL}/transactions/${editForm.value._id}`, {
      status: editForm.value.status,
      paymentMethod: editForm.value.paymentMethod,
      employee: editForm.value.employee,
      customerRfid: editForm.value.customerRfid || null
    })

    if (response.data.success) {
      // Update the transaction in the list
      const index = transactions.value.findIndex(t => t._id === editForm.value._id)
      if (index !== -1) {
        transactions.value[index] = response.data.transaction
      }
      isEditModalOpen.value = false
      editForm.value = null
    }
  } catch (error) {
    console.error('Error updating transaction:', error)
    alert('Failed to update transaction')
  }
}

const confirmDeleteTransaction = (transaction) => {
  transactionToDelete.value = transaction
  isDeleteModalOpen.value = true
}

const deleteTransaction = async () => {
  try {
    const response = await axios.delete(`${API_URL}/transactions/${transactionToDelete.value._id}`)
    
    if (response.data.success) {
      // Remove transaction from list
      transactions.value = transactions.value.filter(t => t._id !== transactionToDelete.value._id)
      isDeleteModalOpen.value = false
      transactionToDelete.value = null
    }
  } catch (error) {
    console.error('Error deleting transaction:', error)
    alert('Failed to delete transaction')
  }
}

const openReportModal = () => {
  isReportModalOpen.value = true
}

const closeReportModal = () => {
  isReportModalOpen.value = false
}

const exportTransactionReportToExcel = () => {
  const dateRangeText = dateFilter.value === 'all' ? 'All Time' :
                        dateFilter.value === 'today' ? 'Today' :
                        `${startDate.value} to ${endDate.value}`
  
  const statusText = statusFilter.value === 'all' ? 'All Status' : statusFilter.value
  const paymentText = paymentMethodFilter.value === 'all' ? 'All Methods' : paymentMethodFilter.value
  const reportTitle = `Transaction Report - ${statusText} - ${paymentText} - ${dateRangeText}`
  
  let csvContent = `${reportTitle}\n`
  csvContent += `Generated on: ${new Date().toLocaleString()}\n`
  csvContent += `Total Transactions: ${filteredTransactions.value.length}\n`
  csvContent += `Cash Payments: ${cashCount.value}\n`
  csvContent += `E-wallet Payments: ${ewalletCount.value}\n\n`
  csvContent += 'Transaction ID,Date & Time,Customer,Payment Method,Amount,Status,Cashier\n'
  
  filteredTransactions.value.forEach(transaction => {
    const customerName = getCustomerName(transaction)
    const dateTime = formatDate(transaction.createdAt)
    csvContent += `"${transaction.transactionId}","${dateTime}","${customerName}","${transaction.paymentMethod}",${transaction.totalAmount.toFixed(2)},"${transaction.status}","${transaction.employee || 'N/A'}"\n`
  })
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `Transaction_Report_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  toast.success('Report exported successfully!')
  closeReportModal()
}

const printTransactionReport = () => {
  const printWindow = window.open('', '_blank')
  
  const dateRangeText = dateFilter.value === 'all' ? 'All Time' :
                        dateFilter.value === 'today' ? 'Today' :
                        `${startDate.value} to ${endDate.value}`
  
  const statusText = statusFilter.value === 'all' ? 'All Status' : statusFilter.value
  const paymentText = paymentMethodFilter.value === 'all' ? 'All Methods' : paymentMethodFilter.value
  const reportTitle = `Transaction Report - ${statusText} - ${paymentText} - ${dateRangeText}`
  
  const reportContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${reportTitle}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          padding: 20px;
          font-size: 9px;
        }
        h1 { 
          font-size: 16px;
          margin-bottom: 10px;
        }
        .report-info {
          margin-bottom: 15px;
          padding: 8px;
          background-color: #f5f5f5;
          border-radius: 4px;
        }
        .report-info p {
          margin: 3px 0;
          font-size: 8px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 10px; 
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 6px; 
          text-align: left;
          font-size: 8px;
        }
        th { 
          background-color: #4CAF50; 
          color: white; 
          font-weight: bold;
        }
        tr:nth-child(even) { 
          background-color: #f2f2f2; 
        }
        .status-completed {
          color: green;
          font-weight: bold;
        }
        .status-returned {
          color: orange;
          font-weight: bold;
        }
        .status-voided {
          color: red;
          font-weight: bold;
        }
        @media print {
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>${reportTitle}</h1>
      <div class="report-info">
        <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Total Transactions:</strong> ${filteredTransactions.value.length}</p>
        <p><strong>Cash Payments:</strong> ${cashCount.value}</p>
        <p><strong>E-wallet Payments:</strong> ${ewalletCount.value}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Transaction ID</th>
            <th>Date & Time</th>
            <th>Customer</th>
            <th>Payment Method</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Cashier</th>
          </tr>
        </thead>
        <tbody>
          ${filteredTransactions.value.map(transaction => `
            <tr>
              <td>${transaction.transactionId}</td>
              <td>${formatDate(transaction.createdAt)}</td>
              <td>${getCustomerName(transaction)}</td>
              <td>${transaction.paymentMethod}</td>
              <td>₱${transaction.totalAmount.toFixed(2)}</td>
              <td class="status-${transaction.status.toLowerCase()}">${transaction.status}</td>
              <td>${transaction.employee || 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `
  
  printWindow.document.write(reportContent)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
  }, 250)
  
  toast.success('Report ready for printing!')
  closeReportModal()
}

const printSingleTransaction = () => {
  if (!selectedTransaction.value) return
  
  const transaction = selectedTransaction.value
  const printWindow = window.open('', '_blank')
  
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Transaction Receipt - ${transaction.transactionId}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          padding: 20px;
          font-size: 10px;
          max-width: 400px;
          margin: 0 auto;
        }
        h1 { 
          font-size: 16px;
          margin-bottom: 10px;
          text-align: center;
        }
        .header {
          text-align: center;
          margin-bottom: 15px;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 15px;
        }
        .info-item {
          font-size: 9px;
        }
        .info-label {
          color: #666;
          font-weight: normal;
        }
        .info-value {
          font-weight: bold;
        }
        .items-section {
          margin-bottom: 15px;
        }
        .section-title {
          font-weight: bold;
          margin-bottom: 8px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 4px;
        }
        .item {
          margin-bottom: 8px;
          padding: 6px;
          background-color: #f9f9f9;
          border-radius: 4px;
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          margin-bottom: 2px;
        }
        .item-details {
          font-size: 9px;
          color: #666;
        }
        .addon {
          margin-left: 12px;
          font-size: 8px;
          color: #666;
          font-style: italic;
        }
        .totals {
          margin-top: 15px;
          border-top: 2px solid #333;
          padding-top: 10px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 10px;
        }
        .total-final {
          font-weight: bold;
          font-size: 14px;
          border-top: 1px solid #333;
          padding-top: 6px;
          margin-top: 6px;
        }
        .status {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 8px;
          font-weight: bold;
        }
        .status-completed { background-color: #d4edda; color: #155724; }
        .status-returned { background-color: #fff3cd; color: #856404; }
        .status-voided { background-color: #f8d7da; color: #721c24; }
        @media print {
          button { display: none; }
          body { padding: 10px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>TRANSACTION RECEIPT</h1>
        <div style="font-size: 12px; font-weight: bold;">${transaction.transactionId}</div>
      </div>
      
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Date & Time:</div>
          <div class="info-value">${formatDate(transaction.createdAt)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Payment:</div>
          <div class="info-value">${transaction.paymentMethod}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Cashier:</div>
          <div class="info-value">${transaction.employee || 'N/A'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Status:</div>
          <div class="info-value">
            <span class="status status-${transaction.status.toLowerCase()}">${transaction.status}</span>
          </div>
        </div>
        <div class="info-item" style="grid-column: 1 / -1;">
          <div class="info-label">Customer:</div>
          <div class="info-value">${getCustomerName(transaction)}</div>
        </div>
        ${transaction.paymentMethod === 'E-wallet' && transaction.customerId && transaction.customerId.balance !== undefined ? `
        <div class="info-item" style="grid-column: 1 / -1;">
          <div class="info-label">Remaining Balance:</div>
          <div class="info-value" style="color: #2563eb;">₱${(transaction.customerId.balance || 0).toFixed(2)}</div>
        </div>
        ` : ''}
      </div>
      
      <div class="items-section">
        <div class="section-title">Items</div>
        ${transaction.cart.map(item => `
          <div class="item">
            <div class="item-header">
              <span>${item.name}</span>
              <span>₱${item.total.toFixed(2)}</span>
            </div>
            <div class="item-details">
              SKU: ${item.sku || 'N/A'} | ${item.quantity} x ₱${item.price.toFixed(2)}
            </div>
            ${item.addons && item.addons.length > 0 ? item.addons.map(addon => `
              <div class="addon">
                + ${addon.name} (${addon.quantity}x ₱${addon.price.toFixed(2)})
              </div>
            `).join('') : ''}
          </div>
        `).join('')}
      </div>
      
      <div class="totals">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>₱${transaction.netAmount.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>Discounts:</span>
          <span>₱${transaction.discounts.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>VAT:</span>
          <span>₱${transaction.VAT.toFixed(2)}</span>
        </div>
        <div class="total-row total-final">
          <span>TOTAL:</span>
          <span>₱${transaction.totalAmount.toFixed(2)}</span>
        </div>
        ${transaction.cash > 0 ? `
          <div class="total-row" style="margin-top: 8px;">
            <span>Cash:</span>
            <span>₱${transaction.cash.toFixed(2)}</span>
          </div>
        ` : ''}
        ${transaction.change > 0 ? `
          <div class="total-row">
            <span>Change:</span>
            <span>₱${transaction.change.toFixed(2)}</span>
          </div>
        ` : ''}
      </div>
      
      <div style="text-align: center; margin-top: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">Print Receipt</button>
      </div>
    </body>
    </html>
  `
  
  printWindow.document.write(printContent)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
  }, 250)
}

onMounted(() => {
  fetchTransactions()
})
</script>
