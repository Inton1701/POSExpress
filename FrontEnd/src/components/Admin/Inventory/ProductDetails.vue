<template>
  <Navbar />

  <div class="page-wrapper">
    <div class="content">
      <div class="page-header">
        <div class="page-title">
          <h4>Product Details</h4>
          <h6>Full details of a product</h6>
        </div>
      </div>
      <div class="row">
        <div class="col-lg-8 col-sm-12">
          <div class="card" v-if="product">
            <div class="card-body">
              <div class="bar-code-view">
                <Barcode :sku="product.sku" />
                <a class="printimg">
                  <img src="/assets/img/icons/printer.svg" alt="print" />
                </a>
              </div>
              <div class="productdetails">
                <ul class="product-bar">
                  <li>
                    <h4>Product</h4>
                    <h6>{{ product.name }}</h6>
                  </li>
                  <li>
                    <h4>Category</h4>
                    <h6>{{ product.category || 'None' }}</h6>
                  </li>
                  <li>
                    <h4>Sub Category</h4>
                    <h6>{{ product.subcategory || 'None' }}</h6>
                  </li>
                  <li>
                    <h4>Brand</h4>
                    <h6>{{ product.brand }}</h6>
                  </li>
                  <li>
                    <h4>Unit</h4>
                    <h6>{{ product.unit }}</h6>
                  </li>
                  <li>
                    <h4>SKU</h4>
                    <h6>{{ product.sku }}</h6>
                  </li>
                  <li>
                    <h4>Minimum Qty</h4>
                    <h6>{{ product.quantityAlert }}</h6>
                  </li>
                  <li>
                    <h4>Quantity</h4>
                    <h6>{{ product.quantity }}</h6>
                  </li>
                  <li>
                    <h4>Discount Type</h4>
                    <h6>{{ product.discountType }}</h6>
                  </li>
                  <li>
                    <h4>Price</h4>
                    <h6>{{ product.price }}</h6>
                  </li>
                  <li>
                    <h4>Status</h4>
                    <h6>{{ product.status }}</h6>
                  </li>
                  <li>
                    <h4>Description</h4>
                    <h6>{{ product.description }}</h6>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-4 col-sm-12">
          <div class="card">
            <div class="card-body">
              <div class="slider-product-details">
                <div class="owl-carousel owl-theme product-slide">
                  <div class="slider-product">
                    <img v-if="product.image" :src="product.image" alt="public/img/icons/no-image-icon.png" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import feather from 'feather-icons';
import Sidebar from '/src/components/Admin/Sidebar.vue';
import Navbar from '/src/components/Admin/Navbar.vue';
import Barcode from './Barcode.vue';

export default {
  components: {
    Sidebar,
    Navbar,
    Barcode
  },
  setup() {
    const route = useRoute();
    const product = ref({});

    const getProductDetails = async () => {
  const productId = route.params.id; // Use 'id' to match route param
  try {
    const response = await axios.get(`http://localhost:5000/api/get_product/${productId}`);
    product.value = response.data.product;
  } catch (error) {
    console.error('Error fetching product details:', error);
  }
};

    onMounted(async () => {
      try {
        feather.replace();
        await getProductDetails();
      } catch (error) {
        console.error(error);
      }
    });

    return {
      product
    };
  },
};
</script>

