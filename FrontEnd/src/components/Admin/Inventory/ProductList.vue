<template>
  <Navbar />

  <div class="page-wrapper">

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
          <ClipLoader v-if="loading" />
          <div v-else class="table-responsive">
            <table class="table"  id="product-table">
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
                        <img v-if="product.image" :src="`${imageURL}${product.image}`"
                          alt="/img/icons/no-image-icon.png" />
                        <img v-else :src="`/img/icons/no-image-icon.png`" />
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
              <form @submit.prevent="submitImport">
                <div class="row">
                  <div class="col-lg-12 col-sm-6 col-12">
                    <div class="modal-footer-btn download-file">
                      <a href="files/Sample.csv" class="btn btn-submit">Download Sample File</a>
                    </div>
                  </div>
                  <div class="col-lg-12">
                    <div class="input-blocks image-upload-down">
                      <label>Upload CSV File(please add the character "x" infront of the sku to ensure smooth import)</label>
                      <div class="image-upload download">
                        <input type="file" accept=".csv" @change="uploadCSV" />
                        <div class="image-uploads">
                          <img src="assets/img/download-img.png" alt="img" />
                          <h4>Drag and drop a <span>file to upload</span></h4>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Scrollable Table for Uploaded JSON Data -->
                <div class="col-lg-12 mt-4" v-if="jsonData.length > 0">
                  <h5>Uploaded Data Preview</h5>
                  <div class="table-wrapper">
                    <table class="table table-striped table-bordered">
                      <thead>
                        <tr>
                          <!-- Dynamically generate table headers -->
                          <th v-for="(header, index) in tableHeaders" :key="index">
                            {{ header }}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <!-- Dynamically generate table rows -->
                        <tr v-for="(row, rowIndex) in jsonData" :key="rowIndex">
                          <td v-for="(value, key, colIndex) in row" :key="colIndex">
                            {{ value }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div class="col-lg-12">
                  <div class="modal-footer-btn">
                    <button type="button" class="btn btn-cancel me-2" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-submit">Submit</button>
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
import { useRouter } from 'vue-router';
import axios from 'axios';
import { exportToCSV } from '@/utils/exportCSV';
import { exportToPDF } from '@/utils/exportPDF';
import Papa from 'papaparse';
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
    const jsonData = ref([]);
    const tableHeaders = ref([]); 

    const initializeDataTable = () => {
    const tableElement = $('#product-table');

    // Destroy existing DataTable instance if it exists
    if ($.fn.DataTable.isDataTable(tableElement)) {
        tableElement.DataTable().destroy();
    }
    // Reinitialize DataTable
    tableElement.DataTable({
        searching: true,
        paging: true,
        info: true,
        responsive: true, // Optional: Makes table responsive
    });
};


const refreshDataTable = () => {
    const table = $('#brand-table').DataTable();
    table.destroy(); // Destroy the current instance
    initializeDataTable(); // Reinitialize with updated data
};


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
      try {
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
            const response = await axios.delete(`${apiURL}/delete_product/${productId}`);

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
      } catch (error) {
        Swal.fire('Error', error, 'error');
      } finally {
        getProductList();
      }

    };
    const exportCSVAlert = async () => {
      try {
        const { value: result } = await Swal.fire({
          title: 'Export Product',
          text: 'Export via CSV',
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Export',
        });

        if (result) {
          const response = await axios.get(`${apiURL}/get_report`);

          // Ensure products are available
          if (response.data.success && response.data.products && response.data.products.length > 0) {
            const products = response.data.products;

            exportToCSV(products, `product_report`); // Call function to export CSV
            Swal.fire('Success', 'products successfully exported', 'success')
          } else {
            Swal.fire('Error', 'No products found to export', 'error');
          }
        }
      } catch (error) {
        console.error('Error during export:', error);
        Swal.fire('Error', 'Something went wrong while exporting.', 'error');
      }
    };
    const exportPDFAlert = async () => {
      try {
        const { value: result } = await Swal.fire({
          title: 'Export Product',
          text: 'Export via PDF',
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Export',
        });

        if (result) {
          const response = await axios.get(`${apiURL}/get_report`);

          // Ensure products are available
          if (response.data.success && response.data.products && response.data.products.length > 0) {
            const products = response.data.products;

            exportToPDF(`product_report`, products); // Call function to export CSV
            Swal.fire('Success', 'products successfully exported', 'success')
          } else {
            Swal.fire('Error', 'No products found to export', 'error');
          }
        }
      } catch (error) {
        console.error('Error during export:', error);
        Swal.fire('Error', 'Something went wrong while exporting.', 'error');
      }
    }



    const uploadCSV = (event) => {
  const file = event.target.files[0];
  if (!file) {
    alert("Please select a file to upload");
    return;
  }

  if (file.type !== "text/csv") {
    alert("Please upload a valid CSV file");
    return;
  }

  Papa.parse(file, {
    complete: (result) => {
      jsonData.value = result.data; // Parsed CSV data

      // Generate table headers dynamically
      if (jsonData.value.length > 0) {
        tableHeaders.value = Object.keys(jsonData.value[0]);
      }

      // Remove 'x' or 'X' from SKU in the parsed data
      jsonData.value.forEach((row) => {
        if (row.sku) {
          row.sku = row.sku.replace(/^x/i, ''); // Remove 'x' or 'X' from SKU
        }
      });
    },
    header: true,
    skipEmptyLines: true,
  });
};

// Validate CSV Data
const validateCSVData = async (data) => {
  const validData = [];
  const invalidData = [];

  // Define required fields
  const requiredFields = ['sku', 'name', 'price', 'cost'];

  for (const row of data) {
    let isValid = true;

    // Check if required fields are present (excluding `sku`)
    requiredFields.forEach((field) => {
      if (field !== 'sku' && !row[field]) {
        isValid = false; // Mark as invalid if any field except `sku` is missing
      }
    });

    // Ensure the SKU is cleaned up (remove 'x' or 'X')
    if (row.sku) {
      row.sku = row.sku.replace(/^x/i, ''); // Remove 'x' or 'X' from SKU
    }

    // Handle missing `sku`: generate a new one if valid so far
    if (isValid && (!row.sku || row.sku.trim() === '')) {
      row.sku = await autoGenerateSKU();
    }

    // Further validation if `sku` is provided
    if (isValid && row.sku) {
      if (!validateSku(row.sku) || !validateNumber(row.price) || !validateNumber(row.cost)) {
        isValid = false; // Invalid format
      } else {
        // Check if SKU already exists
        const exists = await checkSKU(row.sku);
        if (exists) {
          isValid = false; // SKU already exists
        }
      }
    }

    // Add the row to the appropriate list
    if (isValid) {
      validData.push(row);
    } else {
      invalidData.push(row);
    }
  }

  return { validData, invalidData };
};

// Ensure that `validateSku` validates that the SKU is exactly 13 digits after cleaning
const validateSku = (sku) => {
  // Ensure SKU is exactly 13 digits long
  return /^[0-9]{13}$/.test(sku);
};

// Ensure that `validateNumber` handles all types of valid numbers
const validateNumber = (value) => {
  if (typeof value === 'string') {
    value = value.trim();
  }
  // Ensure value is a positive number (including decimals)
  return /^[0-9]+(\.[0-9]{1,2})?$/.test(value) && parseFloat(value) > 0;
};
    const checkSKU = async (sku) => {
      try {
        const response = await axios.get(`${apiURL}/check_sku/${sku}`);
        console.log(response.data.exists);
        return response.data.exists; // Return true if SKU exists
      } catch (error) {
        console.error('Error checking SKU:', error);
        return true; // Assume false if error occurs
      }
    };

    const autoGenerateSKU = async () => {
      let sku = generateEAN13();

      // Loop to regenerate SKU until it's unique
      while (true) {
        try {
          // Check if SKU exists in the database
          const response = await axios.get(`${apiURL}/check_sku/${sku}`);

          if (!response.data.exists) {
            // If SKU is unique, return it
            return sku;
          } else {
            // Regenerate SKU if it exists
            sku = generateEAN13();
          }
        } catch (error) {
          console.error('Error checking SKU:', error);
          return null; // Exit if there's an error
        }
      }
    };


    const generateEAN13 = () => {
      let digits = '4';
      for (let i = 0; i < 11; i++) {
        digits += Math.floor(Math.random() * 10).toString();
      }

      let sumOdd = 0;
      let sumEven = 0;

      for (let i = 0; i < 12; i++) {
        const digit = parseInt(digits[i], 10);
        if (i % 2 === 0) {
          sumOdd += digit;
        } else {
          sumEven += digit;
        }
      }

      const totalSum = sumOdd + (sumEven * 3);
      const checksum = (10 - (totalSum % 10)) % 10;

      return digits + checksum;
    };

    const submitImport = async () => {
  loading.value = true;

  // Ensure jsonData is defined and has data
  if (!jsonData.value || jsonData.value.length === 0) {
    Swal.fire('Error', 'No data to import', 'error');
    loading.value = false;
    return;
  }

  try {
    // Await validation of the CSV data
    const { validData, invalidData } = await validateCSVData(jsonData.value);

    // Log the valid and invalid data
    console.log("Valid Data:", validData);
    console.log("Invalid Data:", invalidData);

    // If there are no valid rows, display an error and stop processing
    if (validData.length === 0) {
      Swal.fire('Error', 'No valid data found in the CSV file', 'error');
      loading.value = false;
      return;
    }

    // Send valid data to the backend
    const response = await axios.post(`${apiURL}/import_products`, { products: validData });

    if (response.data.success) {
      Swal.fire('Success', `${validData.length} products successfully imported`, 'success');
      jsonData.value = []; // Clear data after successful import
      getProductList();
    } else {
      Swal.fire('Error', 'Failed to import products', 'error');
    }

    // Show a warning for invalid rows if any
    if (invalidData.length > 0) {
      Swal.fire('Warning', `${invalidData.length} rows were skipped due to missing or invalid fields.`, 'warning');
    }
  } catch (error) {
    console.error('Error importing products:', error);
    Swal.fire('Error', 'Something went wrong while importing.', 'error');
  } finally {
    loading.value = false;
  }
};


    onMounted(async () => {
      try {
        await nextTick()
        await getProductList();
        initializeDataTable(); 
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
      deleteAlert,
      exportCSVAlert,
      exportPDFAlert,
      uploadCSV,
      submitImport,
      jsonData,
      tableHeaders
    };
  }


};
</script>

<style>
.table-wrapper {
  max-height: 100px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.table {
  width: 100%;
  margin: 0;
  border-collapse: collapse;
}

.table-wrapper th,
.table-wrapper td {
  text-align: left;
  padding: 8px;
  border: 1px solid #ddd;
}

.table-wrapper th {
  background-color: #f4f4f4;
  font-weight: bold;
}

.table-wrapper tr:nth-child(even) {
  background-color: #f9f9f9;
}
</style>