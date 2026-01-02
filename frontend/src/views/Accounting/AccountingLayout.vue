<template>
  <div class="bg-gray-100 min-h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-white shadow-lg p-3">
      <div class="flex justify-between items-center">
        <div class="flex-1"></div>
        <div class="flex-1 flex justify-center">
          <img src="/posxpress-logo.png" alt="PosXpress" class="h-12" />
        </div>
        <div class="flex-1 flex justify-end relative">
          <button @click="toggleMenu" class="text-gray font-bold py-2 px-4 border shadow">
            <font-awesome-icon :icon="isMenuOpen ? 'times' : 'bars'" class="text-xl" />
          </button>
          <!-- Popover Menu -->
          <div v-if="isMenuOpen" class="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-300 shadow-lg z-50">
            <button @click="goToTransactionHistory" class="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3 text-gray-700">
              <font-awesome-icon icon="history" />
              <span>Transaction History</span>
            </button>
            <button @click="openSettingsModal" class="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3 text-gray-700">
              <font-awesome-icon icon="cog" />
              <span>Settings</span>
            </button>
            <button @click="openLogoutModal" class="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3 text-red-600">
              <font-awesome-icon icon="sign-out-alt" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-4">Customer Management</h1>
      
      <!-- Two Column Layout -->
      <div class="grid grid-cols-2 gap-4">
        <!-- Left Column: Customer Management -->
        <div class="bg-white rounded-lg shadow-lg p-4">
          <h2 class="text-xl font-bold mb-4">Manage Customer</h2>
          
          <!-- RFID Scanner Section -->
          <div class="mb-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
            <h3 class="text-md font-bold mb-2 flex items-center gap-2">
              <font-awesome-icon icon="id-card" class="text-blue-600" />
              Scan Customer RFID
            </h3>
            <p class="text-gray-600 mb-3 text-sm">Please tap customer's RFID card</p>
            <input 
              ref="rfidInput" 
              v-model="rfidValue" 
              @keyup.enter="handleRFIDScanned" 
              type="text" 
              placeholder="RFID will be captured automatically..."
              class="w-full p-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm" 
            />
            <button 
              @click="searchCustomer" 
              class="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg text-sm"
            >
              Search Customer
            </button>
          </div>

          <!-- Customer Info Display -->
          <div v-if="selectedCustomer">
            <!-- Customer Details -->
            <div class="mb-3 p-3 bg-green-50 rounded-lg border-2 border-green-300">
              <h3 class="text-md font-bold mb-2 text-green-700">Customer Information</h3>
              <div class="space-y-2">
                <div>
                  <p class="text-gray-600 text-xs">Full Name</p>
                  <p class="font-bold text-sm">{{ selectedCustomer.fullName }}</p>
                </div>
                <div>
                  <p class="text-gray-600 text-xs">Username</p>
                  <p class="font-bold text-sm">{{ selectedCustomer.username }}</p>
                </div>
                <div>
                  <p class="text-gray-600 text-xs">Birthday</p>
                  <p class="font-bold text-sm">{{ formatDate(selectedCustomer.birthday) }}</p>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="grid grid-cols-2 gap-2 mb-2">
              <button 
                @click="openCashInModal" 
                class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs"
              >
                <font-awesome-icon icon="money-bill-wave" />
                Cash In
              </button>
              <button 
                @click="requestRFIDConfirmation('cashOut')" 
                class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs"
              >
                <font-awesome-icon icon="money-bill-wave" />
                Withdraw
              </button>
              <button 
                @click="requestRFIDConfirmation('editProfile')" 
                class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs"
              >
                <font-awesome-icon icon="edit" />
                Edit Profile
              </button>
              <button 
                @click="requestRFIDConfirmation('viewTransactions')" 
                class="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs"
              >
                <font-awesome-icon icon="list" />
                Transactions
              </button>
            </div>
            
            <button
              @click="requestRFIDConfirmation('viewBalance')"
              class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs mb-2"
            >
              <font-awesome-icon icon="eye" />
              View Balance
            </button>

            <button 
              @click="clearCustomer" 
              class="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 rounded-lg text-xs"
            >
              Clear / Scan New Customer
            </button>
          </div>

          <!-- No Customer Selected -->
          <div v-else class="text-center py-6 text-gray-500">
            <font-awesome-icon icon="id-card" class="text-4xl mb-2" />
            <p class="text-sm font-semibold">No customer selected</p>
            <p class="text-xs">Please scan a customer's RFID card</p>
          </div>
        </div>

        <!-- Right Column: All Customers Table -->
        <div class="bg-white rounded-lg shadow-lg p-4">
          <div class="flex justify-between items-center mb-3">
            <h2 class="text-xl font-bold">All Customers</h2>
            <button 
              @click="openAddCustomerModal" 
              class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-lg flex items-center gap-2 text-sm"
            >
              <font-awesome-icon icon="plus" />
              Add Customer
            </button>
          </div>

          <!-- Search Bar -->
          <div class="mb-3">
            <input 
              v-model="customerSearchQuery" 
              type="text" 
              placeholder="Search by name, username..." 
              class="w-full p-2 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            />
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th @click="sortTable('fullName')" class="py-2 px-3 border-b text-left cursor-pointer hover:bg-gray-100">
                    <div class="flex items-center gap-1">
                      Full Name
                      <font-awesome-icon 
                        v-if="sortColumn === 'fullName'" 
                        :icon="sortDirection === 'asc' ? 'sort-up' : 'sort-down'" 
                        class="text-xs" 
                      />
                      <font-awesome-icon v-else icon="sort" class="text-xs text-gray-400" />
                    </div>
                  </th>
                  <th @click="sortTable('username')" class="py-2 px-3 border-b text-left cursor-pointer hover:bg-gray-100">
                    <div class="flex items-center gap-1">
                      Username
                      <font-awesome-icon 
                        v-if="sortColumn === 'username'" 
                        :icon="sortDirection === 'asc' ? 'sort-up' : 'sort-down'" 
                        class="text-xs" 
                      />
                      <font-awesome-icon v-else icon="sort" class="text-xs text-gray-400" />
                    </div>
                  </th>
                  <th @click="sortTable('birthday')" class="py-2 px-3 border-b text-left cursor-pointer hover:bg-gray-100">
                    <div class="flex items-center gap-1">
                      Birthday
                      <font-awesome-icon 
                        v-if="sortColumn === 'birthday'" 
                        :icon="sortDirection === 'asc' ? 'sort-up' : 'sort-down'" 
                        class="text-xs" 
                      />
                      <font-awesome-icon v-else icon="sort" class="text-xs text-gray-400" />
                    </div>
                  </th>
                  <th @click="sortTable('status')" class="py-2 px-3 border-b text-center cursor-pointer hover:bg-gray-100">
                    <div class="flex items-center justify-center gap-1">
                      Status
                      <font-awesome-icon 
                        v-if="sortColumn === 'status'" 
                        :icon="sortDirection === 'asc' ? 'sort-up' : 'sort-down'" 
                        class="text-xs" 
                      />
                      <font-awesome-icon v-else icon="sort" class="text-xs text-gray-400" />
                    </div>
                  </th>
                  <th class="py-2 px-3 border-b text-center sticky right-0 bg-gray-100 shadow-[-2px_0_4px_rgba(0,0,0,0.1)] min-w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredCustomers.length === 0">
                  <td colspan="4" class="py-4 text-center text-gray-500 text-sm">No customers found</td>
                </tr>
                <tr v-else v-for="customer in filteredCustomers" :key="customer._id" class="border-t hover:bg-gray-50">
                  <td class="py-2 px-3">{{ customer.fullName }}</td>
                  <td class="py-2 px-3">{{ customer.username }}</td>
                  <td class="py-2 px-3">{{ formatDate(customer.birthday) }}</td>
                  <td class="py-2 px-3 text-center">
                    <button
                      @click="toggleCustomerStatus(customer)"
                      class="px-2 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors"
                      :class="customer.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'"
                    >
                      {{ customer.status === 'active' ? 'Active' : 'Disabled' }}
                    </button>
                  </td>
                  <td class="py-2 px-3 text-center sticky right-0 bg-white shadow-[-2px_0_4px_rgba(0,0,0,0.1)] whitespace-nowrap min-w-[120px]">
                    <button 
                      @click="selectCustomerById(customer._id)" 
                      class="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                    >
                      Select
                    </button>
                    <button 
                      @click="deleteCustomer(customer._id)" 
                      class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs ml-1"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>

    <!-- Modals -->
    <Modal :is-open="isCashInModalOpen" title="Cash In" @close="isCashInModalOpen = false">
      <p class="mb-4">Enter amount to add to customer's balance:</p>
      <input 
        v-model="cashInAmount" 
        type="number" 
        placeholder="Enter amount" 
        class="w-full p-3 rounded-xl border border-gray-300 mb-4" 
      />
      <div class="flex gap-4">
        <button @click="isCashInModalOpen = false" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
        <button @click="requestRFIDConfirmation('confirmCashIn')" class="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-2xl">Add Funds</button>
      </div>
    </Modal>

    <Modal :is-open="isCashOutModalOpen" title="Withdraw Cash" @close="isCashOutModalOpen = false">
      <div class="mb-4 text-center">
        <span class="block text-gray-700 font-bold mb-2">Current Balance:</span>
        <span class="text-2xl font-bold text-green-600">₱{{ selectedCustomer?.balance.toFixed(2) }}</span>
      </div>
      <p class="mb-4">Enter amount to withdraw from customer's balance:</p>
      <input 
        v-model="cashOutAmount" 
        type="number" 
        placeholder="Enter amount" 
        class="w-full p-3 rounded-xl border border-gray-300 mb-4" 
      />
      <div class="flex gap-4">
        <button @click="isCashOutModalOpen = false" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
        <button @click="requestRFIDConfirmation('confirmCashOut')" class="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-2xl">Withdraw</button>
      </div>
    </Modal>

    <Modal :is-open="isEditModalOpen" title="Edit Customer" @close="isEditModalOpen = false">
      <div class="space-y-4" v-if="editForm">
        <div>
          <label class="block text-gray-700 font-bold mb-2">Full Name</label>
          <input v-model="editForm.fullName" type="text" class="w-full p-3 border rounded-lg" />
        </div>
        <div>
          <label class="block text-gray-700 font-bold mb-2">Username</label>
          <input v-model="editForm.username" type="text" class="w-full p-3 border rounded-lg" />
        </div>
        <div>
          <label class="block text-gray-700 font-bold mb-2">Birthday</label>
          <input v-model="editForm.birthday" type="date" class="w-full p-3 border rounded-lg" />
        </div>
        <div>
          <label class="block text-gray-700 font-bold mb-2">Status</label>
          <select v-model="editForm.status" class="w-full p-3 border rounded-lg">
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
        
        <div class="border-t pt-4 mt-4">
          <p class="text-sm text-gray-600 mb-3">Leave fields below empty if you don't want to change them</p>
          
          <div>
            <label class="block text-gray-700 font-bold mb-2">New RFID (Optional)</label>
            <input v-model="editForm.newRfid" type="text" class="w-full p-3 border rounded-lg" placeholder="Scan or enter new RFID" />
          </div>
          
          <div class="mt-3">
            <label class="block text-gray-700 font-bold mb-2">New Password (Optional)</label>
            <div class="relative">
              <input 
                v-model="editForm.newPassword" 
                :type="showEditPassword ? 'text' : 'password'" 
                class="w-full p-3 pr-12 border rounded-lg" 
                placeholder="Enter new password"
              />
              <button
                type="button"
                @click="showEditPassword = !showEditPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <svg v-if="!showEditPassword" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              </button>
            </div>
          </div>
          
          <div class="mt-3">
            <label class="block text-gray-700 font-bold mb-2">Confirm New Password</label>
            <div class="relative">
              <input 
                v-model="editForm.confirmPassword" 
                :type="showEditConfirmPassword ? 'text' : 'password'" 
                class="w-full p-3 pr-12 border rounded-lg" 
                placeholder="Confirm new password"
              />
              <button
                type="button"
                @click="showEditConfirmPassword = !showEditConfirmPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <svg v-if="!showEditConfirmPassword" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div class="flex gap-4">
          <button @click="isEditModalOpen = false" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
          <button @click="requestRFIDConfirmation('confirmEditProfile')" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-2xl">Save</button>
        </div>
      </div>
    </Modal>

    <Modal :is-open="isAddModalOpen" title="Add New Customer" @close="isAddModalOpen = false">
      <div class="space-y-4" v-if="newCustomerForm">
        <div>
          <label class="block text-gray-700 font-bold mb-2">RFID*</label>
          <input v-model="newCustomerForm.rfid" type="text" class="w-full p-3 border rounded-lg" placeholder="Scan or enter RFID" />
        </div>
        <div>
          <label class="block text-gray-700 font-bold mb-2">Full Name*</label>
          <input v-model="newCustomerForm.fullName" type="text" class="w-full p-3 border rounded-lg" />
        </div>
        <div>
          <label class="block text-gray-700 font-bold mb-2">Username*</label>
          <input v-model="newCustomerForm.username" type="text" class="w-full p-3 border rounded-lg" />
        </div>
        <div>
          <label class="block text-gray-700 font-bold mb-2">Password*</label>
          <input v-model="newCustomerForm.password" type="password" class="w-full p-3 border rounded-lg" />
        </div>
        <div>
          <label class="block text-gray-700 font-bold mb-2">Birthday*</label>
          <input v-model="newCustomerForm.birthday" type="date" class="w-full p-3 border rounded-lg" />
        </div>
        <div>
          <label class="block text-gray-700 font-bold mb-2">Initial Balance</label>
          <input v-model="newCustomerForm.balance" type="number" class="w-full p-3 border rounded-lg" placeholder="0.00" />
        </div>
        <div>
          <label class="block text-gray-700 font-bold mb-2">Status</label>
          <select v-model="newCustomerForm.status" class="w-full p-3 border rounded-lg">
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
        <div class="flex gap-4">
          <button @click="isAddModalOpen = false" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
          <button @click="addCustomer" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-2xl">Add Customer</button>
        </div>
      </div>
    </Modal>

    <Modal :is-open="isTransactionsModalOpen" title="Customer Transactions" @close="isTransactionsModalOpen = false" size="lg">
      <div class="mb-4">
        <div class="flex justify-between items-center mb-3">
          <p>Transaction history for {{ selectedCustomer?.fullName }}</p>
          <button @click="exportCustomerTransactionsPDF" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-xl">
            <font-awesome-icon icon="file-pdf" class="mr-2" />
            Export PDF
          </button>
        </div>
        <div class="mb-3">
          <label class="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
          <select v-model="transactionTypeFilter" class="w-full p-2 rounded-xl border border-gray-300">
            <option value="all">All Types</option>
            <option value="Cash-in">Cash-In</option>
            <option value="Cash-out">Cash-Out</option>
            <option value="Balance Inquiry">Balance Inquiry</option>
            <option value="Purchased">Purchased</option>
            <option value="Refund">Refund</option>
            <option value="Voided">Voided</option>
          </select>
        </div>
      </div>
      <div v-if="transactions.length === 0" class="text-center py-8 text-gray-500">
        <p>No transactions found.</p>
      </div>
      <div v-else>
        <div class="overflow-x-auto">
          <table class="min-w-full bg-white border">
            <thead class="bg-gray-200">
              <tr>
                <th @click="sortTransactions('createdAt')" class="py-2 px-4 border-b text-left cursor-pointer hover:bg-gray-300">
                  <div class="flex items-center gap-1">
                    Date & Time
                    <span v-if="transactionSortColumn === 'createdAt'">{{ transactionSortDirection === 'asc' ? '↑' : '↓' }}</span>
                  </div>
                </th>
                <th @click="sortTransactions('transactionType')" class="py-2 px-4 border-b text-left cursor-pointer hover:bg-gray-300">
                  <div class="flex items-center gap-1">
                    Type
                    <span v-if="transactionSortColumn === 'transactionType'">{{ transactionSortDirection === 'asc' ? '↑' : '↓' }}</span>
                  </div>
                </th>
                <th @click="sortTransactions('amount')" class="py-2 px-4 border-b text-right cursor-pointer hover:bg-gray-300">
                  <div class="flex items-center gap-1">
                    Amount
                    <span v-if="transactionSortColumn === 'amount'">{{ transactionSortDirection === 'asc' ? '↑' : '↓' }}</span>
                  </div>
                </th>
                <th @click="sortTransactions('balanceBefore')" class="py-2 px-4 border-b text-right cursor-pointer hover:bg-gray-300">
                  <div class="flex items-center gap-1">
                    Balance Before
                    <span v-if="transactionSortColumn === 'balanceBefore'">{{ transactionSortDirection === 'asc' ? '↑' : '↓' }}</span>
                  </div>
                </th>
                <th @click="sortTransactions('balanceAfter')" class="py-2 px-4 border-b text-right cursor-pointer hover:bg-gray-300">
                  <div class="flex items-center gap-1">
                    Balance After
                    <span v-if="transactionSortColumn === 'balanceAfter'">{{ transactionSortDirection === 'asc' ? '↑' : '↓' }}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tx in paginatedTransactions" :key="tx._id" class="hover:bg-gray-50">
                <td class="py-2 px-4 border-b text-sm">{{ formatTransactionDateTime(tx.createdAt) }}</td>
                <td class="py-2 px-4 border-b">
                  <span 
                    :class="{
                      'text-green-600 font-semibold': tx.transactionType === 'Cash-in' || tx.transactionType === 'Refund',
                      'text-red-600 font-semibold': tx.transactionType === 'Cash-out' || tx.transactionType === 'Purchased',
                      'text-blue-600 font-semibold': tx.transactionType === 'Balance Inquiry',
                      'text-gray-600 font-semibold': tx.transactionType === 'Voided'
                    }"
                  >
                    {{ tx.transactionType }}
                  </span>
                </td>
                <td class="py-2 px-4 border-b text-right">
                  <span 
                    v-if="tx.transactionType === 'Balance Inquiry'"
                    class="text-gray-500"
                  >
                    -
                  </span>
                  <span 
                    v-else-if="tx.transactionType === 'Voided'"
                    class="text-gray-600 font-semibold"
                  >
                    {{ tx.amount >= 0 ? '+' : '-' }}₱{{ Math.abs(tx.amount).toFixed(2) }}
                  </span>
                  <span 
                    v-else
                    :class="{
                      'text-green-600 font-semibold': tx.transactionType === 'Cash-in' || tx.transactionType === 'Refund',
                      'text-red-600 font-semibold': tx.transactionType === 'Cash-out' || tx.transactionType === 'Purchased'
                    }"
                  >
                    {{ (tx.transactionType === 'Cash-in' || tx.transactionType === 'Refund') ? '+' : '-' }}₱{{ tx.amount.toFixed(2) }}
                  </span>
                </td>
                <td class="py-2 px-4 border-b text-right">
                  <span v-if="tx.balanceBefore !== undefined && tx.balanceBefore !== null">₱{{ tx.balanceBefore.toFixed(2) }}</span>
                  <span v-else class="text-gray-500">-</span>
                </td>
                <td class="py-2 px-4 border-b text-right font-semibold">
                  <span v-if="tx.balanceAfter !== undefined && tx.balanceAfter !== null">₱{{ tx.balanceAfter.toFixed(2) }}</span>
                  <span v-else class="text-gray-500">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination Controls -->
        <div class="flex justify-between items-center px-4 py-3 bg-gray-50 border-t mt-4">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-700">Show</span>
            <select v-model.number="transactionItemsPerPage" class="border border-gray-300 rounded px-2 py-1 text-sm">
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
            </select>
            <span class="text-sm text-gray-700">entries</span>
          </div>
          <div class="flex items-center gap-2">
            <button 
              @click="transactionCurrentPage = 1" 
              :disabled="transactionCurrentPage === 1"
              class="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-sm"
            >
              First
            </button>
            <button 
              @click="transactionCurrentPage--" 
              :disabled="transactionCurrentPage === 1"
              class="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-sm"
            >
              Previous
            </button>
            <span class="text-sm text-gray-700">
              Page {{ transactionCurrentPage }} of {{ transactionTotalPages }}
            </span>
            <button 
              @click="transactionCurrentPage++" 
              :disabled="transactionCurrentPage === transactionTotalPages"
              class="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-sm"
            >
              Next
            </button>
            <button 
              @click="transactionCurrentPage = transactionTotalPages" 
              :disabled="transactionCurrentPage === transactionTotalPages"
              class="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-sm"
            >
              Last
            </button>
          </div>
        </div>
      </div>
      <button @click="isTransactionsModalOpen = false" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-2xl mt-4">Close</button>
    </Modal>

    <Modal :is-open="isLogoutModalOpen" title="Confirm Logout" @close="isLogoutModalOpen = false">
      <p class="mb-4">Are you sure you want to logout?</p>
      <div class="flex gap-4">
        <button @click="isLogoutModalOpen = false" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
        <button @click="confirmLogout" class="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-2xl">Logout</button>
      </div>
    </Modal>

    <!-- RFID Confirmation Modal -->
    <Modal :is-open="isRFIDConfirmModalOpen" title="RFID Confirmation Required" @close="cancelRFIDConfirmation">
      <div class="space-y-4">
        <div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
          <div class="flex items-center gap-3 mb-3">
            <font-awesome-icon icon="shield-alt" class="text-yellow-600 text-2xl" />
            <h3 class="text-lg font-bold text-yellow-800">Security Verification</h3>
          </div>
          <p class="text-gray-700 mb-2">For security purposes, please verify the customer's identity:</p>
          <p class="font-bold text-lg text-gray-800">{{ getActionTitle(pendingAction) }}</p>
        </div>
        
        <div>
          <label class="block text-gray-700 font-bold mb-2">Scan RFID Card</label>
          <input 
            ref="rfidConfirmInput"
            v-model="rfidConfirmValue" 
            @keyup.enter="verifyRFIDConfirmation" 
            type="text" 
            placeholder="Tap RFID card to confirm..."
            class="w-full p-3 border-2 border-yellow-300 rounded-lg focus:outline-none focus:border-yellow-500" 
            :disabled="!!passwordVerifyForm.username || !!passwordVerifyForm.password"
          />
        </div>
        
        <div class="text-center text-gray-500 text-sm">- OR -</div>
        
        <div>
          <label class="block text-gray-700 font-bold mb-2">Customer Password</label>
          <div class="relative">
            <input 
              v-model="passwordVerifyForm.password" 
              :type="showVerifyPassword ? 'text' : 'password'" 
              placeholder="Enter customer password"
              @keyup.enter="verifyPasswordConfirmation"
              class="w-full p-3 pr-12 border-2 border-yellow-300 rounded-lg focus:outline-none focus:border-yellow-500" 
              :disabled="!!rfidConfirmValue"
            />
            <button
              type="button"
              @click="showVerifyPassword = !showVerifyPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              :disabled="!!rfidConfirmValue"
            >
              <svg v-if="!showVerifyPassword" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            </button>
          </div>
        </div>
        
        <div v-if="rfidConfirmError" class="bg-red-50 border-2 border-red-300 rounded-lg p-3">
          <p class="text-red-600 font-bold">{{ rfidConfirmError }}</p>
        </div>
        
        <div class="flex gap-4">
          <button @click="cancelRFIDConfirmation" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
          <button @click="handleVerification" class="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-2xl">Verify</button>
        </div>
      </div>
    </Modal>

    <!-- Balance Modal -->
    <Modal :is-open="isBalanceModalOpen" title="Customer Balance" @close="isBalanceModalOpen = false">
      <div class="text-center py-6">
        <p class="text-lg font-bold mb-2">{{ selectedCustomer?.fullName }}</p>
        <p class="text-3xl font-bold text-green-600">₱{{ selectedCustomer?.balance.toFixed(2) }}</p>
      </div>
      <div class="flex gap-4 mt-4">
        <button @click="printThermalReceipt({ transactionType: 'Balance Inquiry', amount: 0, previousBalance: selectedCustomer?.balance, currentBalance: selectedCustomer?.balance, customerName: selectedCustomer?.fullName, date: new Date() }, selectedPrinter)" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-2xl flex items-center justify-center gap-2">
          <font-awesome-icon icon="print" />
          Print
        </button>
        <button @click="isBalanceModalOpen = false" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-2xl">Close</button>
      </div>
    </Modal>

    <!-- Status Change Confirmation Modal -->
    <Modal :is-open="isStatusModalOpen" title="Confirm Status Change" @close="isStatusModalOpen = false">
      <p class="mb-4">Are you sure you want to {{ customerToChangeStatus?.status === 'active' ? 'disable' : 'activate' }} this customer?</p>
      <p class="text-sm text-gray-600 mb-4">Customer: <strong>{{ customerToChangeStatus?.fullName }}</strong></p>
      <div class="flex gap-4">
        <button @click="isStatusModalOpen = false" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
        <button @click="confirmStatusChange" class="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-2xl">Confirm</button>
      </div>
    </Modal>

    <!-- Settings Modal -->
    <Modal :is-open="isSettingsModalOpen" title="Settings" @close="isSettingsModalOpen = false" size="lg">
      <div class="space-y-6">
        <!-- Printer Settings Section -->
        <div class="border-b pb-4">
          <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
            <font-awesome-icon icon="print" class="text-blue-600" />
            Thermal Printer Settings
          </h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold mb-2">Select Printer</label>
              <div class="flex gap-2">
                <select 
                  v-model="selectedPrinter" 
                  class="flex-1 p-2 border rounded-lg"
                >
                  <option :value="null">Auto-detect</option>
                  <option v-for="printer in availablePrinters" :key="printer.name" :value="printer.name">
                    {{ printer.name }} {{ printer.isDefault ? '(Default)' : '' }}
                  </option>
                </select>
                <button 
                  @click="refreshPrinters" 
                  class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
                >
                  <font-awesome-icon icon="sync-alt" :class="{ 'animate-spin': isRefreshingPrinters }" />
                  Refresh
                </button>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-semibold mb-2">Print Mode</label>
              <div class="space-y-2">
                <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50" :class="{ 'border-blue-500 bg-blue-50': printMode === 'auto' }">
                  <input type="radio" v-model="printMode" value="auto" class="mr-3" />
                  <div>
                    <div class="font-semibold">Automatic</div>
                    <div class="text-sm text-gray-600">Print receipt immediately without confirmation</div>
                  </div>
                </label>
                
                <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50" :class="{ 'border-blue-500 bg-blue-50': printMode === 'manual' }">
                  <input type="radio" v-model="printMode" value="manual" class="mr-3" />
                  <div>
                    <div class="font-semibold">Manual (Recommended)</div>
                    <div class="text-sm text-gray-600">Show confirmation dialog before printing</div>
                  </div>
                </label>
                
                <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50" :class="{ 'border-blue-500 bg-blue-50': printMode === 'off' }">
                  <input type="radio" v-model="printMode" value="off" class="mr-3" />
                  <div>
                    <div class="font-semibold">Disabled</div>
                    <div class="text-sm text-gray-600">Do not print receipts</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="flex gap-4 mt-6">
        <button @click="isSettingsModalOpen = false" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
        <button @click="saveSettings" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-2xl">Save Settings</button>
      </div>
    </Modal>

    <!-- Print Confirmation Modal -->
    <Modal :is-open="isPrintConfirmModalOpen" title="Print Receipt" @close="cancelPrint">
      <div class="text-center py-4">
        <div class="mb-4">
          <svg class="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-800 mb-2">Transaction Successful!</h3>
        <p class="text-gray-600 mb-4">Would you like to print a receipt?</p>
        <div v-if="pendingPrintTransaction" class="bg-gray-50 rounded-lg p-4 mb-4 text-left">
          <div class="text-sm space-y-1">
            <p><span class="font-semibold">Type:</span> {{ pendingPrintTransaction.transactionType }}</p>
            <p><span class="font-semibold">Amount:</span> ₱{{ pendingPrintTransaction.amount?.toFixed(2) }}</p>
            <p><span class="font-semibold">Customer:</span> {{ pendingPrintTransaction.customerName }}</p>
          </div>
        </div>
      </div>
      <div class="flex gap-4">
        <button @click="cancelPrint" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Skip</button>
        <button @click="confirmPrint" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-2xl flex items-center justify-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
          </svg>
          Print Receipt
        </button>
      </div>
    </Modal>

    <!-- Print Confirmation Modal -->
    <Modal :is-open="isPrintConfirmModalOpen" title="Print Receipt" @close="cancelPrint">
      <div class="text-center py-4">
        <div class="mb-4">
          <svg class="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-800 mb-2">Transaction Successful!</h3>
        <p class="text-gray-600 mb-4">Would you like to print a receipt?</p>
        <div v-if="pendingPrintTransaction" class="bg-gray-50 rounded-lg p-4 mb-4 text-left">
          <div class="text-sm space-y-1">
            <p><span class="font-semibold">Type:</span> {{ pendingPrintTransaction.transactionType }}</p>
            <p><span class="font-semibold">Amount:</span> ₱{{ pendingPrintTransaction.amount?.toFixed(2) }}</p>
            <p><span class="font-semibold">Customer:</span> {{ pendingPrintTransaction.customerName }}</p>
          </div>
        </div>
      </div>
      <div class="flex gap-4">
        <button @click="cancelPrint" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Skip</button>
        <button @click="confirmPrint" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-2xl flex items-center justify-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
          </svg>
          Print Receipt
        </button>
      </div>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal :is-open="isDeleteModalOpen" title="Confirm Delete" @close="cancelDeleteCustomer">
      <div class="text-center py-4">
        <div class="mb-4">
          <svg class="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </div>
        <p class="text-lg text-gray-700 mb-2">Are you sure you want to delete this customer?</p>
        <p class="text-sm text-gray-500">This action cannot be undone.</p>
      </div>
      <div class="flex gap-4 mt-6">
        <button @click="cancelDeleteCustomer" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
        <button @click="confirmDeleteCustomer" class="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-2xl">Delete</button>
      </div>
    </Modal>

    <!-- Toast Notification Component -->
    <Toast ref="toastRef" />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import Modal from '../../components/Modal.vue'
import Toast from '../../components/Toast.vue'
import { api } from '@/utils/api'
import { auth } from '@/utils/auth'
import { printThermalReceipt, getAvailablePrinters } from '../../utils/printReceipt.js'

const router = useRouter()

const rfidInput = ref(null)
const rfidValue = ref('')
const selectedCustomer = ref(null)
const customers = ref([])
const transactions = ref([])
const isMenuOpen = ref(false)
const isCashInModalOpen = ref(false)
const isCashOutModalOpen = ref(false)
const isEditModalOpen = ref(false)
const isAddModalOpen = ref(false)
const isTransactionsModalOpen = ref(false)
const isLogoutModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const customerToDelete = ref(null)
const isRFIDConfirmModalOpen = ref(false)
const rfidConfirmInput = ref(null)
const rfidConfirmValue = ref('')
const rfidConfirmError = ref('')
const pendingAction = ref('')
const cashInAmount = ref('')
const cashOutAmount = ref('')
const editForm = ref(null)
const newCustomerForm = ref({
  rfid: '',
  fullName: '',
  username: '',
  password: '',
  birthday: '',
  balance: 0,
  status: 'active'
})
const isBalanceModalOpen = ref(false)
const customerSearchQuery = ref('')
const sortColumn = ref('')
const sortDirection = ref('asc')
const isStatusModalOpen = ref(false)
const customerToChangeStatus = ref(null)
const passwordVerifyForm = ref({
  password: ''
})
const showVerifyPassword = ref(false)
const showEditPassword = ref(false)
const showEditConfirmPassword = ref(false)
const lastTransaction = ref(null)
const availablePrinters = ref([])
const selectedPrinter = ref(null)
const isRefreshingPrinters = ref(false)
const isPrintConfirmModalOpen = ref(false)
const pendingPrintTransaction = ref(null)
const isSettingsModalOpen = ref(false)
const printMode = ref('manual')
const transactionSortColumn = ref('createdAt')
const transactionSortDirection = ref('desc')
const transactionCurrentPage = ref(1)
const transactionItemsPerPage = ref(10)
const transactionTypeFilter = ref('all')

const toastRef = ref(null)

const showToast = (message, type = 'info', title = '') => {
  if (toastRef.value) {
    toastRef.value.addToast(message, type, title)
  }
}

const sortedCustomers = computed(() => {
  let sorted = [...customers.value]
  
  if (!sortColumn.value) return sorted
  
  return sorted.sort((a, b) => {
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
  const query = customerSearchQuery.value.toLowerCase().trim()
  if (!query) return sortedCustomers.value
  
  return sortedCustomers.value.filter(customer => {
    return (
      customer.fullName?.toLowerCase().includes(query) ||
      customer.username?.toLowerCase().includes(query)
    )
  })
})

const sortedTransactions = computed(() => {
  if (!transactions.value || transactions.value.length === 0) return []
  
  let filtered = transactions.value
  
  // Apply transaction type filter
  if (transactionTypeFilter.value !== 'all') {
    filtered = filtered.filter(tx => tx.transactionType === transactionTypeFilter.value)
  }
  
  const sorted = [...filtered].sort((a, b) => {
    let aVal = a[transactionSortColumn.value]
    let bVal = b[transactionSortColumn.value]
    
    if (transactionSortColumn.value === 'createdAt') {
      aVal = new Date(aVal).getTime()
      bVal = new Date(bVal).getTime()
    }
    
    if (aVal === null || aVal === undefined) aVal = ''
    if (bVal === null || bVal === undefined) bVal = ''
    
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }
    
    if (transactionSortDirection.value === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
    }
  })
  
  return sorted
})

const transactionTotalPages = computed(() => {
  return Math.ceil(sortedTransactions.value.length / transactionItemsPerPage.value)
})

const paginatedTransactions = computed(() => {
  const start = (transactionCurrentPage.value - 1) * transactionItemsPerPage.value
  const end = start + transactionItemsPerPage.value
  return sortedTransactions.value.slice(start, end)
})

const sortTable = (column) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

const sortTransactions = (column) => {
  if (transactionSortColumn.value === column) {
    transactionSortDirection.value = transactionSortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    transactionSortColumn.value = column
    transactionSortDirection.value = column === 'createdAt' ? 'desc' : 'asc'
  }
  transactionCurrentPage.value = 1
}

const toggleCustomerStatus = async (customer) => {
  customerToChangeStatus.value = customer
  isStatusModalOpen.value = true
}

const confirmStatusChange = async () => {
  const customer = customerToChangeStatus.value
  const newStatus = customer.status === 'active' ? 'disabled' : 'active'
  
  try {
    const response = await api.put(`/customers/${customer._id}`, {
      status: newStatus
    })
    
    if (response.data.success) {
      customer.status = newStatus
      showToast(`Customer ${newStatus === 'active' ? 'activated' : 'disabled'} successfully`, 'success')
      
      // Update selected customer if it's the same one
      if (selectedCustomer.value && selectedCustomer.value._id === customer._id) {
        selectedCustomer.value.status = newStatus
      }
    }
  } catch (error) {
    showToast('Failed to update customer status', 'error')
  } finally {
    isStatusModalOpen.value = false
    customerToChangeStatus.value = null
  }
}

const fetchCustomers = async () => {
  try {
    const response = await api.get('/customers')
    if (response.data.success) {
      customers.value = response.data.customers
    }
  } catch (error) {
    showToast('Failed to fetch customers', 'error')
  }
}

const fetchTransactions = async () => {
  if (!selectedCustomer.value) return
  try {
    const response = await api.get(`/customer-transactions/${selectedCustomer.value.rfid}`)
    if (response.data.success) {
      transactions.value = response.data.transactions
      transactionCurrentPage.value = 1
      transactionSortColumn.value = 'createdAt'
      transactionSortDirection.value = 'desc'
    } else {
      transactions.value = []
    }
  } catch (e) {
    transactions.value = []
  }
}

const handleRFIDScanned = async () => {
  const rfid = rfidValue.value.trim()
  if (!rfid) return

  try {
    const response = await api.get(`/customers/rfid/${rfid}`)
    if (response.data.success) {
      selectedCustomer.value = response.data.customer
      rfidValue.value = ''
    } else {
      showToast('Customer not found', 'error')
      rfidValue.value = ''
    }
  } catch (error) {
    showToast('Customer not found with this RFID', 'error')
    rfidValue.value = ''
  }
}

const searchCustomer = () => {
  handleRFIDScanned()
}

const selectCustomerById = async (customerId) => {
  try {
    const response = await api.get(`/customers/${customerId}`)
    if (response.data.success) {
      selectedCustomer.value = response.data.customer
    }
  } catch (error) {
    showToast('Failed to fetch customer', 'error')
  }
}

const clearCustomer = () => {
  selectedCustomer.value = null
  rfidValue.value = ''
  passwordVerifyForm.value.password = ''
  showVerifyPassword.value = false
}

const requestRFIDConfirmation = (action) => {
  pendingAction.value = action
  rfidConfirmValue.value = ''
  rfidConfirmError.value = ''
  isRFIDConfirmModalOpen.value = true
  nextTick(() => {
    if (rfidConfirmInput.value) {
      rfidConfirmInput.value.focus()
    }
  })
}

const verifyRFIDConfirmation = async () => {
  const scannedRFID = rfidConfirmValue.value.trim()
  if (!scannedRFID) {
    rfidConfirmError.value = 'Please scan the RFID card'
    return
  }
  if (scannedRFID !== selectedCustomer.value.rfid) {
    rfidConfirmError.value = 'RFID does not match! Please scan the correct customer card.'
    rfidConfirmValue.value = ''
    return
  }
  // RFID verified, proceed with the action
  await proceedWithAction()
}

const cancelRFIDConfirmation = () => {
  isRFIDConfirmModalOpen.value = false
  rfidConfirmValue.value = ''
  rfidConfirmError.value = ''
  pendingAction.value = ''
  passwordVerifyForm.value.password = ''
  showVerifyPassword.value = false
}

const verifyPasswordConfirmation = async () => {
  const password = passwordVerifyForm.value.password
  
  if (!password) {
    rfidConfirmError.value = 'Please enter password'
    return
  }

  try {
    // Verify password using the selected customer's username
    const loginResponse = await api.post('/customers/login', {
      username: selectedCustomer.value.username,
      password: password
    })

    if (loginResponse.data.success) {
      // Password verified, proceed with the action
      await proceedWithAction()
    }
  } catch (error) {
    rfidConfirmError.value = error.response?.data?.message || 'Invalid password'
    passwordVerifyForm.value.password = ''
  }
}

const handleVerification = async () => {
  // Check if using RFID or password verification
  if (rfidConfirmValue.value.trim()) {
    await verifyRFIDConfirmation()
  } else if (passwordVerifyForm.value.password) {
    await verifyPasswordConfirmation()
  } else {
    rfidConfirmError.value = 'Please scan RFID or enter password'
  }
}

const proceedWithAction = async () => {
  isRFIDConfirmModalOpen.value = false
  rfidConfirmValue.value = ''
  rfidConfirmError.value = ''
  passwordVerifyForm.value.password = ''
  showVerifyPassword.value = false
  
  switch (pendingAction.value) {
    case 'cashOut':
      openCashOutModal()
      break
    case 'editProfile':
      openEditCustomerModal()
      break
    case 'viewTransactions':
      openTransactionsModal()
      break
    case 'confirmCashIn':
      await processCashIn()
      break
    case 'confirmCashOut':
      await processCashOut()
      break
    case 'confirmEditProfile':
      await saveCustomer()
      break
    case 'viewBalance':
      isBalanceModalOpen.value = true
      await logTransaction('Balance Inquiry', 0)
      break
  }
  pendingAction.value = ''
}

const getActionTitle = (action) => {
  const titles = {
    'cashOut': 'Withdraw - Remove Funds',
    'editProfile': 'Edit Customer Profile',
    'viewTransactions': 'View Transaction History',
    'confirmCashIn': 'Cash In - Add Funds',
    'confirmCashOut': 'Withdraw - Remove Funds',
    'confirmEditProfile': 'Confirm Profile Update',
    'viewBalance': 'View Customer Balance'
  }
  return titles[action] || ''
}

const openCashInModal = () => {
  cashInAmount.value = ''
  isCashInModalOpen.value = true
}

const openCashOutModal = () => {
  cashOutAmount.value = ''
  isCashOutModalOpen.value = true
}

const logTransaction = async (type, amount = 0) => {
  if (!selectedCustomer.value) return
  try {
    await api.post('/customer-transactions', {
      rfid: selectedCustomer.value.rfid,
      username: selectedCustomer.value.username,
      amount,
      transactionType: type
    })
  } catch (e) {
    // Optionally show a toast for logging error, but usually silent
  }
}

const processCashIn = async () => {
  const amount = parseFloat(cashInAmount.value)
  if (!amount || amount <= 0) {
    showToast('Please enter a valid amount', 'warning')
    return
  }

  try {
    const newBalance = selectedCustomer.value.balance + amount
    const response = await api.put(`/customers/${selectedCustomer.value._id}/balance`, {
      amount: newBalance
    })
    
    if (response.data.success) {
      const previousBalance = selectedCustomer.value.balance
      selectedCustomer.value.balance = newBalance
      lastTransaction.value = {
        type: 'CASH-IN',
        amount: amount,
        previousBalance: previousBalance,
        newBalance: newBalance,
        customerName: selectedCustomer.value.fullName,
        date: new Date()
      }
      showToast(`Successfully added ₱${amount.toFixed(2)} to customer's balance`, 'success')
      isCashInModalOpen.value = false
      await fetchCustomers()
      await logTransaction('Cash-in', amount)
      
      // Handle printing based on print mode
      const transactionData = {
        transactionType: 'CASH-IN',
        amount: amount,
        previousBalance: previousBalance,
        currentBalance: newBalance,
        customerName: selectedCustomer.value.fullName,
        date: new Date()
      }
      
      if (printMode.value === 'auto') {
        // Auto print immediately
        printThermalReceipt(transactionData, selectedPrinter.value)
      } else if (printMode.value === 'manual') {
        // Show confirmation modal
        pendingPrintTransaction.value = transactionData
        isPrintConfirmModalOpen.value = true
      }
      // If printMode is 'off', do nothing
    }
  } catch (error) {
    showToast('Failed to update balance', 'error')
  }
}

const processCashOut = async () => {
  const amount = parseFloat(cashOutAmount.value)
  if (!amount || amount <= 0) {
    showToast('Please enter a valid amount', 'warning')
    return
  }
  if (amount > selectedCustomer.value.balance) {
    showToast('Insufficient balance', 'error')
    return
  }
  try {
    const newBalance = selectedCustomer.value.balance - amount
    const response = await api.put(`/customers/${selectedCustomer.value._id}/balance`, {
      amount: newBalance
    })
    if (response.data.success) {
      const previousBalance = selectedCustomer.value.balance
      selectedCustomer.value.balance = newBalance
      lastTransaction.value = {
        type: 'CASH-OUT / WITHDRAW',
        amount: amount,
        previousBalance: previousBalance,
        newBalance: newBalance,
        customerName: selectedCustomer.value.fullName,
        date: new Date()
      }
      showToast(`Successfully withdrew ₱${amount.toFixed(2)} from customer's balance`, 'success')
      isCashOutModalOpen.value = false
      await fetchCustomers()
      await logTransaction('Cash-out', amount)
      
      // Handle printing based on print mode
      const transactionData = {
        transactionType: 'CASH-OUT / WITHDRAW',
        amount: amount,
        previousBalance: previousBalance,
        currentBalance: newBalance,
        customerName: selectedCustomer.value.fullName,
        date: new Date()
      }
      
      if (printMode.value === 'auto') {
        // Auto print immediately
        printThermalReceipt(transactionData, selectedPrinter.value)
      } else if (printMode.value === 'manual') {
        // Show confirmation modal
        pendingPrintTransaction.value = transactionData
        isPrintConfirmModalOpen.value = true
      }
      // If printMode is 'off', do nothing
    }
  } catch (error) {
    showToast('Failed to update balance', 'error')
  }
}

const openEditCustomerModal = () => {
  editForm.value = {
    fullName: selectedCustomer.value.fullName,
    username: selectedCustomer.value.username,
    birthday: selectedCustomer.value.birthday.split('T')[0],
    status: selectedCustomer.value.status || 'active',
    newRfid: '',
    newPassword: '',
    confirmPassword: ''
  }
  showEditPassword.value = false
  showEditConfirmPassword.value = false
  isEditModalOpen.value = true
}

const saveCustomer = async () => {
  // Validate password confirmation if new password is provided
  if (editForm.value.newPassword || editForm.value.confirmPassword) {
    if (editForm.value.newPassword !== editForm.value.confirmPassword) {
      showToast('Passwords do not match', 'warning')
      return
    }
  }
  
  try {
    // Build update payload with only changed fields
    const updateData = {
      fullName: editForm.value.fullName,
      username: editForm.value.username,
      birthday: editForm.value.birthday,
      status: editForm.value.status
    }
    
    // Only include new RFID if provided
    if (editForm.value.newRfid && editForm.value.newRfid.trim()) {
      updateData.rfid = editForm.value.newRfid.trim()
    }
    
    // Only include new password if provided
    if (editForm.value.newPassword) {
      updateData.password = editForm.value.newPassword
    }
    
    const response = await api.put(`/customers/${selectedCustomer.value._id}`, updateData)
    if (response.data.success) {
      selectedCustomer.value = response.data.customer
      showToast('Customer updated successfully', 'success')
      isEditModalOpen.value = false
      await fetchCustomers()
    }
  } catch (error) {
    showToast(error.response?.data?.message || 'Failed to update customer', 'error')
  }
}

const openAddCustomerModal = () => {
  newCustomerForm.value = {
    rfid: '',
    fullName: '',
    username: '',
    password: '',
    birthday: '',
    balance: 0,
    status: 'active'
  }
  isAddModalOpen.value = true
}

const addCustomer = async () => {
  if (!newCustomerForm.value.rfid || !newCustomerForm.value.fullName || 
      !newCustomerForm.value.username || !newCustomerForm.value.password || 
      !newCustomerForm.value.birthday) {
    showToast('Please fill in all required fields', 'warning')
    return
  }

  try {
    const response = await api.post('/customers', newCustomerForm.value)
    if (response.data.success) {
      showToast('Customer added successfully', 'success')
      isAddModalOpen.value = false
      await fetchCustomers()
    }
  } catch (error) {
    showToast(error.response?.data?.message || 'Failed to add customer', 'error')
  }
}

const deleteCustomer = (customerId) => {
  customerToDelete.value = customerId
  isDeleteModalOpen.value = true
}

const confirmDeleteCustomer = async () => {
  if (!customerToDelete.value) return

  try {
    const response = await api.delete(`/customers/${customerToDelete.value}`)
    if (response.data.success) {
      showToast('Customer deleted successfully', 'success')
      if (selectedCustomer.value?._id === customerToDelete.value) {
        selectedCustomer.value = null
      }
      await fetchCustomers()
    }
  } catch (error) {
    showToast('Failed to delete customer', 'error')
  } finally {
    customerToDelete.value = null
    isDeleteModalOpen.value = false
  }
}

const cancelDeleteCustomer = () => {
  customerToDelete.value = null
  isDeleteModalOpen.value = false
}

const openTransactionsModal = async () => {
  await fetchTransactions()
  isTransactionsModalOpen.value = true
}

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const goToTransactionHistory = () => {
  isMenuOpen.value = false
  router.push('/accounting/transaction-history')
}

const openLogoutModal = () => {
  isMenuOpen.value = false
  isLogoutModalOpen.value = true
}

const openSettingsModal = () => {
  isMenuOpen.value = false
  isSettingsModalOpen.value = true
}

const saveSettings = async () => {
  try {
    const user = auth.getUser()
    if (!user || !user._id) {
      showToast('User not found', 'error')
      return
    }

    // Save to backend
    const response = await api.put(`/users/${user._id}/print-preferences`, {
      selectedPrinter: selectedPrinter.value,
      printMode: printMode.value
    })

    if (response.data.success) {
      // Also save to localStorage as backup
      localStorage.setItem('selectedPrinter', selectedPrinter.value || '')
      localStorage.setItem('printMode', printMode.value)
      
      showToast('Settings saved successfully', 'success')
      isSettingsModalOpen.value = false
    }
  } catch (error) {
    showToast('Failed to save settings', 'error')
  }
}

const confirmLogout = () => {
  localStorage.removeItem('user')
  router.push('/')
}

const confirmPrint = () => {
  if (pendingPrintTransaction.value) {
    printThermalReceipt(pendingPrintTransaction.value, selectedPrinter.value)
    isPrintConfirmModalOpen.value = false
    pendingPrintTransaction.value = null
  }
}

const cancelPrint = () => {
  isPrintConfirmModalOpen.value = false
  pendingPrintTransaction.value = null
}

const refocusRFIDInput = () => {
  nextTick(() => {
    if (rfidInput.value) {
      rfidInput.value.focus()
    }
  })
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

const formatDateTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatTransactionDateTime = (dateString) => {
  const date = new Date(dateString)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)
  const hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  
  return `${month}/${day}/${year} ${displayHours}:${minutes} ${ampm}`
}

const refreshPrinters = async () => {
  if (!window.electronAPI) {
    showToast('Printer management only available in desktop app', 'warning')
    return
  }
  
  isRefreshingPrinters.value = true
  try {
    const printersData = await getAvailablePrinters()
    availablePrinters.value = printersData.allPrinters || []
    showToast(`Found ${availablePrinters.value.length} printer(s)`, 'success')
  } catch (error) {
    showToast('Failed to refresh printers', 'error')
  } finally {
    isRefreshingPrinters.value = false
  }
}

const loadPrinterPreference = async () => {
  try {
    const user = auth.getUser()
    if (user && user._id) {
      // Try to load from backend first
      try {
        const response = await api.get(`/users/${user._id}/print-preferences`)
        if (response.data.success) {
          selectedPrinter.value = response.data.printPreferences.selectedPrinter || null
          printMode.value = response.data.printPreferences.printMode || 'manual'
        }
      } catch (error) {
        // Fallback to localStorage if backend fails
        const saved = localStorage.getItem('selectedPrinter')
        if (saved) {
          selectedPrinter.value = saved
        }
        const savedMode = localStorage.getItem('printMode')
        if (savedMode) {
          printMode.value = savedMode
        }
      }
    } else {
      // Fallback to localStorage if no user
      const saved = localStorage.getItem('selectedPrinter')
      if (saved) {
        selectedPrinter.value = saved
      }
      const savedMode = localStorage.getItem('printMode')
      if (savedMode) {
        printMode.value = savedMode
      }
    }
    
    // Load available printers if in Electron
    if (window.electronAPI) {
      await refreshPrinters()
    }
  } catch (error) {
    console.error('Failed to load printer preferences:', error)
  }
}

const exportCustomerTransactionsPDF = () => {
  if (!selectedCustomer.value || sortedTransactions.value.length === 0) {
    showToast('No transactions to export', 'warning')
    return
  }

  const printWindow = window.open('', '_blank')
  
  const typeText = transactionTypeFilter.value === 'all' ? 'All Types' : transactionTypeFilter.value
  
  const reportContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Customer Transaction History - ${selectedCustomer.value.fullName}</title>
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
        .customer-info {
          background-color: #f5f5f5;
          padding: 8px;
          border-radius: 5px;
          margin-bottom: 10px;
          font-size: 9px;
        }
        .customer-info p {
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
        .amount-positive {
          color: #10b981;
          font-weight: bold;
        }
        .amount-negative {
          color: #ef4444;
          font-weight: bold;
        }
        .amount-neutral {
          color: #3b82f6;
        }
        .text-right {
          text-align: right;
        }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <h1>Customer Transaction History</h1>
      <div class="customer-info">
        <p><strong>Customer Name:</strong> ${selectedCustomer.value.fullName}</p>
        <p><strong>Username:</strong> ${selectedCustomer.value.username}</p>
        <p><strong>Current Balance:</strong> ${selectedCustomer.value.balance.toFixed(2)}</p>
        <p><strong>Transaction Type Filter:</strong> ${typeText}</p>
        <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Total Transactions:</strong> ${sortedTransactions.value.length}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Date & Time</th>
            <th>Transaction Type</th>
            <th class="text-right">Amount</th>
            <th class="text-right">Balance Before</th>
            <th class="text-right">Balance After</th>
          </tr>
        </thead>
        <tbody>
          ${sortedTransactions.value.map(tx => {
            const isPositive = tx.transactionType === 'Cash-in' || tx.transactionType === 'Refund'
            const isNegative = tx.transactionType === 'Cash-out' || tx.transactionType === 'Purchased' || tx.transactionType === 'Voided'
            const isNeutral = tx.transactionType === 'Balance Inquiry'
            
            let amountClass = ''
            let amountDisplay = ''
            if (isNeutral) {
              amountClass = 'amount-neutral'
              amountDisplay = '-'
            } else if (isPositive) {
              amountClass = 'amount-positive'
              amountDisplay = '+' + tx.amount.toFixed(2)
            } else if (isNegative) {
              amountClass = 'amount-negative'
              amountDisplay = '-' + tx.amount.toFixed(2)
            }
            
            return `
            <tr>
              <td>${formatTransactionDateTime(tx.createdAt)}</td>
              <td class="${amountClass}">${tx.transactionType}</td>
              <td class="text-right ${amountClass}">${amountDisplay}</td>
              <td class="text-right">${tx.balanceBefore !== undefined && tx.balanceBefore !== null ? tx.balanceBefore.toFixed(2) : '-'}</td>
              <td class="text-right"><strong>${tx.balanceAfter !== undefined && tx.balanceAfter !== null ? tx.balanceAfter.toFixed(2) : '-'}</strong></td>
            </tr>
            `
          }).join('')}
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
}

onMounted(async () => {
  await fetchCustomers()
  await loadPrinterPreference()
})
</script>
