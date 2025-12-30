<template>
  <div class="bg-gray-100 min-h-screen flex flex-col">
    <header class="bg-white shadow p-4 rounded-b-2xl">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold">Student Portal</h1>
        <button v-if="isLoggedIn" @click="logout" class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-2xl shadow-md">
          Logout
        </button>
      </div>
    </header>

    <main class="flex-1 p-4">
      <!-- Login Form -->
      <div v-if="!isLoggedIn" class="flex items-center justify-center min-h-[80vh]">
        <div class="bg-white rounded-2xl p-8 shadow w-full max-w-md">
          <h3 class="font-bold text-2xl mb-6 text-center">Student Portal Login</h3>
          <form @submit.prevent="handleLogin">
            <div class="mb-4">
              <label class="block text-sm font-bold mb-2">Full Name</label>
              <input v-model="loginForm.fullName" type="text" required class="w-full p-3 rounded-xl border border-gray-300" />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-bold mb-2">RFID Code</label>
              <input v-model="loginForm.rfid" type="text" required class="w-full p-3 rounded-xl border border-gray-300" />
            </div>
            <button type="submit" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl">
              Login to Dashboard
            </button>
          </form>
          <div class="bg-gray-100 p-4 rounded-xl text-center text-sm text-gray-600 mt-4">
            <p><strong>Demo Account:</strong></p>
            <p>Juan Dela Cruz - RFID12A4B8C9</p>
          </div>
        </div>
      </div>

      <!-- Dashboard -->
      <div v-else class="flex flex-col lg:flex-row gap-6">
        <!-- Student Info -->
        <div class="w-full lg:w-1/2">
          <div class="bg-white rounded-2xl p-6 shadow">
            <h3 class="font-bold text-lg mb-4">{{ currentStudent.fullName }}</h3>
            
            <div class="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <p class="text-sm text-gray-600">Current Balance</p>
              <p class="text-3xl font-bold text-green-600">₱{{ currentStudent.balance.toFixed(2) }}</p>
            </div>
            
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p class="text-sm text-gray-600 mb-2">RFID Number</p>
              <p class="font-mono font-bold">{{ currentStudent.rfid }}</p>
            </div>
            
            <div class="bg-gray-50 rounded-xl p-4">
              <p class="text-sm font-bold mb-2">Student Details</p>
              <p class="text-sm"><strong>Email:</strong> {{ currentStudent.email }}</p>
              <p class="text-sm"><strong>Birthday:</strong> {{ currentStudent.birthday }}</p>
            </div>
          </div>
        </div>

        <!-- Transactions -->
        <div class="w-full lg:w-1/2">
          <div class="bg-white rounded-2xl p-6 shadow">
            <h3 class="font-bold text-lg mb-4">My Transactions</h3>
            <div class="space-y-3 max-h-96 overflow-y-auto">
              <div v-for="transaction in transactions" :key="transaction._id" 
                   :class="transaction.status === 'Voided' ? 'bg-red-50 border border-red-200' : 'bg-gray-50'" 
                   class="p-3 rounded-xl">
                <div class="flex justify-between items-start mb-1">
                  <span class="font-semibold text-sm">{{ transaction.type }}</span>
                  <span :class="transaction.amount > 0 ? 'text-green-600' : 'text-red-600'" class="font-bold">
                    ₱{{ Math.abs(transaction.amount).toFixed(2) }}
                  </span>
                </div>
                <div class="flex justify-between items-center text-xs text-gray-600">
                  <span>{{ transaction.id }}</span>
                  <span>{{ transaction.date }}</span>
                </div>
                <div :class="transaction.status === 'Completed' ? 'text-green-600' : 'text-red-600'" class="text-xs mt-1 font-semibold">
                  {{ transaction.status }}
                </div>
              </div>
              <div v-if="transactions.length === 0" class="text-center text-gray-500 py-8">
                No transactions found
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Alert Modal -->
    <Modal :is-open="isAlertModalOpen" title="Login Error" @close="isAlertModalOpen = false">
      <div class="text-center py-4">
        <p class="text-lg text-gray-700">{{ alertModalMessage }}</p>
      </div>
      <div class="flex justify-center mt-4">
        <button @click="isAlertModalOpen = false" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-8 rounded-2xl">OK</button>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Modal from '../../components/Modal.vue'

const isLoggedIn = ref(false)
const isAlertModalOpen = ref(false)
const alertModalMessage = ref('')
const loginForm = ref({
  fullName: '',
  rfid: ''
})

const currentStudent = ref({
  fullName: '',
  email: '',
  rfid: '',
  birthday: '',
  balance: 0
})

const transactions = ref([])

// Demo student data
const demoStudent = {
  fullName: 'Juan Dela Cruz',
  email: 'juan.delacruz@email.com',
  rfid: 'RFID12A4B8C9',
  birthday: '2000-05-15',
  balance: 245.75
}

const demoTransactions = [
  { _id: 1, id: 'TXN101', type: 'Cash In', amount: 200.00, date: '2025-09-27 09:00 AM', status: 'Completed' },
  { _id: 2, id: 'TXN102', type: 'Payment', amount: -45.25, date: '2025-09-26 12:30 PM', status: 'Completed' },
  { _id: 3, id: 'TXN103', type: 'Payment', amount: -15.50, date: '2025-09-25 02:15 PM', status: 'Completed' },
  { _id: 4, id: 'TXN104', type: 'Cash In', amount: 100.00, date: '2025-09-24 08:45 AM', status: 'Completed' },
  { _id: 5, id: 'TXN105', type: 'Payment', amount: -23.75, date: '2025-09-23 01:20 PM', status: 'Completed' }
]

const showAlertModal = (message) => {
  alertModalMessage.value = message
  isAlertModalOpen.value = true
}

const handleLogin = () => {
  // Demo login check
  if (loginForm.value.fullName.toLowerCase() === demoStudent.fullName.toLowerCase() && 
      loginForm.value.rfid === demoStudent.rfid) {
    currentStudent.value = { ...demoStudent }
    transactions.value = [...demoTransactions]
    isLoggedIn.value = true
  } else {
    showAlertModal('Invalid credentials. Please check your name and RFID.')
  }
}

const logout = () => {
  isLoggedIn.value = false
  loginForm.value = { fullName: '', rfid: '' }
  currentStudent.value = { fullName: '', email: '', rfid: '', birthday: '', balance: 0 }
  transactions.value = []
}

onMounted(() => {
  // Check if customer is already logged in from localStorage
})
</script>
