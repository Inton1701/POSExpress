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
            <router-link to="/products" data-bs-toggle="tooltip" data-bs-placement="top" title="Refresh"><i
                data-feather="rotate-ccw" class="feather-rotate-ccw"></i></router-link>
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
                <tr v-else v-for="product in products" :key="product._id">
                  <td>{{ product.sku }}</td>
                  <td>
                    <div class="productimgname">
                      <a href="javascript:void(0);" class="product-img stock-img">
                        <img v-if="product.image" :src="`${imageURL}${product.image}`" alt="/img/icons/no-image-icon.png" />
                        <img v-else :src="`/img/icons/no-image-icon.png`"/>
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
                      'badge-linewarning': product.status === 'inactive'
                    }">
                      {{ product.status }}
                    </span>
                  </td>
                  <td>{{ $formatDate(product.createdAt) }}</td>
                  <td>{{ $formatDate(product.updatedAt) }}</td>
                  <td class="action-table-data">
                    <div class="edit-delete-action">
                      <router-link class="me-2 edit-icon p-2"
                        :to="{ name: 'ProductDetails', params: { id: product._id } }">
                        <font-awesome-icon icon="eye" class="feather-eye" />
                      </router-link>
                      <router-link :to="{ name: 'EditProduct', params: { id: product._id } }" class="me-2 p-2">
                        <font-awesome-icon icon="fa-pen-to-square" class="feather-edit" />
                      </router-link>
                      <a class="confirm-text p-2" href="javascript:void(0);" @click="deleteAlert(product._id)">
                        <font-awesome-icon icon="fa-trash" class="feather-trash-2" />
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
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import axios from 'axios';
import 'select2';
import feather from 'feather-icons';
import ClipLoader from 'vue-spinner/src/ClipLoader.vue';
import Swal from 'sweetalert2';
import Navbar from '/src/components/Admin/Navbar.vue';
import $ from 'jquery';

export default {
  components: {
    Navbar,
    ClipLoader,
  },
  setup() {
    const apiURL = process.env.VUE_APP_URL;
    const imageURL = process.env.VUE_APP_IMAGE_URL;
    const products = ref([]);
    const loading = ref(true);
    const select = ref(null);
    const table = ref(null);

    //  get products from the API
    const getProductList = async () => {
      loading.value = true;
      try {
        const response = await axios.get(`${apiURL}/products_list`);
        products.value = response.data.products;

      } catch (error) {
        Swal.fire('Error', 'Unable to get products', 'error')
      } finally {
        loading.value = false;
      }
    };
    
    const deleteAlert = async (productId) => {
      try{
        const { value: result } = await Swal.fire({
        title: 'Delete Product',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!',
      });

      if (result) {
        try {
          // Send a PUT request to update the product status to "deleted"
          const response = await axios.patch(`${apiURL}/edit_products/${productId}`, {
            status: 'deleted', // Update the status to 'deleted'
          });

          if (response.data.success) {
            Swal.fire('Deleted!', 'Your product has been deleted.', 'success');

          } else {
            Swal.fire('Failed', 'There was an issue deleting the product.', 'error');
          }
        } catch (error) {
          console.error('Error updating product:', error);
          Swal.fire('Error', 'Failed to delete the product.', 'error');
        }
      } else {
        Swal.fire('Cancelled', 'Your product is safe :)', 'error');
      }
      }catch(error){
        Swal.fire('Error',error, 'error');
      }finally{
        getProductList();
      }
      
    };
    onMounted(async () => {
      try {
        await nextTick()
        await getProductList();

        nextTick(() => {
          const table = document.querySelector('.table');
          if (table) {
            $(table).DataTable();
          }
        })
        feather.replace();


      } catch (error) {
        console.log(error);
      }
    });

    onBeforeUnmount(() => {
      feather.replace();
      $(select.value).select2('destroy');
    });


    return {
      products,
      loading,
      select,
      apiURL,
      imageURL,
      deleteAlert
    };
  }


};
</script>