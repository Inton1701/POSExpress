<template>
  <div class="bg-gray-100 min-h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-white shadow-lg p-3">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-3">
          <button @click="goBack" class="text-gray-600 hover:text-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 class="text-xl font-bold text-gray-800">Customer Transaction History</h1>
        </div>
        <div class="relative">
          <button @click="toggleMenu" class="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl">
            <span class="font-semibold">Menu</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
          <div v-if="isMenuOpen" class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg z-10">
            <button @click="openSettingsModal" class="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-t-xl">Settings</button>
            <button @click="openLogoutModal" class="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-b-xl text-red-600">Logout</button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 container mx-auto p-4">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-2xl shadow p-4">
          <p class="text-sm text-gray-600">Total Transactions</p>
          <p class="text-2xl font-bold">{{ filteredTransactions.length }}</p>
        </div>
        <div class="bg-white rounded-2xl shadow p-4">
          <p class="text-sm text-gray-600">Cash-In</p>
          <p class="text-2xl font-bold text-green-600">{{ cashInCount }}</p>
        </div>
        <div class="bg-white rounded-2xl shadow p-4">
          <p class="text-sm text-gray-600">Cash-Out</p>
          <p class="text-2xl font-bold text-red-600">{{ cashOutCount }}</p>
        </div>
        <div class="bg-white rounded-2xl shadow p-4">
          <p class="text-sm text-gray-600">Balance Inquiry</p>
          <p class="text-2xl font-bold text-blue-600">{{ balanceInquiryCount }}</p>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="bg-white rounded-2xl shadow p-4 mb-6">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-lg font-bold text-gray-700">Filters</h3>
          <button @click="openReportModal" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-xl">
            <font-awesome-icon :icon="['fas', 'file-excel']" class="mr-2" />
            Generate Report
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Date Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select v-model="dateFilter" class="w-full p-2 rounded-xl border border-gray-300">
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <!-- Custom Date Range -->
          <div v-if="dateFilter === 'custom'">
            <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input v-model="startDate" type="date" class="w-full p-2 rounded-xl border border-gray-300" />
          </div>
          <div v-if="dateFilter === 'custom'">
            <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input v-model="endDate" type="date" class="w-full p-2 rounded-xl border border-gray-300" />
          </div>

          <!-- Transaction Type Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
            <select v-model="transactionTypeFilter" class="w-full p-2 rounded-xl border border-gray-300">
              <option value="all">All Types</option>
              <option value="Cash-in">Cash-In</option>
              <option value="Cash-out">Cash-Out</option>
              <option value="Balance inquiry">Balance Inquiry</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="mb-6">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search by Username, Transaction ID, or Amount..." 
          class="w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      <!-- Transactions Table -->
      <div class="bg-white rounded-2xl shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th @click="sortTable('createdAt')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  <div class="flex items-center gap-1">
                    Date & Time
                    <span v-if="sortColumn === 'createdAt'">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                  </div>
                </th>
                <th @click="sortTable('transactionId')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  <div class="flex items-center gap-1">
                    Transaction ID
                    <span v-if="sortColumn === 'transactionId'">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                  </div>
                </th>
                <th @click="sortTable('customerUsername')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  <div class="flex items-center gap-1">
                    Username
                    <span v-if="sortColumn === 'customerUsername'">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                  </div>
                </th>
                <th @click="sortTable('amount')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  <div class="flex items-center gap-1">
                    Amount
                    <span v-if="sortColumn === 'amount'">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                  </div>
                </th>
                <th @click="sortTable('transactionType')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  <div class="flex items-center gap-1">
                    Transaction Type
                    <span v-if="sortColumn === 'transactionType'">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                  </div>
                </th>
                <th @click="sortTable('balanceAfter')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  <div class="flex items-center gap-1">
                    Current Balance
                    <span v-if="sortColumn === 'balanceAfter'">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                  </div>
                </th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="paginatedTransactions.length === 0">
                <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                  No transactions found
                </td>
              </tr>
              <tr v-for="transaction in paginatedTransactions" :key="transaction._id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ formatDateTime(transaction.createdAt) }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ transaction.transactionId || 'N/A' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ transaction.customerUsername || 'N/A' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-semibold" :class="getAmountClass(transaction.transactionType)">
                    {{ formatAmount(transaction.amount, transaction.transactionType) }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full" :class="getTransactionTypeClass(transaction.transactionType)">
                    {{ transaction.transactionType }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ (transaction.balanceAfter || 0).toFixed(2) }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                  <button 
                    v-if="transaction.transactionType !== 'Balance Inquiry' && transaction.status !== 'voided'"
                    @click="openVoidModal(transaction)" 
                    class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold"
                  >
                    <font-awesome-icon icon="ban" class="mr-1" />
                    Void
                  </button>
                  <span v-else class="text-xs text-gray-400">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination Controls -->
        <div class="flex justify-between items-center px-6 py-4 bg-gray-50 border-t">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-700">Show</span>
            <select v-model.number="itemsPerPage" class="border border-gray-300 rounded px-2 py-1 text-sm">
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
            <span class="text-sm text-gray-700">entries</span>
          </div>
          <div class="flex items-center gap-2">
            <button 
              @click="currentPage = 1" 
              :disabled="currentPage === 1"
              class="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              First
            </button>
            <button 
              @click="currentPage--" 
              :disabled="currentPage === 1"
              class="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Previous
            </button>
            <span class="text-sm text-gray-700">
              Page {{ currentPage }} of {{ totalPages }}
            </span>
            <button 
              @click="currentPage++" 
              :disabled="currentPage === totalPages"
              class="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Next
            </button>
            <button 
              @click="currentPage = totalPages" 
              :disabled="currentPage === totalPages"
              class="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Last
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Report Modal -->
    <Modal :is-open="isReportModalOpen" title="Generate Customer Transaction Report" @close="closeReportModal">
      <div class="space-y-4">
        <p class="text-sm text-gray-600">Generate a report based on current filters:</p>
        <div class="bg-gray-50 p-3 rounded">
          <p class="text-sm"><strong>Date Range:</strong> {{ getDateRangeText() }}</p>
          <p class="text-sm"><strong>Transaction Type:</strong> {{ transactionTypeFilter === 'all' ? 'All Types' : transactionTypeFilter }}</p>
          <p class="text-sm"><strong>Total Records:</strong> {{ filteredTransactions.length }}</p>
        </div>
        <div class="flex gap-4 pt-4">
          <button @click="exportToExcel" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-2xl">
            <font-awesome-icon :icon="['fas', 'file-excel']" class="mr-2" />
            Export to Excel
          </button>
          <button @click="exportToPDF" class="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-2xl">
            <font-awesome-icon :icon="['fas', 'print']" class="mr-2" />
            Export to PDF
          </button>
        </div>
      </div>
    </Modal>

    <!-- Logout Modal -->
    <Modal :is-open="isLogoutModalOpen" title="Confirm Logout" @close="isLogoutModalOpen = false">
      <p class="mb-4">Are you sure you want to logout?</p>
      <div class="flex gap-4">
        <button @click="isLogoutModalOpen = false" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
        <button @click="confirmLogout" class="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-2xl">Logout</button>
      </div>
    </Modal>

    <!-- Settings Modal -->
    <Modal :is-open="isSettingsModalOpen" title="Settings" @close="isSettingsModalOpen = false" size="lg">
      <div class="space-y-6">
        <div>
          <h3 class="text-lg font-semibold mb-3">Printer Settings</h3>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Print Mode</label>
              <select v-model="printMode" class="w-full p-2 rounded-xl border border-gray-300">
                <option value="manual">Manual (Confirm before printing)</option>
                <option value="auto">Auto (Print immediately)</option>
                <option value="off">Off (No printing)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div class="flex gap-4 mt-6">
        <button @click="isSettingsModalOpen = false" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
        <button @click="saveSettings" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-2xl">Save Settings</button>
      </div>
    </Modal>

    <!-- Void Transaction Modal -->
    <Modal :is-open="isVoidTransactionModalOpen" title="Void Customer Transaction" size="full" @close="closeVoidModal">
      <div v-if="selectedTransaction" class="grid grid-cols-2 gap-8" style="min-height: 70vh;">
        <!-- Left Column: Transaction Details -->
        <div class="flex flex-col space-y-6 justify-start">
          <div class="bg-red-50 border-2 border-red-300 rounded-xl p-6">
            <h3 class="text-2xl font-bold text-red-600 mb-4">Warning: Void Transaction</h3>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-lg font-semibold">Transaction ID:</span>
                <span class="text-lg">{{ selectedTransaction.transactionId }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-lg font-semibold">Customer:</span>
                <span class="text-lg">{{ selectedTransaction.customerUsername }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-lg font-semibold">Type:</span>
                <span class="text-lg">{{ selectedTransaction.transactionType }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-lg font-semibold">Amount:</span>
                <span class="text-lg font-bold" :class="getAmountClass(selectedTransaction.transactionType)">
                  {{ formatAmount(selectedTransaction.amount, selectedTransaction.transactionType) }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-lg font-semibold">Date:</span>
                <span class="text-lg">{{ formatDateTime(selectedTransaction.createdAt) }}</span>
              </div>
            </div>
          </div>

          <div class="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
            <p class="text-base text-yellow-800">
              <strong>Note:</strong> 
              {{ selectedTransaction.transactionType === 'Cash-in' 
                ? 'This will deduct the added funds from the customer account.' 
                : 'This will refund the withdrawn amount to the customer account.' }}
            </p>
          </div>

          <!-- Verification Method Selection -->
          <div>
            <label class="block text-xl font-semibold mb-3">Verify Your Identity (Cashier/Admin):</label>
            <div class="flex gap-4">
              <button 
                @click="voidVerificationMethod = 'password'" 
                :class="voidVerificationMethod === 'password' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'"
                class="flex-1 py-3 px-4 rounded-xl font-semibold text-lg hover:opacity-80"
              >
                Password
              </button>
              <button 
                @click="voidVerificationMethod = 'rfid'" 
                :class="voidVerificationMethod === 'rfid' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'"
                class="flex-1 py-3 px-4 rounded-xl font-semibold text-lg hover:opacity-80"
              >
                RFID
              </button>
            </div>
          </div>

          <!-- Password Input -->
          <div v-if="voidVerificationMethod === 'password'">
            <label class="block text-xl font-semibold mb-3">Enter Your Password:</label>
            <input 
              ref="voidPasswordInput"
              v-model="voidPassword" 
              type="password" 
              @keyup.enter="processVoidTransaction"
              class="w-full p-4 border-2 border-gray-300 rounded-xl text-xl"
              placeholder="Enter password"
            />
          </div>

          <!-- RFID Input -->
          <div v-if="voidVerificationMethod === 'rfid'">
            <label class="block text-xl font-semibold mb-3">Tap Your RFID Card:</label>
            <div class="flex justify-center mb-4">
              <font-awesome-icon icon="id-card" class="text-8xl text-blue-500 animate-pulse" />
            </div>
            <input 
              ref="voidRfidInput"
              v-model="voidRfid" 
              type="text" 
              @keyup.enter="processVoidTransaction"
              class="w-full p-4 border-2 border-gray-300 rounded-xl text-xl text-center"
              placeholder="Tap RFID card"
            />
          </div>

          <!-- Error Message -->
          <div v-if="voidError" class="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <p class="text-lg text-red-600 font-semibold">{{ voidError }}</p>
          </div>
        </div>

        <!-- Right Column: Action Buttons -->
        <div class="flex flex-col justify-between">
          <div class="bg-gray-50 rounded-xl p-6">
            <h4 class="text-xl font-bold mb-4">Action Details</h4>
            <div class="space-y-3 text-lg">
              <p><strong>Current Balance:</strong> ₱{{ (selectedTransaction.balanceAfter || 0).toFixed(2) }}</p>
              <p>
                <strong>New Balance After Void:</strong> 
                <span class="font-bold" :class="selectedTransaction.transactionType === 'Cash-in' ? 'text-red-600' : 'text-green-600'">
                  ₱{{ calculateNewBalance().toFixed(2) }}
                </span>
              </p>
              <p class="text-sm text-gray-600 mt-4">
                This action cannot be undone. Please verify your identity to proceed.
              </p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col gap-4 mt-6">
            <button 
              @click="processVoidTransaction" 
              :disabled="!canProcessVoid"
              :class="!canProcessVoid ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'"
              class="w-full text-white font-bold py-4 px-6 rounded-2xl text-xl"
            >
              <font-awesome-icon icon="ban" class="mr-2" />
              Confirm Void Transaction
            </button>
            <button @click="closeVoidModal" class="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-2xl text-xl">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Modal>

    <!-- Toast Notification Component -->
    <Toast ref="toastRef" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import Modal from '../../components/Modal.vue'
import Toast from '../../components/Toast.vue'
import axios from 'axios'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faPrint, faFileExcel, faBan, faIdCard } from '@fortawesome/free-solid-svg-icons'

library.add(faPrint, faFileExcel, faBan, faIdCard)

const router = useRouter()
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const transactions = ref([])
const searchQuery = ref('')
const isMenuOpen = ref(false)
const isReportModalOpen = ref(false)
const isLogoutModalOpen = ref(false)
const isSettingsModalOpen = ref(false)
const isVoidTransactionModalOpen = ref(false)
const selectedTransaction = ref(null)
const voidVerificationMethod = ref('password')
const voidPassword = ref('')
const voidRfid = ref('')
const voidError = ref('')
const voidPasswordInput = ref(null)
const voidRfidInput = ref(null)
const sortColumn = ref('createdAt')
const sortDirection = ref('desc')
const dateFilter = ref('all')
const startDate = ref('')
const endDate = ref('')
const transactionTypeFilter = ref('all')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const printMode = ref('manual')

const toastRef = ref(null)

const showToast = (message, type = 'info', title = '') => {
  if (toastRef.value) {
    toastRef.value.addToast(message, type, title)
  }
}

const canProcessVoid = computed(() => {
  if (voidVerificationMethod.value === 'password') {
    return voidPassword.value.trim().length > 0
  } else {
    return voidRfid.value.trim().length > 0
  }
})

const calculateNewBalance = () => {
  if (!selectedTransaction.value) return 0
  const currentBalance = selectedTransaction.value.balanceAfter || 0
  const amount = selectedTransaction.value.amount || 0
  
  if (selectedTransaction.value.transactionType === 'Cash-in') {
    return currentBalance - amount
  } else {
    return currentBalance + amount
  }
}

const totalPages = computed(() => {
  return Math.ceil(filteredTransactions.value.length / itemsPerPage.value)
})

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredTransactions.value.slice(start, end)
})

const sortedTransactions = computed(() => {
  if (!sortColumn.value) return transactions.value
  
  return [...transactions.value].sort((a, b) => {
    let aVal = a[sortColumn.value]
    let bVal = b[sortColumn.value]
    
    if (sortColumn.value === 'createdAt') {
      aVal = new Date(aVal).getTime()
      bVal = new Date(bVal).getTime()
    }
    
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
  
  // Apply transaction type filter
  if (transactionTypeFilter.value !== 'all') {
    filtered = filtered.filter(t => t.transactionType === transactionTypeFilter.value)
  }
  
  // Apply search query
  const query = searchQuery.value.toLowerCase().trim()
  if (query) {
    filtered = filtered.filter(transaction => {
      const username = transaction.customerUsername?.toLowerCase() || ''
      const transactionId = transaction.transactionId?.toLowerCase() || ''
      const amount = transaction.amount?.toString() || ''
      
      return (
        username.includes(query) ||
        transactionId.includes(query) ||
        amount.includes(query)
      )
    })
  }
  
  return filtered
})

const cashInCount = computed(() => {
  return filteredTransactions.value.filter(t => t.transactionType === 'Cash-in').length
})

const cashOutCount = computed(() => {
  return filteredTransactions.value.filter(t => t.transactionType === 'Cash-out').length
})

const balanceInquiryCount = computed(() => {
  return filteredTransactions.value.filter(t => t.transactionType === 'Balance Inquiry').length
})

const formatDateTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatAmount = (amount, type) => {
  if (!amount || type === 'Balance inquiry' || type === 'Balance Inquiry') return '0.00'
  
  // For Voided transactions, use the actual sign from the amount
  if (type === 'Voided') {
    const formatted = Math.abs(amount).toFixed(2)
    return amount >= 0 ? `+${formatted}` : `-${formatted}`
  }
  
  // For other transaction types, manually add sign
  const formatted = `${Math.abs(amount).toFixed(2)}`
  if (type === 'Cash-in') return `+${formatted}`
  if (type === 'Cash-out') return `-${formatted}`
  return formatted
}

const getAmountClass = (type) => {
  if (type === 'Cash-in') return 'text-green-600'
  if (type === 'Cash-out') return 'text-red-600'
  if (type === 'Voided') return 'text-gray-600'
  return 'text-gray-600'
}

const getTransactionTypeClass = (type) => {
  switch(type) {
    case 'Cash-in':
      return 'bg-green-100 text-green-800'
    case 'Cash-out':
      return 'bg-red-100 text-red-800'
    case 'Balance inquiry':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
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
    const response = await axios.get(`${API_URL}/customer-transactions`)
    if (response.data.success) {
      transactions.value = response.data.transactions.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )
    }
  } catch (error) {
    console.error('Error fetching transactions:', error)
    showToast('Failed to fetch transactions', 'error')
  }
}

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const openLogoutModal = () => {
  isMenuOpen.value = false
  isLogoutModalOpen.value = true
}

const openSettingsModal = () => {
  isMenuOpen.value = false
  isSettingsModalOpen.value = true
}

const confirmLogout = () => {
  localStorage.removeItem('user')
  router.push('/')
}

const openVoidModal = (transaction) => {
  selectedTransaction.value = transaction
  voidVerificationMethod.value = 'password'
  voidPassword.value = ''
  voidRfid.value = ''
  voidError.value = ''
  isVoidTransactionModalOpen.value = true
  
  setTimeout(() => {
    if (voidPasswordInput.value) {
      voidPasswordInput.value.focus()
    }
  }, 100)
}

const closeVoidModal = () => {
  isVoidTransactionModalOpen.value = false
  selectedTransaction.value = null
  voidPassword.value = ''
  voidRfid.value = ''
  voidError.value = ''
}

const processVoidTransaction = async () => {
  if (!selectedTransaction.value) return
  
  voidError.value = ''
  
  try {
    const user = JSON.parse(localStorage.getItem('user'))
    if (!user) {
      voidError.value = 'User not found. Please login again.'
      return
    }

    // Verify user credentials
    const verificationData = {
      userId: user._id,
      transactionId: selectedTransaction.value._id
    }

    if (voidVerificationMethod.value === 'password') {
      verificationData.password = voidPassword.value
    } else {
      verificationData.rfid = voidRfid.value
    }

    const response = await axios.post(`${API_URL}/customer-transactions/void`, verificationData)

    if (response.data.success) {
      showToast('Transaction voided successfully', 'success')
      closeVoidModal()
      await fetchTransactions()
    } else {
      voidError.value = response.data.message || 'Failed to void transaction'
    }
  } catch (error) {
    console.error('Error voiding transaction:', error)
    voidError.value = error.response?.data?.message || 'Invalid credentials or failed to void transaction'
    
    // Clear the input fields
    if (voidVerificationMethod.value === 'password') {
      voidPassword.value = ''
    } else {
      voidRfid.value = ''
    }
  }
}

const saveSettings = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'))
    if (!user || !user._id) {
      showToast('User not found', 'error')
      return
    }

    const response = await axios.put(`${API_URL}/users/${user._id}/print-preferences`, {
      printMode: printMode.value
    })

    if (response.data.success) {
      localStorage.setItem('printMode', printMode.value)
      showToast('Settings saved successfully', 'success')
      isSettingsModalOpen.value = false
    }
  } catch (error) {
    showToast('Failed to save settings', 'error')
  }
}

const goBack = () => {
  router.push('/accounting')
}

const openReportModal = () => {
  isReportModalOpen.value = true
}

const closeReportModal = () => {
  isReportModalOpen.value = false
}

const getDateRangeText = () => {
  if (dateFilter.value === 'all') return 'All Time'
  if (dateFilter.value === 'today') return 'Today'
  if (dateFilter.value === 'custom' && startDate.value && endDate.value) {
    return `${startDate.value} to ${endDate.value}`
  }
  return 'All Time'
}

const exportToExcel = () => {
  const dateRangeText = getDateRangeText()
  const typeText = transactionTypeFilter.value === 'all' ? 'All Types' : transactionTypeFilter.value
  const reportTitle = `Customer Transaction Report - ${typeText} - ${dateRangeText}`
  
  let csvContent = `${reportTitle}\n`
  csvContent += `Generated on: ${new Date().toLocaleString()}\n`
  csvContent += `Total Transactions: ${filteredTransactions.value.length}\n`
  csvContent += `Cash-In: ${cashInCount.value}\n`
  csvContent += `Cash-Out: ${cashOutCount.value}\n`
  csvContent += `Balance Inquiry: ${balanceInquiryCount.value}\n\n`
  csvContent += 'Date & Time,Transaction ID,Username,Amount,Transaction Type,Current Balance\n'
  
  filteredTransactions.value.forEach(transaction => {
    const dateTime = formatDateTime(transaction.createdAt)
    const transactionId = transaction.transactionId || 'N/A'
    const username = transaction.customerUsername || 'N/A'
    const amount = formatAmount(transaction.amount, transaction.transactionType)
    const currentBalance = `${(transaction.balanceAfter || 0).toFixed(2)}`
    csvContent += `"${dateTime}","${transactionId}","${username}","${amount}","${transaction.transactionType}","${currentBalance}"\n`
  })
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `Customer_Transaction_Report_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  showToast('Report exported successfully!', 'success')
  closeReportModal()
}

const exportToPDF = () => {
  const printWindow = window.open('', '_blank')
  
  const dateRangeText = getDateRangeText()
  const typeText = transactionTypeFilter.value === 'all' ? 'All Types' : transactionTypeFilter.value
  const reportTitle = `Customer Transaction Report - ${typeText} - ${dateRangeText}`
  
  const reportContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${reportTitle}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 10px;
          font-size: 10px;
        }
        h1 {
          text-align: center;
          color: #333;
          font-size: 14px;
          margin-bottom: 10px;
        }
        .report-info {
          background-color: #f5f5f5;
          padding: 8px;
          border-radius: 5px;
          margin-bottom: 10px;
          font-size: 9px;
        }
        .report-info p {
          margin: 3px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          font-size: 9px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 4px 6px;
          text-align: left;
        }
        th {
          background-color: #4CAF50;
          color: white;
          font-size: 10px;
        }
        tr:nth-child(even) {
          background-color: #f2f2f2;
        }
        .type-cash-in {
          color: #10b981;
          font-weight: bold;
        }
        .type-cash-out {
          color: #ef4444;
          font-weight: bold;
        }
        .type-balance {
          color: #3b82f6;
          font-weight: bold;
        }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <h1>${reportTitle}</h1>
      <div class="report-info">
        <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Total Transactions:</strong> ${filteredTransactions.value.length}</p>
        <p><strong>Cash-In:</strong> ${cashInCount.value}</p>
        <p><strong>Cash-Out:</strong> ${cashOutCount.value}</p>
        <p><strong>Balance Inquiry:</strong> ${balanceInquiryCount.value}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Date & Time</th>
            <th>Transaction ID</th>
            <th>Username</th>
            <th>Amount</th>
            <th>Transaction Type</th>
            <th>Current Balance</th>
          </tr>
        </thead>
        <tbody>
          ${filteredTransactions.value.map(transaction => `
            <tr>
              <td>${formatDateTime(transaction.createdAt)}</td>
              <td>${transaction.transactionId || 'N/A'}</td>
              <td>${transaction.customerUsername || 'N/A'}</td>
              <td class="${transaction.transactionType === 'Cash-in' ? 'type-cash-in' : transaction.transactionType === 'Cash-out' ? 'type-cash-out' : 'type-balance'}">${formatAmount(transaction.amount, transaction.transactionType)}</td>
              <td>${transaction.transactionType}</td>
              <td>${(transaction.balanceAfter || 0).toFixed(2)}</td>
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
  
  showToast('Report ready for printing/PDF export!', 'success')
  closeReportModal()
}

// Watch for verification method change to refocus input
watch(voidVerificationMethod, () => {
  nextTick(() => {
    if (voidVerificationMethod.value === 'password' && voidPasswordInput.value) {
      voidPasswordInput.value.focus()
    } else if (voidVerificationMethod.value === 'rfid' && voidRfidInput.value) {
      voidRfidInput.value.focus()
    }
  })
})

onMounted(() => {
  fetchTransactions()
})
</script>
