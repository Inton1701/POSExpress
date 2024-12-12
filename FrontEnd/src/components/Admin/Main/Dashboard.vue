<template>
  <Navbar />

  <div class="page-wrapper">
    <div class="content">
      <div class="row mb-3">
        <div class="col-12 d-flex justify-content-end">
          <button @click="toggleTransaction" :class="['btn', isTransactionOpen ? 'btn-danger' : 'btn-success']">
            {{ isTransactionOpen ? 'Close Transaction' : 'Open Transaction' }}
          </button>
        </div>
      </div>

      <div class="row">
      <!-- Total Items Sold -->

      <div class="col-xl-3 col-sm-6 col-12 d-flex">
        <div class="dash-widget w-100">
          <div class="dash-widgetimg">
            <span><img src="assets/img/icons/dash1.svg" alt="img" /></span>
          </div>
          <div class="dash-widgetcontent">
            
            <h5>
              <span class="counters">{{ totalItemsSold }}</span>
            </h5>
            <h6>Total Items Sold</h6>
          </div>
        </div>
      </div>

      <!-- Total Sales -->
      <div class="col-xl-3 col-sm-6 col-12 d-flex">
        <div class="dash-widget dash1 w-100">
          <div class="dash-widgetimg">
            <span><img src="assets/img/icons/dash2.svg" alt="img" /></span>
          </div>
          <div class="dash-widgetcontent">
            <h5>
              <font-awesome-icon icon="fa-peso-sign" />
              <span class="counters">{{ totalSales.toFixed(2) }}</span>
            </h5>
            <h6>Total Sales</h6>
          </div>
        </div>
      </div>

      <!-- Total Profit -->
      <div class="col-xl-3 col-sm-6 col-12 d-flex">
        <div class="dash-widget dash2 w-100">
          <div class="dash-widgetimg">
            <span>
              <font-awesome-icon icon="fa-arrow-trend-up" :size="'2x'" style="color: #74C0FC;" />
            </span>
          </div>
          <div class="dash-widgetcontent">
            <h5>
              <font-awesome-icon icon="fa-peso-sign" />
              <span class="counters">{{ totalProfit.toFixed(2) }}</span>
            </h5>
            <h6>Total Profit</h6>
          </div>
        </div>
      </div>

      <!-- Total Lost -->
      <div class="col-xl-3 col-sm-6 col-12 d-flex">
        <div class="dash-widget dash3 w-100">
          <div class="dash-widgetimg">
            <span>
              <font-awesome-icon icon="fa-arrow-trend-down" :size="'2x'" style="color: #ee3a5e;" />
            </span>
          </div>
          <div class="dash-widgetcontent">
            <h5>
              <font-awesome-icon icon="fa-peso-sign" />
              <span class="counters">{{ totalLost.toFixed(2) }}</span>
            </h5>
            <h6>Total Lost</h6>
          </div>
        </div>
      </div>

      <!-- Total Transactions -->
      <div class="col-xl-3 col-sm-6 col-12 d-flex">
        <div class="dash-count">
          <div class="dash-counts">
            <h4>{{ totalTransactions }}</h4>
            <h5>Transactions</h5>
          </div>
          <div class="dash-imgs">
            <font-awesome-icon icon="fa-handshake" />
          </div>
        </div>
      </div>

      <!-- Total Returns -->
      <div class="col-xl-3 col-sm-6 col-12 d-flex">
        <div class="dash-count badge-bgprimary">
          <div class="dash-counts">
            <h4>{{ totalReturnedTransactions }}</h4>
            <h5>Returns</h5>
          </div>
          <div class="dash-imgs">
            <font-awesome-icon icon="fa-reply" />
          </div>
        </div>
      </div>

      <!-- Total Purchase Invoice -->
      <div class="col-xl-3 col-sm-6 col-12 d-flex">
        <div class="dash-count das2 bg-danger">
          <div class="dash-counts">
            <h4>{{ totalVoidedTransactions }}</h4>
            <h5>Void Purchases</h5>
          </div>
          <div class="dash-imgs">
            <font-awesome-icon icon="fa-ban" />
          </div>
        </div>
      </div>

      <!-- Completed Transactions -->
      <div class="col-xl-3 col-sm-6 col-12 d-flex">
        <div class="dash-count das3">
          <div class="dash-counts">
            <h4>{{ totalCompletedTransactions }}</h4>
            <h5>Completed transactions</h5>
          </div>
          <div class="dash-imgs">
            <font-awesome-icon icon="fa-clipboard-check" />
          </div>
        </div>
      </div>
    </div>
  </div>
      <div class="row">
        <div class="col-xl-7 col-sm-12 col-12 d-flex">
          <div class="card flex-fill">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="card-title mb-0">Purchase & Sales</h5>
              <div class="graph-sets">

                <div class="dropdown dropdown-wraper">
                  <button class="btn btn-light btn-sm dropdown-toggle" type="button" id="dropdownMenuButton"
                    data-bs-toggle="dropdown" aria-expanded="false">
                    2023
                  </button>
                  <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                    <li>
                      <a href="javascript:void(0);" class="dropdown-item">2023</a>
                    </li>
                    <li>
                      <a href="javascript:void(0);" class="dropdown-item">2022</a>
                    </li>
                    <li>
                      <a href="javascript:void(0);" class="dropdown-item">2021</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="card-body">
              <canvas ref="chartCanvas"></canvas>
            </div>
          </div>
        </div>
        <div class="col-xl-5 col-sm-12 col-12 d-flex">
          <div class="card flex-fill default-cover mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h4 class="card-title mb-0">Recent Transactions</h4>
              <div class="view-all-link">
                <a href="javascript:void(0);" class="view-all d-flex align-items-center">
                  View All<span class="ps-2 d-flex align-items-center"><i data-feather="arrow-right"
                      class="feather-16"></i></span>
                </a>
              </div>
            </div>
            <div class="card-body">
              <div class="table-responsive dataview">
                <ClipLoader v-if="loading" />
                <table v-else class="table datanew">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody class="sales-list">
    <tr v-if="transactions.length <= 0">
      <td colspan="3">No transactions available</td>
    </tr>
    <tr v-else v-for="trans in transactions.slice(0, 5)" :key="trans.id">
      <td>{{ trans.transactionId }}</td>

      <td class="text-center">
        <span :class="{
          'badge': true,
          'badge-bgsuccess': trans.status === 'Completed',
          'badge-bgdanger': trans.status === 'Voided',
          'badge-bgprimary': trans.status === 'Returned'
        }">
          {{ trans.status }}
        </span>
      </td>

      <td>{{ $formatDate(trans.createdAt) }}</td>
    </tr>
  </tbody>
</table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <h4 class="card-title">Fast Moving Products</h4>
        </div>
        <div class="card-body">
          <div class="table-responsive dataview">
            <table class="table dashboard-expired-products">
              <thead>
          <tr>
            <th>SKU</th>
            <th>Product Name</th>
            <th>Price</th>
            <th>Sold</th>
            <th>Quantity</th>
            <th>Total Sales</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products.slice(0, 5)" :key="product.sku">
            <td>{{ product.sku }}</td>
            <td>{{ product.name }}</td>
            <td>{{ product.price.toFixed(2) }}</td>
            <td>{{ product.sales }}</td>
            <td>{{ product.quantity }}</td>
            <td>{{ product.totalSales.toFixed(2) }}</td>
          </tr>
        </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  
</template>

<script>
import { ref, onMounted, onBeforeUnmount,nextTick } from "vue";
import Chart from "chart.js/auto";
import axios from "axios";
import Navbar from "/src/components/Admin/Navbar.vue";
import Swal from "sweetalert2";
import ClipLoader from 'vue-spinner/src/ClipLoader.vue';


export default {
  components: {
    Navbar,
    ClipLoader
  },
  setup() {
    const chartCanvas = ref(null);
    let chartInstance = null;
    const apiURL = process.env.VUE_APP_URL;
    // Initialize statistics as ref variables
    const totalItemsSold = ref(0);
    const totalSales = ref(0);
    const totalProfit = ref(0);
    const totalLost = ref(0);
    const totalTransactions = ref(0);
    const totalCompletedTransactions = ref(0);
    const totalVoidedTransactions = ref(0);
    const totalReturnedTransactions = ref(0);
    const isTransactionOpen = ref(false);
    const dateRange = ref({ startDate: null, endDate: null });
    const loading = ref(false);
    const isLoading = ref(false);
    const transactions = ref([]);
    const products = ref([]);

    const getTransactions = async () => {
      loading.value = true;
      try {
        const reponse = await axios.get(`${apiURL}/get_all_transactions`);
        if (reponse.data.success) {
          transactions.value = reponse.data.transactions
        } else {
          Swal.fire('Eror', 'Failed to get all transaction', 'error');
        }

      } catch (error) {
        console.error(error);
        Swal.fire('Error', 'Something went wrong', 'error');
      } finally {
        loading.value = false;
      }
    }

     const  getFastMovingProducts=  async () => {
      try {
        const response = await axios.get(`${apiURL}/get_fast_moving`); // Adjust API endpoint as necessary
        products.value = response.data;
      } catch (error) {
        console.error('Error fetching fast-moving products:', error);
      }
    }
    // Function to render the chart after data is fetched
    const renderChart = (salesData) => {
      if (salesData.length > 0 && chartCanvas.value) {
        const labels = salesData.map((data) => data._id); // Assuming '_id' as labels
        const totalSalesData = salesData.map((data) => data.totalSales);
        const totalProfitData = salesData.map((data) => data.totalProfit);

        const ctx = chartCanvas.value.getContext("2d"); // Get the context for the canvas element

        // Destroy existing chart instance before creating a new one
        if (chartInstance) {
          chartInstance.destroy();
        }

        // Initialize the chart with the provided data
        chartInstance = new Chart(ctx, {
          type: "bar",
          data: {
            labels: labels,
            datasets: [
              {
                label: "Total Sales",
                data: totalSalesData,
                backgroundColor: "rgb(40, 199, 111)",
                borderColor: "rgb(75, 192, 192)",
                borderWidth: 1,
              },
              {
                label: "Total Profit",
                data: totalProfitData,
                backgroundColor: "rgb(255, 77, 77)",
                borderColor: "rgb(255, 99, 132)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: "top",
              },
              tooltip: {
                enabled: true,
              },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Dates",
                },
              },
              y: {
                title: {
                  display: true,
                  text: "Values",
                },
                beginAtZero: true,
              },
            },
          },
        });
      }
    };

    // Fetch transaction state (open or closed)
    const updateTransactionState = async () => {
  try {
    const response = await axios.get(`${apiURL}/transaction_state`);
    if (response.data.success) {
      isTransactionOpen.value = response.data.isOpen;  // This should reflect the correct state
    } else {
      console.error("Failed to fetch transaction state.");
    }
  } catch (error) {
    console.error("Error fetching transaction state:", error);
    Swal.fire({
      title: "Error!",
      text: "Failed to update transaction state",
      icon: "error",
      confirmButtonText: "OK",
    });
  }
};

const toggleTransaction = async () => {
  const action = isTransactionOpen.value ? "close" : "open";
  try {
    const result = await Swal.fire({
      title: "Confirm Action",
      text: `Are you sure you want to ${action} the transaction?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    });

    if (result.isConfirmed) {
      const endpoint = `${action}_transaction`;
      const response = await axios.post(`${apiURL}/${endpoint}`);

      if (response.data.success) {
        isTransactionOpen.value = !isTransactionOpen.value;
        await Swal.fire({
          title: "Success!",
          text: `Transaction ${action}ed successfully`,
          icon: "success",
          confirmButtonText: "OK",
        });

        // Reset data if the transaction was opened
        if (isTransactionOpen.value) {
          // Reset statistics and chart data
          totalItemsSold.value = 0;
          totalSales.value = 0;
          totalProfit.value = 0;
          totalLost.value = 0;
          totalTransactions.value = 0;
          totalCompletedTransactions.value = 0;
          totalVoidedTransactions.value = 0;
          totalReturnedTransactions.value = 0;
          dateRange.value = { startDate: null, endDate: null };

          // Reload statistics and chart data
          await fetchStatistics();
        } else {
          // Optionally, fetch statistics again when transaction is closed
          await fetchStatistics();
        }
      } else {
        throw new Error(response.data.message || `Failed to ${action} transaction`);
      }
    }
  } catch (error) {
    console.error(`Error ${action}ing transaction:`, error);
    Swal.fire({
      title: "Error!",
      text: error.message,
      icon: "error",
      confirmButtonText: "OK",
    });
  }
};


const fetchStatistics = async () => {
  try {
    isLoading.value = true;

    const response = await axios.get(`${apiURL}/get_statistics`);
    if (response.data.success) {
      const statistics = response.data.statistics;

      // Set the statistics values
      totalTransactions.value = statistics.totalTransactions;
      totalCompletedTransactions.value = statistics.totalCompletedTransactions;
      totalVoidedTransactions.value = statistics.totalVoidedTransactions;
      totalReturnedTransactions.value = statistics.totalReturnedTransactions;
      totalSales.value = statistics.totalSalesAmount;
      totalProfit.value = statistics.totalProfitAmount;
      totalLost.value = statistics.totalLossAmount;
      totalItemsSold.value = statistics.totalItemsSold;
      dateRange.value = statistics.dateRange || { startDate: null, endDate: null };
    } else {
      console.error("Failed to fetch dashboard statistics");
    }

    // Fetch the sales data for the chart
    const chartResponse = await axios.get(`${apiURL}/get_sales`);
    if (chartResponse.data.success) {
      const salesData = chartResponse.data.salesDatas;
      renderChart(salesData); // Render the chart once the data is fetched
    } else {
      console.error("Failed to fetch sales data for chart");
    }
  } catch (error) {
    console.error("Error fetching statistics:", error);
    Swal.fire({
      title: "Error!",
      text: "Failed to fetch dashboard data",
      icon: "error",
      confirmButtonText: "OK",
    });
  } finally {
    isLoading.value = false;
  }
};
    // On component mount, fetch initial data
    onMounted(async () => {
      await updateTransactionState();
      await fetchStatistics();
      await getTransactions();
      await getFastMovingProducts();
    });

    // Clean up the chart instance when the component is unmounted
    onBeforeUnmount(() => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    });

    return {
      chartCanvas,
      totalItemsSold,
      totalSales,
      totalProfit,
      totalLost,
      totalTransactions,
      totalCompletedTransactions,
      totalVoidedTransactions,
      totalReturnedTransactions,
      dateRange,
      isTransactionOpen,
      toggleTransaction,
      getTransactions,
      transactions,
      products
    };
  },
};
</script>
