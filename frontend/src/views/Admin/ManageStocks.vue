<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-3xl font-bold">Manage Stocks</h2>
      <div class="flex gap-3">
        <button @click="openPrintModal" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-2xl shadow-md" title="Print Stock Report">
          <font-awesome-icon :icon="['fas', 'print']" />
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="mb-6 border-b border-gray-200">
      <nav class="flex space-x-4">
        <button 
          @click="activeTab = 'stocks'" 
          :class="activeTab === 'stocks' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          class="py-2 px-4 border-b-2 font-bold text-sm">
          Current Stocks
        </button>
        <button 
          @click="activeTab = 'history'" 
          :class="activeTab === 'history' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          class="py-2 px-4 border-b-2 font-bold text-sm">
          Admin Adjustments
        </button>
        <button 
          @click="activeTab = 'transactions'" 
          :class="activeTab === 'transactions' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          class="py-2 px-4 border-b-2 font-bold text-sm">
          Transaction Adjustments
        </button>
      </nav>
    </div>

    <!-- Search Bar -->
    <div class="mb-6">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="Search by SKU, Name, or Type..." 
        class="w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
    </div>

    <!-- Current Stocks Tab -->
    <div v-show="activeTab === 'stocks'" class="bg-white rounded-2xl shadow overflow-hidden mb-6">
      <div class="p-4 bg-gray-50 border-b">
        <h3 class="text-lg font-bold">Current Stock Levels</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full relative">
        <thead class="bg-gray-50">
          <tr>
            <th @click="sortTable('type')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
              Type
              <span v-if="sortColumn === 'type'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortTable('sku')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
              SKU
              <span v-if="sortColumn === 'sku'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortTable('name')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
              Name
              <span v-if="sortColumn === 'name'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th class="px-6 py-3 text-left text-sm font-bold">Store</th>
            <th @click="sortTable('quantity')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
              Current Quantity
              <span v-if="sortColumn === 'quantity'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortTable('quantityAlert')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
              Quantity Alert
              <span v-if="sortColumn === 'quantityAlert'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th class="px-6 py-3 text-left text-sm font-bold">Status</th>
            <th class="px-6 py-3 text-center text-sm font-bold sticky right-0 bg-gray-50 shadow-[-2px_0_4px_rgba(0,0,0,0.1)] min-w-[140px]">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in paginatedItems" :key="item._id" class="border-t hover:bg-gray-50">
            <td class="px-6 py-4">
              <span :class="item.type === 'Product' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'" class="px-3 py-1 rounded-full text-xs font-bold">
                {{ item.type }}
              </span>
            </td>
            <td class="px-6 py-4">{{ item.sku || 'N/A' }}</td>
            <td class="px-6 py-4">{{ item.name }}</td>
            <td class="px-6 py-4">
              <span v-if="item.type === 'Add-on' && item.isGlobal" class="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">Global</span>
              <span v-else-if="item.type === 'Add-on' && item.stores && item.stores.length > 0" class="text-sm">
                {{ getStoreNames(item.stores) }}
              </span>
              <span v-else-if="item.type === 'Add-on'" class="text-gray-400">No store</span>
              <span v-else-if="item.isGlobal" class="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">Global</span>
              <span v-else-if="item.stores && item.stores.length > 0" class="text-sm">
                {{ getStoreNames(item.stores) }}
              </span>
              <span v-else class="text-gray-400">No store</span>
            </td>
            <td class="px-6 py-4">
              <span :class="getQuantityClass(item.quantity, item.quantityAlert)">
                {{ item.quantity }}
              </span>
            </td>
            <td class="px-6 py-4">{{ item.quantityAlert || 'Not set' }}</td>
            <td class="px-6 py-4">
              <span v-if="item.quantity <= (item.quantityAlert || 0)" class="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                Low Stock
              </span>
              <span v-else class="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                In Stock
              </span>
            </td>
            <td class="px-6 py-4 text-center sticky right-0 bg-white group-hover:bg-gray-50 shadow-[-2px_0_4px_rgba(0,0,0,0.1)] whitespace-nowrap min-w-[140px]">
              <button @click="viewHistory(item)" class="text-blue-500 hover:text-blue-700 mr-2" title="View History">
                <font-awesome-icon :icon="['fas', 'eye']" class="text-lg" />
              </button>
              <button @click="openModifyStockModal(item)" class="text-blue-500 hover:text-blue-700 mr-2" title="Modify Stock">
                <font-awesome-icon :icon="['fas', 'edit']" class="text-lg" />
              </button>
              <button @click="openRestockModal(item)" class="text-green-500 hover:text-green-700 mr-2" title="Restock">
                <font-awesome-icon :icon="['fas', 'plus']" class="text-lg" />
              </button>
              <button @click="openAlertModal(item)" class="text-purple-500 hover:text-purple-700" title="Set Alert">
                <font-awesome-icon :icon="['fas', 'bell']" class="text-lg" />
              </button>
            </td>
          </tr>
          <tr v-if="filteredItems.length === 0">
            <td colspan="8" class="px-6 py-4 text-center text-gray-500">No items found</td>
          </tr>
        </tbody>
      </table>
      </div>
      
      <!-- Pagination Controls -->
      <div class="flex justify-between items-center px-6 py-4 bg-gray-50 border-t">
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600">Items per page:</label>
          <select v-model.number="itemsPerPageStocks" @change="currentPageStocks = 1" class="border border-gray-300 rounded px-2 py-1 text-sm">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
          <span class="text-sm text-gray-600 ml-4">
            Showing {{ Math.min((currentPageStocks - 1) * itemsPerPageStocks + 1, filteredItems.length) }} 
            to {{ Math.min(currentPageStocks * itemsPerPageStocks, filteredItems.length) }} 
            of {{ filteredItems.length }} items
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button 
            @click="currentPageStocks = 1" 
            :disabled="currentPageStocks === 1"
            class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
            First
          </button>
          <button 
            @click="currentPageStocks--" 
            :disabled="currentPageStocks === 1"
            class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
            Previous
          </button>
          <span class="text-sm text-gray-600">Page {{ currentPageStocks }} of {{ totalPagesStocks }}</span>
          <button 
            @click="currentPageStocks++" 
            :disabled="currentPageStocks >= totalPagesStocks"
            class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
            Next
          </button>
          <button 
            @click="currentPageStocks = totalPagesStocks" 
            :disabled="currentPageStocks >= totalPagesStocks"
            class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
            Last
          </button>
        </div>
      </div>
    </div>

    <!-- All Stock History Tab -->
    <div v-show="activeTab === 'history'" class="bg-white rounded-2xl shadow overflow-hidden mb-6">
      <div class="p-4 bg-gray-50 border-b">
        <h3 class="text-lg font-bold">Admin Adjustments</h3>
        <p class="text-sm text-gray-600">Manual stock changes made by administrators</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th @click="sortHistoryTable('updatedAt')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
                Date & Time
                <span v-if="historySortColumn === 'updatedAt'">{{ historySortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th @click="sortHistoryTable('sku')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
                SKU
                <span v-if="historySortColumn === 'sku'">{{ historySortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th @click="sortHistoryTable('product')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
                Product
                <span v-if="historySortColumn === 'product'">{{ historySortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th @click="sortHistoryTable('change')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
                Type
                <span v-if="historySortColumn === 'change'">{{ historySortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th @click="sortHistoryTable('prevStock')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
                Previous Stock
                <span v-if="historySortColumn === 'prevStock'">{{ historySortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th @click="sortHistoryTable('change')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
                Change
                <span v-if="historySortColumn === 'change'">{{ historySortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th @click="sortHistoryTable('newStock')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
                New Stock
                <span v-if="historySortColumn === 'newStock'">{{ historySortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th class="px-6 py-3 text-left text-sm font-bold">Reason</th>
              <th @click="sortHistoryTable('updatedBy')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
                Updated By
                <span v-if="historySortColumn === 'updatedBy'">{{ historySortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="history in paginatedAdminHistory" :key="history._id" class="border-t hover:bg-gray-50">
              <td class="px-6 py-4">{{ formatDate(history.updatedAt) }}</td>
              <td class="px-6 py-4">{{ history.sku || 'N/A' }}</td>
              <td class="px-6 py-4">{{ history.product }}</td>
              <td class="px-6 py-4">
                <span :class="history.change > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" class="px-3 py-1 rounded-full text-xs font-bold">
                  {{ history.change > 0 ? 'Restock' : 'Deduction' }}
                </span>
              </td>
              <td class="px-6 py-4">{{ history.prevStock }}</td>
              <td class="px-6 py-4">
                <span :class="history.change > 0 ? 'text-green-600' : 'text-red-600'" class="font-bold">
                  {{ history.change > 0 ? '+' : '' }}{{ history.change }}
                </span>
              </td>
              <td class="px-6 py-4">{{ history.newStock }}</td>
              <td class="px-6 py-4 text-gray-600 text-sm">{{ history.reason || 'None' }}</td>
              <td class="px-6 py-4 text-gray-700 text-sm font-medium">{{ history.updatedBy || 'Admin' }}</td>
            </tr>
            <tr v-if="filteredAdminHistory.length === 0">
              <td colspan="9" class="px-6 py-4 text-center text-gray-500">No admin adjustments found</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination Controls -->
      <div class="flex justify-between items-center px-6 py-4 bg-gray-50 border-t">
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600">Items per page:</label>
          <select v-model.number="itemsPerPageAdmin" @change="currentPageAdmin = 1" class="border border-gray-300 rounded px-2 py-1 text-sm">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
          <span class="text-sm text-gray-600 ml-4">
            Showing {{ Math.min((currentPageAdmin - 1) * itemsPerPageAdmin + 1, filteredAdminHistory.length) }} 
            to {{ Math.min(currentPageAdmin * itemsPerPageAdmin, filteredAdminHistory.length) }} 
            of {{ filteredAdminHistory.length }} adjustments
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button 
            @click="currentPageAdmin = 1" 
            :disabled="currentPageAdmin === 1"
            class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
            First
          </button>
          <button 
            @click="currentPageAdmin--" 
            :disabled="currentPageAdmin === 1"
            class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
            Previous
          </button>
          <span class="text-sm text-gray-600">Page {{ currentPageAdmin }} of {{ totalPagesAdmin }}</span>
          <button 
            @click="currentPageAdmin++" 
            :disabled="currentPageAdmin >= totalPagesAdmin"
            class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
            Next
          </button>
          <button 
            @click="currentPageAdmin = totalPagesAdmin" 
            :disabled="currentPageAdmin >= totalPagesAdmin"
            class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
            Last
          </button>
        </div>
      </div>
    </div>

    <!-- Transaction Adjustments Tab -->
    <div v-show="activeTab === 'transactions'" class="bg-white rounded-2xl shadow overflow-hidden mb-6">
      <div class="p-4 bg-gray-50 border-b">
        <h3 class="text-lg font-bold">Transaction Adjustments</h3>
        <p class="text-sm text-gray-600">Stock changes from sales, returns, and voided transactions</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th @click="sortTransactionHistoryTable('updatedAt')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
                Date & Time
                <span v-if="transactionHistorySortColumn === 'updatedAt'">{{ transactionHistorySortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th @click="sortTransactionHistoryTable('transactionId')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
                Transaction ID
                <span v-if="transactionHistorySortColumn === 'transactionId'">{{ transactionHistorySortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th @click="sortTransactionHistoryTable('sku')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
                SKU
                <span v-if="transactionHistorySortColumn === 'sku'">{{ transactionHistorySortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th @click="sortTransactionHistoryTable('product')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
                Product
                <span v-if="transactionHistorySortColumn === 'product'">{{ transactionHistorySortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th @click="sortTransactionHistoryTable('transactionType')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
                Type
                <span v-if="transactionHistorySortColumn === 'transactionType'">{{ transactionHistorySortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th @click="sortTransactionHistoryTable('prevStock')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
                Previous Stock
                <span v-if="transactionHistorySortColumn === 'prevStock'">{{ transactionHistorySortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th @click="sortTransactionHistoryTable('change')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
                Change
                <span v-if="transactionHistorySortColumn === 'change'">{{ transactionHistorySortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th @click="sortTransactionHistoryTable('newStock')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
                New Stock
                <span v-if="transactionHistorySortColumn === 'newStock'">{{ transactionHistorySortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th @click="sortTransactionHistoryTable('updatedBy')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
                Updated By
                <span v-if="transactionHistorySortColumn === 'updatedBy'">{{ transactionHistorySortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="history in paginatedTransactionHistory" :key="history._id" class="border-t hover:bg-gray-50">
              <td class="px-6 py-4">{{ formatDate(history.updatedAt) }}</td>
              <td class="px-6 py-4 font-mono text-sm">{{ history.transactionId || 'N/A' }}</td>
              <td class="px-6 py-4">{{ history.sku || 'N/A' }}</td>
              <td class="px-6 py-4">{{ history.product }}</td>
              <td class="px-6 py-4">
                <span :class="getTransactionTypeClass(history.reason)" class="px-3 py-1 rounded-full text-xs font-bold">
                  {{ getTransactionTypeLabel(history.reason) }}
                </span>
              </td>
              <td class="px-6 py-4">{{ history.prevStock }}</td>
              <td class="px-6 py-4">
                <span :class="history.change > 0 ? 'text-green-600' : 'text-red-600'" class="font-bold">
                  {{ history.change > 0 ? '+' : '' }}{{ history.change }}
                </span>
              </td>
              <td class="px-6 py-4">{{ history.newStock }}</td>
              <td class="px-6 py-4 text-gray-700 text-sm font-medium">{{ history.updatedBy || 'System' }}</td>
            </tr>
            <tr v-if="filteredTransactionHistory.length === 0">
              <td colspan="9" class="px-6 py-4 text-center text-gray-500">No transaction adjustments found</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination Controls -->
      <div class="flex justify-between items-center px-6 py-4 bg-gray-50 border-t">
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600">Items per page:</label>
          <select v-model.number="itemsPerPageTransactions" @change="currentPageTransactions = 1" class="border border-gray-300 rounded px-2 py-1 text-sm">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
          <span class="text-sm text-gray-600 ml-4">
            Showing {{ Math.min((currentPageTransactions - 1) * itemsPerPageTransactions + 1, filteredTransactionHistory.length) }} 
            to {{ Math.min(currentPageTransactions * itemsPerPageTransactions, filteredTransactionHistory.length) }} 
            of {{ filteredTransactionHistory.length }} adjustments
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button 
            @click="currentPageTransactions = 1" 
            :disabled="currentPageTransactions === 1"
            class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
            First
          </button>
          <button 
            @click="currentPageTransactions--" 
            :disabled="currentPageTransactions === 1"
            class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
            Previous
          </button>
          <span class="text-sm text-gray-600">Page {{ currentPageTransactions }} of {{ totalPagesTransactions }}</span>
          <button 
            @click="currentPageTransactions++" 
            :disabled="currentPageTransactions >= totalPagesTransactions"
            class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
            Next
          </button>
          <button 
            @click="currentPageTransactions = totalPagesTransactions" 
            :disabled="currentPageTransactions >= totalPagesTransactions"
            class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
            Last
          </button>
        </div>
      </div>
    </div>

    <!-- Modify Stock Modal -->
    <Modal :is-open="isModifyModalOpen" title="Modify Stock" @close="closeModifyModal">
      <form @submit.prevent="submitModifyStock" class="space-y-4">
        <div>
          <label class="block text-sm font-bold mb-2">Product</label>
          <input :value="modifyProduct?.name" type="text" disabled class="w-full p-3 rounded-xl border border-gray-300 bg-gray-100" />
        </div>
        <div>
          <label class="block text-sm font-bold mb-2">Current Stock</label>
          <input :value="modifyProduct?.quantity" type="number" disabled class="w-full p-3 rounded-xl border border-gray-300 bg-gray-100" />
        </div>
        <div>
          <label class="block text-sm font-bold mb-2">New Stock Quantity</label>
          <input v-model.number="modifyForm.newQuantity" type="number" min="0" required class="w-full p-3 rounded-xl border border-gray-300" />
        </div>
        <div>
          <label class="block text-sm font-bold mb-2">Reason (Optional)</label>
          <textarea v-model="modifyForm.reason" rows="3" class="w-full p-3 rounded-xl border border-gray-300" placeholder="Reason for stock modification..."></textarea>
        </div>
        <div class="flex gap-4 pt-4">
          <button type="button" @click="closeModifyModal" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
          <button type="submit" class="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-2xl">Update Stock</button>
        </div>
      </form>
    </Modal>

    <!-- Print Report Modal -->
    <Modal :is-open="isPrintModalOpen" title="Print Stock Report" @close="closePrintModal">
      <form @submit.prevent="printStockReport" class="space-y-4">
        <!-- Menu 1: Report Category -->
        <div>
          <label class="block text-sm font-bold mb-2">Select Report Type</label>
          <select v-model="printForm.reportCategory" class="w-full p-3 rounded-xl border border-gray-300">
            <option value="current-stocks">Current Stocks</option>
            <option value="admin-adjustments">Admin Adjustments</option>
            <option value="transaction-adjustments">Transaction Adjustments</option>
          </select>
        </div>

        <!-- Menu 2: Report Sub-Type (changes based on category) -->
        <div>
          <label class="block text-sm font-bold mb-2">Select Filter</label>
          <select v-model="printForm.reportSubType" class="w-full p-3 rounded-xl border border-gray-300">
            <template v-if="printForm.reportCategory === 'current-stocks'">
              <option value="low">Low Stock</option>
              <option value="on-stock">On Stock</option>
              <option value="all">All Stock</option>
            </template>
            <template v-else-if="printForm.reportCategory === 'admin-adjustments'">
              <option value="deduction">Deduction History</option>
              <option value="restock">Restock History</option>
              <option value="all">All Admin Adjustments</option>
            </template>
            <template v-else>
              <option value="sale">Sales</option>
              <option value="return">Returns</option>
              <option value="void">Voids</option>
              <option value="restock">Restocks</option>
              <option value="all">All Transactions</option>
            </template>
          </select>
        </div>

        <!-- Menu 3: Date Range -->
        <div>
          <label class="block text-sm font-bold mb-2">Select Date Range</label>
          <select v-model="printForm.dateRange" class="w-full p-3 rounded-xl border border-gray-300">
            <option value="today">Today</option>
            <option value="last-7-days">Last 7 Days</option>
            <option value="last-30-days">Last 30 Days</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </div>

        <!-- Custom Date Range Inputs -->
        <div v-if="printForm.dateRange === 'custom'" class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold mb-2">Start Date</label>
            <input v-model="printForm.startDate" type="date" required class="w-full p-3 rounded-xl border border-gray-300" />
          </div>
          <div>
            <label class="block text-sm font-bold mb-2">End Date</label>
            <input v-model="printForm.endDate" type="date" required class="w-full p-3 rounded-xl border border-gray-300" />
          </div>
        </div>
        <div class="flex gap-4 pt-4">
          <button type="button" @click="closePrintModal" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
          <button type="button" @click="exportStockReportToExcel" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-2xl">
            <font-awesome-icon :icon="['fas', 'file-excel']" class="mr-2" />
            Excel
          </button>
          <button type="submit" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-2xl">
            <font-awesome-icon :icon="['fas', 'print']" class="mr-2" />
            Print
          </button>
        </div>
      </form>
    </Modal>

    <!-- View History Modal -->
    <Modal :is-open="isHistoryModalOpen" :title="`Stock History: ${selectedProduct?.name || ''} (${selectedProduct?.sku || ''})`" @close="closeHistoryModal">
      <div class="overflow-x-auto max-h-96">
        <table class="w-full">
          <thead class="bg-gray-50 sticky top-0">
            <tr>
              <th class="px-4 py-2 text-left text-sm font-bold">Date & Time</th>
              <th class="px-4 py-2 text-left text-sm font-bold">Type</th>
              <th class="px-4 py-2 text-left text-sm font-bold">Previous</th>
              <th class="px-4 py-2 text-left text-sm font-bold">Change</th>
              <th class="px-4 py-2 text-left text-sm font-bold">New</th>
              <th class="px-4 py-2 text-left text-sm font-bold">Reason</th>
              <th class="px-4 py-2 text-left text-sm font-bold">Updated By</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="history in productHistory" :key="history._id" class="border-t hover:bg-gray-50">
              <td class="px-4 py-2 text-sm">{{ formatDate(history.updatedAt) }}</td>
              <td class="px-4 py-2">
                <span :class="history.change > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" class="px-2 py-1 rounded-full text-xs font-bold">
                  {{ history.change > 0 ? 'Restock' : 'Deduction' }}
                </span>
              </td>
              <td class="px-4 py-2 text-sm">{{ history.prevStock }}</td>
              <td class="px-4 py-2 text-sm">
                <span :class="history.change > 0 ? 'text-green-600' : 'text-red-600'" class="font-bold">
                  {{ history.change > 0 ? '+' : '' }}{{ history.change }}
                </span>
              </td>
              <td class="px-4 py-2 text-sm">{{ history.newStock }}</td>
              <td class="px-4 py-2 text-sm text-gray-600">{{ history.reason || 'None' }}</td>
              <td class="px-4 py-2 text-sm text-gray-700 font-medium">{{ history.updatedBy || 'Admin' }}</td>
            </tr>
            <tr v-if="productHistory.length === 0">
              <td colspan="7" class="px-4 py-3 text-center text-gray-500 text-sm">No history found for this product</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Modal>

    <!-- Restock Modal -->
    <Modal :is-open="isRestockModalOpen" title="Restock Product" @close="closeRestockModal">
      <form @submit.prevent="submitRestock" class="space-y-4">
        <div>
          <label class="block text-sm font-bold mb-2">Product SKU</label>
          <input :value="restockForm.sku" readonly class="w-full p-3 rounded-xl border border-gray-300 bg-gray-100" />
        </div>
        <div>
          <label class="block text-sm font-bold mb-2">Product Name</label>
          <input :value="restockForm.productName" readonly class="w-full p-3 rounded-xl border border-gray-300 bg-gray-100" />
        </div>
        <div>
          <label class="block text-sm font-bold mb-2">Current Stock</label>
          <input :value="restockForm.currentStock" readonly class="w-full p-3 rounded-xl border border-gray-300 bg-gray-100" />
        </div>
        <div>
          <label class="block text-sm font-bold mb-2">Quantity to Add</label>
          <input v-model.number="restockForm.quantity" type="number" min="1" required class="w-full p-3 rounded-xl border border-gray-300" />
        </div>
        <div class="flex gap-4 pt-4">
          <button type="button" @click="closeRestockModal" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
          <button type="submit" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-2xl">Add Stock</button>
        </div>
      </form>
    </Modal>

    <!-- Set Alert Modal -->
    <Modal :is-open="isAlertModalOpen" title="Set Quantity Alert" @close="closeAlertModal">
      <form @submit.prevent="submitAlert" class="space-y-4">
        <div>
          <label class="block text-sm font-bold mb-2">Product</label>
          <input :value="alertProduct?.name" type="text" disabled class="w-full p-3 rounded-xl border border-gray-300 bg-gray-100" />
        </div>
        <div>
          <label class="block text-sm font-bold mb-2">Alert Threshold</label>
          <input v-model.number="alertForm.threshold" type="number" min="0" required class="w-full p-3 rounded-xl border border-gray-300" placeholder="Alert when stock reaches this level" />
          <p class="text-sm text-gray-600 mt-2">You will be notified when stock reaches or falls below this quantity.</p>
        </div>
        <div class="flex gap-4 pt-4">
          <button type="button" @click="closeAlertModal" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
          <button type="submit" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-2xl">Set Alert</button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, inject } from 'vue'
import Modal from '../../components/Modal.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faEye, faEdit, faPlus, faBell, faPrint, faFileExcel } from '@fortawesome/free-solid-svg-icons'
import axios from 'axios'

library.add(faEye, faEdit, faPlus, faBell, faPrint, faFileExcel)

const API_URL = import.meta.env.VITE_API_URL
const toast = inject('toast')

// Get current user info
const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
const currentUserRole = currentUser.role || ''
const currentUserStore = currentUser.store || null
const currentUsername = currentUser.username || 'Admin'

const products = ref([])
const addons = ref([])
const allItems = ref([])
const selectedProduct = ref(null)
const allStockHistory = ref([])
const productHistory = ref([])
const isRestockModalOpen = ref(false)
const isAlertModalOpen = ref(false)
const isModifyModalOpen = ref(false)
const isHistoryModalOpen = ref(false)
const isPrintModalOpen = ref(false)
const alertProduct = ref(null)
const modifyProduct = ref(null)
const activeTab = ref('stocks')
const searchQuery = ref('')
const sortColumn = ref('')
const sortDirection = ref('asc')
const historySortColumn = ref('')
const historySortDirection = ref('asc')
const transactionHistorySortColumn = ref('')
const transactionHistorySortDirection = ref('asc')
const isLoading = ref(false)

// Pagination for Current Stocks tab
const currentPageStocks = ref(1)
const itemsPerPageStocks = ref(10)

// Pagination for Admin Adjustments tab
const currentPageAdmin = ref(1)
const itemsPerPageAdmin = ref(10)

// Pagination for Transaction Adjustments tab
const currentPageTransactions = ref(1)
const itemsPerPageTransactions = ref(10)

const restockForm = ref({
  productId: '',
  variantId: '',
  quantity: 0,
  hasVariant: false,
  sku: '',
  productName: '',
  currentStock: 0
})

const alertForm = ref({
  threshold: 0,
  hasVariant: false,
  variantId: '',
  productId: ''
})

const modifyForm = ref({
  newQuantity: 0,
  reason: '',
  hasVariant: false,
  variantId: '',
  productId: '',
  sku: ''
})

const printForm = ref({
  reportCategory: 'current-stocks', // current-stocks, admin-adjustments, or transaction-adjustments
  reportSubType: 'all', // low, on-stock, all for current-stocks; deduction, restock, all for admin-adjustments; sale, return, void, restock, all for transaction-adjustments
  dateRange: 'today', // today, last-7-days, last-30-days, custom
  startDate: '',
  endDate: ''
})

// Computed properties for filtering
const filteredItems = computed(() => {
  let filtered = allItems.value
  
  // Apply role-based filtering
  if (currentUserRole === 'Co-Admin' && currentUserStore) {
    filtered = filtered.filter(item => {
      if (item.type === 'Add-on') {
        // Show global add-ons or add-ons assigned to this Co-Admin's store
        if (item.isGlobal) return true
        if (item.stores && Array.isArray(item.stores)) {
          return item.stores.some(store => {
            const storeId = typeof store === 'object' ? store._id : store
            return storeId === currentUserStore._id
          })
        }
        return false
      }
      // For products, filter by store
      if (item.isGlobal) return true
      return item.stores && item.stores.some(store => 
        store._id === currentUserStore._id || store === currentUserStore._id
      )
    })
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item => 
      (item.sku && item.sku.toLowerCase().includes(query)) || 
      item.name.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query)
    )
  }
  
  // Apply sorting
  if (sortColumn.value) {
    filtered = [...filtered].sort((a, b) => {
      let aVal = a[sortColumn.value]
      let bVal = b[sortColumn.value]
      
      // Handle null/undefined values
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
  }
  
  return filtered
})

const totalPagesStocks = computed(() => {
  return Math.ceil(filteredItems.value.length / itemsPerPageStocks.value)
})

const paginatedItems = computed(() => {
  const start = (currentPageStocks.value - 1) * itemsPerPageStocks.value
  const end = start + itemsPerPageStocks.value
  return filteredItems.value.slice(start, end)
})

const filteredProducts = computed(() => {
  return filteredItems.value.filter(item => item.type === 'Product')
})

// Filter for admin manual adjustments only
const filteredAdminHistory = computed(() => {
  let filtered = allStockHistory.value.filter(history => 
    history.transactionType === 'manual'
  )
  
  // Apply role-based filtering for Co-Admin
  if (currentUserRole === 'Co-Admin' && currentUserStore) {
    filtered = filtered.filter(history => {
      // Find the corresponding product/item to check its store assignment
      // For add-ons, match by product name since they don't have SKU
      // For products, match by SKU
      const relatedItem = allItems.value.find(item => {
        if (item.type === 'Add-on') {
          return item.name === history.product
        }
        return item.sku === history.sku
      })
      
      if (relatedItem) {
        // Show if it's a global item
        if (relatedItem.isGlobal) return true
        
        // Show if it belongs to Co-Admin's store
        if (relatedItem.stores && Array.isArray(relatedItem.stores)) {
          return relatedItem.stores.some(store => {
            const storeId = typeof store === 'object' ? store._id : store
            return storeId === currentUserStore._id
          })
        }
      }
      
      // If we can't find the related item, don't show it
      return false
    })
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(history => 
      (history.sku && history.sku.toLowerCase().includes(query)) || 
      history.product.toLowerCase().includes(query)
    )
  }
  
  // Apply sorting
  if (historySortColumn.value) {
    filtered = [...filtered].sort((a, b) => {
      let aVal = a[historySortColumn.value]
      let bVal = b[historySortColumn.value]
      
      // Handle date sorting
      if (historySortColumn.value === 'updatedAt') {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      }
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }
      
      if (historySortDirection.value === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
      }
    })
  }
  
  return filtered
})

const totalPagesAdmin = computed(() => {
  return Math.ceil(filteredAdminHistory.value.length / itemsPerPageAdmin.value)
})

const paginatedAdminHistory = computed(() => {
  const start = (currentPageAdmin.value - 1) * itemsPerPageAdmin.value
  const end = start + itemsPerPageAdmin.value
  return filteredAdminHistory.value.slice(start, end)
})

// Filter for transaction-based adjustments only (Purchased, Returned, Voided, restocks)
const filteredTransactionHistory = computed(() => {
  let filtered = allStockHistory.value.filter(history => 
    history.reason && ['Purchased', 'Returned', 'Voided'].includes(history.reason)
  )
  
  // Apply role-based filtering for Co-Admin
  if (currentUserRole === 'Co-Admin' && currentUserStore) {
    filtered = filtered.filter(history => {
      // Find the corresponding product/item to check its store assignment
      const relatedItem = allItems.value.find(item => {
        if (item.type === 'Add-on') {
          return item.name === history.product
        }
        return item.sku === history.sku
      })
      
      if (relatedItem) {
        if (relatedItem.isGlobal) return true
        
        if (relatedItem.stores && Array.isArray(relatedItem.stores)) {
          return relatedItem.stores.some(store => {
            const storeId = typeof store === 'object' ? store._id : store
            return storeId === currentUserStore._id
          })
        }
      }
      
      return false
    })
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(history => 
      (history.sku && history.sku.toLowerCase().includes(query)) || 
      history.product.toLowerCase().includes(query) ||
      (history.transactionId && history.transactionId.toLowerCase().includes(query))
    )
  }
  
  // Apply sorting
  if (transactionHistorySortColumn.value) {
    filtered = [...filtered].sort((a, b) => {
      let aVal = a[transactionHistorySortColumn.value]
      let bVal = b[transactionHistorySortColumn.value]
      
      // Handle date sorting
      if (transactionHistorySortColumn.value === 'updatedAt') {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      }
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }
      
      if (transactionHistorySortDirection.value === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
      }
    })
  }
  
  return filtered
})

const totalPagesTransactions = computed(() => {
  return Math.ceil(filteredTransactionHistory.value.length / itemsPerPageTransactions.value)
})

const paginatedTransactionHistory = computed(() => {
  const start = (currentPageTransactions.value - 1) * itemsPerPageTransactions.value
  const end = start + itemsPerPageTransactions.value
  return filteredTransactionHistory.value.slice(start, end)
})

const sortTable = (column) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

const sortHistoryTable = (column) => {
  if (historySortColumn.value === column) {
    historySortDirection.value = historySortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    historySortColumn.value = column
    historySortDirection.value = 'asc'
  }
}

const sortTransactionHistoryTable = (column) => {
  if (transactionHistorySortColumn.value === column) {
    transactionHistorySortDirection.value = transactionHistorySortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    transactionHistorySortColumn.value = column
    transactionHistorySortDirection.value = 'asc'
  }
}

const getTransactionTypeClass = (reason) => {
  const classes = 'px-2 py-1 text-xs font-semibold rounded '
  switch (reason) {
    case 'Purchased':
      return classes + 'bg-blue-100 text-blue-800'
    case 'Returned':
      return classes + 'bg-green-100 text-green-800'
    case 'Voided':
      return classes + 'bg-red-100 text-red-800'
    case 'restock':
      return classes + 'bg-purple-100 text-purple-800'
    default:
      return classes + 'bg-gray-100 text-gray-800'
  }
}

const getTransactionTypeLabel = (reason) => {
  // Return the reason as-is since it's already in the correct format
  return reason || 'Manual'
}

const getQuantityClass = (quantity, alert) => {
  if (quantity <= (alert || 0)) {
    return 'text-red-600 font-bold'
  }
  return 'text-gray-800'
}

const getStoreNames = (stores) => {
  if (!stores || stores.length === 0) return 'No store'
  
  const storeNames = stores.map(store => {
    if (typeof store === 'object' && store !== null) {
      return store.storeName || store.name || store._id
    }
    return store
  })
  
  if (storeNames.length > 2) {
    return `${storeNames.slice(0, 2).join(', ')} +${storeNames.length - 2}`
  }
  
  return storeNames.join(', ')
}

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

const openPrintModal = () => {
  const today = new Date().toISOString().split('T')[0]
  printForm.value = {
    reportCategory: 'current-stocks',
    reportSubType: 'all',
    dateRange: 'today',
    startDate: today,
    endDate: today
  }
  isPrintModalOpen.value = true
}

const closePrintModal = () => {
  isPrintModalOpen.value = false
}

const exportStockReportToExcel = () => {
  let reportData = []
  let reportTitle = ''
  let isHistoryReport = false
  
  // Calculate date range
  let startDate, endDate
  const now = new Date()
  
  if (printForm.value.dateRange === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  } else if (printForm.value.dateRange === 'last-7-days') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    startDate.setHours(0, 0, 0, 0)
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  } else if (printForm.value.dateRange === 'last-30-days') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    startDate.setHours(0, 0, 0, 0)
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  } else if (printForm.value.dateRange === 'custom') {
    startDate = new Date(printForm.value.startDate)
    endDate = new Date(printForm.value.endDate)
    endDate.setHours(23, 59, 59, 999)
  }
  
  // Generate report data
  if (printForm.value.reportCategory === 'current-stocks') {
    if (printForm.value.reportSubType === 'low') {
      reportData = filteredItems.value.filter(p => p.quantity <= (p.quantityAlert || 0))
      reportTitle = 'Low Stock Report'
    } else if (printForm.value.reportSubType === 'on-stock') {
      reportData = filteredItems.value.filter(p => p.quantity > (p.quantityAlert || 0))
      reportTitle = 'On Stock Report'
    } else {
      reportData = filteredItems.value
      reportTitle = 'Stock Report'
    }
    
    // Create CSV for current stocks
    const dateRangeText = printForm.value.dateRange === 'today' ? 'Today' :
                          printForm.value.dateRange === 'last-7-days' ? 'Last 7 Days' :
                          printForm.value.dateRange === 'last-30-days' ? 'Last 30 Days' :
                          `${formatDate(startDate)} to ${formatDate(endDate)}`
    
    let csvContent = `${reportTitle} - ${dateRangeText}\n`
    csvContent += `Generated on: ${new Date().toLocaleString()}\n`
    csvContent += `Total Products: ${reportData.length}\n\n`
    csvContent += 'SKU,Name,Type,Quantity,Alert Level,Status\n'
    
    reportData.forEach(item => {
      const status = item.quantity <= (item.quantityAlert || 0) ? 'Low Stock' : 'In Stock'
      csvContent += `"${item.sku || 'N/A'}","${item.name}","${item.type}",${item.quantity},${item.quantityAlert || 0},"${status}"\n`
    })
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${reportTitle.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
  } else {
    // Stock History Report (admin-adjustments or transaction-adjustments)
    isHistoryReport = true
    let filteredHistory = allStockHistory.value
    
    // Filter by report category (admin vs transaction)
    if (printForm.value.reportCategory === 'admin-adjustments') {
      filteredHistory = filteredHistory.filter(h => h.transactionType === 'manual')
    } else if (printForm.value.reportCategory === 'transaction-adjustments') {
      filteredHistory = filteredHistory.filter(h => h.transactionType && ['Purchased', 'Returned', 'Voided'].includes(h.transactionType))
    }
    
    // Apply role-based filtering for Co-Admin
    if (currentUserRole === 'Co-Admin' && currentUserStore) {
      filteredHistory = filteredHistory.filter(history => {
        const relatedItem = allItems.value.find(item => {
          if (item.type === 'Add-on') {
            return item.name === history.product
          }
          return item.sku === history.sku
        })
        
        if (relatedItem) {
          if (relatedItem.isGlobal) return true
          if (relatedItem.stores && Array.isArray(relatedItem.stores)) {
            return relatedItem.stores.some(store => {
              const storeId = typeof store === 'object' ? store._id : store
              return storeId === currentUserStore._id
            })
          }
        }
        return false
      })
    }
    
    // Filter by date range
    filteredHistory = filteredHistory.filter(h => {
      const historyDate = new Date(h.updatedAt)
      return historyDate >= startDate && historyDate <= endDate
    })
    
    // Filter by sub-type
    if (printForm.value.reportCategory === 'admin-adjustments') {
      if (printForm.value.reportSubType === 'deduction') {
        reportData = filteredHistory.filter(h => h.change < 0)
        reportTitle = 'Admin Deduction History'
      } else if (printForm.value.reportSubType === 'restock') {
        reportData = filteredHistory.filter(h => h.change > 0)
        reportTitle = 'Admin Restock History'
      } else {
        reportData = filteredHistory
        reportTitle = 'Admin Adjustments History'
      }
    } else if (printForm.value.reportCategory === 'transaction-adjustments') {
      if (printForm.value.reportSubType === 'sale') {
        reportData = filteredHistory.filter(h => h.reason === 'Purchased')
        reportTitle = 'Sales Transaction History'
      } else if (printForm.value.reportSubType === 'return') {
        reportData = filteredHistory.filter(h => h.reason === 'Returned')
        reportTitle = 'Return Transaction History'
      } else if (printForm.value.reportSubType === 'void') {
        reportData = filteredHistory.filter(h => h.reason === 'Voided')
        reportTitle = 'Void Transaction History'
      } else if (printForm.value.reportSubType === 'restock') {
        reportData = filteredHistory.filter(h => h.reason === 'restock')
        reportTitle = 'Restock Transaction History'
      } else {
        reportData = filteredHistory
        reportTitle = 'Transaction Adjustments History'
      }
    }
    
    const dateRangeText = printForm.value.dateRange === 'today' ? 'Today' :
                          printForm.value.dateRange === 'last-7-days' ? 'Last 7 Days' :
                          printForm.value.dateRange === 'last-30-days' ? 'Last 30 Days' :
                          `${formatDate(startDate)} to ${formatDate(endDate)}`
    
    let csvContent = `${reportTitle} - ${dateRangeText}\n`
    csvContent += `Generated on: ${new Date().toLocaleString()}\n`
    csvContent += `Total Transactions: ${reportData.length}\n\n`
    
    // Different headers based on report type
    if (printForm.value.reportCategory === 'transaction-adjustments') {
      csvContent += 'Date & Time,Transaction ID,SKU,Product,Type,Previous Stock,Change,New Stock,Updated By\n'
      reportData.forEach(history => {
        const typeLabel = getTransactionTypeLabel(history.reason)
        csvContent += `"${formatDate(history.updatedAt)}","${history.transactionId || 'N/A'}","${history.sku}","${history.product}","${typeLabel}",${history.prevStock},${history.change},${history.newStock},"${history.updatedBy || 'Admin'}"\n`
      })
    } else {
      csvContent += 'Date & Time,SKU,Product,Previous Stock,Change,New Stock,Reason,Updated By\n'
      reportData.forEach(history => {
        csvContent += `"${formatDate(history.updatedAt)}","${history.sku}","${history.product}",${history.prevStock},${history.change},${history.newStock},"${history.reason || 'None'}","${history.updatedBy || 'Admin'}"\n`
      })
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${reportTitle.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  closePrintModal()
}

const printStockReport = () => {
  const printWindow = window.open('', '_blank')
  
  let reportData = []
  let reportTitle = ''
  let isHistoryReport = false
  
  // Calculate date range based on selection
  let startDate, endDate
  const now = new Date()
  
  if (printForm.value.dateRange === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  } else if (printForm.value.dateRange === 'last-7-days') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    startDate.setHours(0, 0, 0, 0)
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  } else if (printForm.value.dateRange === 'last-30-days') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    startDate.setHours(0, 0, 0, 0)
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  } else if (printForm.value.dateRange === 'custom') {
    startDate = new Date(printForm.value.startDate)
    endDate = new Date(printForm.value.endDate)
    endDate.setHours(23, 59, 59, 999)
  }
  
  // Generate report based on category and sub-type
  if (printForm.value.reportCategory === 'current-stocks') {
    // Current Stocks Reports - use filteredItems to respect role-based filtering
    
    // Apply sub-type filter
    if (printForm.value.reportSubType === 'low') {
      reportData = filteredItems.value.filter(p => p.quantity <= (p.quantityAlert || 0))
      reportTitle = 'Low Stock Report'
    } else if (printForm.value.reportSubType === 'on-stock') {
      reportData = filteredItems.value.filter(p => p.quantity > (p.quantityAlert || 0))
      reportTitle = 'On Stock Report'
    } else {
      reportData = filteredItems.value
      reportTitle = 'Stock Report'
    }
    
  } else {
    // Stock History Reports (admin-adjustments or transaction-adjustments)
    isHistoryReport = true
    let filteredHistory = allStockHistory.value
    
    // Filter by report category (admin vs transaction)
    if (printForm.value.reportCategory === 'admin-adjustments') {
      filteredHistory = filteredHistory.filter(h => h.transactionType === 'manual')
    } else if (printForm.value.reportCategory === 'transaction-adjustments') {
      filteredHistory = filteredHistory.filter(h => h.transactionType && ['Purchased', 'Returned', 'Voided'].includes(h.transactionType))
    }
    
    // Apply role-based filtering for Co-Admin
    if (currentUserRole === 'Co-Admin' && currentUserStore) {
      filteredHistory = filteredHistory.filter(history => {
        // Find the corresponding product/item to check its store assignment
        const relatedItem = allItems.value.find(item => {
          if (item.type === 'Add-on') {
            return item.name === history.product
          }
          return item.sku === history.sku
        })
        
        if (relatedItem) {
          // Show if it's a global item
          if (relatedItem.isGlobal) return true
          
          // Show if it belongs to Co-Admin's store
          if (relatedItem.stores && Array.isArray(relatedItem.stores)) {
            return relatedItem.stores.some(store => {
              const storeId = typeof store === 'object' ? store._id : store
              return storeId === currentUserStore._id
            })
          }
        }
        
        // If we can't find the related item, don't show it
        return false
      })
    }
    
    // Apply date range filter
    filteredHistory = filteredHistory.filter(h => {
      const historyDate = new Date(h.updatedAt)
      return historyDate >= startDate && historyDate <= endDate
    })
    
    // Apply sub-type filter
    if (printForm.value.reportCategory === 'admin-adjustments') {
      if (printForm.value.reportSubType === 'deduction') {
        reportData = filteredHistory.filter(h => h.change < 0)
        reportTitle = 'Admin Deduction History'
      } else if (printForm.value.reportSubType === 'restock') {
        reportData = filteredHistory.filter(h => h.change > 0)
        reportTitle = 'Admin Restock History'
      } else {
        reportData = filteredHistory
        reportTitle = 'Admin Adjustments History'
      }
    } else if (printForm.value.reportCategory === 'transaction-adjustments') {
      if (printForm.value.reportSubType === 'sale') {
        reportData = filteredHistory.filter(h => h.reason === 'Purchased')
        reportTitle = 'Sales Transaction History'
      } else if (printForm.value.reportSubType === 'return') {
        reportData = filteredHistory.filter(h => h.reason === 'Returned')
        reportTitle = 'Return Transaction History'
      } else if (printForm.value.reportSubType === 'void') {
        reportData = filteredHistory.filter(h => h.reason === 'Voided')
        reportTitle = 'Void Transaction History'
      } else if (printForm.value.reportSubType === 'restock') {
        reportData = filteredHistory.filter(h => h.reason === 'restock')
        reportTitle = 'Restock Transaction History'
      } else {
        reportData = filteredHistory
        reportTitle = 'Transaction Adjustments History'
      }
    }
  }
  
  // Add date range to title
  const dateRangeText = printForm.value.dateRange === 'today' ? 'Today' :
                        printForm.value.dateRange === 'last-7-days' ? 'Last 7 Days' :
                        printForm.value.dateRange === 'last-30-days' ? 'Last 30 Days' :
                        `${formatDate(startDate)} to ${formatDate(endDate)}`
  reportTitle += ` - ${dateRangeText}`
  
  // Generate report based on type
  if (isHistoryReport) {
    const reportContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportTitle} - ${new Date().toLocaleDateString()}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 10px;
            font-size: 9px;
          }
          h1 { 
            text-align: center; 
            color: #333;
            font-size: 14px;
            margin: 5px 0;
          }
          .report-info {
            text-align: center;
            margin-bottom: 8px;
            color: #666;
            font-size: 8px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 10px; 
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 3px 5px; 
            text-align: left;
            font-size: 8px;
          }
          th { 
            background-color: #4CAF50; 
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) { 
            background-color: #f9f9f9; 
          }
          .positive {
            color: green;
            font-weight: bold;
          }
          .negative {
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
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Total Transactions: ${reportData.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              ${printForm.value.reportCategory === 'transaction-adjustments' ? '<th>Transaction ID</th>' : ''}
              <th>SKU</th>
              <th>Product</th>
              ${printForm.value.reportCategory === 'transaction-adjustments' ? '<th>Type</th>' : ''}
              <th>Previous Stock</th>
              <th>Change</th>
              <th>New Stock</th>
              ${printForm.value.reportCategory === 'admin-adjustments' ? '<th>Reason</th>' : ''}
              <th>Updated By</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.map(history => `
              <tr>
                <td>${formatDate(history.updatedAt)}</td>
                ${printForm.value.reportCategory === 'transaction-adjustments' ? `<td>${history.transactionId || 'N/A'}</td>` : ''}
                <td>${history.sku}</td>
                <td>${history.product}</td>
                ${printForm.value.reportCategory === 'transaction-adjustments' ? `<td>${getTransactionTypeLabel(history.reason)}</td>` : ''}
                <td>${history.prevStock}</td>
                <td class="${history.change > 0 ? 'positive' : 'negative'}">${history.change > 0 ? '+' : ''}${history.change}</td>
                <td>${history.newStock}</td>
                ${printForm.value.reportCategory === 'admin-adjustments' ? `<td>${history.reason || 'None'}</td>` : ''}
                <td>${history.updatedBy || 'Admin'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Report</button>
        </div>
      </body>
      </html>
    `
    
    printWindow.document.write(reportContent)
    printWindow.document.close()
    closePrintModal()
    return
  }
  
  // Current stocks report
  const reportContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${reportTitle} - ${new Date().toLocaleDateString()}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          padding: 10px;
          font-size: 9px;
        }
        h1 { 
          text-align: center; 
          color: #333;
          font-size: 14px;
          margin: 5px 0;
        }
        .report-info {
          text-align: center;
          margin-bottom: 8px;
          color: #666;
          font-size: 8px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 10px; 
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 3px 5px; 
          text-align: left;
          font-size: 8px;
        }
        th { 
          background-color: #4CAF50; 
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) { 
          background-color: #f9f9f9; 
        }
        .low-stock {
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
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>Total Products: ${reportData.length}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Name</th>
            <th>Type</th>
            <th>Quantity</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.map(item => `
            <tr>
              <td>${item.sku || 'N/A'}</td>
              <td>${item.name}</td>
              <td>${item.type}</td>
              <td class="${item.quantity <= (item.quantityAlert || 0) ? 'low-stock' : ''}">${item.quantity}</td>
              <td>${item.quantity <= (item.quantityAlert || 0) ? 'Low Stock' : 'In Stock'}</td>
            </tr>
          `).join('')}
        </tbody>
        </table>
        <div style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Report</button>
        </div>
      </body>
      </html>
    `
    
  printWindow.document.write(reportContent)
  printWindow.document.close()
  closePrintModal()
}

const openRestockModal = (item) => {
  if (item.type === 'Add-on') {
    // Add-on restock
    restockForm.value = { 
      itemId: item._id,
      itemType: 'addon',
      quantity: 0,
      sku: item.name,
      productName: item.name,
      currentStock: item.quantity
    }
  } else {
    // Product restock
    restockForm.value = { 
      productId: item.productId, 
      variantId: item.variantId || '', 
      quantity: 0,
      hasVariant: item.hasVariant,
      itemType: 'product',
      sku: item.sku,
      productName: item.name,
      currentStock: item.quantity
    }
  }
  isRestockModalOpen.value = true
}

const openRestockModalForProduct = (product) => {
  restockForm.value = { 
    productId: product.productId, 
    variantId: product.variantId || '', 
    quantity: 0,
    hasVariant: product.hasVariant,
    itemType: 'product',
    sku: product.sku,
    productName: product.name,
    currentStock: product.quantity
  }
  isRestockModalOpen.value = true
}

const closeRestockModal = () => {
  isRestockModalOpen.value = false
  restockForm.value = { productId: '', variantId: '', quantity: 0, hasVariant: false, itemType: '', sku: '', productName: '', currentStock: 0 }
}

const openModifyStockModal = (item) => {
  if (item.type === 'Add-on') {
    // Add-on modify
    modifyProduct.value = item
    modifyForm.value = { 
      newQuantity: item.quantity, 
      reason: '',
      itemType: 'addon',
      itemId: item._id,
      sku: item.name
    }
  } else {
    // Product modify
    modifyProduct.value = item
    modifyForm.value = { 
      newQuantity: item.quantity, 
      reason: '',
      hasVariant: item.hasVariant,
      variantId: item.variantId || '',
      productId: item.productId,
      itemType: 'product',
      sku: item.sku
    }
  }
  isModifyModalOpen.value = true
}

const closeModifyModal = () => {
  isModifyModalOpen.value = false
  modifyProduct.value = null
  modifyForm.value = { newQuantity: 0, reason: '', hasVariant: false, variantId: '', productId: '', itemType: '', sku: '' }
}

const openAlertModal = (item) => {
  alertProduct.value = item
  if (item.type === 'Add-on') {
    alertForm.value = { 
      threshold: item.quantityAlert || 0,
      itemType: 'addon',
      itemId: item._id
    }
  } else {
    alertForm.value = { 
      threshold: item.quantityAlert || 0,
      hasVariant: item.hasVariant,
      variantId: item.variantId || '',
      productId: item.productId,
      itemType: 'product'
    }
  }
  isAlertModalOpen.value = true
}

const closeAlertModal = () => {
  isAlertModalOpen.value = false
  alertProduct.value = null
  alertForm.value = { threshold: 0, hasVariant: false, variantId: '', productId: '', itemType: '' }
}

const viewHistory = async (product) => {
  try {
    selectedProduct.value = product
    const response = await axios.get(`${API_URL}/stock/history/${product.sku}`)
    productHistory.value = response.data.history || []
    isHistoryModalOpen.value = true
  } catch (error) {
    console.error('Error fetching history:', error)
    toast('Failed to load stock history', 'error')
  }
}

const closeHistoryModal = () => {
  isHistoryModalOpen.value = false
  selectedProduct.value = null
  productHistory.value = []
}

const submitModifyStock = async () => {
  if (!modifyProduct.value) return

  try {
    isLoading.value = true
    
    if (modifyForm.value.itemType === 'addon') {
      // Update add-on quantity via stock API
      await axios.put(`${API_URL}/stock/update`, {
        sku: modifyForm.value.sku,
        newQuantity: modifyForm.value.newQuantity,
        reason: modifyForm.value.reason || 'Manual adjustment',
        isAddon: true,
        addonId: modifyForm.value.itemId,
        updatedBy: currentUsername
      })
      toast(`Successfully updated stock for ${modifyProduct.value.name}`, 'success')
      await fetchStockHistory()
    } else {
      // Update product quantity
      await axios.put(`${API_URL}/stock/update`, {
        sku: modifyForm.value.sku,
        newQuantity: modifyForm.value.newQuantity,
        reason: modifyForm.value.reason || 'Manual adjustment',
        isVariant: modifyForm.value.hasVariant,
        variantId: modifyForm.value.variantId,
        productId: modifyForm.value.productId,
        updatedBy: currentUsername
      })
      toast(`Successfully updated stock for ${modifyProduct.value.name}`, 'success')
      await fetchStockHistory()
    }

    await fetchStockData()
    closeModifyModal()
  } catch (error) {
    console.error('Error updating stock:', error)
    toast('Failed to update stock', 'error')
  } finally {
    isLoading.value = false
  }
}

const submitRestock = async () => {
  if (restockForm.value.itemType === 'addon') {
    if (!restockForm.value.itemId) {
      toast('Please select an add-on', 'warning')
      return
    }
    
    try {
      isLoading.value = true
      
      // Restock add-on via stock API
      await axios.post(`${API_URL}/stock/restock`, {
        sku: restockForm.value.sku,
        quantityToAdd: restockForm.value.quantity,
        isAddon: true,
        addonId: restockForm.value.itemId,
        updatedBy: currentUsername
      })

      toast(`Successfully added ${restockForm.value.quantity} units to ${restockForm.value.productName}`, 'success')
      await fetchStockData()
      await fetchStockHistory()
      closeRestockModal()
    } catch (error) {
      console.error('Error restocking add-on:', error)
      toast('Failed to restock add-on', 'error')
    } finally {
      isLoading.value = false
    }
  } else {
    if (!restockForm.value.productId) {
      toast('Please select a product', 'warning')
      return
    }

    try {
      isLoading.value = true
      await axios.post(`${API_URL}/stock/restock`, {
        sku: restockForm.value.sku,
        quantityToAdd: restockForm.value.quantity,
        isVariant: restockForm.value.hasVariant,
        variantId: restockForm.value.variantId,
        productId: restockForm.value.productId,
        updatedBy: currentUsername
      })

      toast(`Successfully added ${restockForm.value.quantity} units to ${restockForm.value.productName}`, 'success')
      
      await fetchStockData()
      await fetchStockHistory()
      closeRestockModal()
    } catch (error) {
      console.error('Error restocking:', error)
      toast('Failed to restock', 'error')
    } finally {
      isLoading.value = false
    }
  }
}

const submitAlert = async () => {
  if (!alertProduct.value) return

  try {
    isLoading.value = true
    
    if (alertForm.value.itemType === 'addon') {
      // Update add-on alert
      await axios.put(`${API_URL}/addons/${alertForm.value.itemId}`, {
        quantityAlert: alertForm.value.threshold
      })
      toast(`Alert threshold set to ${alertForm.value.threshold} for ${alertProduct.value.name}`, 'success')
    } else {
      // Update product alert
      await axios.put(`${API_URL}/stock/alert`, {
        threshold: alertForm.value.threshold,
        isVariant: alertForm.value.hasVariant,
        variantId: alertForm.value.variantId,
        productId: alertForm.value.productId
      })
      toast(`Alert threshold set to ${alertForm.value.threshold} for ${alertProduct.value.name}`, 'success')
    }

    await fetchStockData()
    closeAlertModal()
  } catch (error) {
    console.error('Error setting alert:', error)
    toast('Failed to set alert threshold', 'error')
  } finally {
    isLoading.value = false
  }
}

const fetchStockData = async () => {
  try {
    isLoading.value = true
    
    // Fetch all stock data (includes products and add-ons)
    const stockResponse = await axios.get(`${API_URL}/stock`)
    const stockData = stockResponse.data.stock || []
    
    // Map items with correct type based on isAddon flag
    allItems.value = stockData.map(item => ({
      ...item,
      type: item.isAddon ? 'Add-on' : 'Product'
    }))
  } catch (error) {
    console.error('Error fetching stock:', error)
    toast('Failed to load stock data', 'error')
  } finally {
    isLoading.value = false
  }
}

const fetchStockHistory = async () => {
  try {
    const response = await axios.get(`${API_URL}/stock/history`)
    allStockHistory.value = response.data.history || []
  } catch (error) {
    console.error('Error fetching history:', error)
  }
}

onMounted(() => {
  fetchStockData()
  fetchStockHistory()
})
</script>
