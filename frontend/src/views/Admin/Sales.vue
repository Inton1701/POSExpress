<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-3xl font-bold">Sales Report</h2>
      <button 
        @click="openPrintModal"
        class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow transition"
      >
        <font-awesome-icon icon="print" class="mr-2" />
        Generate Report
      </button>
    </div>

    <!-- Transaction Session Control -->
    <div class="bg-white rounded-2xl shadow p-6 mb-6">
      <div class="flex justify-between items-center">
        <div>
          <h3 class="font-bold text-lg mb-2">Transaction Session Control</h3>
          <p class="text-sm text-gray-600">
            {{ sessionStatus.isActive ? 'Session is currently active' : 'Session is currently inactive' }}
          </p>
          <p v-if="sessionStatus.isActive && sessionStatus.startedAt" class="text-xs text-gray-500 mt-1">
            Started: {{ formatDateTime(sessionStatus.startedAt) }}
            {{ sessionStatus.startedBy ? `by ${sessionStatus.startedBy}` : '' }}
          </p>
          <p v-if="!sessionStatus.isActive" class="text-xs text-orange-600 mt-1">
            No active session - Sales data will not be displayed
          </p>
        </div>
        <div class="flex gap-3">
          <button 
            v-if="!sessionStatus.isActive"
            @click="openStartSessionModal"
            :disabled="loading"
            class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <font-awesome-icon icon="play" class="mr-2" />
            Start Transaction Session
          </button>
          <button 
            v-else
            @click="openEndSessionModal"
            :disabled="loading"
            class="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <font-awesome-icon icon="stop" class="mr-2" />
            End Transaction Session
          </button>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="mb-6 border-b border-gray-200">
      <nav class="flex space-x-4">
        <button 
          @click="activeTab = 'sales'" 
          :class="activeTab === 'sales' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          class="py-2 px-4 border-b-2 font-bold text-sm">
          Current Sales
        </button>
        <button 
          @click="activeTab = 'history'" 
          :class="activeTab === 'history' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          class="py-2 px-4 border-b-2 font-bold text-sm">
          Sales History
        </button>
      </nav>
    </div>

    <!-- Summary Cards -->
    <div v-show="activeTab === 'sales'" v-if="hasActiveSession" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
    <div v-show="activeTab === 'sales'" v-if="hasActiveSession" class="bg-white rounded-2xl shadow p-6 mb-6">
      <h3 class="font-bold text-lg mb-4">Product Sales</h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b">
              <th class="text-left py-3 px-4 font-semibold text-gray-700">SKU</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-700">Product Name</th>
              <th class="text-right py-3 px-4 font-semibold text-gray-700">Price</th>
              <th class="text-right py-3 px-4 font-semibold text-gray-700">Cost</th>
              <th class="text-right py-3 px-4 font-semibold text-gray-700">Quantity Sold</th>
              <th class="text-right py-3 px-4 font-semibold text-gray-700">Total Sales</th>
              <th class="text-right py-3 px-4 font-semibold text-gray-700">Total Profit</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in productSales" :key="product.sku" class="border-b hover:bg-gray-50">
              <td class="py-3 px-4">{{ product.sku }}</td>
              <td class="py-3 px-4 font-medium">{{ product.name }}</td>
              <td class="py-3 px-4 text-right">₱{{ formatNumber(product.price) }}</td>
              <td class="py-3 px-4 text-right text-gray-600">₱{{ formatNumber(product.cost) }}</td>
              <td class="py-3 px-4 text-right font-semibold">{{ product.quantitySold }}</td>
              <td class="py-3 px-4 text-right font-bold text-green-600">₱{{ formatNumber(product.totalSales) }}</td>
              <td class="py-3 px-4 text-right font-bold" :class="product.totalProfit >= 0 ? 'text-blue-600' : 'text-red-600'">
                ₱{{ formatNumber(product.totalProfit) }}
              </td>
            </tr>
            <tr v-if="productSales.length === 0">
              <td colspan="7" class="text-center text-gray-500 py-8">
                No product sales data available
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>



    <!-- Confirmation Modal for Starting Session -->
    <div v-if="showStartSessionModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 class="text-xl font-bold mb-4">Start Transaction Session</h3>
        <p class="text-gray-600 mb-4">
          Are you sure you want to start a new transaction session?
          <br><br>
          <strong>This will enable all transactions, including:</strong>
        </p>
        <ul class="list-disc ml-6 mb-6">
          <li>New sales</li>
          <li>Void operations</li>
          <li>Refund operations</li>
          <li>Cash-in operations</li>
        </ul>
        <div class="flex gap-3 justify-end">
          <button 
            @click="showStartSessionModal = false"
            class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded"
          >
            Cancel
          </button>
          <button 
            @click="startSession"
            :disabled="loading"
            class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Session
          </button>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal for Ending Session -->
    <div v-if="showEndSessionModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 class="text-xl font-bold mb-4">End Transaction Session</h3>
        <p class="text-gray-600 mb-4">
          Are you sure you want to end the transaction session? 
          <br><br>
          <strong>This will disable all transactions, including:</strong>
        </p>
        <ul class="list-disc ml-6 mb-6">
          <li>New sales</li>
          <li>Void operations</li>
          <li>Refund operations</li>
          <li>Cash-in operations</li>
        </ul>
        <div class="flex gap-3 justify-end">
          <button 
            @click="showEndSessionModal = false"
            class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded"
          >
            Cancel
          </button>
          <button 
            @click="endSession"
            :disabled="loading"
            class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            End Session
          </button>
        </div>
      </div>
    </div>

    <!-- Sales History Tab -->
    <div v-show="activeTab === 'history'" class="bg-white rounded-2xl shadow p-6">
      <div class="p-4 bg-gray-50 border-b mb-4">
        <h3 class="text-lg font-bold">Sales History (Past Sessions)</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full relative">
          <thead>
            <tr class="border-b">
              <th class="text-left py-3 px-4 font-semibold text-gray-700">Session Period</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-700">Started By</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-700">Ended By</th>
              <th class="text-right py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" @click="sortHistory('totalSales')">
                Total Sales
                <span v-if="sortColumn === 'totalSales'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th class="text-right py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" @click="sortHistory('totalProfit')">
                Total Profit
                <span v-if="sortColumn === 'totalProfit'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th class="text-right py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" @click="sortHistory('totalProductsSold')">
                Products Sold
                <span v-if="sortColumn === 'totalProductsSold'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th class="text-right py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" @click="sortHistory('transactionCount')">
                Transactions
                <span v-if="sortColumn === 'transactionCount'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th class="text-center py-3 px-4 font-semibold text-gray-700 sticky right-0 bg-gray-50 shadow-[-2px_0_4px_rgba(0,0,0,0.1)] min-w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="session in paginatedSalesHistory" :key="session._id" class="border-b hover:bg-gray-50">
              <td class="py-3 px-4">
                <div class="text-sm">
                  <div class="font-medium">{{ formatDate(session.startedAt) }}</div>
                  <div class="text-gray-500 text-xs">
                    {{ formatTime(session.startedAt) }} - {{ formatTime(session.endedAt) }}
                  </div>
                </div>
              </td>
              <td class="py-3 px-4 text-sm">{{ session.startedBy }}</td>
              <td class="py-3 px-4 text-sm">{{ session.endedBy }}</td>
              <td class="py-3 px-4 text-right font-bold text-green-600">₱{{ formatNumber(session.salesSummary?.totalSales || 0) }}</td>
              <td class="py-3 px-4 text-right font-bold text-blue-600">₱{{ formatNumber(session.salesSummary?.totalProfit || 0) }}</td>
              <td class="py-3 px-4 text-right">{{ session.salesSummary?.totalProductsSold || 0 }}</td>
              <td class="py-3 px-4 text-right">{{ session.salesSummary?.transactionCount || 0 }}</td>
              <td class="py-3 px-4 text-center sticky right-0 bg-white group-hover:bg-gray-50 shadow-[-2px_0_4px_rgba(0,0,0,0.1)] whitespace-nowrap min-w-[100px]">
                <button 
                  @click="viewSessionDetails(session)"
                  class="text-blue-500 hover:text-blue-700"
                  title="View Details"
                >
                  <font-awesome-icon icon="eye" class="text-lg" />
                </button>
              </td>
            </tr>
            <tr v-if="salesHistory.length === 0">
              <td colspan="8" class="text-center text-gray-500 py-8">
                No sales history available
              </td>
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
            Showing {{ Math.min((currentPage - 1) * itemsPerPage + 1, sortedSalesHistory.length) }} 
            to {{ Math.min(currentPage * itemsPerPage, sortedSalesHistory.length) }} 
            of {{ sortedSalesHistory.length }} sessions
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
          <span class="text-sm text-gray-600">Page {{ currentPage }} of {{ totalPagesHistory }}</span>
          <button 
            @click="currentPage++" 
            :disabled="currentPage >= totalPagesHistory"
            class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
            Next
          </button>
          <button 
            @click="currentPage = totalPagesHistory" 
            :disabled="currentPage >= totalPagesHistory"
            class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
            Last
          </button>
        </div>
      </div>
    </div>

    <!-- Session Details Modal -->
    <div v-if="isViewModalOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold">Session Details</h3>
          <button @click="closeViewModal" class="text-gray-500 hover:text-gray-700">
            <font-awesome-icon icon="times" class="text-xl" />
          </button>
        </div>
        
        <div v-if="selectedSession" class="space-y-4">
          <!-- Session Info -->
          <div class="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <p class="text-xs text-gray-600">Session Period</p>
              <p class="font-semibold">{{ formatDateTime(selectedSession.startedAt) }} - {{ formatDateTime(selectedSession.endedAt) }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-600">Duration</p>
              <p class="font-semibold">{{ calculateDuration(selectedSession.startedAt, selectedSession.endedAt) }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-600">Started By</p>
              <p class="font-semibold">{{ selectedSession.startedBy }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-600">Ended By</p>
              <p class="font-semibold">{{ selectedSession.endedBy }}</p>
            </div>
          </div>

          <!-- Summary Cards -->
          <div class="grid grid-cols-4 gap-4">
            <div class="bg-green-50 p-4 rounded-lg border border-green-200">
              <p class="text-xs text-gray-600 mb-1">Total Sales</p>
              <p class="text-2xl font-bold text-green-600">₱{{ formatNumber(selectedSession.salesSummary?.totalSales || 0) }}</p>
            </div>
            <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p class="text-xs text-gray-600 mb-1">Total Profit</p>
              <p class="text-2xl font-bold text-blue-600">₱{{ formatNumber(selectedSession.salesSummary?.totalProfit || 0) }}</p>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p class="text-xs text-gray-600 mb-1">Products Sold</p>
              <p class="text-2xl font-bold text-purple-600">{{ selectedSession.salesSummary?.totalProductsSold || 0 }}</p>
            </div>
            <div class="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <p class="text-xs text-gray-600 mb-1">Transactions</p>
              <p class="text-2xl font-bold text-orange-600">{{ selectedSession.salesSummary?.transactionCount || 0 }}</p>
            </div>
          </div>

          <!-- Product Sales Table -->
          <div class="mt-4">
            <h4 class="font-bold text-lg mb-3">Product Sales Breakdown</h4>
            <div v-if="loadingSessionDetails" class="text-center py-8 text-gray-500">
              Loading product details...
            </div>
            <div v-else-if="selectedSessionProducts.length === 0" class="text-center py-8 text-gray-500">
              No product sales data available
            </div>
            <div v-else class="overflow-x-auto border rounded-lg">
              <table class="w-full">
                <thead class="bg-gray-100 border-b-2">
                  <tr>
                    <th class="px-4 py-3 text-left text-sm font-bold">SKU</th>
                    <th class="px-4 py-3 text-left text-sm font-bold">Product Name</th>
                    <th class="px-4 py-3 text-right text-sm font-bold">Price</th>
                    <th class="px-4 py-3 text-right text-sm font-bold">Cost</th>
                    <th class="px-4 py-3 text-right text-sm font-bold">Quantity Sold</th>
                    <th class="px-4 py-3 text-right text-sm font-bold">Total Sales</th>
                    <th class="px-4 py-3 text-right text-sm font-bold">Total Profit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="product in selectedSessionProducts" :key="product.sku" class="border-t hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm">{{ product.sku }}</td>
                    <td class="px-4 py-3 text-sm font-medium">{{ product.name }}</td>
                    <td class="px-4 py-3 text-sm text-right">₱{{ formatNumber(product.price) }}</td>
                    <td class="px-4 py-3 text-sm text-right text-gray-600">₱{{ formatNumber(product.cost) }}</td>
                    <td class="px-4 py-3 text-sm text-right font-semibold">{{ product.quantitySold }}</td>
                    <td class="px-4 py-3 text-sm text-right font-bold text-green-600">₱{{ formatNumber(product.totalSales) }}</td>
                    <td class="px-4 py-3 text-sm text-right font-bold" :class="product.totalProfit >= 0 ? 'text-blue-600' : 'text-red-600'">
                      ₱{{ formatNumber(product.totalProfit) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 pt-4 border-t mt-4">
            <button 
              @click="printSessionReport(selectedSession)"
              class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              <font-awesome-icon icon="print" class="mr-2" />
              Print Report
            </button>
            <button 
              @click="closeViewModal"
              class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Print Report Modal -->
    <div v-if="isPrintModalOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 class="text-xl font-bold mb-4">Generate Sales Report</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-bold mb-2">Report Type</label>
            <select v-model="reportType" class="w-full p-3 rounded-lg border border-gray-300">
              <option value="all">All Sessions</option>
              <option value="date-range">Custom Date Range</option>
            </select>
          </div>

          <div v-if="reportType === 'date-range'" class="space-y-3">
            <div>
              <label class="block text-sm font-bold mb-2">Start Date</label>
              <input 
                v-model="reportStartDate" 
                type="date" 
                class="w-full p-3 rounded-lg border border-gray-300"
              />
            </div>
            <div>
              <label class="block text-sm font-bold mb-2">End Date</label>
              <input 
                v-model="reportEndDate" 
                type="date" 
                class="w-full p-3 rounded-lg border border-gray-300"
              />
            </div>
          </div>

          <div class="flex gap-3 pt-4 border-t">
            <button 
              @click="closePrintModal"
              class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Cancel
            </button>
            <button 
              @click="exportSalesReportToExcel"
              class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              <font-awesome-icon icon="file-excel" class="mr-2" />
              Excel
            </button>
            <button 
              @click="generateSalesReport"
              class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              <font-awesome-icon icon="print" class="mr-2" />
              Print
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <Toast ref="toastRef" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { api } from '@/utils/api'
import { auth } from '@/utils/auth'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faPlay, faStop, faPrint, faTimes } from '@fortawesome/free-solid-svg-icons'
import Toast from '../../components/Toast.vue'

library.add(faPlay, faStop, faPrint, faTimes)

const loading = ref(false)
const sessionStatus = ref({ isActive: false })
const showStartSessionModal = ref(false)
const showEndSessionModal = ref(false)
const hasActiveSession = ref(false)
const activeTab = ref('sales')
const toastRef = ref(null)

const showToast = (message, type = 'success') => {
  if (toastRef.value) {
    toastRef.value.addToast(message, type)
  }
}
const isViewModalOpen = ref(false)
const isPrintModalOpen = ref(false)
const selectedSession = ref(null)
const selectedSessionProducts = ref([])
const loadingSessionDetails = ref(false)
const sortColumn = ref('')
const sortDirection = ref('desc')
const reportType = ref('all')
const reportStartDate = ref('')
const reportEndDate = ref('')

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)

const summary = ref({
  todaySales: 0,
  totalProfit: 0,
  totalProductsSold: 0
})

const productSales = ref([])
const salesHistory = ref([])

const sortedSalesHistory = computed(() => {
  if (!sortColumn.value) return salesHistory.value
  
  return [...salesHistory.value].sort((a, b) => {
    let aVal = a.salesSummary?.[sortColumn.value] || 0
    let bVal = b.salesSummary?.[sortColumn.value] || 0
    
    if (sortDirection.value === 'asc') {
      return aVal - bVal
    } else {
      return bVal - aVal
    }
  })
})

const totalPagesHistory = computed(() => {
  return Math.ceil(sortedSalesHistory.value.length / itemsPerPage.value)
})

const paginatedSalesHistory = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return sortedSalesHistory.value.slice(start, end)
})

const formatNumber = (value) => {
  return (value || 0).toFixed(2)
}

const formatDateTime = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatTime = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const sortHistory = (column) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'desc'
  }
}

const viewSessionDetails = async (session) => {
  selectedSession.value = session
  selectedSessionProducts.value = []
  isViewModalOpen.value = true
  loadingSessionDetails.value = true
  
  try {
    const response = await api.get(`/transactions/session/${session._id}/details`)
    if (response.data.success) {
      selectedSessionProducts.value = response.data.productSales
    }
  } catch (error) {
    console.error('Error fetching session details:', error)
  } finally {
    loadingSessionDetails.value = false
  }
}

const closeViewModal = () => {
  isViewModalOpen.value = false
  selectedSession.value = null
  selectedSessionProducts.value = []
}

const openPrintModal = () => {
  isPrintModalOpen.value = true
  reportType.value = 'all'
  reportStartDate.value = ''
  reportEndDate.value = ''
}

const closePrintModal = () => {
  isPrintModalOpen.value = false
}

const calculateDuration = (start, end) => {
  if (!start || !end) return 'N/A'
  const diff = new Date(end) - new Date(start)
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${minutes}m`
}

const printSessionReport = (session) => {
  // Generate product table rows
  const productRows = selectedSessionProducts.value.length > 0
    ? selectedSessionProducts.value.map(product => `
        <tr>
          <td style="padding: 6px; border-bottom: 1px solid #ddd;">${product.sku}</td>
          <td style="padding: 6px; border-bottom: 1px solid #ddd;">${product.name}</td>
          <td style="padding: 6px; border-bottom: 1px solid #ddd; text-align: right;">₱${formatNumber(product.price)}</td>
          <td style="padding: 6px; border-bottom: 1px solid #ddd; text-align: right;">₱${formatNumber(product.cost)}</td>
          <td style="padding: 6px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">${product.quantitySold}</td>
          <td style="padding: 6px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold; color: #059669;">₱${formatNumber(product.totalSales)}</td>
          <td style="padding: 6px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold; color: ${product.totalProfit >= 0 ? '#2563eb' : '#dc2626'};">₱${formatNumber(product.totalProfit)}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #666;">No product sales data available</td></tr>'

  const printWindow = window.open('', '_blank')
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Session Report - ${formatDate(session.startedAt)}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 10px; font-size: 9px; }
        .header { text-align: center; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px; }
        .header h1 { font-size: 14px; margin: 5px 0; }
        .header p { font-size: 8px; margin: 2px 0; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
        .info-item { padding: 5px; background: #f5f5f5; border-radius: 3px; }
        .info-label { font-size: 8px; color: #666; margin-bottom: 2px; }
        .info-value { font-size: 10px; font-weight: bold; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 10px; }
        .summary-card { padding: 8px; border: 1px solid #ddd; border-radius: 4px; text-align: center; }
        .summary-label { font-size: 8px; color: #666; margin-bottom: 3px; }
        .summary-value { font-size: 12px; font-weight: bold; color: #2563eb; }
        .products-section { margin-top: 15px; }
        .products-title { font-size: 12px; font-weight: bold; margin-bottom: 8px; padding-bottom: 5px; border-bottom: 2px solid #333; }
        .products-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .products-table th { background: #f5f5f5; padding: 8px; text-align: left; font-size: 9px; border-bottom: 2px solid #333; }
        .products-table th.text-right { text-align: right; }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Sales Session Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
      
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Session Period</div>
          <div class="info-value">${formatDateTime(session.startedAt)} - ${formatDateTime(session.endedAt)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Duration</div>
          <div class="info-value">${calculateDuration(session.startedAt, session.endedAt)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Started By</div>
          <div class="info-value">${session.startedBy}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Ended By</div>
          <div class="info-value">${session.endedBy}</div>
        </div>
      </div>
      
      <div class="summary">
        <div class="summary-card">
          <div class="summary-label">Total Sales</div>
          <div class="summary-value">₱${formatNumber(session.salesSummary?.totalSales || 0)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Total Profit</div>
          <div class="summary-value">₱${formatNumber(session.salesSummary?.totalProfit || 0)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Products Sold</div>
          <div class="summary-value">${session.salesSummary?.totalProductsSold || 0}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Transactions</div>
          <div class="summary-value">${session.salesSummary?.transactionCount || 0}</div>
        </div>
      </div>
      
      <div class="products-section">
        <div class="products-title">Product Sales Breakdown</div>
        <table class="products-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product Name</th>
              <th class="text-right">Price</th>
              <th class="text-right">Cost</th>
              <th class="text-right">Qty Sold</th>
              <th class="text-right">Total Sales</th>
              <th class="text-right">Total Profit</th>
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
        </table>
      </div>
      
      <button onclick="window.print()" style="background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">Print Report</button>
    </body>
    </html>
  `
  
  printWindow.document.write(printContent)
  printWindow.document.close()
  printWindow.focus()
}

const exportSalesReportToExcel = () => {
  let reportSessions = salesHistory.value
  let reportTitle = 'All Sales Sessions Report'
  
  if (reportType.value === 'date-range') {
    if (!reportStartDate.value || !reportEndDate.value) {
      showToast('Please select both start and end dates', 'error')
      return
    }
    
    const startDate = new Date(reportStartDate.value)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(reportEndDate.value)
    endDate.setHours(23, 59, 59, 999)
    
    reportSessions = salesHistory.value.filter(session => {
      const sessionDate = new Date(session.startedAt)
      return sessionDate >= startDate && sessionDate <= endDate
    })
    
    reportTitle = `Sales Report: ${reportStartDate.value} to ${reportEndDate.value}`
  }
  
  // Calculate totals
  const totals = reportSessions.reduce((acc, session) => {
    acc.totalSales += session.salesSummary?.totalSales || 0
    acc.totalProfit += session.salesSummary?.totalProfit || 0
    acc.totalProducts += session.salesSummary?.totalProductsSold || 0
    acc.totalTransactions += session.salesSummary?.transactionCount || 0
    return acc
  }, { totalSales: 0, totalProfit: 0, totalProducts: 0, totalTransactions: 0 })
  
  // Create CSV content
  let csvContent = `${reportTitle}\n`
  csvContent += `Generated on: ${new Date().toLocaleString()}\n`
  csvContent += `Total Sessions: ${reportSessions.length}\n\n`
  csvContent += `Summary\n`
  csvContent += `Total Sales,Total Profit,Products Sold,Transactions\n`
  csvContent += `${totals.totalSales.toFixed(2)},${totals.totalProfit.toFixed(2)},${totals.totalProducts},${totals.totalTransactions}\n\n`
  
  // Add session details
  csvContent += `Session Details\n`
  csvContent += 'Session Date,Start Time,End Time,Started By,Ended By,Sales,Profit,Products,Transactions\n'
  
  reportSessions.forEach(session => {
    csvContent += `"${formatDate(session.startedAt)}","${formatTime(session.startedAt)}","${formatTime(session.endedAt)}","${session.startedBy}","${session.endedBy}",${(session.salesSummary?.totalSales || 0).toFixed(2)},${(session.salesSummary?.totalProfit || 0).toFixed(2)},${session.salesSummary?.totalProductsSold || 0},${session.salesSummary?.transactionCount || 0}\n`
  })
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${reportTitle.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  closePrintModal()
}

const generateSalesReport = () => {
  let reportSessions = salesHistory.value
  let reportTitle = 'All Sales Sessions Report'
  
  if (reportType.value === 'date-range') {
    if (!reportStartDate.value || !reportEndDate.value) {
      showToast('Please select both start and end dates', 'error')
      return
    }
    
    const startDate = new Date(reportStartDate.value)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(reportEndDate.value)
    endDate.setHours(23, 59, 59, 999)
    
    reportSessions = salesHistory.value.filter(session => {
      const sessionDate = new Date(session.startedAt)
      return sessionDate >= startDate && sessionDate <= endDate
    })
    
    reportTitle = `Sales Report: ${reportStartDate.value} to ${reportEndDate.value}`
  }
  
  // Calculate totals
  const totals = reportSessions.reduce((acc, session) => {
    acc.totalSales += session.salesSummary?.totalSales || 0
    acc.totalProfit += session.salesSummary?.totalProfit || 0
    acc.totalProducts += session.salesSummary?.totalProductsSold || 0
    acc.totalTransactions += session.salesSummary?.transactionCount || 0
    return acc
  }, { totalSales: 0, totalProfit: 0, totalProducts: 0, totalTransactions: 0 })
  
  const printWindow = window.open('', '_blank')
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${reportTitle}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 10px; font-size: 9px; }
        .header { text-align: center; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px; }
        .header h1 { font-size: 14px; margin: 5px 0; }
        .header p { font-size: 8px; margin: 2px 0; }
        .totals { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 10px; background: #f8f9fa; padding: 8px; border-radius: 5px; }
        .total-card { text-align: center; }
        .total-label { font-size: 8px; color: #666; margin-bottom: 2px; }
        .total-value { font-size: 12px; font-weight: bold; color: #2563eb; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 3px 5px; text-align: left; border-bottom: 1px solid #ddd; font-size: 8px; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${reportTitle}</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p>Total Sessions: ${reportSessions.length}</p>
      </div>
      
      <div class="totals">
        <div class="total-card">
          <div class="total-label">Total Sales</div>
          <div class="total-value">₱${formatNumber(totals.totalSales)}</div>
        </div>
        <div class="total-card">
          <div class="total-label">Total Profit</div>
          <div class="total-value">₱${formatNumber(totals.totalProfit)}</div>
        </div>
        <div class="total-card">
          <div class="total-label">Products Sold</div>
          <div class="total-value">${totals.totalProducts}</div>
        </div>
        <div class="total-card">
          <div class="total-label">Transactions</div>
          <div class="total-value">${totals.totalTransactions}</div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Session Period</th>
            <th>Started By</th>
            <th>Ended By</th>
            <th class="text-right">Sales</th>
            <th class="text-right">Profit</th>
            <th class="text-center">Products</th>
            <th class="text-center">Transactions</th>
          </tr>
        </thead>
        <tbody>
          ${reportSessions.map(session => `
            <tr>
              <td>
                <div><strong>${formatDate(session.startedAt)}</strong></div>
                <div style="font-size: 11px; color: #666;">${formatTime(session.startedAt)} - ${formatTime(session.endedAt)}</div>
              </td>
              <td>${session.startedBy}</td>
              <td>${session.endedBy}</td>
              <td class="text-right">₱${formatNumber(session.salesSummary?.totalSales || 0)}</td>
              <td class="text-right">₱${formatNumber(session.salesSummary?.totalProfit || 0)}</td>
              <td class="text-center">${session.salesSummary?.totalProductsSold || 0}</td>
              <td class="text-center">${session.salesSummary?.transactionCount || 0}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <button onclick="window.print()" style="margin-top: 30px; background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">Print Report</button>
    </body>
    </html>
  `
  
  printWindow.document.write(printContent)
  printWindow.document.close()
  printWindow.focus()
  
  closePrintModal()
}

const fetchSessionStatus = async () => {
  try {
    const user = auth.getUser() || {}
    const storeId = user.store?._id || user.store
    
    const params = storeId ? { storeId } : {}
    const response = await api.get('/transactions/session/status', { params })
    
    if (response.data.success) {
      sessionStatus.value = response.data.session
    }
  } catch (error) {
    console.error('Error fetching session status:', error)
  }
}

const fetchSalesReport = async () => {
  loading.value = true
  try {
    const response = await api.get('/transactions/sales-report')
    if (response.data.success) {
      hasActiveSession.value = response.data.hasActiveSession || false
      summary.value = response.data.summary
      productSales.value = response.data.productSales
    }
  } catch (error) {
    console.error('Error fetching sales report:', error)
    showToast('Failed to load sales report', 'error')
  } finally {
    loading.value = false
  }
}

const fetchSalesHistory = async () => {
  try {
    const user = auth.getUser() || {}
    const storeId = user.store?._id || user.store
    
    const params = storeId ? { storeId } : {}
    const response = await api.get('/transactions/sales-history', { params })
    
    if (response.data.success) {
      salesHistory.value = response.data.history
    }
  } catch (error) {
    console.error('Error fetching sales history:', error)
  }
}

const openStartSessionModal = () => {
  showStartSessionModal.value = true
}

const startSession = async () => {
  loading.value = true
  try {
    const user = auth.getUser() || {}
    const employee = user.username || 'Admin'
    const storeId = user.store?._id || user.store
    
    const response = await api.post('/transactions/session/start', {
      employee,
      storeId
    })
    
    if (response.data.success) {
      showStartSessionModal.value = false
      showToast('Transaction session started successfully!', 'success')
      await fetchSessionStatus()
      await fetchSalesReport()
    }
  } catch (error) {
    console.error('Error starting session:', error)
    showToast(error.response?.data?.message || 'Failed to start transaction session', 'error')
  } finally {
    loading.value = false
  }
}

const openEndSessionModal = () => {
  showEndSessionModal.value = true
}

const endSession = async () => {
  loading.value = true
  try {
    const user = auth.getUser() || {}
    const employee = user.username || 'Admin'
    
    const response = await api.post('/transactions/session/end', {
      employee
    })
    
    if (response.data.success) {
      showEndSessionModal.value = false
      showToast('Transaction session ended successfully!', 'success')
      await fetchSessionStatus()
      await fetchSalesReport()
      await fetchSalesHistory()
    }
  } catch (error) {
    console.error('Error ending session:', error)
    showToast(error.response?.data?.message || 'Failed to end transaction session', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSessionStatus()
  fetchSalesReport()
  fetchSalesHistory()
})
</script>
