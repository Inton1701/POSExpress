<template>
  <Navbar />
  <Sidebar />
  <div class="page-wrapper">
    <div class="content">
      <div class="page-header">
        <div class="add-item d-flex">
          <div class="page-title">
            <h4>Transaction List</h4>
            <h6>Manage Your Transaction</h6>
          </div>
        </div>
      </div>
      <div class="card table-list-card">
        <div class="card-body">


          <div class="table-responsive">
            <ClipLoader v-if="loading" />
            <table v-else class="table datanew" id="transaction-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th class="text-start">Reference</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th class="text-start">Total</th>
                  <th>Payment Method</th>
                  <th>Biller</th>
                  <th class="text-center">Action</th>
                </tr>
              </thead>
              <tbody class="sales-list">
                <tr v-if="transactions.length <= 0">
                  <td colspan="8">No products available</td>
                </tr>
                <tr v-else v-for="trans in transactions" :key="trans.id">
                  <td>Walk in</td>
                  <td class="text-start">{{ trans.transactionId }}</td>
                  <td>{{ $formatDate(trans.createdAt) }}</td>

                  <td class="text-center">
                    <span :class="{
                      'badge': true,
                      ' badge-bgsuccess': trans.status === 'Completed',
                      ' badge-bgdanger': trans.status === 'Voided',
                      ' badge-bgprimary': trans.status === 'Returned'
                    }">
                      {{ trans.status }}
                    </span>
                  </td>
                  <td class="text-start">{{ trans.totalAmount }}</td>
                  <td><span class="badge badge-linesuccess">{{ trans.paymentMethod }}</span></td>
                  <td>{{ trans.employee }}</td>
                  <td class="text-center">
                    <a class="action-set" href="javascript:void(0);" data-bs-toggle="dropdown" aria-expanded="false">
                      <font-awesome-icon icon="fa fa-ellipsis-v" aria-hidden="true" class="feather-eye" />
                    </a>
                    <ul class="dropdown-menu">
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item" data-bs-toggle="modal"
                          data-bs-target="#sales-details-new" @click="showSaleDetail(trans.transactionId)">
                          <i data-feather="eye" class="info-img"></i> Sale Detail
                        </a>
                      </li>
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item" data-bs-toggle="modal"
                          data-bs-target="#edit-sales-new">
                          <i data-feather="edit" class="info-img"></i> Edit Sale
                        </a>
                      </li>
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item" @click="downloadReceipt(trans.transactionId)">
                          <i data-feather="download" class="info-img"></i> Download Receipt
                        </a>
                      </li>
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item confirm-text mb-0"
                          @click="deleteTransaction(trans.transactionId)">
                          <i data-feather="trash-2" class="info-img"></i> Delete Sale
                        </a>
                      </li>
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Sale Detail Modal -->
  <div class="modal fade" id="sales-details-new" tabindex="-1" aria-labelledby="salesDetailsModal" aria-hidden="true">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="salesDetailsModal">Sale Detail</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <!-- Transaction Information -->
          <div class="mb-3">
            <h6 class="mb-2"><strong>Transaction ID:</strong> {{ selectedTransaction.transactionId }}</h6>
            <h6 class="mb-2"><strong>Cashier:</strong> {{ selectedTransaction.employee }}</h6>
            <h6 class="mb-2"><strong>Customer:</strong> {{ selectedTransaction.customer }}</h6>
            <h6 class="mb-2"><strong>Status:</strong> <span :class="getStatusClass(selectedTransaction.status)">{{
                selectedTransaction.status }}</span></h6>
            <h6 class="mb-2"><strong>Date:</strong> {{ selectedTransaction.createdAt }}</h6>
            <h6 class="mb-2"><strong>Total Amount:</strong> ${{ selectedTransaction.totalAmount }}</h6>
            <h6 class="mb-2"><strong>Payment Method:</strong> {{ selectedTransaction.paymentMethod }}</h6>
          </div>

          <!-- Products Table -->
          <h6><strong>Purchased Products</strong></h6>
          <table class="table table-bordered">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in selectedTransaction.products" :key="product._id">
                <td>{{ product.name }}</td>
                <td>{{ product.sku }}</td>
                <td>{{ product.quantity }}</td>
                <td>{{ product.price }}</td>
                <td>{{ product.quantity * product.price }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-footer d-flex justify-content-center">
  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
</div>
      </div>
    </div>
  </div>

</template>
<script>
import { ref, onMounted, onBeforeMount, nextTick } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';
import Navbar from '/src/components/Admin/Navbar.vue';
import ClipLoader from 'vue-spinner/src/ClipLoader.vue';
import feather from 'feather-icons'
import $ from 'jquery';



export default {
  components: {
    ClipLoader,
    Navbar,
  },
  setup() {
    const apiURL = process.env.VUE_APP_URL;
    const loading = ref(true);
    const transactions = ref([]);

    const selectedTransaction = ref({
      transactionId: '',
      customer: '',
      status: '',
      createdAt: '',
      totalAmount: 0,
      paymentMethod: '',
      employee: '',
      products: []
    });
    const initializeDataTable = () => {
      const tableElement = $('#transaction-table');

      if ($.fn.DataTable.isDataTable(tableElement)) {
        tableElement.DataTable().destroy();
      }

      tableElement.DataTable({
        searching: true,
        paging: true,
        info: true,
        responsive: true,
      });
    };

    const refreshDataTable = () => {
      const table = $('#transaction-table').DataTable();
      table.destroy();
      initializeDataTable();
    };

    const getTransactions = async () => {
      loading.value = true;
      try {
        const reponse = await axios.get(`${apiURL}/get_all_transactions`);
        if (reponse.data.success) {
          transactions.value = reponse.data.transactions
        } else {
          Swal.fire('Eror', 'Failed to get all transaction', 'error');
        }
        nextTick(() => refreshDataTable());
      } catch (error) {
        Swal.fire('Eror', 'Something went wrong', 'error');
      } finally {
        loading.value = false;
      }
    }

    // Get transaction details by ID
    const getTransactionDetails = async (transactionId) => {
      loading.value = true;
      try {
        const response = await axios.get(`${apiURL}/get_transaction_details/${transactionId}`);
        if (response.data.success) {
          selectedTransaction.value = response.data.transaction;
          console.log(selectedTransaction.value);
        } else {
          Swal.fire('Error', 'Failed to get transaction details', 'error');
        }
      } catch (error) {
        Swal.fire('Error', 'Something went wrong', 'error');
      } finally {
        loading.value = false;
      }
    };

    // Get status badge class
    const getStatusClass = (status) => {
      switch (status) {
        case 'Completed':
          return 'text-success';
        case 'Voided':
          return 'text-danger';
        case 'Returned':
          return 'text-info';
        default:
          return '';
      }
    };

    onMounted(async () => {
      try {
        await nextTick()
        await getTransactions();
        initializeDataTable();
        await feather.replace();

      } catch (error) {
        console.log(error);
      }
    });

    onBeforeMount(() => {

    });

    const showSaleDetail = async (transactionId) => {
      await getTransactionDetails(transactionId);
    };
    const deleteTransaction = async (transactionId) => {
      // Show a confirmation alert using SweetAlert2
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: 'This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, cancel',
      });

      // If user confirms the deletion
      if (result.isConfirmed) {
        try {
          const response = await axios.patch(`${apiURL}/delete_transaction/${transactionId}`);
          if (response.data.success) {
            Swal.fire(
              'Deleted!',
              'The transaction has been deleted.',
              'success'
            );

            getTransactions();
          } else {
            Swal.fire('Error', 'Failed to delete the transaction.', 'error');
          }
        } catch (error) {
          Swal.fire('Error', error.message, 'error');
        }
      } else {
        Swal.fire('Cancelled', 'The transaction was not deleted.', 'info');
      }
    };
    const downloadReceipt = async (transactionId) => {
  try {
    const response = await axios.get(`${apiURL}/download_receipt/${transactionId}`, {
      responseType: 'blob', // This tells Axios to treat the response as a binary file
    });

    // Create a link element to trigger the file download
    const link = document.createElement('a');
    const url = window.URL.createObjectURL(new Blob([response.data])); // Create URL from the blob
    link.href = url;
    link.setAttribute('download', `receipt-${transactionId}.pdf`); // Set the filename
    document.body.appendChild(link);
    link.click(); // Trigger the download

    // Clean up the link element
    document.body.removeChild(link);
  } catch (error) {
    Swal.fire('Error', error.message, 'error');
  }
};

    return {
      transactions,
      loading,
      getStatusClass,
      showSaleDetail,
      deleteTransaction,
      downloadReceipt,
      selectedTransaction,

    };
  },
};
</script>