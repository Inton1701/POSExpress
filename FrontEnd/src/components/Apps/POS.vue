<template>
    <div class="main-wrapper">
        <div class="header">
            <div class="header-left active">
                <a href="index.html" class="logo logo-normal">
                    <img src="assets/img/logo.png" alt />
                </a>
                <a href="index.html" class="logo logo-white">
                    <img src="assets/img/logo-white.png" alt />
                </a>
                <a href="index.html" class="logo-small">
                    <img src="assets/img/logo-small.png" alt />
                </a>
            </div>

            <a id="mobile_btn" class="mobile_btn d-none" href="#sidebar">
                <span class="bar-icon">
                    <span></span>
                    <span></span>
                    <span></span>
                </span>
            </a>

            <ul class="nav user-menu">
                <li class="nav-item nav-item-box">
                    <a href="javascript:void(0);" id="btnFullscreen">
                        <i data-feather="maximize"></i>
                    </a>
                </li>
                <li class="nav-item dropdown has-arrow main-drop">
                    <a href="javascript:void(0);" class="dropdown-toggle nav-link userset" data-bs-toggle="dropdown">
                        <span class="user-info">
                            <span class="user-letter">
                                <img src="assets/img/profiles/avator1.jpg" alt class="img-fluid" />
                            </span>
                            <span class="user-detail">
                                <span class="user-name">John Smilga</span>
                                <span class="user-role">Super Admin</span>
                            </span>
                        </span>
                    </a>
                    <div class="dropdown-menu menu-drop-user">
                        <div class="profilename">
                            <div class="profileset">
                                <span class="user-img"><img src="assets/img/profiles/avator1.jpg" alt />
                                    <span class="status online"></span></span>
                                <div class="profilesets">
                                    <h6>John Smilga</h6>
                                    <h5>Super Admin</h5>
                                </div>
                            </div>
                            <hr class="m-0" />
                            <a class="dropdown-item" href="profile.html">
                                <i class="me-2" data-feather="user"></i> My Profile</a>
                            <a class="dropdown-item" href="general-settings.html"><i class="me-2"
                                    data-feather="settings"></i>Settings</a>
                            <hr class="m-0" />
                            <a class="dropdown-item logout pb-0" href="signin.html"><img
                                    src="assets/img/icons/log-out.svg" class="me-2" alt="img" />Logout</a>
                        </div>
                    </div>
                </li>
            </ul>

            <div class="dropdown mobile-user-menu">
                <a href="javascript:void(0);" class="nav-link dropdown-toggle" data-bs-toggle="dropdown"
                    aria-expanded="false"><i class="fa fa-ellipsis-v"></i></a>
                <div class="dropdown-menu dropdown-menu-right">
                    <a class="dropdown-item" href="profile.html">My Profile</a>
                    <a class="dropdown-item" href="general-settings.html">Settings</a>
                    <a class="dropdown-item" href="signin.html">Logout</a>
                </div>
            </div>
        </div>
        <div class="page-wrapper pos-pg-wrapper ms-0">
            <div class="content pos-design p-0">

                <div class="row align-items-start pos-wrapper">
                    <div class="col-md-12 col-lg-7">

                        <div class="row bg-white px-4 pb-5 mx-3 mt-2">
                            <h4>Enter Barcode:</h4>
                            <input v-model="barcode" class="form-control bg-light border border-dark fs-1 mb-2 mt-3"
                                type="text" @keyup.enter="addProduct" placeholder="Scan Barcode">
                        </div>
                        <div class="row">
                            <div class="row pos-categories tabs_wrapper">
                                <div class="pos-products">
                                    <div class="d-flex align-items-center justify-content-between">
                                        <h5 class="mb-3">Products</h5>
                                    </div>
                                    <div class="tabs_container">
                                        <div class="tab_content active" data-tab="all">
                                            <div class="row">
                                                <div class="col-sm-2 col-md-6 col-lg-3 col-xl-3">
                                                    <div class="product-info default-cover card">
                                                        <a href="javascript:void(0);" class="img-bg">
                                                            <img src="assets/img/products/pos-product-01.png"
                                                                alt="Products" />
                                                            <span><i data-feather="check" class="feather-16"></i></span>
                                                        </a>
                                                        <h6 class="cat-name">
                                                            <a href="javascript:void(0);">Mobiles</a>
                                                        </h6>
                                                        <h6 class="product-name">
                                                            <a href="javascript:void(0);">IPhone 14 64GB</a>
                                                        </h6>
                                                        <div
                                                            class="d-flex align-items-center justify-content-between price">
                                                            <span>30 Pcs</span>
                                                            <p>$15800</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-sm-2 col-md-6 col-lg-3 col-xl-3 pe-2">
                                                    <div class="product-info default-cover card">
                                                        <a href="javascript:void(0);" class="img-bg">
                                                            <img src="assets/img/products/pos-product-02.png"
                                                                alt="Products" />
                                                            <span><i data-feather="check" class="feather-16"></i></span>
                                                        </a>
                                                        <h6 class="cat-name">
                                                            <a href="javascript:void(0);">Computer</a>
                                                        </h6>
                                                        <h6 class="product-name">
                                                            <a href="javascript:void(0);">MacBook Pro</a>
                                                        </h6>
                                                        <div
                                                            class="d-flex align-items-center justify-content-between price">
                                                            <span>140 Pcs</span>
                                                            <p>$1000</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-sm-2 col-md-6 col-lg-3 col-xl-3 pe-2">
                                                    <div class="product-info default-cover card">
                                                        <a href="javascript:void(0);" class="img-bg">
                                                            <img src="assets/img/products/pos-product-02.png"
                                                                alt="Products" />
                                                            <span><i data-feather="check" class="feather-16"></i></span>
                                                        </a>
                                                        <h6 class="cat-name">
                                                            <a href="javascript:void(0);">Computer</a>
                                                        </h6>
                                                        <h6 class="product-name">
                                                            <a href="javascript:void(0);">MacBook Pro</a>
                                                        </h6>
                                                        <div
                                                            class="d-flex align-items-center justify-content-between price">
                                                            <span>140 Pcs</span>
                                                            <p>$1000</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-sm-2 col-md-6 col-lg-3 col-xl-3 pe-2">
                                                    <div class="product-info default-cover card">
                                                        <a href="javascript:void(0);" class="img-bg">
                                                            <img src="assets/img/products/pos-product-02.png"
                                                                alt="Products" />
                                                            <span><i data-feather="check" class="feather-16"></i></span>
                                                        </a>
                                                        <h6 class="cat-name">
                                                            <a href="javascript:void(0);">Computer</a>
                                                        </h6>
                                                        <h6 class="product-name">
                                                            <a href="javascript:void(0);">MacBook Pro</a>
                                                        </h6>
                                                        <div
                                                            class="d-flex align-items-center justify-content-between price">
                                                            <span>140 Pcs</span>
                                                            <p>$1000</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-sm-2 col-md-6 col-lg-3 col-xl-3 pe-2">
                                                    <div class="product-info default-cover card">
                                                        <a href="javascript:void(0);" class="img-bg">
                                                            <img src="assets/img/products/pos-product-02.png"
                                                                alt="Products" />
                                                            <span><i data-feather="check" class="feather-16"></i></span>
                                                        </a>
                                                        <h6 class="cat-name">
                                                            <a href="javascript:void(0);">Computer</a>
                                                        </h6>
                                                        <h6 class="product-name">
                                                            <a href="javascript:void(0);">MacBook Pro</a>
                                                        </h6>
                                                        <div
                                                            class="d-flex align-items-center justify-content-between price">
                                                            <span>140 Pcs</span>
                                                            <p>$1000</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div class="col-sm-2 col-md-6 col-lg-3 col-xl-3 pe-2">
                                                    <div class="product-info default-cover card">
                                                        <a href="javascript:void(0);" class="img-bg">
                                                            <img src="assets/img/products/pos-product-11.png"
                                                                alt="Products" />
                                                            <span><i data-feather="check" class="feather-16"></i></span>
                                                        </a>
                                                        <h6 class="cat-name">
                                                            <a href="javascript:void(0);">Watches</a>
                                                        </h6>
                                                        <h6 class="product-name">
                                                            <a href="javascript:void(0);">Fossil Pair Of 3 in 1
                                                            </a>
                                                        </h6>
                                                        <div
                                                            class="d-flex align-items-center justify-content-between price">
                                                            <span>40 Pcs</span>
                                                            <p>$789</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-sm-2 col-md-6 col-lg-3 col-xl-3 pe-2">
                                                    <div class="product-info default-cover card">
                                                        <a href="javascript:void(0);" class="img-bg">
                                                            <img src="assets/img/products/pos-product-18.png"
                                                                alt="Products" />
                                                            <span><i data-feather="check" class="feather-16"></i></span>
                                                        </a>
                                                        <h6 class="cat-name">
                                                            <a href="javascript:void(0);">Shoes</a>
                                                        </h6>
                                                        <h6 class="product-name">
                                                            <a href="javascript:void(0);">Green Nike Fe</a>
                                                        </h6>
                                                        <div
                                                            class="d-flex align-items-center justify-content-between price">
                                                            <span>78 Pcs</span>
                                                            <p>$7847</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </div>
                    <div class="col-md-12 col-lg-5 ps-0">
                        <aside class="product-order-list">
                            <div class="head d-flex align-items-center justify-content-between w-100">
                                <div class>
                                    <h5>Order List</h5>
                                </div>
                                <div class>
                                    <a class="confirm-text" href="javascript:void(0);"><i data-feather="trash-2"
                                            class="feather-16 text-danger"></i></a>
                                    <a href="javascript:void(0);" class="text-default"><i data-feather="more-vertical"
                                            class="feather-16"></i></a>
                                </div>
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
                                            <tr v-for="(item, index) in cart" :key="index">
                                                <td>{{ item.product }}</td>
                                                <td>{{ item.price }}</td>
                                                <td>
                                                        <input type="text" class="text-center" :value=item.quantity />
                                                </td>
                                                <td>{{ item.total }}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div class="block-section">
                                <div class="row">
                                    <div class="col-lg-8 ">
                                        <h6>Order Summary</h6>
                                        <div class="order-total">
                                            <table class="table table-responsive table-borderless">
                                                <tr>
                                                    <td>Sub Total</td>
                                                    <td class="text-end">$60,454</td>
                                                </tr>
                                                <tr>
                                                    <td>Tax</td>
                                                    <td class="text-end">$40.21</td>
                                                </tr>

                                                <tr>
                                                    <td class="danger">Discount</td>
                                                    <td class="danger text-end">$15.21</td>
                                                </tr>
                                                <tr>
                                                    <td>Total</td>
                                                    <td class="text-end">$64,024.5</td>
                                                </tr>
                                            </table>
                                        </div>
                                    </div>
                                    <div class="col-lg-4 payment-method d-flex flex-column">
                                        <h6>Payment Method</h6>

                                        <div class="row d-flex align-items-center justify-content-center methods">
                                            <div class="item border-secondary border border-1 rounded-2">
                                                <div class="default-cover">
                                                    <a href="javascript:void(0);">
                                                        <img src="assets/img/icons/cash-pay.svg" alt="Payment Method" />
                                                        <span>Cash</span>
                                                    </a>
                                                </div>
                                            </div>
                                            <div class="item border-secondary border border-1 rounded-2 my-2">
                                                <div class="default-cover">
                                                    <a href="javascript:void(0);">
                                                        <img src="assets/img/icons/credit-card.svg"
                                                            alt="Payment Method" />
                                                        <span>Debit Card</span>
                                                    </a>
                                                </div>
                                            </div>
                                            <div class="item border-secondary border border-1 rounded-2">
                                                <div class="default-cover ">
                                                    <a href="javascript:void(0); ">
                                                        <img src="assets/img/icons/qr-scan.svg" alt="Payment Method" />
                                                        <span>Scan</span>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="btn-row d-sm-flex align-items-center justify-content-between">
                                <a href="javascript:void(0);" class="btn btn-info btn-icon flex-fill"
                                    data-bs-toggle="modal" data-bs-target="#hold-order"><span
                                        class="me-1 d-flex align-items-center"><i data-feather="corner-up-right"
                                            class="feather-16"></i></span>Return</a>
                                <a href="javascript:void(0);" class="btn btn-danger btn-icon flex-fill"><span
                                        class="me-1 d-flex align-items-center"><i data-feather="trash-2"
                                            class="feather-16"></i></span>Void</a>
                                <a href="javascript:void(0);" class="btn btn-success btn-icon flex-fill"
                                    data-bs-toggle="modal" data-bs-target="#payment-completed"><span
                                        class="me-1 d-flex align-items-center"><i data-feather="credit-card"
                                            class="feather-16"></i></span>Pay</a>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </div>
    </div>






  
    
</template>
<script>
export default {
  data() {
    return {
      barcode: '',
      products: [
        { barcode: '4801981116270', product: 'Apple iPhone 12 Pro Max', price: 1200 },
        { barcode: '234567', product: 'Samsung Galaxy S21', price: 999 },
        { barcode: '345678', product: 'Google Pixel 5', price: 700 },
        // Add more products as needed
      ],
      cart: []
    };
  },
  methods: {
    addProduct() {
      if (!this.barcode) return;

      // Find product by barcode
      const foundProduct = this.products.find(product => product.barcode === this.barcode);
      if (foundProduct) {
        // Check if the product is already in the cart
        const existingProduct = this.cart.find(item => item.product === foundProduct.product);
        if (existingProduct) {
          // Increase quantity if product is already in the cart
          existingProduct.quantity += 1;
          existingProduct.total = existingProduct.quantity * existingProduct.price;
        } else {
          // Add new product to the cart
          this.cart.push({
            product: foundProduct.product,
            price: foundProduct.price,
            quantity: 1,
            total: foundProduct.price
          });
        }
      } else {
        alert('Product not found!');
      }

      // Clear the barcode input after adding product
      this.barcode = '';
    }
  }
};
</script>

<style scoped>
.tabs_container {
    height:500px;
    max-height: 500px; /* Adjust the height as needed */
    overflow-y: auto;  /* Enable vertical scrolling */
    background: #fff;
    padding: 20px;
}

.tab_content {
    display: flex;
    flex-wrap: wrap;
}

.product-info {
    flex: 0 0 25%; /* 4 items per row */
    box-sizing: border-box;
    padding: 10px;
}
.pos-categories .tabs {
  display: flex;
  flex-direction: column;
  gap: 15px; /* Add space between each item */
}
.pos-categories .tabs li {
  display: flex;
  flex-direction: column;
  align-items: center;
}

</style>
