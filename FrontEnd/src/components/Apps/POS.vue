<template>
  <div class="main-wrapper">
    <div class="header">
    <div class="d-flex justify-content-between align-items-center">
      <!-- Logo / Title -->
      <div class="logo">
      <img src="assets/img/logo.png" alt="POSExpress"     class="img-fluid "
      style="width: 200px; height: 60px;" />
    </div>

      <!-- Logout Button -->
      <button class="btn btn-primary" @click="logout()">LOGOUT</button>
    </div>
  </div>

    <div class="page-wrapper pos-pg-wrapper ms-0">
      <div class="content pos-design p-0">
        <div class="row align-items-start pos-wrapper">
          <div class="col-md-3 col-lg-2 ">
            <div class="category-list">
              <h5>Categories</h5>
              <ul class="list-group text-center overflow-auto"
                style="max-height:100vh; overflow-y: auto; scrollbar-width: thin;">
                <li v-for="category in categories" :key="category.name" class="list-group-item"
                  :class="{ 'active': selectedCategory === category.name }" @click="selectCategory(category.name)">
                  <a href="javascript:void(0);">{{ category.name }}</a>
                </li>
              </ul>
            </div>
          </div>
          <!-- Product Display -->
          <div class="col-md-12 col-lg-6">
            <div class="row bg-white px-3 pb-4 mx-1 mt-2">
              <h4>Enter Barcode:</h4>
              <input v-model="barcode" ref="barcodeInput"
                class="form-control bg-light border border-dark fs-3 mb-2 mt-3" type="text"
                @keydown.esc="openEditCartModal" 
                @keyup.enter="addProduct()" 
                @keydown.end="cancelTransaction" 
                placeholder="Scan Barcode" />
              <p v-if="barcodeError.message" class="text-danger">ERROR: {{ barcodeError.message }}</p>
            </div>
            <div class="row pos-wrapper">
              <div class="row">
                <div class="col-md-12 col-lg-12">
                  <div class="pos-products">
                    <div class="tabs_container">
                      <!-- Display products based on selected category -->
                      <div v-if="products.length" class="tab_content active">
                        <div class="row">
                          <div v-for="product in products" :key="product.id"
                            class="col-sm-3 col-md-3 col-lg-3 col-xl-3 col-3 product-item">
                            <div class="product-info" @click="addProduct(product)">
                              <a href="javascript:void(0);" class="img-bg">
                                <img v-if="product.image" :src="`${imgURL}${product.image}`" alt="Product" />
                                <img v-else :src="`/img/icons/no-image-icon.png`" />
                                <span><i data-feather="check"></i></span>
                              </a>
                              <h6 class="product-name ms-2">
                                <a href="javascript:void(0);">{{ product.name }}</a>
                              </h6>
                              <div class="d-flex ms-2 align-items-center justify-content-between price">
                                <span>Stock: {{ product.quantity }}</span>
                                <p class="me-2">${{ product.price }}</p>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>

                      <!-- If no products, show a message -->
                      <div v-else class="d-flex justify-content-center align-items-center" style="height: 80vh;">
                        <p class="text-center">No products available in this category.</p>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Order List and Summary -->
          <div class="col-md-12 col-lg-4 ps-0">
            <aside class="order-sidebar">
              <div class="d-flex justify-content-between align-items-center">
                Order List
          
                <span>
                  <button class="btn btn-info px-4 py-1 mx-1" @click="openEditCartModal"><span class="keyboard-key" style="font-size: 8px; padding: 1px;">ESC</span>  <font-awesome-icon icon="fa-pen-to-square" class="feather-edit" /></button>
                  <button class="btn btn-danger px-4 py-1 mx-1" @click="cancelTransaction" id="del-btn"><span class="keyboard-key" style="font-size: 8px; padding: 1px;">DEL</span> <font-awesome-icon icon="fa-trash" class="feather-trash-2" /></button>
                </span>

              </div>
              <div class="product-added">
                <div class="product-wrap">
                  <table class="table table-responsive">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in cart" :key="item.id">
                        <td>{{ item.name }}</td>
                        <td>{{ item.price }}</td>
                        <td>{{ item.quantity }}</td>
                        <td>{{ item.quantity * item.price }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="order-summary">
                <h6>Order Summary</h6>

                <table class="table">
                  <tr>
                    <td>Sub Total</td>
                    <td class="text-end">${{ subtotal }}</td>
                  </tr>
                  <tr>
                    <td>VAT</td>
                    <td class="text-end">{{ VAT }}%</td>
                  </tr>
                  <tr>
                    <td class="danger">Discount</td>
                    <td class="danger text-end">${{ discount }}</td>
                  </tr>
                  <tr>
                    <td class="fs-5 fw-bolder">Total</td>
                    <td class="text-end fs-5 fw-bolder">{{ total.toFixed(2) }}</td>
                  </tr>
                  <tr v-if="change">
                    <td class="fs-5 fw-bolder text-danger">Change</td>
                    <td class="text-end fs-5 fw-bolder text-danger">{{ change }}</td>
                  </tr>
                </table>
              </div>

              <div class="btn-row d-sm-flex align-items-center justify-content-between mb-5">
                <a href="javascript:void(0);" class="btn btn-success btn-icon flex-fill position-relative p-3 fs-6"
                  @click="openPaymentModal">
                  <span class="keyboard-key">F1</span>
                  <span class="me-1 d-flex align-items-center">
                    <i data-feather="credit-card" class="feather-16"></i>
                  </span>Pay
                </a>
                <a href="javascript:void(0);" class="btn btn-danger btn-icon flex-fill position-relative p-3 fs-6"
                  @click="openVoidModal">
                  <span class="keyboard-key">F2</span>
                  <span class="me-1 d-flex align-items-center">
                    <i data-feather="trash-2" class="feather-16"></i>
                  </span>Void
                </a>

                <a href="javascript:void(0);" class="btn btn-info btn-icon flex-fill position-relative p-3 fs-6"
                  @click="openReturnModal">
                  <span class="keyboard-key">F3</span>
                  <span class="me-1 d-flex align-items-center">
                    <i data-feather="corner-up-right" class="feather-16"></i>
                  </span>Return
                </a>
              </div>
            </aside>
          </div>

        </div>
      </div>
    </div>
  </div>
  <!-- Modal for Updating Quantity -->
  <div class="modal fade" id="update-quantity-modal" tabindex="-1" aria-labelledby="update-quantity-modalLabel"
    aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="update-quantity-modalLabel">Update Quantity</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="new-quantity">Quantity</label>
            <input type="number" id="new-quantity" class="form-control" v-model="newQuantity" min="1"
              @keydown="handleModalKeydown" />
          </div>
          <p v-if="quantityError" class="text-danger">{{ quantityError }}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          <button type="button" class="btn btn-primary" @click="updateProductQuantity">Update</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal for Payment -->
  <div class="modal fade" id="payment-modal" tabindex="-1" aria-labelledby="payment-modalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="payment-modalLabel">Payment</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="payment">Amount to Pay: ${{ total }}</label>
            <input type="number" id="payment" class="form-control" v-model="clientPayment" min="1"
              @keydown.enter="processPayment" placeholder="Enter payment amount" />
          </div>
          <p v-if="paymentError.message" class="text-danger">{{ paymentError.message }}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          <button type="button" class="btn btn-primary" @click="processPayment">Process Payment</button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="return-modal" tabindex="-1" aria-labelledby="return-modalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="return-modalLabel">Enter Transaction ID for Return</h5>
          <button type="button" class="btn-close" id="return-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <input v-model="transactionId" class="form-control" type="text" placeholder="Transaction ID"
            @keydown.enter="fetchTransactionItems" />
          <p v-if="transactionError" class="text-danger">{{ transactionError }}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          <button type="button" class="btn btn-primary" @click="fetchTransactionItems">Fetch Items</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal for Return Item Selection -->
  <div class="modal fade" id="select-return-items-modal" tabindex="-1" aria-labelledby="select-return-items-modalLabel"
    aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="select-return-items-modalLabel">Select Items for Return</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <table class="table" tabindex="0" @keydown="handleKeyNavigation">
            <thead>
              <tr>
                <th>Select</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Return Quantity</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in returnItems" :key="item._id" :class="{ focused: index === focusedIndex }">
                <td>
                  <input type="checkbox" v-model="item.selected" />
                </td>
                
                <td>{{ item.name }}</td>
                <td>{{ item.quantity }}</td>
                <td>
                  <input type="number" v-model="item.returnQuantity" :max="item.quantity" min="1"
                    :autofocus="index === focusedIndex" @input="validateReturnQuantity(item)" />
                </td>
                <td>${{ item.price }}</td>
              </tr>
              <input type="hidden" item.sku>
            </tbody>
          </table>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          <button type="button" class="btn btn-primary" @click="processReturn">Process Return</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Void Transaction Modal -->
  <div class="modal fade" id="void-transaction-modal" tabindex="-1" aria-labelledby="voidTransactionModalLabel"
    aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="voidTransactionModalLabel">Void Transaction</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="processVoid">
            <div class="mb-3">
              <label for="transaction-id" class="form-label">Transaction ID</label>
              <input type="text" id="transaction-id" class="form-control" v-model="transactionId"
                placeholder="Enter Transaction ID" required>
            </div>
            <p v-if="transactionError" class="text-danger">{{ transactionError }}</p>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-danger" @click="processVoid">Void Transaction</button>
        </div>
      </div>
    </div>
  </div>


  <div class="modal fade" id="edit-cart-modal" tabindex="-1" aria-labelledby="edit-cart-modalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="edit-cart-modalLabel">Edit Cart Items</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <table class="table" tabindex="0" @keydown="handleCartKeyNavigation">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in cart" :key="item._id" :class="{ focused: index === focusedCartIndex }">
                <td>{{ item.name }}</td>
                <td>
                  <input type="number" v-model="item.quantity" min="1" @input="validateCartQuantity(item)" />
                </td>
                <td>${{ item.price }}</td>
                <td>${{ item.price * item.quantity}}</td>
                <td>
                  <button class="btn btn-danger btn-sm" @click="removeCartItem(index)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          <button type="button" class="btn btn-primary" @click="saveCartChanges">Save Changes</button>
        </div>
      </div>
    </div>
  </div>

</template>
<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { modalController } from '@/utils/modalController';
import axios from 'axios';
import 'sweetalert2'

export default {
  setup() {
    const router = useRouter();
    const apiURL = process.env.VUE_APP_URL;
    const imgURL = process.env.VUE_APP_IMAGE_URL;
    const selectedCategory = ref('all');
    const barcode = ref('');
    const barcodeInput = ref(null);
    const cart = ref([]);
    const categories = ref([]);
    const subtotal = ref(0);
    const VAT = ref(12); // Example tax rate
    const discount = ref(0);
    const barcodeError = ref({ message: null });
    const paymentError = ref({ message: null });
    const lastAddedProduct = ref(null);
    const stockQuantity = ref(null); // Store the stock quantity of the last fetched product
    const newQuantity = ref(1); // New quantity input for the modal
    const quantityError = ref(null);
    const change = ref(null);
    const clientPayment = ref(null);
    const products = ref([]);
    const transactionId = ref('');
    const transactionError = ref(null);
    const returnItems = ref([]);
    const focusedIndex = ref(0);
    const focusedCartIndex = ref(0);
    const isNewTransaction = ref(true);
    const isTransactionOpen = ref(false);

    const total = computed(() =>
      subtotal.value + (subtotal.value * VAT.value) / 100 - discount.value
    );

    

    // Methods
    const getCategories = async () => {

      try {
        if (await checkState()) return;
        const response = await axios.get(`${apiURL}/get_category_list`);
        categories.value = response.data.categories;
      } catch (error) {
        console.error(error);
      }
    };

    const getProductsByCategory = async (categoryName) => {
      try {
        if (await checkState()) return;
        const response = await axios.get(`${apiURL}/get_products_by_category/${categoryName}`);
        products.value = response.data.products;
      } catch (error) {
        console.error(error);
      }
    };

    const selectCategory = (categoryName) => {
      selectedCategory.value = categoryName; // Update selected category
      getProductsByCategory(categoryName); // Fetch products for the selected category
    };


    const filteredCategories = computed(() => {
      // Filter products based on the selected category
      if (selectedCategory.value === 'all') {
        return categories.value;
      }
      return categories.value.filter(category => category.name === selectedCategory.value);
    });


    const addProduct = async (product = null) => {
      try {
        if (await checkState()) return;

        if (isNewTransaction.value) {
      cart.value = []; // Clear the cart
      subtotal.value = 0;
      discount.value = 0;
      change.value = null;
      isNewTransaction.value = false; // Set to false after starting a new transaction
    }
        if (!product) {
          if (!barcode.value.trim()) {
            return;
          }

          if (barcode.value.trim().startsWith("@")) {
            const sku = barcode.value.trim().substring(1);
            const lookup = await axios.get(`${apiURL}/get_product_info/${sku}`);
            if (lookup.data.success) {
              product = lookup.data.product
              Swal.fire({
            title: product.name,
            html: `
            <div style="display: flex; justify-content: space-between;">
              <p style="flex: 1; text-align: left;"><strong>SKU:</strong></p>
              <p style="flex: 1; text-align: right;">${product.sku}</p>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <p style="flex: 1; text-align: left;"><strong>Price:</strong></p>
              <p style="flex: 1; text-align: right;">$${product.price}</p>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <p style="flex: 1; text-align: left;"><strong>Available Stock:</strong></p>
              <p style="flex: 1; text-align: right;">${product.quantity}</p>
            </div>
            `,
            icon: 'info',
              });

              barcodeError.value.message = null;
              return;
            } else {
              barcodeError.value.message = lookup.data.message || "Product not found.";
              return;
            }
   
          }

          const response = await axios.get(`${apiURL}/get_product_info/${barcode.value.trim()}`);
          if (response.data.success) {
            product = response.data.product; // Assign the fetched product

            barcodeError.value.message = null;
          } else {
            barcodeError.value.message = response.data.message || "Product not found.";
            return;
          }
        }

        // Store the last added product and its stock quantity
        lastAddedProduct.value = product;
        stockQuantity.value = product.quantity;

        // Check if the product is already in the cart
        const existingItem = cart.value.find((item) => item._id === product._id);

        if (existingItem) {
          // Increment quantity if product is already in the cart
          const newTotalQuantity = existingItem.quantity + 1;
          if (newTotalQuantity <= stockQuantity.value) {
            existingItem.quantity = newTotalQuantity;
          } else {
            barcodeError.value.message = `Maximum stock reached for ${product.name}.`;
          }
        } else {
          // Add product to cart if not already present
          if (stockQuantity.value > 0) {
            cart.value.push({ ...product, quantity: 1 });
          } else {
            barcodeError.value.message = `No stock available for ${product.name}.`;
          }
        }

        updateSubtotal(); // Update the subtotal after adding the product
      } catch (error) {
        console.error("Error adding product:", error);
        barcodeError.value.message = "An error occurred while fetching the product.";
      } finally {
        barcode.value = ""; // Clear the barcode input
      }
    };


    const updateSubtotal = () => {
      subtotal.value = cart.value.reduce((sum, item) => sum + item.quantity * item.price, 0);
    };

    const handleKeydown = (event) => {
      switch (event.key) {
        case 'F1':
          event.preventDefault();
          openPaymentModal();
          break;
        case 'F2':
          event.preventDefault();
          openVoidModal(); // open return modal
          break;
        case 'F3':
          event.preventDefault();
          openReturnModal(); // open return modal
          break;
        case 'q':
          event.preventDefault();
          openUpdateQuantityModal(); // Open quantity modal
          break;
        case 'Escape':
          // Refocus on the barcode input
          if (barcodeInput.value) {
            barcodeInput.value.focus();
            transactionId.value = ''; // Clear transaction ID
            returnItems.value = []; // Clear previously selected items
            transactionError.value = null; // Clear any previous errors
          }
          break;
          case 'l': // Check for Ctrl + L
          if (event.ctrlKey) {
            event.preventDefault();
            router.push('/lockscreen'); // Redirect to lock screen
          }
          break;
        default:
          break;
      }
    };
    const resetTransactions = () => {
      transactionId.value = '';
      returnItems.value = [];
      transactionError.value = null;
    }

    const openPaymentModal = async() => {
      if (await checkState()) return;
      if (total.value > 0) {
        resetTransactions();
        modalController.show('payment-modal');
        modalController.focus('payment-modal');
      }

    };

    const openReturnModal = async () => {
      if (await checkState()) return;
      resetTransactions();
      modalController.show('return-modal');
      modalController.focus('return-modal');
      addNavigationListener();
    };
    const addNavigationListener = () => {
      window.addEventListener("keydown", handleKeyNavigation);
    };

    const removeNavigationListener = () => {
      window.removeEventListener("keydown", handleKeyNavigation);
    };

    const openVoidModal = async() => {
      if (await checkState()) return;
      resetTransactions();
      modalController.show('void-transaction-modal');
      modalController.focus('void-transaction-modal');
    };



    const handleModalKeydown = async(event) => {
      if (await checkState()) return;
      // Check for Enter key
      if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default form submission
        updateProductQuantity(); // Trigger the update function
      }

      // Check for Escape key
      if (event.key === 'Escape') {
        event.preventDefault(); // Prevent default behavior
        modalController.hide('update-quantity-modal')
      }

    };

    const openUpdateQuantityModal = () => {
      if (lastAddedProduct.value) {
        // Open modal to update quantity
        modalController.show('update-quantity-modal');
        modalController.focus('update-quantity-modal');
      } else {
        barcodeError.value.message = "No product in cart yet.";
      }
    };
    const processPayment = async () => {
      // Validate payment
      if (clientPayment.value === null || clientPayment.value < total.value) {
        paymentError.value.message = `Payment must be at least $${total.value}.`;
        return;
      }

      try {
        // Prepare transaction data
        const transactionData = {
          cart: cart.value.map((item) => ({
            _id: item._id, // Product ID
            sku: item.sku,
            name: item.name,
            price: item.price,
            total: item.total,
            quantity: item.quantity,
          })),
          paymentMethod: "Cash", // You can dynamically set this
          discounts: discount.value,
          netAmount: subtotal.value,
          VAT: (subtotal.value * VAT.value) / 100,
          totalAmount: total.value,
          cash: clientPayment.value,
          change: change.value,
          status: "Completed", // Transaction status
          employee: localStorage.getItem("user"), // Example employee, replace with actual
        };

        // Send transaction data to the backend
        const response = await axios.post(`${apiURL}/commit_transaction`, transactionData);

        if (response.data.success) {
          // Backend transaction was successful
          console.log("Transaction saved:", response.data.transaction);

          // Calculate change
          change.value = (clientPayment.value - total.value).toFixed(2);


          clientPayment.value = null;
          paymentError.value.message = null;

          // Notify the user of successful payment (optional)
          Swal.fire({
            title: 'Success!',
            text: 'Transaction successful.',
            icon: 'success',
            timer: 1500, // 
            showConfirmButton: false // Optional: Hide the confirm button
          });

          // Close the payment modal
          modalController.hide('payment-modal')
          isNewTransaction.value = true;

        } else {
          // Backend returned an error
          paymentError.value.message = response.data.message || "Failed to process transaction.";
          console.error("Transaction failed:", response.data.message);
        }
      } catch (error) {
        // Handle network or server errors
        console.error("Error processing payment:", error);
        paymentError.value.message = "An error occurred while processing the payment. Please try again.";
      }
    };


    const processVoid = async () => {
      try {
        if (await checkState()) return;
        const response = await axios.post(`${apiURL}/void_transaction`, {
          transactionId: transactionId.value,
          employee: 'JohnDoe' // Replace with actual employee information
        });

        if (response.data.success) {
          // Display success message
          Swal.fire({
            title: 'Voided!',
            text: 'Transaction has been successfully voided.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });

          // Clear transaction ID and close the modal
          resetTransactions();
          modalController.hide('void-transaction-modal');
        } else {
          // Handle server error messages
          Swal.fire({
            title: 'Error',
            text: response.data.message || 'Failed to void the transaction.',
            icon: 'error',
            timer: 2000,
            showConfirmButton: false

          });
        }
      } catch (error) {
        // Handle unexpected errors
        Swal.fire({
          title: 'Error',
          text: `An error occurred: ${error.message}`,
          icon: 'error',
          timer: 2000,
          showConfirmButton: false

        });
      }
    };


    const updateProductQuantity = async () => {
      if (await checkState()) return;
      if (lastAddedProduct.value) {
        if (newQuantity.value > stockQuantity.value) {
          quantityError.value = `Stock quantity is only ${stockQuantity.value}. Please enter a valid quantity.`;
          return;
        }

        // Update quantity in cart
        const cartItem = cart.value.find((item) => item._id === lastAddedProduct.value._id);
        if (cartItem) {
          cartItem.quantity = newQuantity.value;
        }

        updateSubtotal();

        modalController.hide('update-quantity-modal');
        newQuantity.value = 1;
        quantityError.value = null;

        // Focus back on the barcode input
        if (barcodeInput.value) {
          barcodeInput.value.focus();
        }
      }
    };
    const fetchTransactionItems = async () => {
      try {
        modalController.hide('return-modal');
        removeNavigationListener();

        // Fetch transaction items from the API
        const response = await axios.get(`${apiURL}/get_transaction_items/${transactionId.value}`);
        const { success, cart, totalAmount } = response.data;

        if (success && cart && Array.isArray(cart)) {
          // Process the cart items
          console.log('Transaction cart items:', cart);

          // Populate the returnItems array with the fetched items
          returnItems.value = cart.map(item => ({
            _id: item._id,
            sku: item.sku,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            selected: false, // Add a 'selected' property to track if the item is selected for return
            returnQuantity: 0, // Initialize return quantity to 0
          }));

          modalController.show('select-return-items-modal')
        } else {
          console.error('Cart is empty or response structure is incorrect');
        }
      } catch (error) {
        console.error('Error fetching transaction items:', error);
      }
    };

    const processReturn = async () => {
      try {
        if (await checkState()) return;
        const itemsToReturn = returnItems.value.filter(item => item.selected && item.returnQuantity > 0);

        if (itemsToReturn.length === 0) {
          transactionError.value = 'Please select at least one item to return.';
          return;
        }

        // Await the axios call to get the response properly
        const response = await axios.post(`${apiURL}/return_transaction/${transactionId.value}`, {
          returnedItems: itemsToReturn,
          employee: localStorage.getItem("user")
        });

        console.log(response.data); // This will now log the actual response data

        if (response.data.success) {
          // Update stock and cart
          itemsToReturn.forEach(item => {
            const cartItem = cart.value.find(cartItem => cartItem._id === item._id);
            if (cartItem) {
              cartItem.quantity -= item.returnQuantity;
              if (cartItem.quantity <= 0) {
                const index = cart.value.indexOf(cartItem);
                cart.value.splice(index, 1); // Remove the item if quantity becomes 0
              }
            }
          });

          // Notify the user of successful payment (optional)
          Swal.fire({
            title: 'Returned!',
            text: 'Transaction successful.',
            icon: 'success',
            timer: 1500, // 
            showConfirmButton: false // Optional: Hide the confirm button
          });

          modalController.hide('select-return-items-modal')
          // Clear transaction ID input

        } else {
          Swal.fire({
            title: 'Error',
            text: response.data.message || 'Failed to process the return.',
            icon: 'error',
            timer: 2000,
            showConfirmButton: false

          });
        }
      } catch (error) {
        console.error('Error processing return:', error);
        Swal.fire({
          title: 'Error',
          text: 'An error occurred while processing the return. Please try again.',
          icon: 'error',
          timer: 2000,
          showConfirmButton: false

        });
      }
    };

    const validateReturnQuantity = (item) => {
      if (item.returnQuantity > item.quantity) {
        item.returnQuantity = item.quantity; // Reset to maximum allowed
      }
    }




    const handleKeyNavigation = (event) => {
      const items = returnItems.value; // Access the return items
      if (!items || items.length === 0) return; // Exit if no items are present

      if (event.key === "ArrowDown" && focusedIndex.value < items.length - 1) {
        event.preventDefault(); // Prevent scrolling
        focusedIndex.value = (focusedIndex.value + 1) % items.length; // Move focus down
      } else if (event.key === 'ArrowUp' && focusedIndex.value > 0) {
        event.preventDefault(); // Prevent scrolling
        focusedIndex.value = (focusedIndex.value - 1 + items.length) % items.length; // Move focus up
      } else if (event.key === " ") {
        event.preventDefault(); // Prevent scrolling
        const currentItem = items[focusedIndex.value];
        if (currentItem && currentItem.returnQuantity > 0) {
          // Only allow selection if returnQuantity > 0
          currentItem.selected = !currentItem.selected;
        }
      } else if (event.key === "Enter") {
        event.preventDefault(); // Prevent default behavior
        // Process return only if at least one item is selected
        if (items.some((item) => item.selected)) {
          processReturn();
        } else {
          transactionError.value = "Please select at least one item to return.";
        }
      }

      // Trigger autofocus on the input when moving focus
      const focusedInput = document.querySelector(`#select-return-items-modal .focused input[type="number"]`);
      if (focusedInput) {
        focusedInput.focus();
      }
    };
    const validateCartQuantity = (item) => {
  if (item.quantity < 0) {
    item.quantity = 0; // Allow 0 but prevent negative quantities
  }
};



// Handle key navigation and actions in the cart modal
const handleCartKeyNavigation = (event) => {
  const items = cart.value; // Access the cart items
  if (!items || items.length === 0) return; // Exit if no items are present

  switch (event.key) {
    case "ArrowDown":
      if (focusedCartIndex.value < items.length - 1) {
        event.preventDefault(); // Prevent scrolling
        focusedCartIndex.value++;
      }
      break;

    case "ArrowUp":
      if (focusedCartIndex.value > 0) {
        event.preventDefault(); // Prevent scrolling
        focusedCartIndex.value--;
      }
      break;

    case "Delete":
      event.preventDefault(); // Prevent default behavior
      removeCartItem(focusedCartIndex.value); // Delete the focused item
      break;

    case "Enter":
      event.preventDefault(); // Prevent default behavior
      // Optionally trigger saving the changes if Enter is pressed
      saveCartChanges();
      break;

    default:
      break;
  }

  // Trigger autofocus on the input of the focused item
  const focusedInput = document.querySelector(
    `#edit-cart-modal .focused input[type="number"]`
  );
  if (focusedInput) {
    focusedInput.focus();
  }
};

// Remove an item from the cart
const removeCartItem = (index) => {
  cart.value.splice(index, 1); // Remove the item at the specified index
  if (focusedCartIndex.value >= cart.value.length) {
    focusedCartIndex.value = cart.value.length - 1; // Adjust focus index
  }
  updateSubtotal(); // Update the subtotal after removing an item
};

// Save changes to the cart
const saveCartChanges = () => {
  cart.value = cart.value.filter((item) => item.quantity > 0); 

  updateSubtotal(); // Update subtotal
  modalController.hide("edit-cart-modal"); // Close modal
};

// Open the edit cart modal
const openEditCartModal = async() => {
  if (await checkState()) return;
  if (cart.value.length > 0) {
    focusedCartIndex.value = 0; // Reset focus to the first item
    modalController.show("edit-cart-modal");
    modalController.focus("edit-cart-modal");
  } else {
    Swal.fire({
      title: "Cart is empty",
      text: "Add items to the cart first.",
      icon: "info",
      timer: 1500,
      showConfirmButton: false,
    });
    barcodeInput.value.focus();
  }

};

// Function to handle canceling the transaction and clearing the cart
const cancelTransaction = () => {
  // Show SweetAlert for confirmation
  Swal.fire({
    title: "Cancel Transaction",
    text: "Are you sure you want to cancel the transaction and empty the cart?\n press ESC to cancel or ENTER to proceed.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Proceed",
    cancelButtonText: "Cancel",
  }).then((result) => {
    if (result.isConfirmed) {
      // Clear the cart if confirmed
      if(cart.value.length > 0) {
        cart.value = [];
      updateSubtotal(); // Update subtotal after emptying cart
      Swal.fire({
        title: "Transaction Canceled",
        text: "Your cart has been emptied.",
        icon: "success",
        timer: 1000,
        showConfirmButton: false,
      });
      }else{
        Swal.fire({
        title: "Your Cart is empty",
        text: "Make new transaction",
        icon: "info",
        timer: 1500,
        showConfirmButton: false,
      });
      }
      barcodeInput.value.focus();
     
    }
  });
};

const checkState = async () => {
  try {
    const response = await axios.get(`${apiURL}/transaction_state`);
    if (response.data.success) {
      isTransactionOpen.value = response.data.isOpen;

      if (isTransactionOpen.value === false) {
        Swal.fire({
          title: 'Error',
          text: 'Transaction is already closed, no further actions can be processed.',
          icon: 'error',
          timer: 5000,
          showConfirmButton: false
        });
        return true; // Return true if transaction is closed
      }

      return false; // Return false if the transaction is open
    } else {
      console.error("Failed to fetch transaction state.");
      return false; // Ensure a return value in case of failure
    }
  } catch (error) {
    console.error("Error fetching transaction state:", error);
    Swal.fire({
      title: "Error!",
      text: "Failed to get transaction state",
      icon: "error",
      confirmButtonText: "OK",
    });
    return false; // Ensure a return value in case of error
  }
};

const logout =  () =>{
      Swal.fire({
        title: 'Are you sure?',
        text: "You will be logged out of your account.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, logout!',
        cancelButtonText: 'Cancel'
      }).then( async(result) => {
        if (result.isConfirmed) {
          try{
            const userId = localStorage.getItem('id');
          const response = await axios.patch(`${apiURL}/logout/${userId}`)
          if(response.data.success) {
          // Clear local storage
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          localStorage.removeItem('id');
          localStorage.removeItem('user');
          localStorage.removeItem('emails');
          localStorage.removeItem("image");
          
          // Redirect to home
          router.push('/');
          
          Swal.fire(
            'Logged Out',
            'You have been successfully logged out.',
            'success'
          );
          }else{
            Swal.fire(
            'Logged Out',
            'An error occurred during logout',
            'error'
          );
          router.push('/');
          }

          }catch(error){
            Swal.fire('Error','An error occurred during logout','error'); 
            console.log(error);
          }
         
        }
      });
    };

    // Assuming `processReturn` and `transactionError` are defined somewhere in your code.

    // Lifecycle Hooks
    onMounted(() => {
      getCategories();
      if (barcodeInput.value) {
        barcodeInput.value.focus();
      }

      window.addEventListener('keydown', handleKeydown); // Listen to keydown events
      window.addEventListener("keydown", handleCartKeyNavigation);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener("keydown", handleCartKeyNavigation);
    });

    // Return Variables and Methods
    return {
      categories,
      selectedCategory,
      barcode,
      barcodeInput,
      cart,
      subtotal,
      VAT,
      discount,
      total,
      barcodeError,
      lastAddedProduct,
      stockQuantity,
      newQuantity,
      quantityError,
      addProduct,
      updateProductQuantity,
      handleModalKeydown,
      focusedIndex,
      handleKeyNavigation,
      validateReturnQuantity,
      focusedCartIndex,
      handleCartKeyNavigation,
      openEditCartModal,
      validateCartQuantity,
      removeCartItem,
      cancelTransaction,
      change,
      clientPayment,
      paymentError,
      selectCategory,
      products,
      imgURL,
      transactionId,
      transactionError,
      returnItems,
      fetchTransactionItems,
      processReturn,
      processVoid,
      openPaymentModal,
      openVoidModal,
      openReturnModal,
      processPayment,
      logout
    };
  },
};
</script>



<style scoped>
.focused {
  background-color: #f0f8ff;
  /* Light blue */
  outline: 2px solid #007bff;
  /* Optional for extra visibility */
}

.tabs_container {
  min-height: 80vh;
  max-height: 80vh;
  overflow-y: auto;
  background: #fff;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.tab_content {
  display: flex;
  flex-wrap: wrap;
  /* Allow products to wrap to new rows */
  gap: 1rem;
  /* Space between items */
  justify-content: flex-start;
  height: 100%;
  /* Fill the container */
}

.product-item {
  width: 200px;
  height: 200px;
  /* Fixed height for each product */
  margin-bottom: 1rem;
  /* Space between rows */
  box-sizing: border-box;
}

.product-info {
  position: relative;
  padding: 15px;
  padding-inline: 0;
  background: #f9f9f9;
  border-radius: 3px;
  overflow: hidden;
  transition: transform 0.2s ease-in-out;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}

.product-info img {
  width: 100%;
  /* Ensures the image covers the full width */
  height: 150px;
  /* Fixed height for images */
  object-fit: fit;
  /* Ensure the image covers the area on the X-axis */
  margin-bottom: 30px;
  margin-inline: 0;
}

.product-info:hover {
  transform: scale(1.05);
  /* Slight zoom effect on hover */
}

/* Category List Styling */
.category-list {
  padding: 15px;
  background-color: #f9f9f9;
}

.category-list ul {
  list-style-type: none;
  padding-left: 0;
}

.category-list li {
  margin-bottom: 10px;
}

.category-list a {
  text-decoration: none;
  color: #333;
  font-size: 16px;
  padding: 8px 10px;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.category-list a:active {
  color: #fff;
}

.category-list a:hover {
  color: #fff;
}

.list-group-item.active {
  background-color: #22A95E;
  /* Green background for active list item */
  border-color: #22A95E;
  /* Optional: Match border with the active color */
}

.list-group-item.active a {
  color: #fff;
  /* Make the text white inside the active list item */
}

/* Keyboard Key Styling for the UI */
.keyboard-key {
  position: absolute;
  top: 5px;
  left: 5px;
  font-size: 12px;
  background-color: rgba(0, 0, 0, 0.1);
  color: white;
  padding: 5px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}
.btn-info, #del-btn{
  position: relative; /* Make the button a reference for the absolute key */
  padding-top: 20px; /* Add some padding to avoid content overlap */
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
}

.btn-row {
  display: flex;
  flex-wrap: wrap;
  flex-shrink: 0;
}



.order-summary h6 {
  margin-top: 0;
  /* Remove extra top margin */
  margin-bottom: 8px;
  /* Add a small space below the heading */
}

.order-summary .table {
  margin-top: 0;
  /* Remove extra top margin */
  margin-bottom: 0;
  /* Remove extra bottom margin */
}

.order-summary .table tr {
  margin-top: 0;
  /* Remove any top margin for rows */
  margin-bottom: 0;
  /* Remove any bottom margin for rows */
}

.order-summary .table td {
  padding-top: 15px;
  /* Adjust top padding for cells */
}

/* Product order list container adjustments */
.product-order-list {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  /* Allow the product order list to take remaining space */
  overflow: hidden;
}

/* Ensure the product added section expands */
.product-order-list .product-added {
  flex-grow: 1;
  /* Expand to fill available space */
  overflow-y: auto;
  /* Allow vertical scrolling */
  margin-bottom: 20px;
  padding-right: 15px;
  /* Optional: Add some space from the right edge */
}

/* Product wrap table adjustments */
.product-wrap table {
  width: 100%;
  table-layout: auto;
  overflow-x: auto;
  /* Enable horizontal scroll if necessary */
}

/* Table and row adjustments */
.product-order-list .product-wrap th,
.product-order-list .product-wrap td {
  padding: 8px;
  /* Spacing inside cells */
  text-align: left;
  /* Align text to the left */
  font-size: 1rem;
  /* Default font size */
}

/* Smaller font size for longer content */
.product-order-list .product-wrap tbody td {
  font-size: calc(1rem - 0.2vw);
  /* Shrink font size based on screen size */
  word-wrap: break-word;
  overflow-wrap: anywhere;
  /* Ensure text breaks correctly */
}

/* Responsive design adjustments */
@media (max-height: 768px) {
  .product-order-list .product-wrap tbody td {
    font-size: 0.85rem;
    /* Shrink font size further for smaller screens */
  }

  /* Adjust button sizes on small screens */
  .btn-row .btn {
    font-size: 0.9rem;
    /* Smaller font size for buttons */
    padding: 10px 18px;
    /* Adjust button padding */
  }
}

/* Sidebar container adjusted to fit full screen height */
.order-sidebar {
  height: 100vh;
  /* Take up full screen height */
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  /* Enable scrolling if content exceeds the height */
  justify-content: space-between;
  /* Push content to top and bottom */
}

.btn-row {
  display: flex;
  flex-wrap: wrap;
  flex-shrink: 0;
  /* Prevent shrinking */
  margin-inline: 0;
}
</style>
