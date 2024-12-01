<template>
  <Navbar/>
  <Sidebar/>
    <div class="page-wrapper">
        <div class="content">
          <div class="page-header">
            <div class="add-item d-flex">
              <div class="page-title">
                <h4>Transaction List</h4>
                <h6>Manage Your Transaction</h6>
              </div>
            </div>
            <div class="page-btn">
              <a
                href="#"
                class="btn btn-added"
                data-bs-toggle="modal"
                data-bs-target="#add-sales-new"
                ><i data-feather="plus-circle" class="me-2"></i> Add New
                Sales</a
              >
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
                      <td>{{$formatDate(trans.createdAt)}}</td>
              
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
                      <td class="text-start">{{trans.totalAmount}}</td>
                      <td><span class="badge badge-linesuccess">{{trans.paymentMethod}}</span></td>
                      <td>{{ trans.employee }}</td>
                      <td class="text-center">
                        <a
                          class="action-set"
                          href="javascript:void(0);"
                          data-bs-toggle="dropdown"
                          aria-expanded="true"
                        >
                          <font-awesome-icon icon="fa fa-ellipsis-v" aria-hidden="true"  class="feather-eye"/>                     
                        </a>
                        <ul class="dropdown-menu">
                          <li>
                            <a
                              href="javascript:void(0);"
                              class="dropdown-item"
                              data-bs-toggle="modal"
                              data-bs-target="#sales-details-new"
                              ><i data-feather="eye" class="info-img"></i>Sale
                              Detail</a
                            >
                          </li>
                          <li>
                            <a
                              href="javascript:void(0);"
                              class="dropdown-item"
                              data-bs-toggle="modal"
                              data-bs-target="#edit-sales-new"
                              ><i data-feather="edit" class="info-img"></i>Edit
                              Sale</a
                            >
                          </li>
                          <li>
                            <a
                              href="javascript:void(0);"
                              class="dropdown-item"
                              data-bs-toggle="modal"
                              data-bs-target="#showpayment"
                              ><i
                                data-feather="dollar-sign"
                                class="info-img"
                              ></i
                              >Show Payments</a
                            >
                          </li>
                          <li>
                            <a
                              href="javascript:void(0);"
                              class="dropdown-item"
                              data-bs-toggle="modal"
                              data-bs-target="#createpayment"
                              ><i
                                data-feather="plus-circle"
                                class="info-img"
                              ></i
                              >Create Payment</a
                            >
                          </li>
                          <li>
                            <a href="javascript:void(0);" class="dropdown-item"
                              ><i data-feather="download" class="info-img"></i
                              >Download pdf</a
                            >
                          </li>
                          <li>
                            <a
                              href="javascript:void(0);"
                              class="dropdown-item confirm-text mb-0"
                              ><i data-feather="trash-2" class="info-img"></i
                              >Delete Sale</a
                            >
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

        const getTransactions = async () =>{
          loading.value = true;
        try{
          const reponse = await axios.get(`${apiURL}/get_all_transactions`);
        if(reponse.data.success){
          transactions.value = reponse.data.transactions
        }else{
          Swal.fire('Eror', 'Failed to get all transaction', 'error');
        }
        nextTick(() => refreshDataTable());
        }catch(error){
          Swal.fire('Eror', 'Something went wrong', 'error');
        }finally {
                loading.value = false;
            }


      }

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
    return {
      transactions,
      loading,
 
    };
  },
};
</script>