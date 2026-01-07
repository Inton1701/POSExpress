<template>
  <div class="bg-gray-100 min-h-screen">
    <header class="bg-white shadow-md p-4 flex justify-between items-center">
      <div class="flex items-center gap-4">
        <button @click="goBack" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl">
          <font-awesome-icon icon="arrow-left" class="mr-2" />
          Back to POS
        </button>
        <h1 class="text-2xl font-bold">Sales Report</h1>
      </div>
      <div class="flex items-center gap-3">
        <div class="text-sm text-gray-600">
          <span v-if="sessionActive" class="text-green-600 font-semibold">● Session Active</span>
          <span v-else class="text-gray-500">Viewing Last Session</span>
        </div>
        <button @click="toggleKeyboardModal" class="bg-gray-200 hover:bg-gray-300 p-3 rounded-lg transition active:scale-95" title="On-Screen Keyboard">
          <font-awesome-icon icon="keyboard" class="text-gray-600 text-xl" />
        </button>
        <button @click="toggleFullScreen" class="bg-gray-200 hover:bg-gray-300 p-3 rounded-lg transition active:scale-95" title="Toggle Fullscreen">
          <font-awesome-icon icon="expand" class="text-gray-600 text-xl" />
        </button>
      </div>
    </header>

    <main class="container mx-auto p-6">
      <div>
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div class="bg-white rounded-2xl p-6 shadow">
            <h3 class="text-gray-600 text-sm mb-2">Today's Sales</h3>
            <p class="text-3xl font-bold text-green-600">₱{{ formatNumber(summary.todaySales) }}</p>
          </div>
          <div class="bg-white rounded-2xl p-6 shadow">
            <h3 class="text-gray-600 text-sm mb-2">Total Profit</h3>
            <p class="text-3xl font-bold text-orange-600">₱{{ formatNumber(summary.totalProfit) }}</p>
          </div>
          <div class="bg-white rounded-2xl p-6 shadow">
            <h3 class="text-gray-600 text-sm mb-2">Total Products Sold</h3>
            <p class="text-3xl font-bold text-teal-600">{{ formatNumber(summary.totalProductsSold) }}</p>
          </div>
        </div>

        <!-- Product Sales Table -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold">Product Sales</h2>
            <div class="flex gap-3">
              <button @click="refreshSales" :disabled="isLoading" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-xl">
                <font-awesome-icon :icon="isLoading ? 'spinner' : 'sync'" :class="{ 'fa-spin': isLoading }" class="mr-2" />
                Refresh
              </button>
              <button @click="printSalesReport" :disabled="productSales.length === 0" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
                <font-awesome-icon icon="print" class="mr-2" />
                Print Report
              </button>
            </div>
          </div>

          <!-- Search and Sort -->
          <div class="mb-4 flex gap-4">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Search by product name or SKU..." 
              class="flex-1 p-2 rounded-xl border border-gray-300"
            />
            <select v-model="sortBy" class="p-2 rounded-xl border border-gray-300">
              <option value="name">Sort by Name</option>
              <option value="quantitySold">Sort by Quantity</option>
              <option value="totalSales">Sort by Sales</option>
              <option value="totalProfit">Sort by Profit</option>
            </select>
            <select v-model="sortDirection" class="p-2 rounded-xl border border-gray-300">
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="text-center py-12">
            <font-awesome-icon icon="spinner" spin class="text-4xl text-blue-500 mb-4" />
            <p class="text-gray-600">Loading sales data...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredProductSales.length === 0" class="text-center py-12">
            <font-awesome-icon icon="chart-line" class="text-6xl text-gray-300 mb-4" />
            <p class="text-gray-600">{{ searchQuery ? 'No products found matching your search' : 'No sales data found' }}</p>
          </div>

          <!-- Sales Table -->
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-8 py-6 text-left text-2xl font-bold">SKU</th>
                  <th class="px-8 py-6 text-left text-2xl font-bold">Product Name</th>
                  <th class="px-8 py-6 text-right text-2xl font-bold">Price</th>
                  <th class="px-8 py-6 text-right text-2xl font-bold">Cost</th>
                  <th class="px-8 py-6 text-right text-2xl font-bold">Quantity Sold</th>
                  <th class="px-8 py-6 text-right text-2xl font-bold">Total Sales</th>
                  <th class="px-8 py-6 text-right text-2xl font-bold">Total Profit</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="product in paginatedProductSales" :key="product.sku" class="border-t hover:bg-gray-50">
                  <td class="px-8 py-6 text-xl">{{ product.sku }}</td>
                  <td class="px-8 py-6 font-medium text-xl">{{ product.name }}</td>
                  <td class="px-8 py-6 text-right text-xl">₱{{ formatNumber(product.price) }}</td>
                  <td class="px-8 py-6 text-right text-gray-600 text-xl">₱{{ formatNumber(product.cost) }}</td>
                  <td class="px-8 py-6 text-right font-semibold text-xl">{{ product.quantitySold }}</td>
                  <td class="px-8 py-6 text-right font-bold text-green-600 text-xl">₱{{ formatNumber(product.totalSales) }}</td>
                  <td class="px-8 py-6 text-right font-bold text-xl" :class="product.totalProfit >= 0 ? 'text-blue-600' : 'text-red-600'">
                    ₱{{ formatNumber(product.totalProfit) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Controls -->
          <div v-if="filteredProductSales.length > 0" class="flex justify-between items-center mt-4 pt-4 border-t">
            <div class="flex items-center gap-2">
              <label class="text-sm text-gray-600">Items per page:</label>
              <select v-model.number="itemsPerPage" @change="currentPage = 1" class="border border-gray-300 rounded px-2 py-1 text-sm">
                <option :value="10">10</option>
                <option :value="25">25</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
              </select>
              <span class="text-sm text-gray-600 ml-4">
                Showing {{ Math.min((currentPage - 1) * itemsPerPage + 1, filteredProductSales.length) }} 
                to {{ Math.min(currentPage * itemsPerPage, filteredProductSales.length) }} 
                of {{ filteredProductSales.length }} products
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
      </div>
    </main>

    <!-- Print Confirmation Modal -->
    <Modal :is-open="isPrintConfirmModalOpen" title="Print Sales Report" @close="isPrintConfirmModalOpen = false">
      <div class="text-center py-4">
        <div class="mb-4">
          <font-awesome-icon icon="print" class="text-6xl text-blue-500" />
        </div>
        <h3 class="text-xl font-bold text-gray-800 mb-2">Print Sales Report</h3>
        <p class="text-gray-600 mb-4">Would you like to print the sales report to the thermal printer?</p>
      </div>
      <div class="flex gap-4">
        <button @click="isPrintConfirmModalOpen = false" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
        <button @click="confirmPrintSalesReport" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-2xl flex items-center justify-center gap-2">
          <font-awesome-icon icon="print" />
          Print Report
        </button>
      </div>
    </Modal>

    <!-- Print Loading Modal -->
    <Modal :is-open="isPrintingReceipt" title="Printing Sales Report">
      <div class="text-center py-8">
        <font-awesome-icon icon="spinner" spin class="text-6xl text-blue-500 mb-4" />
        <p class="text-lg font-semibold text-gray-700">Printing sales report...</p>
        <p class="text-sm text-gray-500 mt-2">Please wait while we process your print request</p>
      </div>
    </Modal>

    <!-- On-Screen Keyboard Modal -->
    <div v-if="isKeyboardModalOpen" class="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center">
      <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl mx-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-2xl font-bold text-gray-900">On-Screen Keyboard</h3>
          <button @click="toggleKeyboardModal" class="text-gray-500 hover:text-gray-700 text-3xl">&times;</button>
        </div>
        
        <!-- Preview -->
        <div class="mb-4 p-4 bg-gray-100 rounded-xl text-center text-2xl font-mono min-h-[60px] flex items-center justify-center">
          <span v-if="keyboardValue" class="break-all">{{ keyboardValue }}</span>
          <span v-else class="text-gray-400">Type here...</span>
        </div>
        
        <!-- Number Row -->
        <div class="grid grid-cols-10 gap-2 mb-2">
          <button v-for="num in ['1','2','3','4','5','6','7','8','9','0']" :key="num" 
            @click="keyboardValue += num" 
            class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 text-xl rounded-lg">
            {{ num }}
          </button>
        </div>
        
        <!-- QWERTY Row -->
        <div class="grid grid-cols-10 gap-2 mb-2">
          <button v-for="key in ['Q','W','E','R','T','Y','U','I','O','P']" :key="key" 
            @click="keyboardValue += key" 
            class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 text-xl rounded-lg">
            {{ key }}
          </button>
        </div>
        
        <!-- ASDF Row -->
        <div class="grid grid-cols-10 gap-2 mb-2 px-4">
          <button v-for="key in ['A','S','D','F','G','H','J','K','L']" :key="key" 
            @click="keyboardValue += key" 
            class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 text-xl rounded-lg">
            {{ key }}
          </button>
          <button @click="keyboardValue = keyboardValue.slice(0, -1)" class="bg-red-400 hover:bg-red-500 text-white font-bold py-4 text-lg rounded-lg">
            <font-awesome-icon icon="backspace" />
          </button>
        </div>
        
        <!-- ZXCV Row -->
        <div class="grid grid-cols-10 gap-2 mb-2 px-8">
          <button v-for="key in ['Z','X','C','V','B','N','M','-']" :key="key" 
            @click="keyboardValue += key" 
            class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 text-xl rounded-lg">
            {{ key }}
          </button>
          <button @click="keyboardValue = ''" class="bg-orange-400 hover:bg-orange-500 text-white font-bold py-4 text-sm rounded-lg col-span-2">
            Clear
          </button>
        </div>
        
        <!-- Space bar -->
        <div class="grid grid-cols-10 gap-2 mb-4 px-12">
          <button @click="keyboardValue += '@'" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 text-xl rounded-lg">@</button>
          <button @click="keyboardValue += '.'" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 text-xl rounded-lg">.</button>
          <button @click="keyboardValue += ' '" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-4 text-lg rounded-lg col-span-6">Space</button>
          <button @click="keyboardValue += '_'" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 text-xl rounded-lg">_</button>
          <button @click="keyboardValue += '#'" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 text-xl rounded-lg">#</button>
        </div>
        
        <!-- Action buttons -->
        <div class="flex gap-4">
          <button @click="toggleKeyboardModal" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 text-xl rounded-xl">Cancel</button>
          <button @click="applyKeyboardValue" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-4 text-xl rounded-xl">Apply</button>
        </div>
      </div>
    </div>

    <Toast ref="toastRef" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import Toast from '../../components/Toast.vue'
import Modal from '../../components/Modal.vue'
import { api } from '@/utils/api'
import { auth } from '@/utils/auth'
import { printThermalReceipt } from '../../utils/printReceipt.js'

const router = useRouter()

const productSales = ref([])
const summary = ref({
  todaySales: 0,
  totalProfit: 0,
  totalProductsSold: 0
})
const sessionInfo = ref({
  startedAt: null,
  endedAt: null
})
const sessionActive = ref(false)
const isLoading = ref(false)
const toastRef = ref(null)
const selectedPrinter = ref(null)
const currentStore = ref(null)
const isPrintConfirmModalOpen = ref(false)
const isPrintingReceipt = ref(false)
const isKeyboardModalOpen = ref(false)
const keyboardValue = ref('')

// Filter and pagination
const searchQuery = ref('')
const sortBy = ref('name')
const sortDirection = ref('asc')
const currentPage = ref(1)
const itemsPerPage = ref(10)

const filteredProductSales = computed(() => {
  let filtered = [...productSales.value]
  
  // Apply search
  const query = searchQuery.value.toLowerCase().trim()
  if (query) {
    filtered = filtered.filter(product => 
      product.name.toLowerCase().includes(query) || 
      product.sku.toLowerCase().includes(query)
    )
  }
  
  // Apply sorting
  filtered.sort((a, b) => {
    let aVal = a[sortBy.value]
    let bVal = b[sortBy.value]
    
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
  
  return filtered
})

const totalPages = computed(() => {
  return Math.ceil(filteredProductSales.value.length / itemsPerPage.value)
})

const paginatedProductSales = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredProductSales.value.slice(start, end)
})

const showToast = (message, type = 'info') => {
  if (toastRef.value) {
    toastRef.value.addToast(message, type)
  }
}

const goBack = () => {
  router.push('/pos')
}

const toggleKeyboardModal = () => {
  isKeyboardModalOpen.value = !isKeyboardModalOpen.value
  if (isKeyboardModalOpen.value) {
    keyboardValue.value = searchQuery.value
  } else {
    keyboardValue.value = ''
  }
}

const applyKeyboardValue = () => {
  searchQuery.value = keyboardValue.value
  toggleKeyboardModal()
}

const toggleFullScreen = async () => {
  try {
    if (window.electronAPI?.toggleFullscreen) {
      await window.electronAPI.toggleFullscreen()
    } else {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        }
      }
    }
  } catch (err) {
    console.error('Failed to toggle fullscreen:', err)
  }
}

const formatNumber = (value) => {
  return (value || 0).toFixed(2)
}

const checkSessionStatus = async () => {
  try {
    const response = await api.get('/transactions/session/status')
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

const fetchSalesData = async () => {
  try {
    isLoading.value = true
    const response = await api.get('/transactions/sales-report')
    if (response.data.success) {
      summary.value = response.data.summary
      productSales.value = response.data.productSales
      sessionInfo.value = response.data.sessionInfo || { startedAt: null, endedAt: null }
      
      // Show message if no active session
      if (response.data.hasActiveSession === false) {
        if (productSales.value.length > 0) {
          showToast('No active session. Viewing last session data.', 'info')
        } else {
          showToast('No session data available.', 'warning')
        }
      }
    }
  } catch (error) {
    console.error('Error fetching sales:', error)
    showToast('Failed to load sales data', 'error')
  } finally {
    isLoading.value = false
  }
}

const refreshSales = async () => {
  await checkSessionStatus()
  await fetchSalesData()
  showToast('Sales data refreshed', 'success')
}

const printSalesReport = () => {
  // Check if Electron is available
  if (!window.electronAPI) {
    showToast('Thermal printing is only available in desktop app', 'error')
    return
  }

  // Show confirmation modal
  isPrintConfirmModalOpen.value = true
}

const confirmPrintSalesReport = async () => {
  try {
    // Close confirmation modal
    isPrintConfirmModalOpen.value = false

    // Show loading modal
    isPrintingReceipt.value = true

    // Verify Electron is available
    if (!window.electronAPI) {
      showToast('Thermal printing requires desktop application', 'error')
      return
    }

    // Load printer preference
    const printerPref = localStorage.getItem('selectedPrinter')
    if (printerPref) {
      selectedPrinter.value = printerPref
    }

    // Prepare sales report data for thermal printing (all primitive values)
    const printData = {
      transactionType: 'Sales Report',
      storeName: String(currentStore.value?.storeName || 'POSXPRESS'),
      address: String(currentStore.value?.address || ''),
      contact: String(currentStore.value?.contact || ''),
      tin: String(currentStore.value?.tin || ''),
      date: String(new Date().toISOString()),
      sessionActive: Boolean(sessionActive.value),
      sessionStartedAt: sessionInfo.value.startedAt ? String(sessionInfo.value.startedAt) : null,
      sessionEndedAt: sessionInfo.value.endedAt ? String(sessionInfo.value.endedAt) : null,
      summary: {
        todaySales: Number(summary.value.todaySales || 0),
        totalProfit: Number(summary.value.totalProfit || 0),
        totalProductsSold: Number(summary.value.totalProductsSold || 0)
      },
      products: (productSales.value || []).map(p => ({
        name: String(p.name || ''),
        sku: String(p.sku || ''),
        quantitySold: Number(p.quantitySold || 0),
        totalSales: Number(p.totalSales || 0),
        totalProfit: Number(p.totalProfit || 0)
      }))
    }

    // Convert to plain object for IPC (strip Vue reactivity)
    const plainPrintData = JSON.parse(JSON.stringify(printData))

    // Send to thermal printer
    const result = await printThermalReceipt(plainPrintData, selectedPrinter.value)
    
    showToast('Sales report sent to printer successfully', 'success')
  } catch (error) {
    console.error('Print error:', error)
    showToast(`Print failed: ${error.message || 'Unknown error'}`, 'error')
  } finally {
    isPrintingReceipt.value = false
  }
}

const loadCurrentUser = () => {
  try {
    const user = auth.getUser() || {}
    if (user.store) {
      currentStore.value = user.store
    }
  } catch (error) {
    console.error('Error loading user:', error)
  }
}

onMounted(async () => {
  loadCurrentUser()
  await checkSessionStatus()
  await fetchSalesData()
})
</script>
