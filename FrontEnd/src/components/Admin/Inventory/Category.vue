<template>
    <Navbar />
    <div class="page-wrapper">

        <div class="content">
            <div class="page-header">
                <div class="add-item d-flex">
                    <div class="page-title">
                        <h4>Category</h4>
                        <h6>Manage your categories</h6>
                    </div>
                </div>
                <div class="page-btn">
                    <a href="#" class="btn btn-added" data-bs-toggle="modal" data-bs-target="#add-category">
                        <i data-feather="plus-circle" class="me-2"></i>Add New Category</a>
                </div>
            </div>
            <div class="card table-list-card">
                <div class="card-body">
                    <div class="table-responsive">
                        <ClipLoader v-if="loading" />
                        <table v-else class="table datanew" id="category-table">
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Created On</th>
                                    <th>Status</th>
                                    <th class="no-sort">Action</th>
                                </tr>
                            </thead>
                            <tbody>

                                <tr v-if="categories.length <= 0">
                                    <td colspan="8">No products available</td>
                                </tr>
                                <tr v-else v-for="category in categories" :key="category.id">
                                    <td>{{ category.name }}</td>
                                    <td>{{ $formatDate(category.createdAt) }}</td>
                                    <td>

                                        <span :class="{
                                            'badge': true,
                                            'badge-linesuccess': category.status === 'active',
                                            'badge-linewarning': category.status === 'inactive'
                                        }">
                                            {{ category.status }}
                                        </span>
                                    </td>

                                    <td class="action-table-data">
                                        <div class="edit-delete-action">
                                            <a class="me-2 p-2" href="#" data-bs-toggle="modal"
                                                data-bs-target="#edit-category" @click="openEditModal(category._id)">
                                                <i data-feather="edit" class="feather-edit"></i>
                                            </a>
                                            <a class="confirm-text p-2" href="javascript:void(0);"
                                                @click="deleteCategory(category._id)">
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

    <!-- Add Category Modal -->
    <div class="modal fade" id="add-category">
        <div class="modal-dialog modal-dialog-centered custom-modal-two">
            <div class="modal-content">
                <div class="modal-header border-0 custom-modal-header">
                    <div class="page-title">
                        <h4>Create Category</h4>
                    </div>
                    <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body custom-modal-body">
                    <form @submit.prevent="addCategory">
                        <div class="mb-3">
                            <label class="form-label">Category</label>
                            <input type="text" class="form-control" v-model="newCategory.name" required />
                        </div>
                        <div class="mb-0">
                            <div class="status-toggle modal-status d-flex justify-content-between">
                                <span class="form-label">{{ newCategory.status }}</span>
                                <input type="checkbox" id="add-category-status" class="check"
                                    v-model="newCategory.status" :true-value="'active'" :false-value="'inactive'" />
                                <label for="add-category-status" class="checktoggle"></label>
                            </div>
                        </div>
                        <div class="modal-footer-btn">
                            <button type="button" class="btn btn-cancel me-2" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" class="btn btn-submit">Create Category</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Edit Category Modal -->
    <div class="modal fade" id="edit-category">
        <div class="modal-dialog modal-dialog-centered ">
            <div class="modal-content">
                <div class="modal-header border-0">
                    <div class="page-title">
                        <h4>Edit Category</h4>
                    </div>
                    <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body ">
                    <form @submit.prevent="updateCategory">
                        <div class="mb-3">
                            <label class="form-label">Category</label>
                            <input type="text" class="form-control" v-model="editCategory.name" required />
                        </div>
                        <div class="mb-0">
                            <div class="status-toggle modal-status d-flex justify-content-between">
                                <span class="form-label">{{ editCategory.status }}</span>
                                <input type="checkbox" id="edit-category-status" class="check"
                                    v-model="editCategory.status" :true-value="'active'" :false-value="'inactive'" />
                                <label for="edit-category-status" class="checktoggle"></label>
                            </div>
                        </div>
                        <div class="modal-footer-btn">
                            <button type="button" class="btn btn-cancel me-2" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" class="btn btn-submit">Save Changes</button>
                        </div>
                    </form>
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
        Navbar,
        ClipLoader
    },

    setup() {
        const apiURL = process.env.VUE_APP_URL;
        const imageURL = process.env.VUE_APP_IMAGE_URL;
        const categories = ref([]);
        const newCategory = ref({
            name: '',
            status: 'inactive'
        });
        const editCategory = ref({ _id: null, name: '', status: 'inactive' });
        const loading = ref(true);
        const initializeDataTable = () => {
            const tableElement = $('#category-table');

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
            const table = $('#category-table').DataTable();
            table.destroy();
            initializeDataTable();
        };
         const getCategories = async () => {
            loading.value = true;
            try {
                const response = await axios.get(`${apiURL}/get_category_list`);
                categories.value = response.data.categories;
                if (!response.data.success) {
                    Swal.fire('Error', response.data.message, 'errror');
                } else {
                    nextTick(() => refreshDataTable());
                }
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'Unable to fetch categories', 'error');
            }
            finally {
                loading.value = false;
            }
        };



        const addCategory = async () => {
            try {
                const response = await axios.post(`${apiURL}/add_category`, newCategory.value);

                if (response.data.success) {
                    Swal.fire('Success', 'Category added successfully!', 'success');

                    document.querySelector('#add-category .btn-cancel').click();

                } else {
                    Swal.fire('Error', response.data.message || 'Failed to add category', 'error');

                    document.querySelector('#add-category .btn-cancel').click();
                }
                getCategories();
            } catch (error) {
                console.error(error);
                const errorMessage = error.response?.data?.message || 'An unexpected error occurred';
                Swal.fire('Error', errorMessage, 'error');
            }
        };

        const openEditModal = async (id) => {
            const response = await axios.get(`${apiURL}/get_category/${id}`);
            editCategory.value = response.data.category;
        };
        const toggleStatus = (data, event) => {
            data.status = event.target.checked ? 'active' : 'inactive';
        };

        const updateCategory = async () => {
            try {
                const response = await axios.patch(`${apiURL}/edit_category/${editCategory.value._id}`, editCategory.value);
                if (!response.data.success) {
                    Swal.fire('Error', response.data.message, 'error');
                } else {
                    Swal.fire('Success', 'Category updated successfully!', 'success');
                }
                document.querySelector('#edit-category .btn-cancel').click();
                getCategories();

            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'Failed to update category', 'error');
            }
        };

        const deleteCategory = async (id) => {
            Swal.fire({
                title: 'Are you sure?',
                text: 'You are about to delete this category!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, delete it!',
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const response = await axios.patch(`${apiURL}/edit_category/${id}`, { status: 'deleted', deletedAt: Date.now() });
                        if (response.data.success) {
                            Swal.fire('Deleted!', 'Category has been deleted.', 'success');
                        } else {
                            Swal.fire('Error', response.data.message, 'error');
                        }

                        getCategories();
                    } catch (error) {
                        console.error(error);
                        Swal.fire('Error', 'Failed to delete category', 'error');
                    }
                }
            });
        };


        onMounted(async () => {
            try {
                await nextTick()
                await getCategories();
                initializeDataTable();
                await feather.replace();

            } catch (error) {
                console.log(error);
            }
        });
        onBeforeMount(async () => {
            try {
                await getCategories();
                feather.replace();


            } catch (error) {
                console.error(error);
            }
        })

        return {
            categories,
            newCategory,
            editCategory,
            getCategories,
            addCategory,
            openEditModal,
            updateCategory,
            deleteCategory,
            toggleStatus,
            loading,
            imageURL,
            apiURL,

        };
    },
};
</script>
