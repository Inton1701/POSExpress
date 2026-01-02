<template>
  <div class="bg-gray-100 min-h-screen">
    <header class="bg-white shadow-md p-4 flex justify-between items-center">
      <div class="flex items-center gap-4">
        <button @click="goBack" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl">
          <font-awesome-icon icon="arrow-left" class="mr-2" />
          Back to POS
        </button>
        <h1 class="text-2xl font-bold">Transactions</h1>
      </div>
      <div class="text-sm text-gray-600">
        <span v-if="sessionActive" class="text-green-600 font-semibold">● Session Active</span>
        <span v-else class="text-gray-500">Viewing Last Session</span>
      </div>
    </header>

    <main class="container mx-auto p-6">
      <!-- Transactions List -->
      <div class="bg-white rounded-2xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold">Transactions ({{ filteredTransactions.length }})</h2>
          <button @click="refreshTransactions" :disabled="isLoading" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-xl">
            <font-awesome-icon :icon="isLoading ? 'spinner' : 'sync'" :class="{ 'fa-spin': isLoading }" class="mr-2" />
            Refresh
          </button>
        </div>

        <!-- Filters -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search by Transaction ID or Customer..." 
            class="p-2 rounded-xl border border-gray-300"
          />
          <select v-model="paymentMethodFilter" class="p-2 rounded-xl border border-gray-300">
            <option value="all">All Payment Methods</option>
            <option value="Cash">Cash</option>
            <option value="E-wallet">E-wallet</option>
          </select>
          <select v-model="statusFilter" class="p-2 rounded-xl border border-gray-300">
            <option value="all">All Status</option>
            <option value="Completed">Completed</option>
            <option value="Returned">Returned</option>
            <option value="Voided">Voided</option>
          </select>
          <select v-model="sortBy" class="p-2 rounded-xl border border-gray-300">
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="totalAmount-desc">Highest Amount</option>
            <option value="totalAmount-asc">Lowest Amount</option>
          </select>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-12">
          <font-awesome-icon icon="spinner" spin class="text-4xl text-blue-500 mb-4" />
          <p class="text-gray-600">Loading transactions...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredTransactions.length === 0" class="text-center py-12">
          <font-awesome-icon icon="receipt" class="text-6xl text-gray-300 mb-4" />
          <p class="text-gray-600">{{ searchQuery ? 'No transactions found matching your search' : 'No transactions found' }}</p>
        </div>

        <!-- Transactions Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full relative">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-8 py-6 text-left text-2xl font-bold">Transaction ID</th>
                <th class="px-8 py-6 text-left text-2xl font-bold">Date & Time</th>
                <th class="px-8 py-6 text-left text-2xl font-bold">Customer</th>
                <th class="px-8 py-6 text-left text-2xl font-bold">Payment</th>
                <th class="px-8 py-6 text-left text-2xl font-bold">Amount</th>
                <th class="px-8 py-6 text-left text-2xl font-bold">Status</th>
                <th class="px-8 py-6 text-center text-2xl font-bold sticky right-0 bg-gray-50 shadow-[-2px_0_4px_rgba(0,0,0,0.1)] min-w-[200px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="transaction in paginatedTransactions" :key="transaction._id" class="border-t hover:bg-gray-50">
                <td class="px-8 py-6 font-mono text-xl">
                  <div class="flex items-center gap-2">
                    <span>{{ transaction.transactionId }}</span>
                    <button 
                      @click="copyTransactionId(transaction.transactionId)" 
                      class="text-blue-500 hover:text-blue-700"
                      title="Copy Transaction ID"
                    >
                      <font-awesome-icon icon="copy" class="text-lg" />
                    </button>
                  </div>
                </td>
                <td class="px-8 py-6 text-xl">{{ formatDate(transaction.createdAt) }}</td>
                <td class="px-8 py-6 text-xl">{{ getCustomerName(transaction) }}</td>
                <td class="px-8 py-6 text-xl">{{ transaction.paymentMethod }}</td>
                <td class="px-8 py-6 font-semibold text-xl">₱{{ transaction.totalAmount.toFixed(2) }}</td>
                <td class="px-8 py-6">
                  <span :class="getStatusClass(transaction.status)" class="px-4 py-2 rounded-full text-lg font-bold">
                    {{ transaction.status }}
                  </span>
                </td>
                <td class="px-8 py-6 text-center sticky right-0 bg-white group-hover:bg-gray-50 shadow-[-2px_0_4px_rgba(0,0,0,0.1)] whitespace-nowrap min-w-[200px]">
                  <div class="flex gap-2 justify-center">
                    <button @click="viewTransaction(transaction)" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-lg font-semibold">
                      <font-awesome-icon icon="eye" class="mr-2" />
                      View
                    </button>
                    <button @click="reprintTransaction(transaction)" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-lg font-semibold">
                      <font-awesome-icon icon="print" class="mr-2" />
                      Print
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div v-if="filteredTransactions.length > 0" class="flex justify-between items-center mt-4 pt-4 border-t">
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
    </main>

    <!-- View Transaction Modal -->
    <Modal :is-open="isViewModalOpen" title="Transaction Details" size="lg" @close="isViewModalOpen = false">
      <div v-if="selectedTransaction" class="space-y-4 max-h-[70vh] overflow-y-auto">
        <!-- Transaction Info -->
        <div class="bg-gray-50 rounded-xl p-4">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p class="text-gray-600">Transaction ID</p>
              <p class="font-bold text-gray-800">{{ selectedTransaction.transactionId }}</p>
            </div>
            <div>
              <p class="text-gray-600">Date & Time</p>
              <p class="font-bold text-gray-800">{{ formatDate(selectedTransaction.createdAt) }}</p>
            </div>
            <div>
              <p class="text-gray-600">Payment Method</p>
              <p class="font-bold text-gray-800">{{ selectedTransaction.paymentMethod }}</p>
            </div>
            <div>
              <p class="text-gray-600">Employee</p>
              <p class="font-bold text-gray-800">{{ selectedTransaction.employee || 'Cashier' }}</p>
            </div>
            <div>
              <p class="text-gray-600">Customer</p>
              <p class="font-bold text-gray-800">{{ getCustomerName(selectedTransaction) }}</p>
            </div>
            <div>
              <p class="text-gray-600">Status</p>
              <span :class="getStatusClass(selectedTransaction.status)" class="px-3 py-1 rounded-full text-xs font-bold">
                {{ selectedTransaction.status }}
              </span>
            </div>
          </div>
        </div>

        <!-- Items -->
        <div>
          <h3 class="font-bold text-gray-800 mb-2">Items</h3>
          <div class="space-y-2">
            <div v-for="(item, index) in selectedTransaction.cart" :key="index" class="bg-white border rounded-lg p-3">
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <p class="font-semibold text-gray-800">{{ item.name }}</p>
                  <p class="text-xs text-gray-500">₱{{ item.price.toFixed(2) }} × {{ item.quantity }}</p>
                  <!-- Addons -->
                  <div v-if="item.addons && item.addons.length > 0" class="ml-4 mt-1">
                    <div v-for="(addon, addonIndex) in item.addons" :key="addonIndex" class="text-xs text-gray-600">
                      + {{ addon.name }} (₱{{ addon.price.toFixed(2) }} × {{ addon.quantity }})
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-bold text-gray-800">₱{{ item.total.toFixed(2) }}</p>
                  <p v-if="item.addons && item.addons.length > 0" class="text-xs text-gray-500">
                    + ₱{{ item.addons.reduce((sum, a) => sum + (a.price * a.quantity), 0).toFixed(2) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Summary -->
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Subtotal</span>
              <span class="font-semibold">₱{{ selectedTransaction.totalAmount.toFixed(2) }}</span>
            </div>
            <div v-if="selectedTransaction.paymentMethod === 'Cash'" class="border-t pt-2 space-y-1">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Cash Received</span>
                <span class="font-semibold">₱{{ (selectedTransaction.cash || 0).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Change</span>
                <span class="font-semibold text-purple-600">₱{{ (selectedTransaction.change || 0).toFixed(2) }}</span>
              </div>
            </div>
            <div class="border-t pt-2 flex justify-between items-center">
              <span class="text-lg font-bold text-gray-800">Total Amount</span>
              <span class="text-2xl font-bold text-blue-600">₱{{ selectedTransaction.totalAmount.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="flex gap-4 mt-4">
        <button @click="isViewModalOpen = false" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl">Close</button>
        <button @click="reprintFromView" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2">
          <font-awesome-icon icon="print" />
          Print Receipt
        </button>
      </div>
    </Modal>

    <!-- Print Confirmation Modal -->
    <Modal :is-open="isPrintConfirmModalOpen" title="Print Receipt" @close="isPrintConfirmModalOpen = false">
      <div class="text-center py-4">
        <div class="mb-4">
          <font-awesome-icon icon="print" class="text-6xl text-blue-500" />
        </div>
        <h3 class="text-xl font-bold text-gray-800 mb-2">Print Receipt?</h3>
        <p class="text-gray-600 mb-4">Do you want to print this receipt?</p>
      </div>
      <div class="flex gap-4">
        <button @click="isPrintConfirmModalOpen = false" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl">Cancel</button>
        <button @click="confirmPrint" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2">
          <font-awesome-icon icon="print" />
          Print
        </button>
      </div>
    </Modal>

    <Toast ref="toastRef" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import Toast from '../../components/Toast.vue'
import Modal from '../../components/Modal.vue'
import axios from 'axios'
import { printThermalReceipt } from '../../utils/printReceipt.js'

const router = useRouter()
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const transactions = ref([])
const sessionActive = ref(false)
const isLoading = ref(false)
const toastRef = ref(null)
const selectedPrinter = ref(null)
const currentStore = ref(null)
const isViewModalOpen = ref(false)
const selectedTransaction = ref(null)
const isPrintConfirmModalOpen = ref(false)
const pendingPrintData = ref(null)

// Filter and pagination
const searchQuery = ref('')
const paymentMethodFilter = ref('all')
const statusFilter = ref('all')
const sortBy = ref('createdAt-desc')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const currentUserStore = ref(null)

const filteredTransactions = computed(() => {
  let filtered = [...transactions.value]
  
  // Filter by store for current user
  if (currentUserStore.value) {
    filtered = filtered.filter(t => {
      const transactionStoreId = typeof t.store === 'object' ? t.store?._id : t.store
      return transactionStoreId && transactionStoreId.toString() === currentUserStore.value.toString()
    })
  }
  
  // Apply search
  const query = searchQuery.value.toLowerCase().trim()
  if (query) {
    filtered = filtered.filter(transaction => {
      const transactionId = transaction.transactionId?.toLowerCase() || ''
      const customerName = getCustomerName(transaction).toLowerCase()
      return transactionId.includes(query) || customerName.includes(query)
    })
  }
  
  // Apply payment method filter
  if (paymentMethodFilter.value !== 'all') {
    filtered = filtered.filter(t => t.paymentMethod === paymentMethodFilter.value)
  }
  
  // Apply status filter
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(t => t.status === statusFilter.value)
  }
  
  // Apply sorting
  const [sortField, sortDir] = sortBy.value.split('-')
  filtered.sort((a, b) => {
    let aVal = a[sortField]
    let bVal = b[sortField]
    
    if (sortField === 'createdAt') {
      aVal = new Date(aVal).getTime()
      bVal = new Date(bVal).getTime()
    }
    
    if (sortDir === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
    }
  })
  
  return filtered
})

const totalPages = computed(() => {
  return Math.ceil(filteredTransactions.value.length / itemsPerPage.value)
})

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredTransactions.value.slice(start, end)
})

const showToast = (message, type = 'info') => {
  if (toastRef.value) {
    toastRef.value.addToast(message, type)
  }
}

const goBack = () => {
  router.push('/pos')
}

const formatDate = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

const getCustomerName = (transaction) => {
  if (transaction.customerId && transaction.customerId.fullName) {
    return transaction.customerId.fullName
  }
  return 'Walk-in Customer'
}

const getStatusClass = (status) => {
  switch (status) {
    case 'Completed':
      return 'bg-green-100 text-green-800'
    case 'Returned':
      return 'bg-yellow-100 text-yellow-800'
    case 'Voided':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const checkSessionStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/transactions/session/status`)
    if (response.data.success) {
      sessionActive.value = response.data.session?.isActive || false
      return sessionActive.value
    }
    return false
  } catch (error) {
    console.error('Error checking session status:', error)
    return false
  }
}

const fetchTransactions = async () => {
  try {
    isLoading.value = true
    const response = await axios.get(`${API_URL}/transactions`)
    if (response.data.success) {
      // Show all transactions, sorted by date
      transactions.value = response.data.transactions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }
  } catch (error) {
    console.error('Error fetching transactions:', error)
    showToast('Failed to load transactions', 'error')
  } finally {
    isLoading.value = false
  }
}

const refreshTransactions = async () => {
  await checkSessionStatus()
  await fetchTransactions()
  showToast('Transactions refreshed', 'success')
}

const viewTransaction = (transaction) => {
  selectedTransaction.value = transaction
  isViewModalOpen.value = true
}

const reprintTransaction = async (transaction) => {
  try {
    console.log('Reprint transaction clicked:', transaction.transactionId)
    
    // Load printer preference
    const printerPref = localStorage.getItem('selectedPrinter')
    if (printerPref) {
      selectedPrinter.value = printerPref
      console.log('Using printer:', printerPref)
    } else {
      console.log('No printer selected')
    }

    // Prepare receipt data based on transaction type
    // IMPORTANT: Only use plain JavaScript objects (no Date objects, no circular references)
    let printData
    
    // Extract customer name as plain string to avoid passing object references
    let customerNameStr = 'Walk-in Customer'
    if (transaction.customerId) {
      if (typeof transaction.customerId === 'object' && transaction.customerId.fullName) {
        customerNameStr = String(transaction.customerId.fullName)
      }
    }
    
    // Convert date to string immediately to avoid Date object in IPC
    const dateStr = transaction.createdAt 
      ? String(new Date(transaction.createdAt).toISOString())
      : String(new Date().toISOString())
    
    if (transaction.status === 'Returned') {
      console.log('Preparing refund receipt')
      // Refund receipt format - all values must be serializable
      printData = {
        type: 'refund',
        transactionId: String(transaction.transactionId || ''),
        originalTransactionId: String(transaction.originalTransactionId || transaction.transactionId || ''),
        items: (transaction.cart || []).map(item => ({
          name: String(item.name || ''),
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 0)
        })),
        refundAmount: Number(transaction.totalAmount || 0),
        paymentMethod: String(transaction.paymentMethod || ''),
        customer: transaction.customerId ? {
          fullName: customerNameStr
        } : null,
        cashier: String(transaction.employee || 'Cashier'),
        date: dateStr,
        storeName: String(currentStore.value?.storeName || ''),
        address: String(currentStore.value?.address || ''),
        contact: String(currentStore.value?.contact || '')
      }
    } else {
      console.log('Preparing sales receipt')
      // Sales receipt format - all values must be serializable
      printData = {
        transactionType: 'SALE',
        transactionId: String(transaction.transactionId || ''),
        cart: (transaction.cart || []).map(item => ({
          name: String(item.name || ''),
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 0),
          total: Number(item.total || 0),
          addons: (item.addons || []).map(addon => ({
            name: String(addon.name || ''),
            price: Number(addon.price || 0),
            quantity: Number(addon.quantity || 0)
          }))
        })),
        paymentMethod: String(transaction.paymentMethod || ''),
        customerName: customerNameStr,
        totalAmount: Number(transaction.totalAmount || 0),
        cash: Number(transaction.cash || 0),
        change: Number(transaction.change || 0),
        employee: String(transaction.employee || 'Cashier'),
        date: dateStr,
        storeName: String(currentStore.value?.storeName || ''),
        address: String(currentStore.value?.address || ''),
        contact: String(currentStore.value?.contact || '')
      }
    }

    console.log('Print data prepared:', printData)
    
    // Show confirmation modal
    pendingPrintData.value = printData
    isPrintConfirmModalOpen.value = true
  } catch (error) {
    console.error('Error preparing receipt:', error)
    showToast('Error preparing receipt: ' + error.message, 'error')
  }
}

const reprintFromView = () => {
  if (selectedTransaction.value) {
    isViewModalOpen.value = false
    reprintTransaction(selectedTransaction.value)
  }
}

const confirmPrint = async () => {
  try {
    if (pendingPrintData.value) {
      // Ensure we have the printer preference loaded
      const printerPref = localStorage.getItem('selectedPrinter')
      if (printerPref) {
        selectedPrinter.value = printerPref
      }
      
      // Convert Vue Proxy to plain object for IPC serialization
      const plainPrintData = JSON.parse(JSON.stringify(pendingPrintData.value))
      
      await printThermalReceipt(plainPrintData, selectedPrinter.value)
      showToast('Receipt sent to printer', 'success')
    }
  } catch (error) {
    console.error('Print error:', error)
    showToast(error.message || 'Failed to print receipt', 'error')
  } finally {
    isPrintConfirmModalOpen.value = false
    pendingPrintData.value = null
  }
}

const loadCurrentUser = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.store) {
      currentStore.value = user.store
      currentUserStore.value = user.store?._id || user.store
    }
  } catch (error) {
    console.error('Error loading user:', error)
  }
}

const copyTransactionId = async (transactionId) => {
  try {
    await navigator.clipboard.writeText(transactionId)
    showToast('Transaction ID copied to clipboard', 'success')
  } catch (error) {
    console.error('Error copying transaction ID:', error)
    showToast('Failed to copy Transaction ID', 'error')
  }
}

onMounted(async () => {
  loadCurrentUser()
  await checkSessionStatus()
  await fetchTransactions()
})
</script>
