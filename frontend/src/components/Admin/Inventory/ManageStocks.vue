<template>
    <Navbar />

    <div class="page-wrapper">
        <div class="content">
            <div class="page-header">
                <div class="page-title me-auto">
                    <h4>Manage Stocks</h4>
                </div>
                <ul class="table-top-head low-stock-top-head">
                    <li>
                        <div class="status-toggle d-flex justify-content-between align-items-center">
                            <input type="checkbox" id="user2" class="check" checked />
                            <label for="user2" class="checktoggle">checkbox</label>
                            Notify
                        </div>
                    </li>
                    <li>
                        <a data-bs-toggle="tooltip" data-bs-placement="top" title="Pdf"><img
                                src="/assets/img/icons/pdf.svg" alt="img" /></a>
                    </li>
                    <li>
                        <a data-bs-toggle="tooltip" data-bs-placement="top" title="Excel"><img
                                src="/assets/img/icons/excel.svg" alt="img" /></a>
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
            </div>
            <div class="table-tab">
                <ul class="nav nav-pills" id="pills-tab" role="tablist">
                    <li v-for="(tab, index) in tabs" :key="index" class="nav-item" role="presentation">
                        <button class="nav-link" :class="{ active: activeTab === tab.key }" :id="`pills-${tab.key}-tab`"
                            type="button" @click="changeTab(tab.key)">
                            {{ tab.label }}
                        </button>
                    </li>
                </ul>
                <div class="tab-content" id="pills-tabContent">
                    <div class="tab-pane fade show active" id="pills-table" role="tabpanel">
                        <div class="card table-list-card">
                            <div class="card-body">
                                <ClipLoader v-if="loading" />
                                <ClipLoader v-if="loadingStates[activeTab]" />


                                <div class="table-responsive" v-show="activeTab === 'history'">
                                    <table id="history-table" class="table">
                                        <thead>
                                            <tr>
                                                <th>SKU</th>
                                                <th>Product Name</th>
                                                <th>Previous Stock</th>
                                                <th>Changes</th>
                                                <th>New Stock</th>
                                                <th>Updated At</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="record in history" :key="record._id">
                                                <td>{{ record.sku }}</td>
                                                <td>{{ record.product }}</td>
                                                <td>{{ record.prevStock }}</td>
                                                <td>{{ record.change }}</td>
                                                <td>{{ record.newStock }}</td>
                                                <td>{{ $formatDate(record.updatedAt) }}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div class="table-responsive" v-show="activeTab !== 'history'">
                                    <table id="other-table" class="table">
                                        <thead>
                                            <tr>
                                                <th>SKU</th>
                                                <th>Product Name</th>
                                                <th>Category</th>
                                                <th>Status</th>
                                                <th>Created On</th>
                                                <th>Last Restock</th>
                                                <th>Qty</th>
                                                <th>Qty Alert</th>
                                                <th class="no-sort">Modify</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="product in filteredProducts" :key="product._id">
                                                <td>{{ product.sku }}</td>
                                                <td>{{ product.name }}</td>
                                                <td>{{ product.category }}</td>
                                                <td>
                                                    <span :class="{
                                                        'badge': true,
                                                        'badge-linesuccess': product.status === 'active',
                                                        'badge-linewarning': product.status === 'inactive'
                                                    }">
                                                        {{ product.status }}
                                                    </span>
                                                </td>
                                                <td>{{ $formatDate(product.updatedAt) }}</td>
                                                <td>{{ $formatDate(product.lastRestock) }}</td>
                                                <td>{{ product.quantity }}</td>
                                                <td>{{ product.quantityAlert }}</td>
                                                <td class="action-table-data">
                                                    <div class="edit-delete-action">
                                                        <a @click="openEditStockModal(product._id)" class="me-2 p-2"
                                                            type="button">
                                                            <font-awesome-icon icon="fa-pen-to-square"
                                                                class="feather-edit" />
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
            </div>
        </div>
    </div>
    <!-- Modal -->
    <div class="modal fade" id="edit-stock">
        <div class="modal-dialog modal-dialog-centered custom-modal-two">
            <div class="modal-content">
                <div class="page-wrapper-new p-0">
                    <div class="content">
                        <div class="modal-header border-0 custom-modal-header">
                            <div class="page-title">
                                <h4>Edit Stocks</h4>
                            </div>
                            <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div v-if="editProductData" class="modal-body custom-modal-body">
                            <form @submit.prevent="editStock">
                                <input type="hidden" input="">
                                <p>Product SKU: {{ editProductData.sku }}</p>
                                <p>Note: use (-) to deduct stock, e.g., -5</p>
                                <div class="mb-3">
                                    <label class="form-label">Qty</label>
                                    <input type="number" v-model="entryValue" class="form-control" placeholder="0"
                                        required />
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Qty Alert</label>
                                    <input type="number" v-model="newQuantityAlert" class="form-control"
                                        placeholder="0" />
                                </div>
                                <div class="modal-footer-btn">
                                    <button type="button" class="btn btn-cancel me-2"
                                        data-bs-dismiss="modal">Cancel</button>
                                    <button type="submit" class="btn btn-submit">Save Changes</button>
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
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue';
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
        const imageURL = process.env.VUE_IMAGE_URL;
        const products = ref([]);
        const lowStocks = ref([]);
        const outOfStock = ref([]);
        const history = ref([]);
        const select = ref(null);
        const editProductData = ref({});
        const selectedProductId = ref(null);
        const entryValue = ref(null);
        const newQuantityAlert = ref(0);
        const activeTab = ref('low');
        const tableInstance = ref(null);
        const loadingStates = ref({
            all: false,
            low: false,
            out: false,
            history: false,
        });
        onMounted(() => {

            // Fetch data for the active tab on 
            setTimeout(() => {
                const activeTabData = tabs.find(tab => tab.key === activeTab.value);
                if (activeTabData && activeTabData.fetch) {
                    activeTabData.fetch();
                }
            }, 1000)
        });

        onBeforeUnmount(() => {
            // Destroy DataTable instance on component unmount

            if (tableInstance.value) {
                tableInstance.value.destroy();
            }
        });

        const tabs = [
            { key: 'all', label: 'All Stocks', fetch: () => fetchStock('products_list', products) },
            { key: 'low', label: 'Low Stocks', fetch: () => fetchStock('low_stocks', lowStocks) },
            { key: 'out', label: 'Out of Stocks', fetch: () => fetchStock('no_stock', outOfStock) },  // Changed here
            { key: 'history', label: 'History', fetch: () => fetchStock('stock_history_list', history) },
        ];

        // Function to get products from the API
        const fetchStock = async (endpoint, stateVariable) => {
            loadingStates.value[activeTab.value] = true;
            try {
                const response = await axios.get(`${apiURL}/${endpoint}`);
                console.log(`${endpoint} response:`, response.data);

                // Check for the endpoint and populate the appropriate state variable
                if (endpoint === 'stock_history_list') {
                    history.value = response.data.history;
                } else if (endpoint === 'products_list') {
                    products.value = response.data.products;
                } else if (endpoint === 'low_stocks') {
                    lowStocks.value = response.data.lowStock;
                } else if (endpoint === 'no_stock') {
                    outOfStock.value = response.data.noStock;
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to fetch products. Please try again later.',
                });
            } finally {
                loadingStates.value[activeTab.value] = false;

            }
        };

        const changeTab = async (key) => {
            activeTab.value = key;
            const selectedTab = tabs.find((tab) => tab.key === key);

            if (selectedTab && selectedTab.fetch) {
                await selectedTab.fetch();
            }

            // Initialize DataTable after the DOM is updated
            nextTick(() => {

            });
        };

        const filteredProducts = computed(() => {
            console.log('Active Tab:', activeTab.value);  // Log active tab
            console.log('Filtered Products:', filteredProducts.value);  // Log filtered products
            if (activeTab.value === 'all') return products.value;
            if (activeTab.value === 'low') return lowStocks.value;
            if (activeTab.value === 'out') return outOfStock.value;
            if (activeTab.value === 'history') return history.value;
            return [];
        });


        const openEditStockModal = async (productId) => {
            try {
                entryValue.value = 0;
                newQuantityAlert.value = 0;

                const response = await axios.get(`${apiURL}/get_product/${productId}`);

                editProductData.value = response.data.product;
                newQuantityAlert.value = editProductData.value.quantityAlert;
                selectedProductId.value = editProductData.value._id;

                const modal = new bootstrap.Modal(document.getElementById('edit-stock'));
                modal.show();
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Something Went wrong',
                    showConfirmButton: true,
                });
            }
        };


        const editStock = async () => {
            try {
                const payload = {
                    entryValue: Number(entryValue.value),
                    quantityAlert: Number(newQuantityAlert.value),
                };

                const response = await axios.patch(
                    `${apiURL}/edit_stock/${editProductData.value._id}`,
                    payload
                );

                if (response.data.success) {
                    const result = await Swal.fire({
                        icon: 'success',
                        title: response.data.message,
                        showConfirmButton: true,
                    });
                    if (result.isConfirmed) {
                        document.querySelector('#edit-stock .btn-cancel').click();
                    }
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: response.data.message,
                        showConfirmButton: true,
                    });
                }
            } catch (error) {
                console.error('Error updating stock:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Failed to update stock.',
                    showConfirmButton: true,
                });
            } finally {
                fetchStockForCurrentTab();
            }
        };

        const fetchStockForCurrentTab = async () => {
            if (activeTab.value === 'all') {
                await fetchStock('products_list', products);
            } else if (activeTab.value === 'low') {
                await fetchStock('low_stocks', lowStocks);
            } else if (activeTab.value === 'out') {
                await fetchStock('no_stock', outOfStock);
            } else if (activeTab.value === 'history') {
                await fetchStock('stock_history_list', history);
            }
        };

        const deleteAlert = async (productId) => {
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
                    const response = await axios.patch(`${apiURL}/edit_products/${productId}`, {
                        status: 'deleted',
                    });

                    if (response.data.success) {
                        Swal.fire('Deleted!', 'Your product has been deleted.', 'success');
                        this.products = this.products.filter(product => product._id !== productId);
                    } else {
                        Swal.fire('Failed', 'There was an issue deleting the product.', 'error');
                    }
                } catch (error) {
                    Swal.fire('Error', 'Failed to delete the product.', 'error');
                }
            } else {
                Swal.fire('Cancelled', 'Your product is safe :)', 'error');
            }
        };

        return {
            products,
            select,
            lowStocks,
            outOfStock,
            history,
            selectedProductId,
            openEditStockModal,
            editProductData,
            editStock,
            entryValue,
            newQuantityAlert,
            activeTab,
            changeTab,
            filteredProducts,
            tabs,
            loadingStates,
            apiURL,
            imageURL,
            deleteAlert
        };
    },

};

</script>
