<template>
  <div class="bg-gray-100 h-screen flex flex-col" style="touch-action: manipulation;" @click="handlePageClick">
    <!-- Hidden barcode input for scanning -->
    <input 
      ref="barcodeInput" 
      v-model="barcodeValue" 
      @keyup.enter="handleBarcodeScanned" 
      @blur="handleBarcodeBlur"
      type="text" 
      class="absolute opacity-0" 
      style="position: fixed; top: -100px; left: -100px;"
      aria-hidden="true"
    />
    <header class="bg-white shadow-lg p-3">
      <div class="flex justify-between items-center">
        <div class="flex-1 flex items-center gap-2">
          <!-- Session Status Indicator -->
          <div class="flex items-center gap-2 px-3 py-1 rounded-full" :class="sessionActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
            <div class="w-2 h-2 rounded-full" :class="sessionActive ? 'bg-green-600' : 'bg-red-600'"></div>
            <span class="text-xs font-semibold">{{ sessionActive ? 'Session Active' : 'Session Inactive' }}</span>
          </div>
        </div>
        <div class="flex-1 flex justify-center">
          <img src="/posxpress-logo.png" alt="PosXpress" class="h-12" />
        </div>
        <div class="flex-1 flex justify-end items-center gap-3 relative">
          <button @click="openKeyboardModal('general')" class="bg-gray-200 hover:bg-gray-300 p-3 rounded-lg transition active:scale-95" title="On-Screen Keyboard">
            <font-awesome-icon icon="keyboard" class="text-gray-600 text-xl" />
          </button>
          <button @click="toggleFullScreen" class="bg-gray-200 hover:bg-gray-300 p-3 rounded-lg transition active:scale-95" title="Toggle Fullscreen">
            <font-awesome-icon icon="expand" class="text-gray-600 text-xl" />
          </button>
          <button @click="toggleMenu" class="text-gray font-bold py-2 px-4 border shadow">
            <font-awesome-icon :icon="isMenuOpen ? 'times' : 'bars'" class="text-xl" />
          </button>
          <!-- Popover Menu -->
          <div v-if="isMenuOpen" class="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-300 shadow-lg z-50">
            <button @click="openBalanceModal" class="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3 border-b">
              <font-awesome-icon icon="wallet" class="text-blue-500" />
              <span>Check Balance</span>
            </button>
            <button @click="openCashInModal" class="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3 border-b">
              <font-awesome-icon icon="money-bill-wave" class="text-yellow-500" />
              <span>Cash In</span>
            </button>
            <button @click="goToCustomerTransactions" class="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3 border-b">
              <font-awesome-icon icon="users" class="text-purple-500" />
              <span>Customer Transactions</span>
            </button>
            <button @click="goToTransactions" class="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3 border-b">
              <font-awesome-icon icon="receipt" class="text-blue-500" />
              <span>Transactions</span>
            </button>
            <button @click="goToSales" class="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3 border-b">
              <font-awesome-icon icon="chart-line" class="text-green-500" />
              <span>Sales Report</span>
            </button>
            <button @click="openSettingsModal" class="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3 border-b">
              <font-awesome-icon icon="cog" class="text-gray-600" />
              <span>Settings</span>
            </button>
            <button v-if="isCoAdmin" @click="goToAdminPanel" class="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3 border-b">
              <font-awesome-icon icon="user-shield" class="text-purple-500" />
              <span>Admin Panel</span>
            </button>
            <button @click="openLockConfirmModal" class="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3 border-b text-orange-600">
              <font-awesome-icon icon="lock" />
              <span>Lock POS</span>
            </button>
            <button @click="openLogoutModal" class="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3 text-red-600">
              <font-awesome-icon icon="sign-out-alt" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="flex-1 flex overflow-hidden">
      <!-- Order List (Left) -->
      <div class="w-40 sm:w-48 md:w-56 lg:w-64 xl:w-72 bg-white border-r  flex flex-col">
        <div class="flex-1 overflow-y-auto p-3">
          <div class="flex  b-2 justify-between items-center mb-3">
            <h3 class="font-bold text-lg">Order Items</h3>
            <div class="flex gap-2">
              <button @click="openBarcodeModal" class="bg-purple-500 hover:bg-purple-600 text-white font-bold py-1 px-3 text-sm flex items-center gap-1">
                <font-awesome-icon icon="barcode" />
              </button>
            </div>
          </div>
          <div v-if="barcodeError" class="mb-2 p-2 bg-red-100 border border-red-400 text-red-700 text-sm">
            {{ barcodeError }}
          </div>
          <div v-for="(item, index) in orderItems" :key="index" :class="index === orderItems.length - 1 ? 'bg-blue-100 border-blue-300' : 'bg-gray-50 border-gray-300'" class="mb-2 p-2 border">
            <div class="flex justify-between items-start mb-1">
              <div class="flex-1">
                <span class="font-semibold text-sm">{{ item.name }}</span>
                <span v-if="item.isVattable" class="ml-2 text-xs text-green-600 font-semibold">(VAT)</span>
                <!-- Display addons -->
                <div v-if="item.addons && item.addons.length > 0" class="ml-3 mt-1">
                  <div v-for="addon in item.addons" :key="addon.addonId" class="text-xs text-gray-600 italic">
                    + {{ addon.name }} (₱{{ addon.price.toFixed(2) }} x {{ addon.quantity }})
                  </div>
                </div>
              </div>
              <span class="font-bold">₱{{ (getItemPrice(item) * item.quantity).toFixed(2) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-2">
                <button @click="adjustQuantity(index, -1)" class="bg-red-500 hover:bg-red-600 text-white w-10 h-10 text-lg font-bold rounded-lg transition">−</button>
                <span class="text-lg font-semibold px-3">{{ item.quantity }}</span>
                <button @click="adjustQuantity(index, 1)" class="bg-green-500 hover:bg-green-600 text-white w-10 h-10 text-lg font-bold rounded-lg transition">+</button>
              </div>
              <button @click="removeItem(index)" class="text-red-500 hover:text-red-700" title="Remove item">
                <font-awesome-icon icon="trash" class="text-lg" />
              </button>
            </div>
          </div>
          <div v-if="orderItems.length === 0" class="text-center text-gray-500 py-6 text-sm">
            No items
          </div>
        </div>
        
        <div class="border-t p-3 bg-white">
          <div class="flex justify-between items-center text-2xl font-bold mb-2">
            <span>Total:</span>
            <span>₱{{ totalAmount.toFixed(2) }}</span>
          </div>
          <div v-if="showChange" class="flex justify-between items-center text-lg border-t pt-2">
            <span>Change:</span>
            <span class="font-bold text-purple-600">₱{{ changeAmount.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <!-- Products Grid (Center) -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Search Bar -->
        <div class="p-2 bg-white border-b">
          <input v-model="searchQuery" type="text" placeholder="Search products..." class="w-full p-3 border border-gray-300 text-lg" />
        </div>
        
        <div class="flex-1 overflow-y-auto p-2">
          <!-- Back Button (when viewing variants) -->
          <div v-if="viewingVariants" class="mb-2 flex justify-end">
            <button @click="backToProducts" class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 text-sm">
              ← Back to Products
            </button>
          </div>
          
          <!-- Products View -->
          <div v-if="!viewingVariants" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          <!-- Loading state -->
          <div v-if="isLoading" class="col-span-full text-center py-12 text-gray-500">
            Loading products...
          </div>
          <!-- No products found -->
          <div v-else-if="filteredProducts.length === 0" class="col-span-full text-center py-12 text-gray-500">
            No products found
          </div>
          <!-- Product buttons -->
          <button 
            v-else
            v-for="product in filteredProducts" 
            :key="product._id" 
            @click="handleProductClick(product)" 
            class="relative font-bold p-2 flex flex-col items-center justify-center aspect-square bg-green-500 hover:bg-green-600 text-white overflow-hidden"
          >
            <!-- Stock indicator at top left -->
            <div v-if="getStockStatus(product) !== 'ok'" class="absolute top-1 left-1">
              <span v-if="getStockStatus(product) === 'out'" class="bg-red-600 text-white text-xs px-2 py-1 font-bold">SOLD OUT</span>
              <span v-else-if="getStockStatus(product) === 'low'" class="bg-yellow-500 text-white text-xs px-2 py-1 font-bold">LOW</span>
            </div>
            
            <span class="text-lg sm:text-xl md:text-xl lg:text-2xl xl:text-2xl text-center font-bold leading-tight line-clamp-3 px-1">{{ product.name }}</span>
            
            <!-- Show stock count only if product has no variants - bottom right -->
            <span v-if="!productsWithVariants.has(String(product._id))" class="absolute bottom-1 right-2 text-xs sm:text-xs md:text-sm font-semibold bg-black bg-opacity-40 px-1.5 py-0.5 rounded">{{ product.quantity || 0 }}</span>
          </button>
        </div>
        
        <!-- Variants View -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          <button 
            v-for="variant in selectedProductVariants" 
            :key="variant._id" 
            @click="addVariantToOrder(variant)"
            :disabled="getVariantStockStatus(variant) === 'out'"
            :class="[
              'relative font-bold p-2 flex flex-col items-center justify-center aspect-square overflow-hidden',
              getVariantStockStatus(variant) === 'out' ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'
            ]"
          >
            <!-- Variant stock indicator at top left -->
            <div v-if="getVariantStockStatus(variant) !== 'ok'" class="absolute top-1 left-1">
              <span v-if="getVariantStockStatus(variant) === 'out'" class="bg-red-600 text-white text-xs px-2 py-1 font-bold">SOLD OUT</span>
              <span v-else-if="getVariantStockStatus(variant) === 'low'" class="bg-yellow-500 text-white text-xs px-2 py-1 font-bold">LOW</span>
            </div>
            
            <span class="text-lg sm:text-xl md:text-xl lg:text-2xl xl:text-2xl text-center font-bold leading-tight line-clamp-2 px-1 mb-1">{{ variant.value }}</span>
            <span class="text-base sm:text-base md:text-lg lg:text-lg">₱{{ variant.price.toFixed(2) }}</span>
            
            <!-- Stock at bottom right -->
            <span class="absolute bottom-1 right-2 text-xs sm:text-xs md:text-sm font-semibold bg-black bg-opacity-40 px-1.5 py-0.5 rounded">{{ variant.quantity || 0 }}</span>
          </button>
        </div>
        </div>
      </div>

      <!-- Categories (Right Sidebar) -->
      <div class="w-40 bg-white flex flex-col shadow-lg border-l border-gray-200">
        <!-- Quick Adjust for Last Item -->
        <div class="bg-gray-50 border-b border-gray-200 flex">
          <button 
            @click="adjustLastItem(-1)" 
            :disabled="orderItems.length === 0"
            :class="orderItems.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'"
            class="bg-red-500 text-white font-bold flex-1 py-3 text-xl transition-colors"
          >
            -
          </button>
          <button 
            @click="adjustLastItem(1)" 
            :disabled="orderItems.length === 0"
            :class="orderItems.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'"
            class="bg-green-500 text-white font-bold flex-1 py-3 text-xl transition-colors"
          >
            +
          </button>
        </div>
        
        <!-- Category Buttons -->
        <div class="flex-1 overflow-y-auto">
          <button 
            v-for="category in categories" 
            :key="category._id"
            @click="selectedCategory = category._id"
            :class="selectedCategory === category._id ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'"
            class="w-full font-semibold py-8 px-4 border-b border-gray-200 text-base transition-all duration-200"
          >
            {{ category.name }}
          </button>
        </div>
      </div>
    </main>

    <!-- Action Buttons at Bottom (Static) -->
    <div class="bg-white border-t p-2">
      <div class="grid grid-cols-3 gap-2">
        <button @click="openVoidModal" class="bg-red-500 hover:bg-red-600 text-white font-bold py-6 text-lg">
          Void
        </button>
        <button @click="openRefundModal" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 text-lg">
          Refund
        </button>
        <button 
          @click="openPayModal" 
          :disabled="orderItems.length === 0"
          :class="orderItems.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'"
          class="text-white font-bold py-6 text-lg"
        >
          Pay
        </button>
      </div>
    </div>

    <!-- Pay Modal -->
    <Modal :is-open="isPayModalOpen" title="Select Payment Method" size="full" @close="closePayModal">
      <div class="flex flex-col justify-center items-center" style="min-height: 70vh;">
        <!-- Total on top -->
        <div class="text-center mb-4">
          <p class="text-2xl text-gray-600 mb-2">Total Amount</p>
          <p class="text-7xl font-bold text-gray-800">₱{{ totalAmount.toFixed(2) }}</p>
        </div>
        
        <!-- Payment buttons side by side -->
        <div class="grid grid-cols-2 gap-12 w-full max-w-6xl px-8">
          <button @click="selectPaymentMethod('Cash')" class="bg-green-500 hover:bg-green-600 text-white font-bold py-16 px-10 rounded-xl flex flex-col items-center gap-4 shadow-lg transition transform hover:scale-105">
            <font-awesome-icon icon="money-bill-wave" class="text-7xl" />
            <span class="text-3xl">Cash</span>
          </button>
          <button @click="selectPaymentMethod('E-wallet')" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-16 px-10 rounded-xl flex flex-col items-center gap-4 shadow-lg transition transform hover:scale-105">
            <font-awesome-icon icon="credit-card" class="text-7xl" />
            <span class="text-3xl">E-wallet/RFID</span>
          </button>
        </div>
      </div>
    </Modal>

    <!-- Cash Payment Modal -->
    <Modal :is-open="isCashPaymentModalOpen" title="Cash Payment" size="full" @close="closeCashPaymentModal">
      <div class="grid grid-cols-2 gap-8" style="min-height: 70vh;">
        <!-- Left side: Amount Details -->
        <div class="flex flex-col justify-center space-y-6">
          <div>
            <p class="text-lg text-gray-600 mb-2">Total Amount</p>
            <p class="text-5xl font-bold text-blue-600">₱{{ totalAmount.toFixed(2) }}</p>
          </div>
          
          <div>
            <p class="text-lg text-gray-600 mb-2">Cash Received</p>
            <div class="bg-gray-100 p-4 rounded-xl">
              <p class="text-5xl font-bold text-green-600">₱{{ cashAmount || '0.00' }}</p>
            </div>
          </div>
          
          <div>
            <p class="text-lg text-gray-600 mb-2">Change</p>
            <div class="bg-gray-100 p-4 rounded-xl">
              <p class="text-5xl font-bold" :class="changeAmount >= 0 ? 'text-purple-600' : 'text-red-600'">
                ₱{{ changeAmount.toFixed(2) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Right side: Number Pad and Buttons -->
        <div class="flex flex-col justify-between">
          <!-- Number Pad -->
          <div class="grid grid-cols-3 gap-3 mb-6">
            <button v-for="num in [1,2,3,4,5,6,7,8,9]" :key="num" @click="addToCashAmount(num.toString())" 
              class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 text-3xl rounded-xl">
              {{ num }}
            </button>
            <button @click="addToCashAmount('.')" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 text-3xl rounded-xl">.</button>
            <button @click="addToCashAmount('0')" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 text-3xl rounded-xl">0</button>
            <button @click="deleteCashAmount" class="bg-red-500 hover:bg-red-600 text-white font-bold py-6 text-3xl rounded-xl" title="Delete">
              <font-awesome-icon icon="backspace" />
            </button>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col gap-4">
            <button @click="processCashPayment" :disabled="changeAmount < 0" 
              :class="changeAmount < 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'"
              class="w-full text-white font-bold py-5 text-2xl rounded-xl">
              Complete Payment
            </button>
            <button @click="closeCashPaymentModal" class="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 text-xl rounded-xl">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Modal>

    <!-- RFID Payment Modal -->
    <Modal :is-open="isRfidPaymentModalOpen" title="RFID Payment" size="full" @close="closeRfidPaymentModal">
      <div v-if="!rfidCustomer" class="grid grid-cols-2 gap-8" style="min-height: 70vh;">
        <!-- Left Column: Icon and Input -->
        <div class="flex flex-col justify-center space-y-6">
          <p class="text-2xl font-semibold text-gray-700 text-center">Please tap your RFID card</p>
          <div class="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 w-full">
            <p class="text-lg text-gray-600 mb-2 text-center">Total Amount</p>
            <p class="text-5xl font-bold text-blue-600 text-center">₱{{ totalAmount.toFixed(2) }}</p>
          </div>
          <div class="flex justify-center">
            <font-awesome-icon icon="credit-card" class="text-9xl text-blue-500 animate-pulse" />
          </div>
          <input 
            ref="rfidPaymentInput" 
            v-model="rfidPaymentValue" 
            @keyup.enter="handleRfidPayment" 
            type="text" 
            class="w-full p-4 border-2 border-gray-300 rounded-xl text-center text-xl"
            placeholder="Tap RFID or enter manually"
          />
          <p v-if="rfidPaymentError" class="text-red-600 text-center text-xl font-semibold">{{ rfidPaymentError }}</p>
        </div>
        
        <!-- Right Column: Number Pad -->
        <div class="flex flex-col justify-center">
          <div class="grid grid-cols-3 gap-3 mb-6">
            <button v-for="num in [1,2,3,4,5,6,7,8,9]" :key="num" 
              @click="rfidPaymentValue += num" 
              class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 text-3xl rounded-xl">
              {{ num }}
            </button>
            <button @click="rfidPaymentValue += '.'" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 text-3xl rounded-xl">.</button>
            <button @click="rfidPaymentValue += '0'" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 text-3xl rounded-xl">0</button>
            <button @click="rfidPaymentValue = rfidPaymentValue.slice(0, -1)" class="bg-red-500 hover:bg-red-600 text-white font-bold py-6 text-3xl rounded-xl" title="Delete">
              <font-awesome-icon icon="backspace" />
            </button>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex flex-col gap-4">
            <button @click="handleRfidPayment" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-5 text-2xl rounded-xl">Continue</button>
            <button @click="closeRfidPaymentModal" class="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 text-xl rounded-xl">Cancel</button>
          </div>
        </div>
      </div>

      <div v-else class="grid grid-cols-2 gap-8" style="min-height: 70vh;">
        <!-- Left Column: Balance Info -->
        <div class="flex flex-col justify-center space-y-6">
          <div class="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
            <p class="text-lg text-gray-600 mb-2">Current Balance</p>
            <p class="text-5xl font-bold text-blue-600">₱{{ rfidCustomer.balance.toFixed(2) }}</p>
          </div>
          
          <div class="bg-purple-50 border-2 border-purple-300 rounded-xl p-6">
            <p class="text-lg text-gray-600 mb-2">Total Amount</p>
            <p class="text-5xl font-bold text-purple-600">₱{{ totalAmount.toFixed(2) }}</p>
          </div>
          
          <div :class="(rfidCustomer.balance - totalAmount) >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'" class="border-2 rounded-xl p-6">
            <p class="text-lg text-gray-600 mb-2">Remaining Balance</p>
            <p class="text-5xl font-bold" :class="(rfidCustomer.balance - totalAmount) >= 0 ? 'text-green-600' : 'text-red-600'">
              ₱{{ (rfidCustomer.balance - totalAmount).toFixed(2) }}
            </p>
          </div>

          <div v-if="rfidCustomer.balance < totalAmount" class="bg-red-100 border-2 border-red-400 text-red-700 px-6 py-4 rounded-xl">
            <p class="font-bold text-xl">Insufficient Balance!</p>
            <p class="text-lg">Please add funds or use another payment method.</p>
          </div>
        </div>
        
        <!-- Right Column: Customer Info & Action Buttons -->
        <div class="flex flex-col justify-center gap-6">
          <div class="text-center mb-4">
            <font-awesome-icon icon="check-circle" class="text-8xl text-green-500 mb-4" />
            <p class="text-4xl font-bold">{{ rfidCustomer.fullName }}</p>
          </div>
          
          <button @click="processRfidPayment" 
            :disabled="rfidCustomer.balance < totalAmount"
            :class="rfidCustomer.balance < totalAmount ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'"
            class="w-full text-white font-bold py-8 text-3xl rounded-xl">
            Complete Payment
          </button>
          <button @click="closeRfidPaymentModal" class="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-6 text-2xl rounded-xl">Cancel</button>
        </div>
      </div>
    </Modal>

    <!-- Balance Modal -->
    <Modal :is-open="isBalanceModalOpen" title="Check Balance" size="full" @close="closeBalanceModal">
      <div v-if="!balanceCustomer" class="grid grid-cols-2 gap-8" style="min-height: 70vh;">
        <!-- Left Column: Icon and Input -->
        <div class="flex flex-col justify-center items-center space-y-6">
          <p class="text-2xl font-semibold text-gray-700">Please tap your RFID card</p>
          <div class="flex justify-center">
            <font-awesome-icon icon="wallet" class="text-9xl text-blue-500 animate-pulse" />
          </div>
          <input 
            ref="balanceRfidInput" 
            v-model="balanceRfid" 
            @keyup.enter="handleBalanceRfid" 
            type="text" 
            class="w-full p-4 border-2 border-gray-300 rounded-xl text-center text-xl"
            placeholder="Tap RFID or enter manually"
          />
          <p v-if="balanceError" class="text-red-600 text-center text-xl font-semibold">{{ balanceError }}</p>
        </div>
        
        <!-- Right Column: Number Pad -->
        <div class="flex flex-col justify-center">
          <div class="grid grid-cols-3 gap-3 mb-6">
            <button v-for="num in [1,2,3,4,5,6,7,8,9]" :key="num" 
              @click="balanceRfid += num" 
              class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 text-3xl rounded-xl">
              {{ num }}
            </button>
            <button @click="balanceRfid += '.'" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 text-3xl rounded-xl">.</button>
            <button @click="balanceRfid += '0'" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 text-3xl rounded-xl">0</button>
            <button @click="balanceRfid = balanceRfid.slice(0, -1)" class="bg-red-500 hover:bg-red-600 text-white font-bold py-6 text-3xl rounded-xl" title="Delete">
              <font-awesome-icon icon="backspace" />
            </button>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex flex-col gap-4">
            <button @click="handleBalanceRfid" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-5 text-2xl rounded-xl">Check Balance</button>
            <button @click="closeBalanceModal" class="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 text-xl rounded-xl">Cancel</button>
          </div>
        </div>
      </div>
      
      <div v-else class="grid grid-cols-2 gap-8" style="min-height: 70vh;">
        <!-- Left Column: Customer Info -->
        <div class="flex flex-col space-y-6 justify-start">
          <div class="bg-blue-50 border-2 border-blue-300 rounded-xl p-8">
            <p class="text-center font-bold text-5xl mb-4">{{ balanceCustomer.fullName }}</p>
            <p class="text-center text-2xl text-gray-700">Current Balance</p>
            <p class="text-center font-bold text-6xl text-blue-600 mt-3">₱{{ balanceCustomer.balance.toFixed(2) }}</p>
          </div>
          
          <div class="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
            <p class="text-2xl font-semibold text-gray-700 mb-2">Card Details</p>
            <p class="text-lg text-gray-600">RFID: <span class="font-bold">{{ balanceCustomer.rfid }}</span></p>
          </div>
        </div>
        
        <!-- Right Column: Actions -->
        <div class="flex flex-col justify-between">
          <div class="bg-blue-100 border-2 border-blue-300 rounded-xl p-8">
            <p class="text-center text-2xl font-semibold text-gray-700 mb-4">Balance Information</p>
            <p class="text-center text-5xl font-bold text-blue-600">₱{{ balanceCustomer.balance.toFixed(2) }}</p>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col gap-4">
            <button @click="printBalanceReceipt" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 px-6 rounded-2xl flex items-center justify-center gap-3 text-3xl">
              <font-awesome-icon icon="print" />
              Print Receipt
            </button>
            <button @click="closeBalanceModal" class="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-6 px-6 rounded-2xl text-3xl">Close</button>
          </div>
        </div>
      </div>
    </Modal>

    <!-- Cash In Modal -->
    <Modal :is-open="isCashInModalOpen" title="Cash In" size="full" @close="closeCashInModal">
      <div v-if="!cashInCustomer" class="grid grid-cols-2 gap-8" style="min-height: 70vh;">
        <!-- Left Column: Icon and Input -->
        <div class="flex flex-col justify-center items-center space-y-6">
          <p class="text-2xl font-semibold text-gray-700">Please tap your RFID card</p>
          <div class="flex justify-center">
            <font-awesome-icon icon="credit-card" class="text-9xl text-yellow-500 animate-pulse" />
          </div>
          <input 
            ref="cashInRfidInput" 
            v-model="cashInRfid" 
            @keyup.enter="handleCashInRfid" 
            type="text" 
            class="w-full p-4 border-2 border-gray-300 rounded-xl text-center text-xl"
            placeholder="Tap RFID or enter manually"
          />
          <p v-if="cashInError" class="text-red-600 text-center text-xl font-semibold">{{ cashInError }}</p>
        </div>
        
        <!-- Right Column: Number Pad -->
        <div class="flex flex-col justify-center">
          <div class="grid grid-cols-3 gap-3 mb-6">
            <button v-for="num in [1,2,3,4,5,6,7,8,9]" :key="num" 
              @click="cashInRfid += num" 
              class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 text-3xl rounded-xl">
              {{ num }}
            </button>
            <button @click="cashInRfid += '.'" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 text-3xl rounded-xl">.</button>
            <button @click="cashInRfid += '0'" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 text-3xl rounded-xl">0</button>
            <button @click="cashInRfid = cashInRfid.slice(0, -1)" class="bg-red-500 hover:bg-red-600 text-white font-bold py-6 text-3xl rounded-xl" title="Delete">
              <font-awesome-icon icon="backspace" />
            </button>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex flex-col gap-4">
            <button @click="handleCashInRfid" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-5 text-2xl rounded-xl">Continue</button>
            <button @click="closeCashInModal" class="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 text-xl rounded-xl">Cancel</button>
          </div>
        </div>
      </div>
      
      <div v-else class="grid grid-cols-2 gap-8" style="min-height: 70vh;">
        <!-- Left Column: Customer Info and Amount -->
        <div class="flex flex-col justify-center space-y-6">
          <div>
            <p class="text-lg text-gray-600 mb-2">Customer Name</p>
            <p class="text-5xl font-bold text-green-600">{{ cashInCustomer.fullName }}</p>
          </div>
          
          <div>
            <p class="text-lg text-gray-600 mb-2">Current Balance</p>
            <div class="bg-green-100 p-4 rounded-xl">
              <p class="text-5xl font-bold text-green-600">₱{{ cashInCustomer.balance.toFixed(2) }}</p>
            </div>
          </div>
          
          <div>
            <p class="text-lg text-gray-600 mb-2">Amount to Add</p>
            <input v-model="cashInAmount" type="text" readonly placeholder="0.00" class="w-full p-4 rounded-xl border-2 border-gray-300 text-right text-5xl font-bold bg-gray-50" />
          </div>
        </div>
        
        <!-- Right Column: Number Pad and Buttons -->
        <div class="flex flex-col justify-between">
          <!-- Number Pad -->
          <div class="grid grid-cols-3 gap-3 mb-6">
            <button v-for="num in [1,2,3,4,5,6,7,8,9]" :key="num" 
              @click="appendToCashIn(num)" 
              class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 text-3xl rounded-xl">
              {{ num }}
            </button>
            <button @click="appendToCashIn('.')" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 text-3xl rounded-xl">.</button>
            <button @click="appendToCashIn(0)" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 text-3xl rounded-xl">0</button>
            <button @click="deleteCashInDigit" class="bg-red-500 hover:bg-red-600 text-white font-bold py-6 text-3xl rounded-xl" title="Delete">
              <font-awesome-icon icon="backspace" />
            </button>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col gap-4">
            <button @click="showCashInVerification" :disabled="!cashInAmount || parseFloat(cashInAmount) <= 0" 
              :class="!cashInAmount || parseFloat(cashInAmount) <= 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'"
              class="w-full text-white font-bold py-5 text-2xl rounded-xl">Continue to Verification</button>
            <button @click="closeCashInModal" class="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 text-xl rounded-xl">Cancel</button>
          </div>
        </div>
      </div>
    </Modal>

    <!-- Cash In RFID Verification Modal -->
    <Modal :is-open="isCashInVerificationModalOpen" title="Verify Cash-In Transaction" size="full" @close="closeCashInVerificationModal">
      <div class="grid grid-cols-2 gap-8" style="min-height: 70vh;">
        <!-- Left Column: Transaction Summary + RFID Input -->
        <div class="flex flex-col justify-center space-y-6">
          <!-- Transaction Summary Card -->
          <div class="bg-gray-50 p-6 rounded-xl space-y-4">
            <h3 class="text-xl font-bold text-gray-800 border-b-2 pb-2">Transaction Summary</h3>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-600">Customer</p>
                <p class="text-xl font-bold text-blue-600">{{ cashInCustomer.fullName }}</p>
              </div>
              
              <div>
                <p class="text-sm text-gray-600">RFID</p>
                <p class="text-lg font-mono text-gray-800">{{ cashInCustomer.rfid }}</p>
              </div>
            </div>
            
            <div class="grid grid-cols-3 gap-4 border-t pt-4">
              <div>
                <p class="text-sm text-gray-600">Current Balance</p>
                <p class="text-2xl font-bold text-green-600">₱{{ cashInCustomer.balance.toFixed(2) }}</p>
              </div>
              
              <div>
                <p class="text-sm text-gray-600">Amount to Add</p>
                <p class="text-2xl font-bold text-purple-600">+₱{{ cashInAmount }}</p>
              </div>
              
              <div>
                <p class="text-sm text-gray-600">New Balance</p>
                <p class="text-2xl font-bold text-green-700">₱{{ (cashInCustomer.balance + parseFloat(cashInAmount || 0)).toFixed(2) }}</p>
              </div>
            </div>
          </div>
          
          <!-- RFID Verification Section -->
          <div class="bg-purple-50 p-6 rounded-xl space-y-4">
            <div class="text-center">
              <p class="text-2xl font-bold text-purple-600 mb-2">Verify with RFID</p>
              <p class="text-lg text-gray-600">Tap the same RFID card again to confirm</p>
            </div>
            
            <div class="flex justify-center">
              <font-awesome-icon icon="credit-card" class="text-7xl text-purple-500 animate-pulse" />
            </div>
            
            <input 
              ref="cashInVerificationRfidInput" 
              v-model="cashInVerificationRfid" 
              @keyup.enter="verifyCashInRfid" 
              type="text" 
              class="w-full p-4 border-2 border-purple-300 rounded-xl text-center text-xl"
              placeholder="Tap RFID to verify"
            />
            
            <p v-if="cashInVerificationError" class="text-red-600 text-center text-lg font-semibold">{{ cashInVerificationError }}</p>
          </div>
          
          <!-- Back Button -->
          <button 
            @click="closeCashInVerificationModal" 
            class="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-xl">
            Back to Amount
          </button>
        </div>
        
        <!-- Right Column: Number Pad -->
        <div class="flex flex-col justify-center">
          <div class="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-6">
            <p class="text-center text-yellow-800 text-lg">
              <font-awesome-icon icon="exclamation-triangle" class="mr-2" />
              Security verification required - Enter RFID manually or tap card
            </p>
          </div>
          
          <!-- Number Pad -->
          <div class="grid grid-cols-3 gap-3 mb-6">
            <button v-for="num in [1,2,3,4,5,6,7,8,9]" :key="num" 
              @click="cashInVerificationRfid += num" 
              class="bg-purple-500 hover:bg-purple-600 text-white font-bold py-8 text-4xl rounded-xl">
              {{ num }}
            </button>
            <button @click="cashInVerificationRfid += '.'" class="bg-purple-500 hover:bg-purple-600 text-white font-bold py-8 text-4xl rounded-xl">.</button>
            <button @click="cashInVerificationRfid += '0'" class="bg-purple-500 hover:bg-purple-600 text-white font-bold py-8 text-4xl rounded-xl">0</button>
            <button @click="cashInVerificationRfid = cashInVerificationRfid.slice(0, -1)" class="bg-red-500 hover:bg-red-600 text-white font-bold py-8 text-3xl rounded-xl" title="Delete">
              <font-awesome-icon icon="backspace" />
            </button>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col gap-4">
            <button 
              @click="verifyCashInRfid"
              class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-6 px-6 rounded-xl flex items-center justify-center gap-3 text-2xl transition-colors"
            >
              <font-awesome-icon icon="check-circle" class="text-3xl" />
              Confirm Cash-In
            </button>
          </div>
        </div>
      </div>
    </Modal>

    <!-- Void Modal -->
    <Modal :is-open="isVoidModalOpen" title="Void Transaction" @close="isVoidModalOpen = false">
      <p class="mb-4 text-red-600">Are you sure you want to void this transaction? This action cannot be undone.</p>
      <div class="flex gap-4">
        <button @click="isVoidModalOpen = false" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
        <button @click="processVoid" class="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-2xl">Void</button>
      </div>
    </Modal>

    <!-- Manual Barcode Modal -->
    <Modal :is-open="isBarcodeModalOpen" title="Manual Barcode Entry" size="lg" @close="isBarcodeModalOpen = false">
      <div class="space-y-4">
        <p class="text-gray-600">Enter product barcode/SKU:</p>
        <div class="flex gap-2">
          <input 
            ref="manualBarcodeInput"
            v-model="manualBarcode" 
            @keyup.enter="processManualBarcode"
            type="text" 
            placeholder="Enter barcode" 
            class="flex-1 p-3 rounded-xl border-2 border-purple-300 text-xl text-center font-mono focus:border-purple-500 focus:outline-none" 
          />
          <button @click="openKeyboardModal('manualBarcode')" class="bg-gray-200 hover:bg-gray-300 p-3 rounded-lg transition active:scale-95" title="Open Keyboard">
            <font-awesome-icon icon="keyboard" class="text-gray-600 text-xl" />
          </button>
        </div>
        <div v-if="barcodeError" class="p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl text-center">
          {{ barcodeError }}
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button @click="isBarcodeModalOpen = false" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-xl">
          Cancel
        </button>
        <button @click="processManualBarcode" class="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-xl">
          <font-awesome-icon icon="plus" class="mr-2" />
          Add Item
        </button>
      </div>
    </Modal>

    <!-- Lock Confirmation Modal -->
    <Modal :is-open="isLockConfirmModalOpen" title="Lock POS" @close="isLockConfirmModalOpen = false">
      <p class="mb-4">Are you sure you want to lock the POS? You will need to enter your password or scan your RFID to unlock.</p>
      <div class="flex gap-4">
        <button @click="isLockConfirmModalOpen = false" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
        <button @click="lockPOS" class="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-2xl">Lock</button>
      </div>
    </Modal>

    <!-- Lockscreen Overlay -->
    <div v-if="isPOSLocked" class="fixed inset-0 bg-gray-900 bg-opacity-95 z-[9999] flex items-center justify-center">
      <!-- Top-right buttons on lockscreen -->
      <div class="absolute top-4 right-4 flex gap-2">
        <button @click="openKeyboardModal('lockscreen')" class="bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-bold py-3 px-4 rounded-lg transition" title="On-Screen Keyboard">
          <font-awesome-icon icon="keyboard" class="text-xl" />
        </button>
        <button @click="toggleFullScreen" class="bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-bold py-3 px-4 rounded-lg transition" title="Toggle Fullscreen">
          <font-awesome-icon icon="expand" class="text-xl" />
        </button>
      </div>
      <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
        <div class="text-center mb-6">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-4">
            <font-awesome-icon icon="lock" class="text-orange-600 text-2xl" />
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">POS Locked</h2>
          <p class="text-sm text-gray-600">Enter your password or scan your RFID to unlock</p>
          <p class="text-xs text-gray-500 mt-2">Locked by: {{ lockedByUser }}</p>
        </div>

        <!-- Tab Selection -->
        <div class="flex gap-2 mb-4">
          <button 
            @click="unlockMethod = 'password'" 
            :class="unlockMethod === 'password' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'"
            class="flex-1 py-2 rounded-lg font-semibold transition"
          >
            Password
          </button>
          <button 
            @click="unlockMethod = 'rfid'" 
            :class="unlockMethod === 'rfid' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'"
            class="flex-1 py-2 rounded-lg font-semibold transition"
          >
            RFID
          </button>
        </div>

        <!-- Password Input -->
        <div v-if="unlockMethod === 'password'" class="space-y-4">
          <div>
            <label class="block text-sm font-bold mb-2 text-gray-700">Password</label>
            <div class="flex gap-2">
              <input 
                v-model="unlockPassword" 
                type="password" 
                ref="unlockPasswordInput"
                @keyup.enter="attemptUnlock"
                class="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                autofocus
              />
              <button @click="openKeyboardModal('unlockPassword')" class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-4 rounded-lg" title="Keyboard">
                <font-awesome-icon icon="keyboard" />
              </button>
            </div>
          </div>
          <button 
            @click="attemptUnlock" 
            :disabled="!unlockPassword"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Unlock
          </button>
        </div>

        <!-- RFID Input -->
        <div v-if="unlockMethod === 'rfid'" class="space-y-4">
          <div>
            <label class="block text-sm font-bold mb-2 text-gray-700">RFID</label>
            <div class="flex gap-2">
              <input 
                v-model="unlockRFID" 
                type="text" 
                ref="unlockRFIDInput"
                @keyup.enter="attemptUnlock"
                class="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Scan your RFID card"
                autofocus
              />
              <button @click="openKeyboardModal('unlockRFID')" class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-4 rounded-lg" title="Keyboard">
                <font-awesome-icon icon="keyboard" />
              </button>
            </div>
          </div>
          <button 
            @click="attemptUnlock" 
            :disabled="!unlockRFID"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Unlock
          </button>
        </div>

        <div v-if="unlockError" class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          {{ unlockError }}
        </div>

        <!-- Logout Button -->
        <div class="mt-6 pt-6 border-t">
          <button 
            @click="confirmLogout"
            class="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            <font-awesome-icon icon="sign-out-alt" />
            <span>Logout</span>
          </button>
          <p class="text-xs text-center text-gray-500 mt-2">Can't unlock? Logout and login as a different user</p>
        </div>
      </div>
    </div>

    <!-- Logout Confirmation Modal -->
    <Modal :is-open="isLogoutModalOpen" title="Confirm Logout" @close="isLogoutModalOpen = false">
      <p class="mb-4">Are you sure you want to logout?</p>
      <div class="flex gap-4">
        <button @click="isLogoutModalOpen = false" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
        <button @click="confirmLogout" class="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-2xl">Logout</button>
      </div>
    </Modal>

    <!-- Clear All Confirmation Modal -->
    <Modal :is-open="isClearAllModalOpen" title="Clear All Items" @close="isClearAllModalOpen = false">
      <p class="mb-4 text-orange-600">Are you sure you want to clear all items from the order?</p>
      <div class="flex gap-4">
        <button @click="isClearAllModalOpen = false" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
        <button @click="confirmClearAll" class="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-2xl">Clear All</button>
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
                <button 
                  @click="testPrint" 
                  class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
                  :disabled="isRefreshingPrinters"
                >
                  <font-awesome-icon icon="print" />
                  Test
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

        <!-- System Control Section -->
        <div class="border-b pb-4">
          <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
            <font-awesome-icon icon="cog" class="text-gray-600" />
            System Controls
          </h3>
          <div class="grid grid-cols-2 gap-3">
            <button 
              @click="toggleFullScreen" 
              class="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
            >
              <font-awesome-icon icon="expand" />
              Full Screen
            </button>
            <button 
              @click="reloadApp" 
              class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
            >
              <font-awesome-icon icon="sync-alt" />
              Reload
            </button>
            <button 
              v-if="isElectron" 
              @click="rebootSystem" 
              class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
            >
              <font-awesome-icon icon="redo" />
              Reboot System
            </button>
            <button 
              v-if="isElectron" 
              @click="shutdownSystem" 
              class="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
            >
              <font-awesome-icon icon="power-off" />
              Shutdown
            </button>
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
          <font-awesome-icon icon="print" class="text-6xl text-blue-500" />
        </div>
        <h3 class="text-xl font-bold text-gray-800 mb-2">Transaction Successful!</h3>
        <p class="text-gray-600 mb-4">Would you like to print a receipt?</p>
      </div>
      <div class="flex gap-4">
        <button @click="cancelPrint" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Skip</button>
        <button @click="confirmPrint" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-2xl flex items-center justify-center gap-2">

    <!-- Admin Verification Modal for System Actions -->
    <Modal :is-open="isAdminVerificationModalOpen" title="Administrator Verification Required" @close="closeAdminVerificationModal">
      <div class="p-4">
        <div class="mb-4 text-center">
          <font-awesome-icon icon="shield-alt" class="text-6xl text-yellow-500" />
          <p class="mt-4 text-gray-700">{{ adminVerificationMessage }}</p>
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-semibold mb-2">Verification Method</label>
          <div class="flex gap-4 mb-4">
            <button 
              @click="adminVerificationMethod = 'password'" 
              :class="adminVerificationMethod === 'password' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'"
              class="flex-1 py-2 px-4 rounded-lg font-semibold"
            >
              Password
            </button>
            <button 
              @click="adminVerificationMethod = 'rfid'" 
              :class="adminVerificationMethod === 'rfid' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'"
              class="flex-1 py-2 px-4 rounded-lg font-semibold"
            >
              RFID
            </button>
          </div>
        </div>

        <div v-if="adminVerificationMethod === 'password'" class="mb-4">
          <label class="block text-sm font-semibold mb-2">Admin Password</label>
          <input 
            ref="adminPasswordInput"
            type="password" 
            v-model="adminPassword" 
            @keyup.enter="verifyAdminCredentials"
            class="w-full p-3 border rounded-lg"
            placeholder="Enter admin password"
          />
        </div>

        <div v-if="adminVerificationMethod === 'rfid'" class="mb-4">
          <label class="block text-sm font-semibold mb-2">Admin RFID</label>
          <input 
            ref="adminRfidInput"
            type="text" 
            v-model="adminRfid" 
            @keyup.enter="verifyAdminCredentials"
            class="w-full p-3 border rounded-lg"
            placeholder="Scan admin RFID"
            autocomplete="off"
          />
        </div>

        <div v-if="adminVerificationError" class="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {{ adminVerificationError }}
        </div>
      </div>
      
      <div class="flex gap-4">
        <button @click="closeAdminVerificationModal" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
        <button @click="verifyAdminCredentials" class="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-2xl">Verify & Continue</button>
      </div>
    </Modal>
          <font-awesome-icon icon="print" />
          Print Receipt
        </button>
      </div>
    </Modal>

    <!-- Refund Transaction Lookup Modal -->
    <Modal :is-open="isRefundModalOpen" title="Refund Transaction" size="full" @close="closeRefundModal">
      <div class="grid grid-cols-2 gap-8" style="min-height: 70vh;">
        <!-- Left side: Transaction ID and Error -->
        <div class="flex flex-col justify-start space-y-4">
          <div>
            <p class="text-base text-gray-600 mb-2">Enter or scan the Transaction ID from the receipt</p>
            <label class="block text-base font-bold mb-2">Transaction ID</label>
            <input 
              ref="transactionIdInput"
              v-model="refundTransactionId"
              type="text"
              placeholder="Enter transaction ID"
              class="w-full p-4 rounded-xl border-2 border-gray-300 text-center text-2xl font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
            />
            <button 
              @click="pasteTransactionId"
              class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-3 text-xl rounded-xl"
              title="Paste Transaction ID"
            >
              <font-awesome-icon icon="paste" class="mr-2" /> Paste
            </button>
          </div>

          <!-- Error Message -->
          <div v-if="refundError" class="bg-red-50 border border-red-200 rounded-xl p-4">
            <p class="text-base text-red-600 font-semibold">{{ refundError }}</p>
          </div>
        </div>

        <!-- Right side: Number Pad and Buttons -->
        <div class="flex flex-col justify-between">
          <!-- Number Pad -->
          <div class="grid grid-cols-3 gap-3 mb-6">
            <button v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 9]" :key="num" 
              @click="addToRefundTransactionId(num.toString())"
              class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 text-3xl rounded-xl">
              {{ num }}
            </button>
            <button @click="addToRefundTransactionId('.')" 
              class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 text-3xl rounded-xl">
              .
            </button>
            <button @click="addToRefundTransactionId('0')" 
              class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 text-3xl rounded-xl">
              0
            </button>
            <button @click="deleteRefundTransactionId" 
              class="bg-red-500 hover:bg-red-600 text-white font-bold py-6 text-3xl rounded-xl" title="Delete">
              <font-awesome-icon icon="backspace" />
            </button>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col gap-4">
            <button @click="searchRefundTransaction" :disabled="!refundTransactionId || isLoading"
              class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-5 text-2xl rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
              {{ isLoading ? 'Searching...' : 'Search Transaction' }}
            </button>
            <button @click="closeRefundModal" class="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 text-xl rounded-xl">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Modal>

    <!-- Refund Details Modal -->
    <Modal :is-open="isRefundDetailsModalOpen" title="Process Refund" size="full" @close="closeRefundDetailsModal">
      <div v-if="refundTransaction" class="grid grid-cols-2 gap-8" style="min-height: 70vh;">
        <!-- Left side: Items to Refund -->
        <div class="flex flex-col space-y-4 overflow-y-auto pr-2">
          <h3 class="font-bold text-lg text-gray-800 sticky top-0 bg-white py-2">Items to Refund</h3>
          <div class="space-y-2 flex-1">
            <div v-for="(item, index) in refundItems" :key="index" 
              class="bg-white border rounded-xl p-3 flex flex-col gap-2">
              <div>
                <p class="font-semibold text-gray-800">{{ item.name }}</p>
                <p class="text-xs text-gray-500">₱{{ item.price.toFixed(2) }} each</p>
                <p class="text-xs text-gray-600">Max: {{ item.maxQuantity }}</p>
              </div>
              <div class="flex items-center justify-between">
                <p class="font-bold text-gray-800">₱{{ (item.price * item.refundQuantity).toFixed(2) }}</p>
                <div class="flex items-center gap-2">
                  <button @click="adjustRefundQuantity(index, -1)" 
                    class="bg-red-500 hover:bg-red-600 text-white font-bold w-10 h-10 rounded-lg text-lg">
                    −
                  </button>
                  <span class="font-bold w-12 text-center text-lg">{{ item.refundQuantity }}</span>
                  <button @click="adjustRefundQuantity(index, 1)" 
                    class="bg-green-500 hover:bg-green-600 text-white font-bold w-10 h-10 rounded-lg text-lg">
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right side: Transaction Details and Buttons -->
        <div class="flex flex-col justify-between space-y-6">
          <!-- Transaction Info -->
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-gray-50 rounded-xl p-4">
                <p class="text-gray-600 text-sm mb-1">Transaction ID</p>
                <p class="font-bold text-gray-800 text-lg">{{ refundTransaction.transactionId }}</p>
              </div>

              <div class="bg-gray-50 rounded-xl p-4">
                <p class="text-gray-600 text-sm mb-1">Date</p>
                <p class="font-bold text-gray-800">{{ new Date(refundTransaction.createdAt).toLocaleString() }}</p>
              </div>

              <div class="bg-gray-50 rounded-xl p-4">
                <p class="text-gray-600 text-sm mb-1">Payment Method</p>
                <p class="font-bold text-gray-800">{{ refundTransaction.paymentMethod }}</p>
              </div>

              <div class="bg-gray-50 rounded-xl p-4">
                <p class="text-gray-600 text-sm mb-1">Original Amount</p>
                <p class="font-bold text-green-600 text-lg">₱{{ refundTransaction.totalAmount.toFixed(2) }}</p>
              </div>
            </div>

            <div v-if="refundTransaction.customerDetails" class="bg-gray-50 rounded-xl p-4">
              <p class="text-gray-600 text-sm mb-1">Customer</p>
              <p class="font-bold text-gray-800">{{ refundTransaction.customerDetails.fullName }}</p>
              <p class="text-xs text-gray-500">RFID: {{ refundTransaction.customerDetails.rfid }}</p>
              <p class="text-xs text-gray-500">Balance: ₱{{ refundTransaction.customerDetails.balance.toFixed(2) }}</p>
            </div>
          </div>

          <!-- Refund Summary -->
          <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div class="flex justify-between items-center">
              <p class="text-lg font-bold text-gray-800">Total Refund</p>
              <p class="text-3xl font-bold text-blue-600">₱{{ refundAmount.toFixed(2) }}</p>
            </div>
            <p v-if="refundTransaction.paymentMethod === 'E-wallet'" class="text-sm text-gray-600 mt-2">
              Amount will be refunded to customer's account
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col gap-3">
            <button @click="processRefund" :disabled="isLoading || refundAmount === 0"
              class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg">
              {{ isLoading ? 'Processing...' : 'Process Refund' }}
            </button>
            <button @click="closeRefundDetailsModal" class="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Modal>

    <!-- Alert/Message Modal -->
    <Modal :is-open="isAlertModalOpen" :title="alertModalTitle" @close="isAlertModalOpen = false">
      <div class="text-center py-4">
        <p class="text-lg text-gray-700 whitespace-pre-line">{{ alertModalMessage }}</p>
      </div>
      <div class="flex justify-center mt-4">
        <button @click="isAlertModalOpen = false" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-8 rounded-2xl">OK</button>
      </div>
    </Modal>

    <!-- Payment Processing Modal -->
    <Modal :is-open="isPaymentProcessing" title="Processing Payment" :show-close="false">
      <div class="text-center py-8">
        <div class="mb-6">
          <font-awesome-icon icon="spinner" class="text-6xl text-blue-500 animate-spin" />
        </div>
        <h3 class="text-xl font-bold text-gray-800 mb-3">{{ paymentProcessingMessage }}</h3>
        <p class="text-gray-600">Please wait while we process your transaction...</p>
      </div>
    </Modal>

    <!-- Printing Receipt Modal -->
    <Modal :is-open="isPrintingReceipt" title="Printing Receipt" :show-close="false">
      <div class="text-center py-8">
        <div class="mb-6">
          <font-awesome-icon icon="print" class="text-6xl text-purple-500 animate-pulse" />
        </div>
        <h3 class="text-xl font-bold text-gray-800 mb-3">Printing receipt...</h3>
        <p class="text-gray-600">Please wait while we print your receipt</p>
      </div>
    </Modal>

    <!-- On-Screen Keyboard Modal - High z-index to appear above lockscreen -->
    <div v-if="isKeyboardModalOpen" class="fixed inset-0 bg-black bg-opacity-50 z-[99999] flex items-center justify-center">
      <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl mx-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-2xl font-bold text-gray-900">On-Screen Keyboard</h3>
          <button @click="closeKeyboardModal" class="text-gray-500 hover:text-gray-700 text-3xl">&times;</button>
        </div>
        
        <!-- Preview of typed text -->
        <div class="mb-4 p-4 bg-gray-100 rounded-xl text-center text-2xl font-mono min-h-[60px] flex items-center justify-center">
          <span v-if="keyboardValue" class="break-all">{{ keyboardTarget === 'unlockPassword' ? '•'.repeat(keyboardValue.length) : keyboardValue }}</span>
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
        
        <!-- Space bar and special chars -->
        <div class="grid grid-cols-10 gap-2 mb-4 px-12">
          <button @click="keyboardValue += '@'" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 text-xl rounded-lg">@</button>
          <button @click="keyboardValue += '.'" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 text-xl rounded-lg">.</button>
          <button @click="keyboardValue += ' '" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-4 text-lg rounded-lg col-span-6">Space</button>
          <button @click="keyboardValue += '_'" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 text-xl rounded-lg">_</button>
          <button @click="keyboardValue += '#'" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 text-xl rounded-lg">#</button>
        </div>
        
        <!-- Action buttons -->
        <div class="flex gap-4">
          <button @click="closeKeyboardModal" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 text-xl rounded-xl">Cancel</button>
          <button @click="applyKeyboardValue" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-4 text-xl rounded-xl">Apply</button>
        </div>
      </div>
    </div>

    <!-- Toast Notification Component -->
    <Toast ref="toastRef" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import Modal from '../../components/Modal.vue'
import Toast from '../../components/Toast.vue'
import { api } from '@/utils/api'
import { auth } from '@/utils/auth'
import { printThermalReceipt, getAvailablePrinters } from '../../utils/printReceipt.js'

const router = useRouter()

const searchQuery = ref('')
const selectedCategory = ref('all')
const orderItems = ref([])
const viewingVariants = ref(false)
const selectedProduct = ref(null)
const selectedProductVariants = ref([])
const isPayModalOpen = ref(false)
const isCashPaymentModalOpen = ref(false)
const isRfidPaymentModalOpen = ref(false)
const cashAmount = ref('')
const rfidPaymentValue = ref('')
const rfidPaymentInput = ref(null)
const rfidCustomer = ref(null)
const rfidPaymentError = ref('')
const showChange = ref(false)
const isBalanceModalOpen = ref(false)
const isCashInModalOpen = ref(false)
const isVoidModalOpen = ref(false)
const isClearAllModalOpen = ref(false)
const isBarcodeModalOpen = ref(false)
const isLogoutModalOpen = ref(false)
const isRefundModalOpen = ref(false)
const isRefundDetailsModalOpen = ref(false)
const isLockConfirmModalOpen = ref(false)
const isPOSLocked = ref(false)
const lockedByUser = ref('')
const unlockMethod = ref('password')
const unlockPassword = ref('')
const unlockRFID = ref('')
const unlockError = ref('')
const unlockPasswordInput = ref(null)
const unlockRFIDInput = ref(null)
const transactionIdInput = ref(null)
const refundTransactionId = ref('')
const refundTransaction = ref(null)
const refundItems = ref([])
const refundError = ref('')
const cashInAmount = ref('')
const cashInRfid = ref('')
const cashInRfidInput = ref(null)
const cashInCustomer = ref(null)
const cashInError = ref('')
const isCashInVerificationModalOpen = ref(false)
const cashInVerificationRfid = ref('')
const cashInVerificationRfidInput = ref(null)
const cashInVerificationError = ref('')
const balanceRfid = ref('')
const balanceRfidInput = ref(null)
const balanceCustomer = ref(null)
const balanceError = ref('')
const currentUser = ref(null)
const currentStore = ref(null)
const isLoading = ref(false)
const isPrintingReceipt = ref(false)
const isPaymentProcessing = ref(false)
const paymentProcessingMessage = ref('')
const barcodeValue = ref('')
const productsWithVariants = ref(new Set())
const manualBarcode = ref('')
const barcodeError = ref('')
const barcodeInput = ref(null)
const manualBarcodeInput = ref(null)
const isMenuOpen = ref(false)
const isSettingsModalOpen = ref(false)
const isPrintConfirmModalOpen = ref(false)
const pendingPrintData = ref(null)
const isKeyboardModalOpen = ref(false)
const keyboardTarget = ref('')
const keyboardValue = ref('')
const availablePrinters = ref([])
const selectedPrinter = ref(null)
const isRefreshingPrinters = ref(false)
const printMode = ref('manual')
const toastRef = ref(null)
const sessionActive = ref(false)

// Alert modal state
const isAlertModalOpen = ref(false)
const alertModalTitle = ref('')
const alertModalMessage = ref('')

// Admin verification state
const isAdminVerificationModalOpen = ref(false)
const adminVerificationMethod = ref('password')
const adminPassword = ref('')
const adminRfid = ref('')
const adminVerificationError = ref('')
const adminVerificationMessage = ref('')
const adminVerificationAction = ref(null)
const adminPasswordInput = ref(null)
const adminRfidInput = ref(null)

// Data from backend
const categories = ref([])
const products = ref([])
const allAddons = ref([])
const vatConfig = ref({ type: 'percent', value: 0 })

const showToast = (message, type = 'info', title = '') => {
  if (toastRef.value) {
    toastRef.value.addToast(message, type, title)
  }
}

const showAlertModal = (message, title = 'Alert') => {
  alertModalTitle.value = title
  alertModalMessage.value = message
  isAlertModalOpen.value = true
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
    // Silent error handling - only log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error checking session status:', error)
    }
    return false
  }
}

// Fetch data from backend
const fetchCurrentUser = async () => {
  try {
    const user = auth.getUser() || {}
    currentUser.value = user
    
    if (user.store) {
      currentStore.value = user.store
    }
  } catch (error) {
    console.error('Error fetching user:', error)
  }
}

const fetchCategories = async () => {
  try {
    const response = await api.get('/categories')
    if (response.data.success) {
      // Filter active categories and by store
      let activeCategories = response.data.categories.filter(cat => cat.status === 'active')
      
      // Filter by store - show only global categories or categories for current store
      if (currentStore.value) {
        activeCategories = activeCategories.filter(cat => {
          if (cat.isGlobal) return true
          if (cat.stores && cat.stores.length > 0) {
            return cat.stores.some(store => 
              (typeof store === 'string' ? store : store._id) === currentStore.value._id
            )
          }
          return false
        })
      }
      
      categories.value = [
        { _id: 'all', name: 'All' },
        ...activeCategories
      ]
    }
  } catch (error) {
    console.error('Error fetching categories:', error)
  }
}

const fetchProducts = async () => {
  try {
    isLoading.value = true
    const response = await api.get('/products')
    if (response.data.success) {
      products.value = response.data.products
      // Fetch which products have variants
      await fetchProductsWithVariants()
    }
  } catch (error) {
    console.error('Error fetching products:', error)
  } finally {
    isLoading.value = false
  }
}

const fetchProductsWithVariants = async () => {
  try {
    const response = await api.get('/variants')
    if (response.data.success) {
      const productIds = new Set()
      response.data.variants.forEach(variant => {
        if (variant.productId) {
          // Handle both populated objects and direct IDs
          const id = typeof variant.productId === 'object' ? variant.productId._id : variant.productId
          productIds.add(String(id))
        }
      })
      productsWithVariants.value = productIds
    }
  } catch (error) {
    console.error('Error fetching variants:', error)
  }
}

const fetchAddons = async () => {
  try {
    const response = await api.get('/addons')
    if (response.data.success) {
      allAddons.value = response.data.addons.filter(addon => addon.status === 'active')
    }
  } catch (error) {
    console.error('Error fetching addons:', error)
  }
}

const fetchVATConfig = async () => {
  try {
    const response = await api.get('/settings/vat-config')
    if (response.data.success) {
      vatConfig.value = response.data.vatConfig
    }
  } catch (error) {
    console.error('Error fetching VAT config:', error)
  }
}

const fetchVariants = async (productId) => {
  try {
    const response = await api.get(`/variants/product/${productId}`)
    if (response.data.success) {
      return response.data.variants.filter(v => v.status === 'active')
    }
    return []
  } catch (error) {
    console.error('Error fetching variants:', error)
    return []
  }
}

const filteredProducts = computed(() => {
  let filtered = products.value
  
  // Filter by store - show only products for current store or global products
  if (currentStore.value) {
    filtered = filtered.filter(product => {
      if (product.isGlobal) return true
      if (product.stores && product.stores.length > 0) {
        return product.stores.some(store => 
          (typeof store === 'string' ? store : store._id) === currentStore.value._id
        )
      }
      return false
    })
  }
  
  // Filter by active status - show active and sold out products
  filtered = filtered.filter(product => product.status === 'active' || product.status === 'sold out')
  
  // Filter by category - only show if no category or category is active
  filtered = filtered.filter(product => {
    if (!product.category) return true // No category assigned
    
    // Find the category in categories list (which already contains only active categories)
    const category = categories.value.find(cat => cat.name === product.category)
    return !!category // Category must exist in our active categories list
  })
  
  // Filter by selected category
  if (selectedCategory.value !== 'all') {
    const selectedCat = categories.value.find(cat => cat._id === selectedCategory.value)
    if (selectedCat) {
      filtered = filtered.filter(product => product.category === selectedCat.name)
    }
  }
  
  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(product => 
      product.name.toLowerCase().includes(query) || 
      product.sku?.toLowerCase().includes(query)
    )
  }
  
  return filtered
})

// Helper function to get item price with VAT applied
const getItemPrice = (item) => {
  let price = item.price
  
  if (item.isVattable) {
    if (vatConfig.value.type === 'percent') {
      price = price * (1 + vatConfig.value.value / 100)
    } else if (vatConfig.value.type === 'fixed') {
      price = price + vatConfig.value.value
    }
  }
  
  return price
}

const totalAmount = computed(() => {
  return orderItems.value.reduce((sum, item) => {
    // Get price with VAT applied if vattable
    let itemTotal = getItemPrice(item) * item.quantity
    
    // Add addon prices
    if (item.addons && item.addons.length > 0) {
      const addonTotal = item.addons.reduce((addonSum, addon) => {
        return addonSum + (addon.price * addon.quantity)
      }, 0)
      itemTotal += addonTotal
    }
    
    return sum + itemTotal
  }, 0)
})

const changeAmount = computed(() => {
  const cash = parseFloat(cashAmount.value) || 0
  return cash - totalAmount.value
})

const lastItemQuantity = computed(() => {
  if (orderItems.value.length === 0) return 0
  return orderItems.value[orderItems.value.length - 1].quantity
})

const isCoAdmin = computed(() => {
  const result = currentUser.value && (currentUser.value.role === 'Co-Admin' || currentUser.value.role === 'Admin')
  return result
})

const isElectron = computed(() => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined
})

const refundAmount = computed(() => {
  return refundItems.value.reduce((sum, item) => {
    return sum + (item.price * item.refundQuantity)
  }, 0)
})

const adjustLastItem = async (change) => {
  if (orderItems.value.length === 0) return
  const lastIndex = orderItems.value.length - 1
  await adjustQuantity(lastIndex, change)
}

// Check if product has stock issues
const getStockStatus = (product) => {
  // Don't show stock badges for products with variants
  if (productsWithVariants.value.has(String(product._id))) {
    return 'ok'
  }
  
  // For products without variants, check their quantity
  const quantity = product.quantity || 0
  const alert = product.quantityAlert || 5
  
  if (quantity <= 0) return 'out'
  if (quantity <= alert) return 'low'
  return 'ok'
}

// Check variant stock status
const getVariantStockStatus = (variant) => {
  const quantity = variant.quantity || 0
  const alert = variant.quantityAlert || 5
  
  if (quantity <= 0) return 'out'
  if (quantity <= alert) return 'low'
  return 'ok'
}

const handleProductClick = async (product) => {
  // Check if product has variants
  const variants = await fetchVariants(product._id)
  
  if (variants && variants.length > 0) {
    // Show variants (stock will be checked per variant)
    selectedProduct.value = product
    selectedProductVariants.value = variants
    viewingVariants.value = true
  } else {
    // For products without variants, check stock before adding
    const quantity = product.quantity || 0
    if (quantity <= 0) {
      showAlertModal(`${product.name} is out of stock`, 'Out of Stock')
      return
    }
    addToOrder(product)
  }
}

const backToProducts = () => {
  viewingVariants.value = false
  selectedProduct.value = null
  selectedProductVariants.value = []
}

const addVariantToOrder = (variant) => {
  // Check variant stock before adding
  const quantity = variant.quantity || 0
  if (quantity <= 0) {
    showAlertModal(`${selectedProduct.value.name} - ${variant.value} is out of stock`, 'Out of Stock')
    return // Don't allow adding out of stock variants
  }
  
  const productId = `variant-${variant._id}`
  const existingItem = orderItems.value.find(item => item.id === productId)
  
  if (existingItem) {
    // Check if there's enough stock before increasing quantity
    const currentQuantityInCart = existingItem.quantity
    const availableStock = variant.quantity || 0
    const newQuantity = currentQuantityInCart + 1
    
    if (newQuantity > availableStock) {
      showAlertModal(`Insufficient stock for ${selectedProduct.value.name} - ${variant.value}. Available: ${availableStock}`, 'Out of Stock')
      return
    }
    
    existingItem.quantity = newQuantity
    existingItem.availableStock = availableStock // Update stored stock
    // Update addon quantities
    updateAddonsForItem(existingItem)
  } else {
    const newItem = { 
      id: productId, 
      sku: variant.sku || selectedProduct.value.sku,
      name: `${selectedProduct.value.name} - ${variant.value}`, 
      price: variant.price, 
      quantity: 1,
      isVariant: true,
      variantId: variant._id,
      productId: selectedProduct.value._id,
      availableStock: variant.quantity || 0,
      isVattable: selectedProduct.value.isVattable || false,
      addons: []
    }
    
    // Add product addons using selectedProduct
    if (selectedProduct.value.addons && selectedProduct.value.addons.length > 0) {
      addAddonsToItem(newItem, selectedProduct.value.addons)
    }
    
    orderItems.value.push(newItem)
  }
}

const addToOrder = (product) => {
  const existingItem = orderItems.value.find(item => item.id === product._id)
  
  if (existingItem) {
    // Check if there's enough stock before increasing quantity
    const currentQuantityInCart = existingItem.quantity
    const availableStock = product.quantity || 0
    const newQuantity = currentQuantityInCart + 1
    
    if (newQuantity > availableStock) {
      showAlertModal(`Insufficient stock for ${product.name}. Available: ${availableStock}`, 'Out of Stock')
      return
    }
    
    existingItem.quantity = newQuantity
    // Update addon quantities
    updateAddonsForItem(existingItem)
  } else {
    const newItem = { 
      id: product._id, 
      sku: product.sku,
      name: product.name, 
      price: product.price, 
      quantity: 1,
      isVariant: false,
      productId: product._id,
      isVattable: product.isVattable || false,
      addons: []
    }
    
    // Add product addons
    if (product.addons && product.addons.length > 0) {
      addAddonsToItem(newItem, product.addons)
    }
    
    orderItems.value.push(newItem)
  }
}

// Add addons to a new order item
const addAddonsToItem = (item, productAddons) => {
  productAddons.forEach(addonRef => {
    // Handle both old format (string/object ID) and new format (object with addon ID and quantity)
    let addonId, addonQuantityPerProduct
    
    if (typeof addonRef === 'string') {
      // Old format: just addon ID string
      addonId = addonRef
      addonQuantityPerProduct = 1
    } else if (addonRef.addon) {
      // New format: { addon: addonId, quantity: number }
      addonId = typeof addonRef.addon === 'object' ? addonRef.addon._id : addonRef.addon
      addonQuantityPerProduct = addonRef.quantity || 1
    } else {
      // Fallback: object with _id
      addonId = addonRef._id
      addonQuantityPerProduct = 1
    }
    
    const addon = allAddons.value.find(a => a._id === addonId)
    
    if (addon && addon.status === 'active') {
      // Calculate total addon quantity needed (per-product quantity × item quantity)
      const totalAddonQuantityNeeded = addonQuantityPerProduct * item.quantity
      const addonStock = addon.quantity || 0
      
      if (addonStock >= totalAddonQuantityNeeded) {
        item.addons.push({
          addonId: addon._id,
          name: addon.name,
          price: addon.price || 0,
          quantity: totalAddonQuantityNeeded
        })
      } else {
        // If addon stock insufficient, add available quantity or skip
        if (addonStock > 0) {
          item.addons.push({
            addonId: addon._id,
            name: addon.name,
            price: addon.price || 0,
            quantity: addonStock
          })
          showAlertModal(`Limited stock for ${addon.name}. Only ${addonStock} available (needed ${totalAddonQuantityNeeded}).`, 'Limited Stock')
        } else {
          showAlertModal(`${addon.name} is out of stock and will not be added.`, 'Out of Stock')
        }
      }
    }
  })
}

// Update addon quantities when product quantity changes
const updateAddonsForItem = (item) => {
  if (item.addons && item.addons.length > 0) {
    item.addons.forEach(addon => {
      // Find the addon to check stock
      const addonData = allAddons.value.find(a => a._id === addon.addonId)
      if (addonData) {
        const availableStock = addonData.quantity || 0
        // Limit addon quantity to available stock
        addon.quantity = Math.min(item.quantity, availableStock)
        
        if (addon.quantity < item.quantity) {
          showAlertModal(`Limited stock for ${addon.name}. Only ${addon.quantity} available.`, 'Limited Stock')
        }
      } else {
        addon.quantity = item.quantity
      }
    })
  }
}

const adjustQuantity = async (index, change) => {
  const item = orderItems.value[index]
  const newQuantity = item.quantity + change
  
  // If decreasing quantity or removing item
  if (newQuantity <= 0) {
    orderItems.value.splice(index, 1)
    return
  }
  
  // If increasing quantity, check stock availability
  if (change > 0) {
    if (item.isVariant) {
      // For variants, fetch fresh stock data
      try {
        const variants = await fetchVariants(item.productId)
        const variant = variants.find(v => v._id === item.variantId)
        
        if (!variant) {
          showAlertModal('Variant not found', 'Error')
          return
        }
        
        const availableStock = variant.quantity || 0
        
        if (newQuantity > availableStock) {
          showAlertModal(`Insufficient stock for ${item.name}. Available: ${availableStock}`, 'Out of Stock')
          return
        }
        
        // Update quantity and stored stock
        item.quantity = newQuantity
        item.availableStock = availableStock
        updateAddonsForItem(item)
      } catch (error) {
        console.error('Error checking stock:', error)
        showAlertModal('Failed to check stock availability', 'Error')
        return
      }
    } else {
      // For products without variants, check stock from products array
      const product = products.value.find(p => p._id === item.productId)
      if (product) {
        const availableStock = product.quantity || 0
        
        if (newQuantity > availableStock) {
          showAlertModal(`Insufficient stock for ${item.name}. Available: ${availableStock}`, 'Out of Stock')
          return
        }
      }
      
      // Update quantity
      item.quantity = newQuantity
      updateAddonsForItem(item)
    }
  } else {
    // For decreasing quantity, just update
    item.quantity = newQuantity
    updateAddonsForItem(item)
  }
}

const removeItem = (index) => {
  orderItems.value.splice(index, 1)
  saveCartToLocalStorage()
}

const openRefundModal = () => {
  if (orderItems.value.length > 0) {
    showAlertModal('Please clear the current order before processing a refund.', 'Warning')
    return
  }
  refundTransactionId.value = ''
  refundError.value = ''
  isRefundModalOpen.value = true
  nextTick(() => {
    transactionIdInput.value?.focus()
  })
}

const openPayModal = () => {
  if (orderItems.value.length === 0) {
    showAlertModal('Please add items to order first', 'No Items')
    return
  }
  isPayModalOpen.value = true
}

const closePayModal = () => {
  isPayModalOpen.value = false
}

const selectPaymentMethod = (method) => {
  isPayModalOpen.value = false
  
  if (method === 'Cash') {
    cashAmount.value = ''
    showChange.value = false
    isCashPaymentModalOpen.value = true
  } else if (method === 'E-wallet') {
    rfidPaymentValue.value = ''
    rfidCustomer.value = null
    rfidPaymentError.value = ''
    isRfidPaymentModalOpen.value = true
    // Wait for modal to render before focusing
    nextTick(() => {
      if (rfidPaymentInput.value) {
        rfidPaymentInput.value.focus()
      }
    })
  }
}

const addToCashAmount = (value) => {
  // Prevent multiple dots
  if (value === '.' && cashAmount.value.includes('.')) return
  
  cashAmount.value += value
}

const deleteCashAmount = () => {
  cashAmount.value = cashAmount.value.slice(0, -1)
}

const closeCashPaymentModal = () => {
  isCashPaymentModalOpen.value = false
  cashAmount.value = ''
  showChange.value = false
}

const closeRfidPaymentModal = () => {
  isRfidPaymentModalOpen.value = false
  rfidPaymentValue.value = ''
  rfidCustomer.value = null
  rfidPaymentError.value = ''
}

const handleRfidPayment = async () => {
  const rfid = rfidPaymentValue.value.trim()
  if (!rfid) return
  
  rfidPaymentError.value = ''
  
  try {
    const response = await api.get(`/customers/rfid/${rfid}`)
    if (response.data.success) {
      rfidCustomer.value = response.data.customer
      
      if (rfidCustomer.value.status === 'disabled') {
        rfidPaymentError.value = 'This card is disabled. Please contact support.'
        rfidCustomer.value = null
      }
    }
  } catch (error) {
    rfidPaymentError.value = 'RFID not found. Please check and try again.'
    rfidPaymentValue.value = ''
  }
}

const processCashPayment = async () => {
  if (changeAmount.value < 0) {
    showAlertModal('Insufficient cash amount', 'Payment Error')
    return
  }

  // Check session status
  const isSessionActive = await checkSessionStatus()
  if (!isSessionActive) {
    showAlertModal('Transaction session is not active. Please contact administrator to start the session.', 'Session Inactive')
    return
  }

  // Show loading modal
  isPaymentProcessing.value = true
  paymentProcessingMessage.value = 'Processing cash payment...'

  try {
    const cash = parseFloat(cashAmount.value)
    const change = changeAmount.value

    // Prepare cart items for transaction
    const cartItems = orderItems.value.map(item => ({
      _id: item.id,
      sku: item.sku || 'N/A',
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity,
      isVariant: item.isVariant || false,
      variantId: item.variantId || null,
      productId: item.productId || item.id,
      addons: item.addons || []
    }))

    const transactionData = {
      cart: cartItems,
      paymentMethod: 'Cash',
      discounts: 0,
      netAmount: totalAmount.value,
      VAT: 0,
      totalAmount: totalAmount.value,
      cash: cash,
      change: change,
      employee: currentUser.value?.username || 'cashier',
      store: currentStore.value?._id || currentUser.value?.store?._id
    }

    const response = await api.post('/transactions', transactionData)
    
    if (response.data.success) {
      // Show change display
      showChange.value = true
      
      // Print receipt with transaction ID based on print mode
      if (printMode.value !== 'off' && window.electronAPI) {
        // Convert to plain serializable objects for IPC
        const printableCart = cartItems.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.total,
          isVattable: item.isVattable || false,
          addons: item.addons ? item.addons.map(addon => ({
            name: addon.name,
            price: addon.price,
            quantity: addon.quantity
          })) : []
        }))
        
        const printData = {
          transactionType: 'SALE',
          transactionId: response.data.transactionId,
          cart: printableCart,
          paymentMethod: 'Cash',
          totalAmount: Number(totalAmount.value),
          cash: Number(cash),
          change: Number(change),
          employee: currentUser.value?.username || 'cashier',
          date: new Date().toISOString(),
          storeName: currentStore.value?.storeName || '',
          address: currentStore.value?.address || '',
          contact: currentStore.value?.contact || '',
          tin: currentStore.value?.tin || '',
          vatConfig: {
            type: vatConfig.value.type,
            value: Number(vatConfig.value.value)
          }
        }
        
        if (printMode.value === 'auto') {
          // Auto print immediately
          isPrintingReceipt.value = true
          try {
            await printThermalReceipt(printData, selectedPrinter.value)
          } finally {
            isPrintingReceipt.value = false
          }
        } else if (printMode.value === 'manual') {
          // Show confirmation modal
          pendingPrintData.value = printData
          isPrintConfirmModalOpen.value = true
        }
      }

      showAlertModal(`Payment successful!\nChange: ₱${change.toFixed(2)}`, 'Success')
      
      // Clear order
      orderItems.value = []
      localStorage.removeItem('cashierCart')
      isCashPaymentModalOpen.value = false
      cashAmount.value = ''
      
      // Refresh products to update stock
      await fetchProducts()
      await fetchProductsWithVariants()
      
      setTimeout(() => {
        showChange.value = false
      }, 3000)
    }
  } catch (error) {
    console.error('Payment error:', error)
    showAlertModal('Payment failed: ' + (error.response?.data?.message || error.message), 'Payment Error')
  } finally {
    // Hide loading modal
    isPaymentProcessing.value = false
  }
}

const processRfidPayment = async () => {
  if (!rfidCustomer.value) return
  
  if (rfidCustomer.value.balance < totalAmount.value) {
    showAlertModal('Insufficient balance', 'Payment Error')
    return
  }

  // Check session status
  const isSessionActive = await checkSessionStatus()
  if (!isSessionActive) {
    showAlertModal('Transaction session is not active. Please contact administrator to start the session.', 'Session Inactive')
    return
  }

  // Show loading modal
  isPaymentProcessing.value = true
  paymentProcessingMessage.value = 'Processing E-wallet payment...'

  try {
    // Prepare cart items for transaction
    const cartItems = orderItems.value.map(item => ({
      _id: item.id,
      sku: item.sku || 'N/A',
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity,
      isVariant: item.isVariant || false,
      variantId: item.variantId || null,
      productId: item.productId || item.id,
      addons: item.addons || []
    }))

    const transactionData = {
      cart: cartItems,
      paymentMethod: 'E-wallet',
      discounts: 0,
      netAmount: totalAmount.value,
      VAT: 0,
      totalAmount: totalAmount.value,
      cash: 0,
      change: 0,
      employee: currentUser.value?.username || 'cashier',
      customerId: rfidCustomer.value._id,
      customerRfid: rfidCustomer.value.rfid,
      store: currentStore.value?._id || currentUser.value?.store?._id
    }

    const response = await api.post('/transactions', transactionData)
    
    if (response.data.success) {
      // Update customer balance
      const newBalance = rfidCustomer.value.balance - totalAmount.value
      await api.put(`/customers/${rfidCustomer.value._id}/balance`, {
        amount: newBalance
      })

      // Log customer transaction
      await api.post('/customer-transactions', {
        rfid: rfidCustomer.value.rfid,
        username: rfidCustomer.value.username,
        amount: totalAmount.value,
        transactionType: 'Purchased',
        balanceBefore: rfidCustomer.value.balance,
        balanceAfter: newBalance
      })

      // Print receipt with transaction ID based on print mode
      if (printMode.value !== 'off' && window.electronAPI) {
        // Convert to plain serializable objects for IPC
        const printableCart = cartItems.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.total,
          isVattable: item.isVattable || false,
          addons: item.addons ? item.addons.map(addon => ({
            name: addon.name,
            price: addon.price,
            quantity: addon.quantity
          })) : []
        }))
        
        const printData = {
          transactionType: 'SALE',
          transactionId: response.data.transactionId,
          cart: printableCart,
          paymentMethod: 'E-wallet/RFID',
          customerName: rfidCustomer.value.fullName,
          totalAmount: Number(totalAmount.value),
          cash: 0,
          change: 0,
          previousBalance: Number(rfidCustomer.value.balance),
          remainingBalance: Number(newBalance),
          employee: currentUser.value?.username || 'cashier',
          date: new Date().toISOString(),
          storeName: currentStore.value?.storeName || '',
          address: currentStore.value?.address || '',
          contact: currentStore.value?.contact || '',
          tin: currentStore.value?.tin || '',
          vatConfig: {
            type: vatConfig.value.type,
            value: Number(vatConfig.value.value)
          }
        }
        
        if (printMode.value === 'auto') {
          // Auto print immediately
          isPrintingReceipt.value = true
          try {
            await printThermalReceipt(printData, selectedPrinter.value)
          } finally {
            isPrintingReceipt.value = false
          }
        } else if (printMode.value === 'manual') {
          // Show confirmation modal
          pendingPrintData.value = printData
          isPrintConfirmModalOpen.value = true
        }
      }

      showAlertModal(`Payment successful!\nTransaction ID: ${response.data.transactionId}\nAmount Paid: ₱${totalAmount.value.toFixed(2)}\nRemaining Balance: ₱${newBalance.toFixed(2)}`, 'Success')
      
      // Clear order
      orderItems.value = []
      localStorage.removeItem('cashierCart')
      isRfidPaymentModalOpen.value = false
      rfidCustomer.value = null
      rfidPaymentValue.value = ''
      
      // Refresh products to update stock
      await fetchProducts()
      await fetchProductsWithVariants()
    }
  } catch (error) {
    console.error('Payment error:', error)
    showAlertModal('Payment failed: ' + (error.response?.data?.message || error.message), 'Payment Error')
  } finally {
    // Hide loading modal
    isPaymentProcessing.value = false
  }
}

const openBalanceModal = () => {
  isMenuOpen.value = false
  balanceRfid.value = ''
  balanceCustomer.value = null
  balanceError.value = ''
  isBalanceModalOpen.value = true
  nextTick(() => {
    if (balanceRfidInput.value) {
      balanceRfidInput.value.focus()
    }
  })
}

const closeBalanceModal = () => {
  isBalanceModalOpen.value = false
  balanceCustomer.value = null
  balanceRfid.value = ''
  balanceError.value = ''
}

const handleBalanceRfid = async () => {
  if (!balanceRfid.value.trim()) {
    balanceError.value = 'Please enter or scan RFID'
    return
  }

  try {
    const response = await api.get(`/customers/rfid/${balanceRfid.value.trim()}`)
    if (response.data.success && response.data.customer) {
      balanceCustomer.value = response.data.customer
      balanceError.value = ''
      
      // Log balance inquiry transaction
      await api.post('/customer-transactions', {
        rfid: balanceCustomer.value.rfid,
        username: currentUser.value?.username || 'Cashier',
        amount: 0,
        transactionType: 'Balance Inquiry',
        balanceBefore: balanceCustomer.value.balance,
        balanceAfter: balanceCustomer.value.balance
      })
    } else {
      balanceError.value = 'Customer not found'
      balanceRfid.value = ''
    }
  } catch (error) {
    balanceError.value = error.response?.data?.message || 'Customer not found'
    balanceRfid.value = ''
  }
}

const printBalanceReceipt = async () => {
  if (!balanceCustomer.value) return

  const receiptData = {
    transactionType: 'Balance Inquiry',
    amount: 0,
    previousBalance: balanceCustomer.value.balance,
    currentBalance: balanceCustomer.value.balance,
    customerName: balanceCustomer.value.fullName,
    date: new Date().toISOString(),
    storeName: String(currentStore.value?.storeName || ''),
    address: String(currentStore.value?.address || ''),
    contact: String(currentStore.value?.contact || ''),
    tin: String(currentStore.value?.tin || '')
  }

  try {
    if (printMode.value === 'auto' && selectedPrinter.value) {
      isPrintingReceipt.value = true
      try {
        await printThermalReceipt(receiptData, selectedPrinter.value)
        showToast('Receipt printed successfully', 'success')
      } finally {
        isPrintingReceipt.value = false
      }
    } else if (printMode.value === 'manual') {
      pendingPrintData.value = receiptData
      isPrintConfirmModalOpen.value = true
    } else {
      isPrintingReceipt.value = true
      try {
        await printThermalReceipt(receiptData, selectedPrinter.value)
        showToast('Receipt printed successfully', 'success')
      } finally {
        isPrintingReceipt.value = false
      }
    }
  } catch (error) {
    console.error('Print error:', error)
    showToast('Failed to print receipt', 'error')
  }
}

const openCashInModal = () => {
  isMenuOpen.value = false
  cashInAmount.value = ''
  cashInRfid.value = ''
  cashInCustomer.value = null
  cashInError.value = ''
  isCashInModalOpen.value = true
  nextTick(() => {
    if (cashInRfidInput.value) {
      cashInRfidInput.value.focus()
    }
  })
}

const closeCashInModal = () => {
  isCashInModalOpen.value = false
  cashInCustomer.value = null
  cashInRfid.value = ''
  cashInAmount.value = ''
  cashInError.value = ''
  isCashInVerificationModalOpen.value = false
  cashInVerificationRfid.value = ''
  cashInVerificationError.value = ''
}

const showCashInVerification = () => {
  const amount = parseFloat(cashInAmount.value)
  if (!amount || amount <= 0) {
    showAlertModal('Please enter a valid amount', 'Invalid Amount')
    return
  }
  isCashInVerificationModalOpen.value = true
  cashInVerificationError.value = ''
  nextTick(() => {
    if (cashInVerificationRfidInput.value) {
      cashInVerificationRfidInput.value.focus()
    }
  })
}

const closeCashInVerificationModal = () => {
  isCashInVerificationModalOpen.value = false
  cashInVerificationRfid.value = ''
  cashInVerificationError.value = ''
}

const verifyCashInRfid = async () => {
  if (!cashInVerificationRfid.value.trim()) {
    cashInVerificationError.value = 'Please tap or enter RFID to verify'
    return
  }

  // Check if RFID matches the customer's RFID
  if (cashInVerificationRfid.value.trim() !== cashInCustomer.value.rfid) {
    cashInVerificationError.value = 'RFID does not match. Please use the same card.'
    cashInVerificationRfid.value = ''
    return
  }

  // RFID verified, close verification modal and process cash-in
  isCashInVerificationModalOpen.value = false
  await processCashIn()
}

const handleCashInRfid = async () => {
  if (!cashInRfid.value.trim()) {
    cashInError.value = 'Please enter or scan RFID'
    return
  }

  try {
    const response = await api.get(`/customers/rfid/${cashInRfid.value.trim()}`)
    if (response.data.success && response.data.customer) {
      cashInCustomer.value = response.data.customer
      cashInError.value = ''
    } else {
      cashInError.value = 'Customer not found'
      cashInRfid.value = ''
    }
  } catch (error) {
    cashInError.value = error.response?.data?.message || 'Customer not found'
    cashInRfid.value = ''
  }
}

const appendToCashIn = (value) => {
  const current = cashInAmount.value
  // Prevent multiple dots
  if (value === '.' && current.includes('.')) return
  // Prevent starting with multiple zeros
  if (value === 0 && current === '0') return
  // Limit to 2 decimal places
  if (current.includes('.')) {
    const [, decimal] = current.split('.')
    if (decimal && decimal.length >= 2) return
  }
  cashInAmount.value = current + String(value)
}

const deleteCashInDigit = () => {
  cashInAmount.value = cashInAmount.value.slice(0, -1)
}

const openVoidModal = () => {
  if (orderItems.value.length === 0) {
    showAlertModal('No items to void', 'Void Transaction')
    return
  }
  isVoidModalOpen.value = true
}

const openClearAllModal = () => {
  if (orderItems.value.length === 0) {
    showAlertModal('No items to clear', 'Clear All')
    return
  }
  isClearAllModalOpen.value = true
}

const processPayment = () => {
  // This function is no longer used - replaced by processCashPayment and processRfidPayment
  showAlertModal('Please select a payment method', 'Payment Method')
  isPayModalOpen.value = true
}

const processCashIn = async () => {
  const amount = parseFloat(cashInAmount.value)
  if (!amount || amount <= 0) {
    showAlertModal('Please enter a valid amount', 'Invalid Amount')
    return
  }

  if (!cashInCustomer.value) {
    showAlertModal('No customer selected', 'Error')
    return
  }

  try {
    isLoading.value = true
    const previousBalance = cashInCustomer.value.balance
    const newBalance = previousBalance + amount
    
    const response = await api.put(`/customers/${cashInCustomer.value._id}/balance`, {
      amount: newBalance
    })
    
    if (response.data.success) {
      // Log the transaction
      await api.post('/customer-transactions', {
        rfid: cashInCustomer.value.rfid,
        username: currentUser.value?.username || 'Cashier',
        amount: amount,
        transactionType: 'Cash-in',
        balanceBefore: previousBalance,
        balanceAfter: newBalance
      })
      
      // Prepare receipt data
      const receiptData = {
        transactionType: 'CASH-IN',
        amount: amount,
        previousBalance: previousBalance,
        currentBalance: newBalance,
        customerName: cashInCustomer.value.fullName,
        date: new Date().toISOString(),
        storeName: String(currentStore.value?.storeName || ''),
        address: String(currentStore.value?.address || ''),
        contact: String(currentStore.value?.contact || ''),
        tin: String(currentStore.value?.tin || '')
      }
      
      // Print receipt based on mode
      try {
        if (printMode.value === 'auto' && selectedPrinter.value) {
          isPrintingReceipt.value = true
          try {
            await printThermalReceipt(receiptData, selectedPrinter.value)
            showToast(`₱${amount.toFixed(2)} added successfully. Receipt printed.`, 'success')
          } finally {
            isPrintingReceipt.value = false
          }
        } else if (printMode.value === 'manual') {
          pendingPrintData.value = receiptData
          isPrintConfirmModalOpen.value = true
          showToast(`₱${amount.toFixed(2)} added successfully`, 'success')
        } else {
          showToast(`₱${amount.toFixed(2)} added successfully`, 'success')
        }
      } catch (printError) {
        console.error('Print error:', printError)
        showToast(`₱${amount.toFixed(2)} added successfully (print failed)`, 'warning')
      }
      
      closeCashInModal()
    }
  } catch (error) {
    console.error('Error processing cash in:', error)
    showAlertModal(error.response?.data?.message || 'Failed to process cash in', 'Error')
  } finally {
    isLoading.value = false
  }
}

const processVoid = () => {
  orderItems.value = []
  localStorage.removeItem('cashierCart')
  showAlertModal('Transaction voided successfully!', 'Void Complete')
  isVoidModalOpen.value = false
}

const addToRefundTransactionId = (value) => {
  refundTransactionId.value += value
}

const deleteRefundTransactionId = () => {
  refundTransactionId.value = refundTransactionId.value.slice(0, -1)
}

const pasteTransactionId = async () => {
  try {
    // Import clipboard utility dynamically
    const { readFromClipboard, isClipboardAvailable } = await import('@/utils/clipboard.js')
    
    // Try to read from clipboard (works on HTTPS)
    if (isClipboardAvailable()) {
      const text = await readFromClipboard()
      refundTransactionId.value = text
      refundError.value = ''
    } else {
      // On HTTP: Focus input and prompt user to paste manually
      transactionIdInput.value?.focus()
      showAlertModal('Press Ctrl+V (or Cmd+V on Mac) to paste the Transaction ID', 'Paste Manually')
    }
  } catch (error) {
    console.error('Error pasting transaction ID:', error)
    // Fallback: Focus input so user can paste manually
    transactionIdInput.value?.focus()
    showAlertModal('Press Ctrl+V (or Cmd+V on Mac) to paste the Transaction ID', 'Paste Manually')
  }
}

const closeRefundModal = () => {
  isRefundModalOpen.value = false
  refundTransactionId.value = ''
  refundError.value = ''
}

const searchRefundTransaction = async () => {
  if (!refundTransactionId.value) {
    refundError.value = 'Please enter a transaction ID'
    return
  }

  try {
    isLoading.value = true
    refundError.value = ''

    const response = await api.get(`/transactions/by-transaction-id/${refundTransactionId.value}`)
    
    if (response.data.success) {
      const transaction = response.data.transaction
      
      // Check if already refunded
      if (transaction.status === 'Returned') {
        refundError.value = 'This transaction has already been refunded'
        return
      }
      
      if (transaction.status === 'Voided' || transaction.status === 'Canceled') {
        refundError.value = 'Cannot refund a voided or canceled transaction'
        return
      }

      // Fetch customer details if RFID payment
      if (transaction.customerId) {
        try {
          const customerResponse = await api.get(`/customers/${transaction.customerId}`)
          transaction.customerDetails = customerResponse.data.customer
        } catch (error) {
          console.error('Error fetching customer:', error)
        }
      }

      refundTransaction.value = transaction
      refundItems.value = transaction.cart.map(item => ({
        ...item,
        maxQuantity: item.quantity,
        refundQuantity: item.quantity // Default to full refund
      }))

      isRefundModalOpen.value = false
      isRefundDetailsModalOpen.value = true
    }
  } catch (error) {
    console.error('Error fetching transaction:', error)
    refundError.value = error.response?.data?.message || 'Transaction not found'
  } finally {
    isLoading.value = false
  }
}

const closeRefundDetailsModal = () => {
  isRefundDetailsModalOpen.value = false
  refundTransaction.value = null
  refundItems.value = []
}

const adjustRefundQuantity = (index, change) => {
  const item = refundItems.value[index]
  const newQuantity = item.refundQuantity + change
  
  if (newQuantity >= 0 && newQuantity <= item.maxQuantity) {
    item.refundQuantity = newQuantity
  }
}

const processRefund = async () => {
  // Check session status
  const isSessionActive = await checkSessionStatus()
  if (!isSessionActive) {
    showAlertModal('Transaction session is not active. Refund operations are disabled.', 'Session Inactive')
    return
  }

  try {
    // Validate at least one item is being refunded
    const itemsToRefund = refundItems.value.filter(item => item.refundQuantity > 0)
    
    if (itemsToRefund.length === 0) {
      showAlertModal('Please select at least one item to refund', 'Error')
      return
    }

    isLoading.value = true

    const refundData = {
      originalTransactionId: refundTransaction.value._id,
      transactionId: refundTransaction.value.transactionId,
      refundItems: itemsToRefund.map(item => ({
        _id: item._id,
        sku: item.sku,
        name: item.name,
        price: item.price,
        quantity: item.refundQuantity,
        total: item.price * item.refundQuantity,
        isVariant: item.isVariant,
        variantId: item.variantId,
        productId: item.productId,
        addons: item.addons
      })),
      refundAmount: refundAmount.value,
      paymentMethod: refundTransaction.value.paymentMethod,
      customerId: refundTransaction.value.customerId,
      customerRfid: refundTransaction.value.customerRfid,
      employee: currentUser.value?.username || 'unknown',
      store: currentStore.value?._id || currentUser.value?.store?._id
    }

    // Process refund on backend
    const response = await api.post('/transactions/refund', refundData)

    if (response.data.success) {
      // Show success message with balance for E-wallet refunds
      if (refundTransaction.value.paymentMethod === 'E-wallet' && response.data.newCustomerBalance !== null) {
        showAlertModal(`Refund processed successfully!\nRefund Amount: ₱${refundAmount.value.toFixed(2)}\nNew Balance: ₱${response.data.newCustomerBalance.toFixed(2)}`, 'Success')
      }

      // Print refund receipt - serialize all data to avoid cloning issues
      const printData = {
        type: 'refund',
        transactionId: response.data.refundTransactionId,
        originalTransactionId: refundTransaction.value.transactionId,
        items: itemsToRefund.map(item => ({
          name: String(item.name),
          price: Number(item.price),
          quantity: Number(item.refundQuantity),
          sku: String(item.sku || ''),
          isVattable: Boolean(item.isVattable || false),
          addons: Array.isArray(item.addons) ? item.addons.map(addon => ({
            name: String(addon.name),
            price: Number(addon.price),
            quantity: Number(addon.quantity || 1)
          })) : []
        })),
        refundAmount: Number(refundAmount.value),
        paymentMethod: String(refundTransaction.value.paymentMethod),
        customer: refundTransaction.value.customerDetails ? {
          fullName: String(refundTransaction.value.customerDetails.fullName),
          rfid: String(refundTransaction.value.customerDetails.rfid || ''),
          balance: Number(refundTransaction.value.customerDetails.balance || 0)
        } : null,
        date: new Date().toISOString(),
        cashier: String(currentUser.value?.username || 'Cashier'),
        storeName: String(currentStore.value?.storeName || ''),
        address: String(currentStore.value?.address || ''),
        contact: String(currentStore.value?.contact || ''),
        tin: String(currentStore.value?.tin || ''),
        vatConfig: {
          type: String(vatConfig.value.type),
          value: Number(vatConfig.value.value)
        }
      }

      try {
        if (printMode.value === 'auto' && selectedPrinter.value) {
          isPrintingReceipt.value = true
          try {
            await printThermalReceipt(printData, selectedPrinter.value)
            if (refundTransaction.value.paymentMethod !== 'E-wallet') {
              showToast('Refund processed and receipt printed', 'success')
            }
          } finally {
            isPrintingReceipt.value = false
          }
        } else {
          pendingPrintData.value = printData
          isPrintConfirmModalOpen.value = true
          if (refundTransaction.value.paymentMethod !== 'E-wallet') {
            showToast('Refund processed successfully', 'success')
          }
        }
      } catch (printError) {
        console.error('Print error:', printError)
        showAlertModal('Refund processed but failed to print receipt: ' + printError.message, 'Print Error')
      }

      closeRefundDetailsModal()
    }
  } catch (error) {
    console.error('Error processing refund:', error)
    showAlertModal(error.response?.data?.message || 'Failed to process refund', 'Error')
  } finally {
    isLoading.value = false
  }
}

const openBarcodeModal = () => {
  isBarcodeModalOpen.value = true
  // Use nextTick to ensure modal is fully rendered before focusing
  nextTick(() => {
    if (manualBarcodeInput.value) {
      manualBarcodeInput.value.focus()
    }
  })
}

const findProductByBarcode = (barcode) => {
  // Search in products by SKU
  const product = products.value.find(p => 
    p.sku && p.sku.toLowerCase() === barcode.toLowerCase() &&
    p.status === 'active'
  )
  
  if (product) {
    // Check if product belongs to current store
    if (currentStore.value) {
      if (product.isGlobal) return product
      if (product.stores && product.stores.length > 0) {
        const belongsToStore = product.stores.some(store => 
          (typeof store === 'string' ? store : store._id) === currentStore.value._id
        )
        if (belongsToStore) return product
      }
      return null
    }
    return product
  }
  
  return null
}

const handleBarcodeScanned = async () => {
  const barcode = barcodeValue.value.trim()
  if (!barcode) return
  
  barcodeError.value = ''
  
  const product = findProductByBarcode(barcode)
  
  if (product) {
    // Check if product has variants
    const variants = await fetchVariants(product._id)
    
    if (variants && variants.length > 0) {
      // For products with variants, add the first available variant
      const availableVariant = variants.find(v => v.quantity > 0)
      if (availableVariant) {
        addVariantToOrder(availableVariant)
      } else {
        barcodeError.value = 'Item not registered or out of stock'
        setTimeout(() => { barcodeError.value = '' }, 3000)
      }
    } else {
      // Check stock for products without variants
      const quantity = product.quantity || 0
      if (quantity > 0) {
        addToOrder(product)
      } else {
        barcodeError.value = 'Item not registered or out of stock'
        setTimeout(() => { barcodeError.value = '' }, 3000)
      }
    }
  } else {
    barcodeError.value = 'Item not registered'
    setTimeout(() => { barcodeError.value = '' }, 3000)
  }
  
  barcodeValue.value = ''
  refocusBarcodeInput()
}

const processManualBarcode = async () => {
  const barcode = manualBarcode.value.trim()
  if (!barcode) return
  
  barcodeError.value = ''
  
  const product = findProductByBarcode(barcode)
  
  if (product) {
    // Check if product has variants
    const variants = await fetchVariants(product._id)
    
    if (variants && variants.length > 0) {
      // For products with variants, add the first available variant
      const availableVariant = variants.find(v => v.quantity > 0)
      if (availableVariant) {
        addVariantToOrder(availableVariant)
        manualBarcode.value = ''
        isBarcodeModalOpen.value = false
      } else {
        barcodeError.value = 'Item not registered or out of stock'
        setTimeout(() => { barcodeError.value = '' }, 3000)
      }
    } else {
      // Check stock for products without variants
      const quantity = product.quantity || 0
      if (quantity > 0) {
        addToOrder(product)
        manualBarcode.value = ''
        isBarcodeModalOpen.value = false
      } else {
        barcodeError.value = 'Item not registered or out of stock'
        setTimeout(() => { barcodeError.value = '' }, 3000)
      }
    }
  } else {
    barcodeError.value = 'Item not registered'
    setTimeout(() => { barcodeError.value = '' }, 3000)
  }
  
  refocusBarcodeInput()
}

const refocusBarcodeInput = () => {
  nextTick(() => {
    if (barcodeInput.value) {
      barcodeInput.value.focus()
    }
  })
}

const handlePageClick = (event) => {
  // Don't refocus if any modal is open
  if (isSettingsModalOpen.value || isPrintConfirmModalOpen.value || isPayModalOpen.value || 
      isCashPaymentModalOpen.value || isRfidPaymentModalOpen.value || isBarcodeModalOpen.value ||
      isBalanceModalOpen.value || isCashInModalOpen.value || isVoidModalOpen.value ||
      isLogoutModalOpen.value || isAlertModalOpen.value ||
      isRefundModalOpen.value || isRefundDetailsModalOpen.value) {
    return
  }
  
  // Don't refocus if clicking on an input, textarea, button, select, or any interactive element
  const target = event.target
  const isInteractive = target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || 
                        target.tagName === 'BUTTON' ||
                        target.tagName === 'SELECT' ||
                        target.tagName === 'A' ||
                        target.closest('button') !== null ||
                        target.closest('input') !== null ||
                        target.closest('textarea') !== null ||
                        target.closest('select') !== null
  
  if (!isInteractive) {
    // Use Promise to ensure DOM is ready
    Promise.resolve().then(() => {
      if (barcodeInput.value && !document.activeElement?.closest('input[type="text"]')) {
        barcodeInput.value.focus()
      }
    })
  }
}

const handleBarcodeBlur = () => {
  // Only refocus barcode input if no other input has focus and no modals are open
  Promise.resolve().then(() => {
    // Check if any modal is open
    if (isSettingsModalOpen.value || isPrintConfirmModalOpen.value || isPayModalOpen.value || 
        isCashPaymentModalOpen.value || isRfidPaymentModalOpen.value || isBarcodeModalOpen.value ||
        isBalanceModalOpen.value || isCashInModalOpen.value || isVoidModalOpen.value ||
        isLogoutModalOpen.value || isAlertModalOpen.value ||
        isRefundModalOpen.value || isRefundDetailsModalOpen.value) {
      return
    }
    
    // Check if another input/select/textarea is focused
    const activeElement = document.activeElement
    const isOtherInputFocused = activeElement && 
                                (activeElement.tagName === 'INPUT' || 
                                 activeElement.tagName === 'TEXTAREA' ||
                                 activeElement.tagName === 'SELECT') &&
                                activeElement !== barcodeInput.value
    
    // Only refocus if no other input is focused
    if (!isOtherInputFocused && barcodeInput.value) {
      barcodeInput.value.focus()
    }
  })
}

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const openLockConfirmModal = () => {
  isLockConfirmModalOpen.value = true
  isMenuOpen.value = false
}

const lockPOS = () => {
  isPOSLocked.value = true
  isLockConfirmModalOpen.value = false
  lockedByUser.value = currentUser.value.username || 'Unknown User'
  unlockPassword.value = ''
  unlockRFID.value = ''
  unlockError.value = ''
  
  // Use nextTick to ensure lock screen is rendered
  nextTick(() => {
    if (unlockMethod.value === 'password' && unlockPasswordInput.value) {
      unlockPasswordInput.value.focus()
    } else if (unlockMethod.value === 'rfid' && unlockRFIDInput.value) {
      unlockRFIDInput.value.focus()
    }
  })
}

const attemptUnlock = async () => {
  unlockError.value = ''
  
  try {
    const user = currentUser.value
    
    if (unlockMethod.value === 'password') {
      if (!unlockPassword.value) {
        unlockError.value = 'Please enter your password'
        return
      }
      
      // Verify password
      const response = await api.post('/users/verify-password', {
        userId: user._id,
        password: unlockPassword.value
      })
      
      if (response.data.success) {
        isPOSLocked.value = false
        unlockPassword.value = ''
        showToast('POS unlocked successfully', 'success')
      } else {
        unlockError.value = 'Invalid password'
      }
    } else if (unlockMethod.value === 'rfid') {
      if (!unlockRFID.value) {
        unlockError.value = 'Please scan your RFID card'
        return
      }
      
      // Verify RFID
      if (user.rfid && user.rfid === unlockRFID.value) {
        isPOSLocked.value = false
        unlockRFID.value = ''
        showToast('POS unlocked successfully', 'success')
      } else {
        unlockError.value = 'Invalid RFID'
        unlockRFID.value = ''
      }
    }
  } catch (error) {
    console.error('Error verifying credentials:', error)
    unlockError.value = error.response?.data?.message || 'Failed to verify credentials'
  }
}

const openLogoutModal = () => {
  isMenuOpen.value = false
  isLogoutModalOpen.value = true
}

const confirmLogout = () => {
  localStorage.removeItem('user')
  router.push('/')
}



const goToAdminPanel = () => {
  isMenuOpen.value = false
  router.push('/admin')
}

const goToCustomerTransactions = () => {
  isMenuOpen.value = false
  router.push('/pos/customer-transactions')
}

const goToTransactions = () => {
  isMenuOpen.value = false
  router.push('/pos/transactions')
}

const goToSales = () => {
  isMenuOpen.value = false
  router.push('/pos/sales')
}

const logout = () => {
  localStorage.removeItem('user')
  router.push('/')
}

const openSettingsModal = () => {
  isMenuOpen.value = false
  isSettingsModalOpen.value = true
}

const openKeyboardModal = (target) => {
  keyboardTarget.value = target
  // Pre-fill with current value if editing a specific field
  if (target === 'unlockPassword') {
    keyboardValue.value = unlockPassword.value
  } else if (target === 'unlockRFID') {
    keyboardValue.value = unlockRFID.value
  } else if (target === 'searchQuery') {
    keyboardValue.value = searchQuery.value
  } else if (target === 'manualBarcode') {
    keyboardValue.value = manualBarcode.value
  } else {
    // For general keyboard, try to get the currently focused input value
    const activeEl = document.activeElement
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
      keyboardValue.value = activeEl.value || ''
    } else {
      keyboardValue.value = ''
    }
  }
  isKeyboardModalOpen.value = true
}

const closeKeyboardModal = () => {
  isKeyboardModalOpen.value = false
  keyboardTarget.value = ''
  keyboardValue.value = ''
}

const applyKeyboardValue = () => {
  if (keyboardTarget.value === 'unlockPassword') {
    unlockPassword.value = keyboardValue.value
  } else if (keyboardTarget.value === 'unlockRFID') {
    unlockRFID.value = keyboardValue.value
  } else if (keyboardTarget.value === 'searchQuery') {
    searchQuery.value = keyboardValue.value
  } else if (keyboardTarget.value === 'manualBarcode') {
    manualBarcode.value = keyboardValue.value
  } else if (keyboardTarget.value === 'general' || keyboardTarget.value === 'lockscreen') {
    // For general/lockscreen keyboard, find the visible input and update it
    // This handles the case when user clicks keyboard button in navbar
    if (isPOSLocked.value) {
      // When locked, apply to unlock fields
      if (unlockMethod.value === 'password') {
        unlockPassword.value = keyboardValue.value
      } else {
        unlockRFID.value = keyboardValue.value
      }
    } else {
      // When not locked, apply to search query
      searchQuery.value = keyboardValue.value
    }
  }
  closeKeyboardModal()
}

const toggleFullScreen = async () => {
  try {
    // Use Electron API if available
    if (window.electronAPI?.toggleFullscreen) {
      await window.electronAPI.toggleFullscreen()
    } else {
      // Fallback to browser fullscreen API
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        }
      }
    }
  } catch (err) {
    showToast('Failed to toggle fullscreen mode', 'error')
  }
}

const reloadApp = async () => {
  try {
    // Use Electron API if available
    if (window.electronAPI?.reloadApp) {
      await window.electronAPI.reloadApp()
    } else {
      // Fallback to browser reload
      window.location.reload()
    }
  } catch (err) {
    showToast('Failed to reload application', 'error')
  }
}

const rebootSystem = async () => {
  if (!isElectron.value) return
  
  // Require admin verification
  adminVerificationMessage.value = 'System reboot requires administrator privileges. Please verify your credentials.'
  adminVerificationAction.value = 'reboot'
  isAdminVerificationModalOpen.value = true
  nextTick(() => {
    if (adminVerificationMethod.value === 'password') {
      adminPasswordInput.value?.focus()
    } else {
      adminRfidInput.value?.focus()
    }
  })
}

const shutdownSystem = async () => {
  if (!isElectron.value) return
  
  // Require admin verification
  adminVerificationMessage.value = 'System shutdown requires administrator privileges. Please verify your credentials.'
  adminVerificationAction.value = 'shutdown'
  isAdminVerificationModalOpen.value = true
  nextTick(() => {
    if (adminVerificationMethod.value === 'password') {
      adminPasswordInput.value?.focus()
    } else {
      adminRfidInput.value?.focus()
    }
  })
}

const closeAdminVerificationModal = () => {
  isAdminVerificationModalOpen.value = false
  adminPassword.value = ''
  adminRfid.value = ''
  adminVerificationError.value = ''
  adminVerificationAction.value = null
}

const verifyAdminCredentials = async () => {
  adminVerificationError.value = ''
  
  try {
    const credentials = adminVerificationMethod.value === 'password' 
      ? { password: adminPassword.value }
      : { rfid: adminRfid.value }
    
    const response = await api.post('/users/verify-admin', credentials)
    
    if (response.data.success) {
      // Admin verified, execute the action
      closeAdminVerificationModal()
      
      if (adminVerificationAction.value === 'reboot') {
        await executeReboot()
      } else if (adminVerificationAction.value === 'shutdown') {
        await executeShutdown()
      }
    } else {
      adminVerificationError.value = 'Invalid admin credentials'
    }
  } catch (error) {
    adminVerificationError.value = error.response?.data?.message || 'Verification failed'
  }
}

const executeReboot = async () => {
  try {
    const response = await api.post('/system/reboot')
    if (response.data.success) {
      showToast('System will reboot in 5 seconds...', 'info')
    }
  } catch (error) {
    showToast('Reboot failed. Please ensure admin privileges and permissions are configured.', 'error')
    console.error('Reboot error:', error)
  }
}

const executeShutdown = async () => {
  try {
    const response = await api.post('/system/shutdown')
    if (response.data.success) {
      showToast('System will shutdown in 5 seconds...', 'info')
    }
  } catch (error) {
    showToast('Shutdown failed. Please ensure admin privileges and permissions are configured.', 'error')
    console.error('Shutdown error:', error)
  }
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

const refreshPrinters = async () => {
  if (!window.electronAPI) {
    showToast('Printer management only available in desktop app', 'warning')
    return
  }
  
  isRefreshingPrinters.value = true
  try {
    const printersData = await getAvailablePrinters()
    availablePrinters.value = printersData.allPrinters || []
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
          selectedPrinter.value = response.data.preferences.selectedPrinter || null
          printMode.value = response.data.preferences.printMode || 'manual'
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

const confirmPrint = async () => {
  if (pendingPrintData.value) {
    isPrintingReceipt.value = true
    try {
      await printThermalReceipt(pendingPrintData.value, selectedPrinter.value)
      showToast('Receipt printed successfully', 'success')
    } catch (error) {
      console.error('Print error:', error)
      showAlertModal('Failed to print receipt: ' + error.message, 'Print Error')
    } finally {
      isPrintingReceipt.value = false
    }
    isPrintConfirmModalOpen.value = false
    pendingPrintData.value = null
  }
}

const testPrint = async () => {
  const testData = {
    isTestPrint: true,
    storeName: '',
    address: '',
    contact: '',
    tin: '',
    transactionId: 'TEST',
    date: new Date().toISOString(),
    employee: 'Test',
    paymentMethod: 'Cash',
    totalAmount: 0,
    cash: 0,
    change: 0,
    cart: [{ name: 'TEST PRINT', quantity: 1, price: 0, isVattable: false }],
    vatConfig: { type: 'percent', value: 0 }
  }

  try {
    isPrintingReceipt.value = true
    await printThermalReceipt(testData, selectedPrinter.value)
    showToast('Test print sent', 'success')
  } catch (error) {
    showToast('Failed: ' + error.message, 'error')
  } finally {
    isPrintingReceipt.value = false
  }
}

const cancelPrint = () => {
  isPrintConfirmModalOpen.value = false
  pendingPrintData.value = null
}

// Initialize data on component mount
// Save cart to localStorage
const saveCartToLocalStorage = () => {
  try {
    localStorage.setItem('cashierCart', JSON.stringify(orderItems.value))
  } catch (error) {
    console.error('Error saving cart to localStorage:', error)
  }
}

// Load cart from localStorage
const loadCartFromLocalStorage = () => {
  try {
    const savedCart = localStorage.getItem('cashierCart')
    if (savedCart) {
      orderItems.value = JSON.parse(savedCart)
    }
  } catch (error) {
    console.error('Error loading cart from localStorage:', error)
    localStorage.removeItem('cashierCart')
  }
}

// Watch orderItems for changes and save to localStorage
watch(orderItems, () => {
  saveCartToLocalStorage()
}, { deep: true })

// Watch unlockMethod to refocus input
watch(unlockMethod, () => {
  if (isPOSLocked.value) {
    nextTick(() => {
      if (unlockMethod.value === 'password' && unlockPasswordInput.value) {
        unlockPasswordInput.value.focus()
      } else if (unlockMethod.value === 'rfid' && unlockRFIDInput.value) {
        unlockRFIDInput.value.focus()
      }
    })
  }
})

// Watch adminVerificationMethod to refocus input
watch(adminVerificationMethod, () => {
  if (isAdminVerificationModalOpen.value) {
    nextTick(() => {
      if (adminVerificationMethod.value === 'password') {
        adminPasswordInput.value?.focus()
      } else {
        adminRfidInput.value?.focus()
      }
    })
  }
})

onMounted(async () => {
  await fetchCurrentUser()
  await Promise.all([
    fetchCategories(),
    fetchProducts(),
    fetchAddons(),
    fetchVATConfig(),
    loadPrinterPreference(),
    checkSessionStatus()
  ])
  
  // Load saved cart from localStorage
  loadCartFromLocalStorage()
  
  // Check session status every 30 seconds
  setInterval(checkSessionStatus, 30000)
  
  // Focus barcode input for automatic scanning
  refocusBarcodeInput()
})</script>
