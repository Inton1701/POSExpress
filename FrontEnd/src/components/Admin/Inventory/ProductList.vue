<template>
  <Navbar />

  <div class="page-wrapper">
    <ClipLoader v-if="loading" />
    <div class="content">
      <div class="page-header">
        <div class="add-item d-flex">
          <div class="page-title">
            <h4>Product List</h4>
            <h6>Manage your products</h6>
          </div>
        </div>
        <ul class="table-top-head">
          <li>
            <a data-bs-toggle="tooltip" data-bs-placement="top" title="Pdf" type="button"
              @click="exportPDFAlert();"><img src="/assets/img/icons/pdf.svg" alt="img" /></a>
          </li>
          <li>
            <a type="button" data-bs-toggle="tooltip" data-bs-placement="top" title="Excel"
              @click="exportCSVAlert();"><img src="/assets/img/icons/excel.svg" alt="img" /></a>
          </li>
          <li>
            <a data-bs-toggle="tooltip" data-bs-placement="top" title="Print"><i data-feather="printer"
                class="feather-rotate-ccw"></i></a>
          </li>
          <li>
            <a data-bs-toggle="tooltip" data-bs-placement="top" title="Refresh"><i data-feather="rotate-ccw"
                class="feather-rotate-ccw"></i></a>
          </li>
          <li>
            <a data-bs-toggle="tooltip" data-bs-placement="top" title="Collapse" id="collapse-header"><i
                data-feather="chevron-up" class="feather-chevron-up"></i></a>
          </li>
        </ul>
        <div class="page-btn">
          <router-link to="create-product" class="btn btn-added"><i data-feather="plus-circle" class="me-2"></i>Add New
            Product</router-link>
        </div>
        <div class="page-btn import">
          <a href="#" class="btn btn-added color" data-bs-toggle="modal" data-bs-target="#view-notes"><i
              data-feather="download" class="me-2"></i>Import Product</a>
        </div>
      </div>
      <div class="card table-list-card">
        <div class="card-body">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Created On</th>
                  <th>Updated On</th>

                  <th class="no-sort">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="products.length <= 0">
                  <td colspan="8">No products available</td>
                </tr>
                <tr v-for="product in products" :key="product._id">
                  <td>{{ product.sku }}</td>
                  <td>
                    <div class="productimgname">
                      <a href="javascript:void(0);" class="product-img stock-img">
                        <img v-if="product.image" :src="product.image" alt="/img/icons/no-image-icon.png" />
                      </a>
                      <a href="javascript:void(0);">{{ product.name }}</a>
                    </div>
                  </td>
                  <td>{{ product.category }}</td>
                  <td>{{ product.price.toFixed(2) }}</td>
                  <td>
                    <span :class="{
                      'badge': true,
                      'badge-linesuccess': product.status === 'active',
                      'badge-linedanger': product.status === 'inactive'
                    }">
                      {{ product.status }}
                    </span>
                  </td>
                  <td>{{ new Date(product.createdAt).toLocaleString() }}</td>
                  <td>{{ new Date(product.updatedAt).toLocaleString() }}</td>
                  <td class="action-table-data">
                    <div class="edit-delete-action">
                      <router-link class="me-2 edit-icon p-2"  :to="{ name: 'ProductDetails', params: { id: product._id } }">
                        <i data-feather="eye" class="feather-eye"></i>
                      </router-link>
                      <router-link to="edit-product" class="me-2 p-2">
                        <i data-feather="edit" class="feather-edit"></i>
                      </router-link>
                      <a class="confirm-text p-2" href="javascript:void(0);" @click="deleteAlert()">
                        <i data-feather="trash-2" class="feather-trash-2"></i>
                      </a>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="view-notes">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="page-wrapper-new p-0">
          <div class="content">
            <div class="modal-header border-0 custom-modal-header">
              <div class="page-title">
                <h4>Import Product</h4>
              </div>
              <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body custom-modal-body">
              <form action="product-list.html">
                <div class="row">
                  <div class="col-lg-12 col-sm-6 col-12">
                    <div class="row">
                      <div>
                        <div class="modal-footer-btn download-file">
                          <a href="files/Sample.csv" class="btn btn-submit">Download Sample File</a>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-lg-12">
                    <div class="input-blocks image-upload-down">
                      <label> Upload CSV File</label>
                      <div class="image-upload download">
                        <input type="file" accept=".csv" @change="uploadCSV" />
                        <div class="image-uploads">
                          <img src="assets/img/download-img.png" alt="img" />
                          <h4>Drag and drop a <span>file to upload</span></h4>
                        </div>
                      </div>
                      <pre>{{ jsonData }}</pre>
                    </div>
                  </div>
                </div>
                <div class="col-lg-12">
                  <div class="modal-footer-btn">
                    <button type="button" class="btn btn-cancel me-2" data-bs-dismiss="modal">
                      Cancel
                    </button>
                    <button type="button" @click="printJSON();" class="btn btn-submit">
                      Submit
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import axios from 'axios';
import 'select2';
import feather from 'feather-icons';
import ClipLoader from 'vue-spinner/src/ClipLoader.vue';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';
import Swal from 'sweetalert2';
import Sidebar from '/src/components/Admin/Sidebar.vue';
import Navbar from '/src/components/Admin/Navbar.vue';

export default {
  components: {
    Sidebar,
    Navbar,
    ClipLoader,
  },
  setup() {
    const products = ref([]);
    const loading = ref(true);
    const select = ref(null);
    const table = ref(null);

    // Function to get products from the API
    const getProductList = async () => {
      loading.value = true;
      try {
        const response = await axios.get('http://localhost:5000/api/products_list'); // Update with actual API endpoint
        products.value = response.data.productList; // Update based on your API response structure
        console.log(products.value); // For debugging
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        loading.value = false;
      }
    };

    onMounted(async () => {
      try {
        await getProductList();
        await $(select.value).select2();
        await feather.replace();
        await $('.table').DataTable();
      } catch (error) {
        console.log(error);
      }
    });

    onBeforeUnmount(() => {
      $(select.value).select2('destroy');
    });

    return {
      products,
      loading,
      select,
    };
  },
  methods: {
    async deleteAlert() {
      const { value: result } = await Swal.fire({
        title: 'Delete Products',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result) {
        Swal.fire('Deleted!', 'Your file has been deleted.', 'success');
      } else {
        Swal.fire('Cancelled', 'Your file is safe :)', 'error');
      }
    },
    async exportCSVAlert() {
      console.log("Export alert triggered", this.products); // Debug
      const result = await this.$showAlert({
        title: 'Export Products',
        text: 'Do you want to export products to CSV?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Export'
      });

      if (result.isConfirmed) {
        console.log("Export confirmed, data:", this.products); // Debug
        await this.$exportToCSV(this.products, 'products');
      }
    },
    async exportPDFAlert() {
      console.log("Export alert triggered", this.products); // Debug
      const result = await this.$showAlert({
        title: 'Export Products',
        text: 'Do you want to export products to PDF?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Export'
      });

      if (result.isConfirmed) {
        console.log("Export confirmed, data:", this.products); // Debug
        await this.$exportToPDF('Product List', this.products, 'products');
      }
    }
  }
};
</script>