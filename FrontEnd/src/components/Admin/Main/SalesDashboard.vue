<template>
    <Navbar/>

    <div class="page-wrapper">
        <div class="content">
            
            
            <div class="row sales-cards">
                <div class="col-xl-6 col-sm-12 col-12">
                    <div class="card d-flex align-items-center justify-content-between default-cover mb-4">
                        <div>
                            <h6>Weekly Earning</h6>
                            <h3>
                                $<span class="counters" data-count="95000.45">95000.45</span>
                            </h3>
                            <p class="sales-range">
                                <span class="text-success"><i data-feather="chevron-up"
                                        class="feather-16"></i>48%&nbsp;</span>increase compare to last week
                            </p>
                        </div>
                        <img src="/assets/img/icons/weekly-earning.svg" alt="img" />
                    </div>
                </div>
                <div class="col-xl-3 col-sm-6 col-12">
                    <div class="card color-info bg-primary mb-4">
                        <img src="/assets/img/icons/total-sales.svg" alt="img" />
                        <h3 class="counters" data-count="10000.00">10,000+</h3>
                        <p>No of Total Sales</p>
                        <i data-feather="rotate-ccw" class="feather-16" data-bs-toggle="tooltip" data-bs-placement="top"
                            title="Refresh"></i>
                    </div>
                </div>
                <div class="col-xl-3 col-sm-6 col-12">
                    <div class="card color-info bg-secondary mb-4">
                        <img src="/assets/img/icons/purchased-earnings.svg" alt="img" />
                        <h3 class="counters" data-count="800.00">800+</h3>
                        <p>No of Total Sales</p>
                        <i data-feather="rotate-ccw" class="feather-16" data-bs-toggle="tooltip" data-bs-placement="top"
                            title="Refresh"></i>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-sm-12 col-md-12 col-xl-4 d-flex">
                    <div class="card flex-fill default-cover w-100 mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h4 class="card-title mb-0">Best Seller</h4>
                            <div class="dropdown">
                                <a href="javascript:void(0);" class=" d-flex align-items-center">
                                    View All<span class="ps-2 d-flex align-items-center"><i data-feather="arrow-right"
                                            class="feather-16"></i></span>
                                </a>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table">
                                    <tbody class="slimScroll">
                                        <tr>
                                            <td>
                                                <div class="">
                                                    <a href="product-list.html" class="product-img">
                                                        <img src="/assets/img/products/stock-img-04.png"
                                                            alt="product" />
                                                    </a>
                                                    <div class="info">
                                                        <a href="product-list.html">Amazon Echo Dot</a>
                                                        <p class="dull-text">$597</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <p class="head-text">Sales</p>
                                                784
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-sm-12 col-md-12 col-xl-8 d-flex">
                    <div class="card flex-fill default-cover w-100 mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h4 class="card-title mb-0">Recent Transactions</h4>
                            <div class="dropdown">
                                <a href="javascript:void(0);" class="view-all d-flex align-items-center">
                                    View All<span class="ps-2 d-flex align-items-center"><i data-feather="arrow-right"
                                            class="feather-16"></i></span>
                                </a>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table ">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Order Details</th>
                                            <th>Payment</th>
                                            <th>Status</th>
                                            <th>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>5</td>
                                            <td>
                                                <div class="product-info">
                                                    <a href="product-list.html" class="product-img">
                                                        <img src="/assets/img/products/expire-product-04.png"
                                                            alt="product" />
                                                    </a>
                                                    <div class="info">
                                                        <a href="product-list.html">Woodcraft Sandal</a>
                                                        <span class="dull-text d-flex align-items-center"><i
                                                                data-feather="clock" class="feather-14"></i>15
                                                            Mins</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span class="text-blue">#147784454554</span>
                                            </td>
                                            <td>
                                                <span class="badge background-less border-success">Success</span>
                                            </td>
                                            <td>$1,478.00</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row sales-board  col-12">
                <div class="col-md-12 col-lg-7 col-sm-12 col-12">
                    <div class="card flex-fill default-cover">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="card-title mb-0">Sales Analytics</h5>
                            <div class="graph-sets">
                                <div class="dropdown dropdown-wraper">
                                    <button class="btn btn-white btn-sm dropdown-toggle d-flex align-items-center"
                                        type="button" id="dropdown-sales" data-bs-toggle="dropdown"
                                        aria-expanded="false">
                                        <i data-feather="calendar" class="feather-14"></i>2023
                                    </button>
                                    <ul class="dropdown-menu" aria-labelledby="dropdown-sales">
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
                            <div id="sales-analysis" class="chart-set"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import { ref, onMounted, onBeforeUnmount } from 'vue';

import 'select2'; 
import feather from 'feather-icons'
import 'datatables.net-bs5'
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';

import Sidebar from '/src/components/Admin/Sidebar.vue';
import Navbar from '/src/components/Admin/Navbar.vue';


export default {
  components: {
    Sidebar,
    Navbar,
  },
  setup() {
    const select = ref('.select'); 
    onMounted(async () => {
        try{
            await $(select.value).select2();
            await feather.replace();
            // await $('.table').DataTable();
        }catch(error){
            console.log(error);
        }

    });
    onBeforeUnmount(() => {
      $(select.value).select2('destroy');
    });
    return {
      select
    };
  },
};
</script>