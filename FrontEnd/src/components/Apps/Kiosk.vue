<template>
  <div class="kiosk-wrapper">
    <div class="header">
      <h1 class="text-2xl font-bold text-center py-4">Kiosk POS System</h1>
    </div>

    <div class="kiosk-content">
      <div class="category-list">
        <div class="grid grid-cols-3 gap-2 mb-4">
          <button
            v-for="category in categories"
            :key="category.name"
            class="btn btn-category"
            :class="{ 'btn-active': selectedCategory === category.name }"
            @click="fetchProducts(category.name)"
          >
            {{ category.name }}
          </button>
        </div>
      </div>

      <div class="product-grid">
        <div v-for="product in products" :key="product.id" class="product-item" @click="addProduct(product)">
          <img :src="product.image ? `${imgURL}${product.image}` : '/img/icons/no-image-icon.png'" alt="Product" class="product-image" />
          <div class="product-details">
            <h3 class="product-name">{{ product.name }}</h3>
            <p class="product-price">${{ product.price.toFixed(2) }}</p>
          </div>
        </div>
      </div>

      <div class="order-summary">
        <h2 class="text-xl font-bold mb-2">Order Summary</h2>
        <div class="order-items">
          <div v-for="item in cart" :key="item.id" class="order-item">
            <span>{{ item.name }} x {{ item.quantity }}</span>
            <span>${{ (item.price * item.quantity).toFixed(2) }}</span>
          </div>
        </div>
        <div class="total-section">
          <div class="flex justify-between">
            <span>Subtotal:</span>
            <span>${{ subtotal.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Tax ({{ VAT }}%):</span>
            <span>${{ ((subtotal * VAT) / 100).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between font-bold">
            <span>Total:</span>
            <span>${{ total.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button class="btn btn-primary" @click="openPaymentModal" :disabled="cart.length === 0">
          Pay Now
        </button>
        <button class="btn btn-secondary" @click="clearCart" :disabled="cart.length === 0">
          Clear Cart
        </button>
      </div>
    </div>

    <!-- Payment Modal -->
    <div v-if="showPaymentModal" class="modal">
      <div class="modal-content">
        <h2 class="text-xl font-bold mb-4">Payment</h2>
        <p class="mb-2">Total to pay: ${{ total.toFixed(2) }}</p>
        <input v-model="clientPayment" type="number" placeholder="Enter amount" class="w-full p-2 mb-4 border rounded" />
        <div class="flex justify-between">
          <button @click="processPayment" class="btn btn-primary">Confirm Payment</button>
          <button @click="closePaymentModal" class="btn btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>
