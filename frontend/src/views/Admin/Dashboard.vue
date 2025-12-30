<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-3xl font-bold">Dashboard</h2>
      
      <!-- Date Range Filter -->
      <div class="flex items-center gap-3 bg-white p-4 rounded-lg shadow">
        <label class="text-sm font-semibold text-gray-700">Filter by Date:</label>
        <input 
          type="date" 
          v-model="startDate" 
          @change="fetchDashboardData"
          class="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span class="text-gray-500">to</span>
        <input 
          type="date" 
          v-model="endDate" 
          @change="fetchDashboardData"
          class="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          @click="resetToToday" 
          class="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
        >
          Today
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm opacity-90 mb-1">{{ dateRangeLabel }} Transactions</p>
            <h3 class="text-4xl font-bold">{{ todayStats.totalTransactions }}</h3>
          </div>
          <div class="bg-white bg-opacity-20 rounded-full p-4">
            <font-awesome-icon icon="receipt" class="text-3xl" />
          </div>
        </div>
      </div>

      <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 shadow-lg text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm opacity-90 mb-1">{{ dateRangeLabel }} Products Sold</p>
            <h3 class="text-4xl font-bold">{{ todayStats.totalProducts }}</h3>
          </div>
          <div class="bg-white bg-opacity-20 rounded-full p-4">
            <font-awesome-icon icon="box" class="text-3xl" />
          </div>
        </div>
      </div>

      <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-lg text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm opacity-90 mb-1">{{ dateRangeLabel }} Sales</p>
            <h3 class="text-4xl font-bold">₱{{ formatNumber(todayStats.totalSales) }}</h3>
          </div>
          <div class="bg-white bg-opacity-20 rounded-full p-4">
            <font-awesome-icon icon="coins" class="text-3xl" />
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Sales Line Chart -->
      <div class="bg-white rounded-2xl shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold">Sales Trend (Last 7 Days)</h3>
          <button @click="navigateToSales" class="text-blue-600 hover:text-blue-800 transition" title="View Sales">
            <font-awesome-icon icon="arrow-right" class="text-xl" />
          </button>
        </div>
        <div style="position: relative; height: 300px; width: 100%;">
          <canvas ref="salesChartCanvas"></canvas>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="bg-white rounded-2xl shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold">Recent Transactions</h3>
          <button @click="navigateToTransactions" class="text-blue-600 hover:text-blue-800 transition" title="View All Transactions">
            <font-awesome-icon icon="arrow-right" class="text-xl" />
          </button>
        </div>
        <div class="space-y-3 max-h-[350px] overflow-y-auto">
          <div v-for="transaction in recentTransactions" :key="transaction._id" 
               class="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <div class="flex-1">
              <p class="font-semibold text-sm">#{{ transaction.transactionId }}</p>
              <p class="text-xs text-gray-600">{{ formatDateTime(transaction.transactionDate) }}</p>
            </div>
            <div class="text-right">
              <p class="font-bold text-lg">₱{{ formatNumber(transaction.totalAmount) }}</p>
              <span :class="getStatusClass(transaction.status)" 
                    class="text-xs px-2 py-1 rounded-full">
                {{ transaction.status }}
              </span>
            </div>
          </div>
          <div v-if="recentTransactions.length === 0" class="text-center text-gray-500 py-8">
            No recent transactions
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Transaction Status Pie Chart -->
      <div class="bg-white rounded-2xl shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold">Transaction Status Distribution</h3>
          <button @click="navigateToTransactions" class="text-blue-600 hover:text-blue-800 transition" title="View All Transactions">
            <font-awesome-icon icon="arrow-right" class="text-xl" />
          </button>
        </div>
        <div style="position: relative; height: 300px; max-width: 400px; margin: 0 auto;">
          <canvas ref="statusChartCanvas"></canvas>
        </div>
        <div class="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p class="text-2xl font-bold text-green-600">{{ transactionStats.completed }}</p>
            <p class="text-xs text-gray-600">Completed</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-yellow-600">{{ transactionStats.voided }}</p>
            <p class="text-xs text-gray-600">Voided</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-red-600">{{ transactionStats.returned }}</p>
            <p class="text-xs text-gray-600">Returned</p>
          </div>
        </div>
      </div>

      <!-- Low Stock Products -->
      <div class="bg-white rounded-2xl shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold">Low Stock Alert</h3>
          <button @click="navigateToStocks" class="text-blue-600 hover:text-blue-800 transition" title="Manage Stocks">
            <font-awesome-icon icon="arrow-right" class="text-xl" />
          </button>
        </div>
        <div class="space-y-3 max-h-[350px] overflow-y-auto">
          <div v-for="product in lowStockProducts" :key="product._id" 
               class="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
            <div class="flex-1">
              <p class="font-semibold text-sm">{{ product.name }}</p>
              <p class="text-xs text-gray-600">SKU: {{ product.sku || 'N/A' }}</p>
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold text-red-600">{{ product.quantity }}</p>
              <p class="text-xs text-gray-600">Alert: {{ product.quantityAlert }}</p>
            </div>
          </div>
          <div v-if="lowStockProducts.length === 0" class="text-center text-gray-500 py-8">
            <font-awesome-icon icon="check-circle" class="text-4xl text-green-500 mb-2" />
            <p>All products are well stocked!</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const router = useRouter()
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const salesChartCanvas = ref(null)
const statusChartCanvas = ref(null)
let salesChart = null
let statusChart = null

// Date range filters - default to today
const getTodayDateString = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const startDate = ref(getTodayDateString())
const endDate = ref(getTodayDateString())

const todayStats = ref({
  totalTransactions: 0,
  totalProducts: 0,
  totalSales: 0
})

const recentTransactions = ref([])
const lowStockProducts = ref([])
const salesData = ref([])

const transactionStats = ref({
  completed: 0,
  voided: 0,
  returned: 0
})

const dateRangeLabel = computed(() => {
  if (startDate.value === endDate.value) {
    const todayStr = getTodayDateString()
    
    if (startDate.value === todayStr) {
      return "Today's"
    }
    return new Date(startDate.value + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  const start = new Date(startDate.value + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const end = new Date(endDate.value + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${start} - ${end}`
})

const formatNumber = (value) => {
  return (value || 0).toFixed(2)
}

const formatDateTime = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusClass = (status) => {
  const classes = {
    'Completed': 'bg-green-100 text-green-800',
    'Voided': 'bg-yellow-100 text-yellow-800',
    'Returned': 'bg-red-100 text-red-800',
    'Canceled': 'bg-gray-100 text-gray-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const navigateToTransactions = () => {
  router.push('/admin/transactions')
}

const navigateToProducts = () => {
  router.push('/admin/products')
}

const navigateToSales = () => {
  router.push('/admin/sales')
}

const navigateToStocks = () => {
  router.push('/admin/manage-stocks')
}

const resetToToday = () => {
  const todayStr = getTodayDateString()
  startDate.value = todayStr
  endDate.value = todayStr
  fetchDashboardData()
}

const fetchDashboardData = async () => {
  try {
    // Parse selected date range
    const rangeStart = new Date(startDate.value)
    rangeStart.setHours(0, 0, 0, 0)
    
    const rangeEnd = new Date(endDate.value)
    rangeEnd.setHours(23, 59, 59, 999)
    
    const transactionsResponse = await axios.get(`${API_BASE_URL}/transactions`)
    const allTransactions = transactionsResponse.data.transactions || []

    // Filter transactions by selected date range
    const filteredTransactions = allTransactions.filter(t => {
      const transactionDate = new Date(t.transactionDate)
      return transactionDate >= rangeStart && transactionDate <= rangeEnd
    })

    // Calculate stats for selected date range
    todayStats.value.totalTransactions = filteredTransactions.length
    todayStats.value.totalSales = filteredTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0)
    
    let totalProducts = 0
    filteredTransactions.forEach(t => {
      if (t.cart && Array.isArray(t.cart)) {
        totalProducts += t.cart.reduce((sum, item) => sum + (item.quantity || 0), 0)
      }
    })
    todayStats.value.totalProducts = totalProducts

    // Get recent transactions from filtered data (last 10)
    recentTransactions.value = filteredTransactions
      .sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate))
      .slice(0, 10)

    // Calculate transaction status stats from filtered data
    transactionStats.value.completed = filteredTransactions.filter(t => t.status === 'Completed').length
    transactionStats.value.voided = filteredTransactions.filter(t => t.status === 'Voided').length
    transactionStats.value.returned = filteredTransactions.filter(t => t.status === 'Returned').length

    // Get sales data for last 7 days
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      
      const daySales = allTransactions
        .filter(t => {
          const transactionDate = new Date(t.transactionDate)
          return transactionDate >= date && transactionDate < nextDay
        })
        .reduce((sum, t) => sum + (t.totalAmount || 0), 0)
      
      last7Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: daySales
      })
    }
    salesData.value = last7Days

    // Fetch low stock products
    const stockResponse = await axios.get(`${API_BASE_URL}/stock`)
    const allStock = stockResponse.data.stock || []
    
    // Get current user's store from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const currentStoreId = user.store?._id || user.store
    
    // Filter low stock products by current store
    let filteredStock = allStock
    if (currentStoreId) {
      filteredStock = allStock.filter(item => {
        // If product is global, show it
        if (item.isGlobal) return true
        // If product has stores array, check if current store is included
        if (item.stores && Array.isArray(item.stores)) {
          return item.stores.some(store => {
            const storeId = typeof store === 'object' ? store._id : store
            return storeId && storeId.toString() === currentStoreId.toString()
          })
        }
        return false
      })
    }
    
    lowStockProducts.value = filteredStock
      .filter(item => item.quantity <= (item.quantityAlert || 0))
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 10)

    // Update charts
    updateCharts()
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  }
}

const updateCharts = () => {
  // Add delay to ensure DOM is ready
  setTimeout(() => {
    // Update Sales Line Chart
    if (salesChartCanvas.value) {
      if (salesChart) {
        salesChart.destroy()
      }

      const ctx = salesChartCanvas.value.getContext('2d')
      salesChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: salesData.value.map(d => d.date),
          datasets: [{
            label: 'Sales (₱)',
            data: salesData.value.map(d => d.sales),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return '₱' + context.parsed.y.toFixed(2)
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '₱' + value.toFixed(0)
                }
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      })
    }

    // Update Status Pie Chart
    if (statusChartCanvas.value) {
      if (statusChart) {
        statusChart.destroy()
      }

      const ctx = statusChartCanvas.value.getContext('2d')
      statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'Voided', 'Returned'],
          datasets: [{
            data: [
              transactionStats.value.completed,
              transactionStats.value.voided,
              transactionStats.value.returned
            ],
            backgroundColor: [
              'rgb(34, 197, 94)',
              'rgb(234, 179, 8)',
              'rgb(239, 68, 68)'
            ],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      })
    }
  }, 100)
}

onMounted(() => {
  fetchDashboardData()
  
  // Refresh data every 30 seconds
  const intervalId = setInterval(fetchDashboardData, 30000)
  
  // Store interval ID for cleanup
  onUnmounted(() => {
    clearInterval(intervalId)
    if (salesChart) salesChart.destroy()
    if (statusChart) statusChart.destroy()
  })
})
</script>
