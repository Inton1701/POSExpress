<template>
  <div class="main-wrapper">
    <div class="header">
      <!-- Header Content -->
    </div>

    <div class="page-wrapper pos-pg-wrapper ms-0">
      <div class="content pos-design p-0">
        <div class="row align-items-start pos-wrapper">
          <!-- Category Sidebar -->
          <div class="col-md-3 col-lg-2 ps-0">
            <div class="category-list">
              <h5>Categories</h5>
              <ul class="list-group text-center">
                <li v-for="category in categories" :key="category.name" class="list-group-item"
                  :class="{ 'active': selectedCategory === category.name }" @click="selectCategory(category.name)">
                  <a href="javascript:void(0);">{{ category.name }}</a>
                </li>
              </ul>
            </div>
          </div>


          <!-- Product Display -->
          <div class="col-md-12 col-lg-6">
            <div class="row bg-white px-4 pb-5 mx-3 mt-2">
              <h4>Enter Barcode:</h4>
              <input v-model="barcode" ref="barcodeInput"
                class="form-control bg-light border border-dark fs-1 mb-2 mt-3" type="text" @keyup.enter="addProduct()"
                placeholder="Scan Barcode" />
              <p v-if="barcodeError.message" class="text-danger">ERROR: {{ barcodeError.message }}</p>

            </div>
            <div class="pos-wrapper">
              <div class="row">
                <div class="col-md-12 col-lg-12">
                  <div class="pos-products">
                    <div class="tabs_container">
                      <!-- Display products based on selected category -->
                      <div v-if="products.length" class="tab_content active">
                        <div class="row">
                          <div v-for="product in products" :key="product.id" class="col-sm-2 col-md-12 col-lg-5 col-xl-5 product-item">
  <div class="product-info default-cover card" @click="addProduct(product)">
    <a href="javascript:void(0);" class="img-bg">
      <img v-if="product.image" :src="`${imgURL}${product.image}`" alt="Product" />
      <img v-else :src="`/img/icons/no-image-icon.png`" />
      <span><i data-feather="check"></i></span>
    </a>
    <h6 class="product-name">
      <a href="javascript:void(0);">{{ product.name }}</a>
    </h6>
    <div class="d-flex align-items-center justify-content-between price">
      <span>Stock: {{ product.quantity }}</span>
      <p>${{ product.price }}</p>
    </div>
  </div>
</div>

                        </div>
                      </div>

                      <!-- If no products, show a message -->
                      <div v-else class="no-products-message">
                        <p>No products available in this category.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Order List and Summary -->
          <div class="col-md-12 col-lg-4 ps-0">
            <aside class="product-order-list">
              <div class="head d-flex align-items-center justify-content-between w-100">
                <h5>Order List</h5>
                <a class="confirm-text" href="javascript:void(0);"><i data-feather="trash-2"
                    class="feather-16 text-danger"></i></a>
              </div>

              <div class="product-added block-section">
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

              <div class="block-section">
                <h6>Order Summary</h6>
                <table class="table table-responsive table-borderless">
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
                    <td>Total</td>
                    <td class="text-end">${{ total.toFixed(2) }}</td>
                  </tr>
                  <tr v-if="change">
                    <td>Change</td>
                    <td class="text-end">${{ change }}</td>
                  </tr>
                </table>
              </div>
            </aside>
            <div class="btn-row d-sm-flex align-items-center justify-content-between">
              <a href="javascript:void(0);" class="btn btn-success btn-icon flex-fill position-relative p-4 fs-6"
                data-bs-toggle="modal" data-bs-target="#payment-completed">
                <span class="keyboard-key">F1</span>
                <span class="me-1 d-flex align-items-center">
                  <i data-feather="credit-card" class="feather-16"></i>
                </span>Pay
              </a>
              <a href="javascript:void(0);" class="btn btn-danger btn-icon flex-fill position-relative p-4 fs-6">
                <span class="keyboard-key">F2</span>
                <span class="me-1 d-flex align-items-center">
                  <i data-feather="trash-2" class="feather-16"></i>
                </span>Void
              </a>

              <a href="javascript:void(0);" class="btn btn-info btn-icon flex-fill position-relative p-4 fs-6"
                data-bs-toggle="modal" data-bs-target="#hold-order">
                <span class="keyboard-key">F3</span>
                <span class="me-1 d-flex align-items-center">
                  <i data-feather="corner-up-right" class="feather-16"></i>
                </span>Return
              </a>
            </div>

          </div>
          <!-- Action Buttons -->

        </div>
      </div>
    </div>
  </div>
  <!-- Modal for Updating Quantity -->
  <div class="modal fade" id="update-quantity-modal" tabindex="-1" aria-labelledby="update-quantity-modalLabel"
    aria-hidden="true">
    <div class="modal-dialog">
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
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="payment-modalLabel">Payment</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="payment">Amount to Pay: ${{ total }}</label>
            <input type="number" id="payment" class="form-control" v-model="clientPayment" min="1"
              @keydown="handlePaymentKeydown" placeholder="Enter payment amount" />
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

</template>
<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import axios from 'axios';
import 'sweetalert2'

export default {
  setup() {
    // Reactive Variables
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
    // Computed Variables
    const total = computed(() =>
      subtotal.value + (subtotal.value * VAT.value) / 100 - discount.value
    );

    // Methods
    const getCategories = async () => {
      try {
        const response = await axios.get(`${apiURL}/get_category_list`);
        categories.value = response.data.categories;
      } catch (error) {
        console.error(error);
      }
    };

    const getProductsByCategory = async (categoryName) => {
      try {
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
    change.value = null; 

 
    if (!product) {
      if (!barcode.value.trim()) {
        return;
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
          openPaymentModal(); // Open payment modal
          break;
        case 'q':
          event.preventDefault();
          openUpdateQuantityModal(); // Open quantity modal
          break;
        default:
          break;
      }
    };

    const openPaymentModal = () => {
      const modalElement = document.getElementById('payment-modal');
      const modal = new bootstrap.Modal(modalElement);

      if (modal) {
        modal.show();

        // Focus on the payment input field when the modal opens
        modalElement.addEventListener('shown.bs.modal', () => {
          const inputField = modalElement.querySelector('input');
          if (inputField) {
            inputField.focus();
          }
        });
      }
    };

    const handleModalKeydown = (event) => {
      const modalElement = document.getElementById('update-quantity-modal');

      if (modalElement) {
        // Check for Enter key
        if (event.key === 'Enter') {
          event.preventDefault(); // Prevent default form submission
          updateProductQuantity(); // Trigger the update function
        }

        // Check for Escape key
        if (event.key === 'Escape') {
          event.preventDefault(); // Prevent default behavior
          const modal = bootstrap.Modal.getInstance(modalElement);
          if (modal) {
            modal.hide(); // Close the modal
          }

          // Refocus barcode input after closing the modal
          const barcodeInput = document.getElementById('barcode-input');
          if (barcodeInput) {
            barcodeInput.focus();
          }
        }
      }
    };

    const handlePaymentKeydown = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default form submission
        processPayment(); // Trigger payment processing
      }
    };

    const openUpdateQuantityModal = () => {
      if (lastAddedProduct.value) {
        // Open modal to update quantity
        const modalElement = document.getElementById('update-quantity-modal');
        const modal = new bootstrap.Modal(modalElement);

        if (modal) {
          modal.show();

          // Focus on the input field when modal is shown
          modalElement.addEventListener('shown.bs.modal', () => {
            const inputField = modalElement.querySelector('input');
            if (inputField) {
              inputField.focus();
            }
          });
        }
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
          status: "Completed", // Transaction status
          employee: "JohnDoe", // Example employee, replace with actual
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
          const modalElement = document.getElementById("payment-modal");
          const modal = bootstrap.Modal.getInstance(modalElement);
          if (modal) {
            modal.hide();
          }

          cart.value = [];
          subtotal.value = 0;
          discount.value = 0;

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




    const updateProductQuantity = () => {
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

        // Close the modal
        const modalElement = document.getElementById('update-quantity-modal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }

        // Reset modal input
        newQuantity.value = 1;
        quantityError.value = null;

        // Focus back on the barcode input
        if (barcodeInput.value) {
          barcodeInput.value.focus();
        }
      }
    };

    // Lifecycle Hooks
    onMounted(() => {
      getCategories();

    
      window.addEventListener('keydown', handleKeydown); // Listen to keydown events
    });

    onBeforeUnmount(() => {
      window.removeEventListener('keydown', handleKeydown);
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
      handlePaymentKeydown,
      change,
      clientPayment,
      paymentError,
      selectCategory,
      products,
      imgURL,
    };
  },
};
</script>






<style scoped>
/* Container for the product display */
.tabs_container {
  min-height: 620px;
  max-height: 620px;
  overflow-y: auto;
  background: #fff;
  padding: 20px;

}

/* Flex container for product display */
.tab_content {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  /* Space between items */
  justify-content: space-between;
}

/* Ensure product-info fits within columns properly */
.product-info {
  position: relative;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s ease-in-out;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  /* Optional shadow */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  /* Flex to ensure each card takes equal width */
  flex: 1 1 calc(33.33% - 1rem);
  /* Default to 3 items per row */
  height: 100%;

}

.product-info img {
  width: 100%;
  height: 150px;
  /* Fixed height for images */
  object-fit: cover;
  /* Ensure images cover the area proportionally */
}

.product-info:hover {
  transform: scale(1.05);
  /* Slight zoom effect on hover */
}

/* Mobile and tablet adjustments for card layout */
@media (max-width: 1200px) {
  .product-info {
    flex: 1 1 calc(25% - 1rem);
    /* 4 items per row for large screens */
    height: 300px;
    /* Set height for large screens */
  }
}

@media (max-width: 768px) {
  .product-info {
    flex: 1 1 calc(33.33% - 1rem);
    /* 3 items per row for medium screens */
    height: 250px;
    /* Adjust height for medium screens */
  }
}

@media (max-width: 576px) {
  .product-info {
    flex: 1 1 calc(50% - 1rem);
    /* 2 items per row for small screens */
    height: 200px;
    /* Adjust height for small screens */
  }
}

/* Category List Styling */
.category-list {
  padding: 15px;
  background-color: #f9f9f9;
  border-right: 1px solid #ddd;
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

.product-wrap {
  max-height: 100%;

  overflow: hidden;
  
}

.table {
  width: 100%;
  table-layout: auto;
  word-wrap: break-word;

}

.table th,
.table td {
  white-space: normal;

  word-break: break-word;

  text-align: left;

}

.product-name-cell {
  max-width: 200px;
  /* Adjust as needed for column width */
  overflow: hidden;
  text-overflow: ellipsis;
  /* Optional: adds "..." for long text */
  white-space: normal;
}

.quantity-input {
  width: 50px;
  /* Ensures quantity input field doesn't take too much space */
  text-align: center;
}

.no-products-message {
  display: flex;
  justify-content: center;
  /* Center horizontally */
  align-items: center;
  /* Center vertically */
  height: 200px;
  /* Adjust the height as needed */
  text-align: center;
  /* Center the text */
  font-size: 18px;
  /* Optional: Adjust the font size */
  color: #777;
  /* Optional: Set a color for the text */
}
</style>
