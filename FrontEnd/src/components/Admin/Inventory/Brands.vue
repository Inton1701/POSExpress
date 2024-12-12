<template>
    <Navbar />

    <div class="page-wrapper">

        <div class="content">
            <div class="page-header">
                <div class="add-item d-flex">
                    <div class="page-title">
                        <h4>Brand</h4>
                        <h6>Manage your brands</h6>
                    </div>
                </div>
                <ul class="table-top-head">
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
                <div class="page-btn">
                    <a href="#" class="btn btn-added" data-bs-toggle="modal" data-bs-target="#add-brand"><i
                            data-feather="plus-circle" class="me-2"></i>Add New Brand</a>
                </div>
            </div>

            <div class="card table-list-card">
                <div class="card-body">
                    <div class="table-responsive">
                        <ClipLoader v-if="loading" />
                        <table v-else class="table   datanew" id="brand-table">
                            <thead>
                                <tr>
                                    <th>Brand</th>
                                    <th>Logo</th>
                                    <th>Status</th>
                                    <th>Created On</th>
                                    <th>Last Updated</th>
                                    <th class="no-sort">Action</th>
                                </tr>
                            </thead>

                            <tbody>

                                <tr v-if="brands.length <= 0">
                                    <td colspan="8">No products available</td>
                                </tr>
                                <tr v-else v-for="brand in brands" :key="brand._id">
                                    <td>{{ brand.name }}</td>
                                    <td>
                                        <span class="d-flex">
                                            <img v-if="brand.logo" :src="`${imageURL}${brand.logo}`"
                                                class="img-thumbnail"
                                                style="width: 150px; height: 50px; object-fit: contain;" />
                                            <img v-else :src="`/img/icons/no-image-icon.png`"
                                                alt="No image available" />
                                        </span>
                                    </td>
                                    <td>
                                        <span :class="{
                                            'badge': true,
                                            'badge-linesuccess': brand.status === 'active',
                                            'badge-linewarning': brand.status === 'inactive'
                                        }">
                                            {{ brand.status }}
                                        </span>
                                    </td>
                                    <td>{{ $formatDate(brand.createdAt) }}</td>
                                    <td>{{ $formatDate(brand.updatedAt) }}</td>
                                    <td class="action-table-data">
                                        <div class="edit-delete-action">
                                            <a class="me-2 p-2" href="#" data-bs-toggle="modal"
                                                data-bs-target="#edit-brand" @click="openEditModal(brand._id)">
                                                <i data-feather="edit" class="feather-edit"></i>
                                            </a>
                                            <a class="confirm-text p-2" href="javascript:void(0);"
                                                @click="deleteBrand(brand._id)">
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


    <div class="modal fade" id="add-brand">
        <div class="modal-dialog modal-dialog-centered custom-modal-two">
            <div class="modal-content">
                <div class="page-wrapper-new p-0">
                    <div class="content">
                        <div class="modal-header border-0 custom-modal-header">
                            <div class="page-title">
                                <h4>Create Brand</h4>
                            </div>
                            <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body custom-modal-body new-employee-field">
                            <form @submit.prevent="addBrand">
                                <div class="mb-3">
                                    <label class="form-label">Brand</label>
                                    <input type="text" v-model="newBrand.name" class="form-control" />
                                </div>
                                <label class="form-label">Logo</label>
                                <div class="profile-pic-upload mb-3">
                                    <!-- Add Image -->
                                    <div v-if="!newBrand.logo.url" class="profile-pic brand-pic"
                                        @click="triggerFileInput('new')">
                                        <input id="new-brand-file-input" type="file"
                                            @change="onFileChange('new', $event)" hidden />
                                        <span><i data-feather="plus-circle" class="plus-down-add"></i> Add Image</span>
                                    </div>

                                    <!-- Image Preview -->
                                    <div class="phone-img" v-else>
                                        <div class="image-preview-wrapper">
                                            <img :src="newBrand.logo.url" alt="Uploaded image" class="image-preview" />
                                            <a @click="removeImage('new')" class="remove-image-btn">
                                                <font-awesome-icon icon="xmark" style="color: #ffffff;" class="mx-2" />
                                            </a>
                                        </div>
                                    </div>
                                </div>


                                <div class="mb-0">
                                    <div
                                        class="status-toggle modal-status d-flex justify-content-between align-items-center">

                                        <span class="form-label">{{ newBrand.status }}</span>
                                        <input type="checkbox" id="add-category-status" class="check"
                                            v-model="newBrand.status" :true-value="'active'"
                                            :false-value="'inactive'" />
                                        <label for="add-category-status" class="checktoggle"></label>
                                    </div>
                                </div>
                                <div class="modal-footer-btn">
                                    <button type="button" class="btn btn-cancel me-2" data-bs-dismiss="modal">
                                        Cancel
                                    </button>
                                    <button type="submit" class="btn btn-submit">
                                        Create Brand
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="edit-brand">
        <div class="modal-dialog modal-dialog-centered custom-modal-two">
            <div class="modal-content">
                <div class="page-wrapper-new p-0">
                    <div class="content">
                        <div class="modal-header border-0 custom-modal-header">
                            <div class="page-title">
                                <h4>Edit Brand</h4>
                            </div>
                            <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body custom-modal-body new-employee-field">
                            <form @submit.prevent="updateBrand">
                                <div class="mb-3">
                                    <label class="form-label">Brand</label>
                                    <input type="text" v-model="editBrand.name" class="form-control" />
                                </div>
                                <label class="form-label">Logo</label>
                                <div class="profile-pic-upload mb-3">
                                    <!-- Add Image -->
                                    <div v-if="!editBrand.logo.url" class="profile-pic brand-pic"
                                        @click="triggerFileInput('edit')">
                                        <input id="edit-brand-file-input" type="file"
                                            @change="onFileChange('edit', $event)" hidden />
                                        <span><i data-feather="plus-circle" class="plus-down-add"></i> Add Image</span>
                                    </div>

                                    <!-- Image Preview -->
                                    <div class="phone-img" v-else>
                                        <div class="image-preview-wrapper">
                                            <img :src="editBrand.logo.url" alt="Uploaded image" class="image-preview" />
                                            <a @click="removeImage('edit')" class="remove-image-btn">
                                                <font-awesome-icon icon="xmark" style="color: #ffffff;" class="mx-2" />
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <div class="mb-0">
                                    <div
                                        class="status-toggle modal-status d-flex justify-content-between align-items-center">
                                        <span class="form-label">{{ editBrand.status }}</span>
                                        <input type="checkbox" id="add-category-status" class="check"
                                            v-model="editBrand.status" :true-value="'active'"
                                            :false-value="'inactive'" />
                                        <label for="add-category-status" class="checktoggle"></label>
                                    </div>
                                </div>
                                <div class="modal-footer-btn">
                                    <button type="button" class="btn btn-cancel me-2" data-bs-dismiss="modal">
                                        Cancel
                                    </button>
                                    <button type="submit" class="btn btn-submit">
                                        Save Changes
                                    </button>
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
import Swal from 'sweetalert2';
import 'select2';
import feather from 'feather-icons';
import ClipLoader from 'vue-spinner/src/ClipLoader.vue';
import $ from 'jquery';
import Navbar from '/src/components/Admin/Navbar.vue';
import { faL } from '@fortawesome/free-solid-svg-icons';

export default {
    components: {
        Navbar,
        ClipLoader,
    },
    setup() {
        const apiURL = process.env.VUE_APP_URL;
        const imageURL = process.env.VUE_APP_IMAGE_URL;
        const brands = ref([]);
        const newBrand = ref({
            name: '',
            logo: { file: null, url: null },
            status: 'active',
        });
        const editBrand = ref({
            _id: '',
            name: '',
            logo: { file: null, url: null },
            status: 'active',
            isLogoRemoved: false,
        });
        const loading = ref(false);

        const initializeDataTable = () => {
            const tableElement = $('#brand-table');

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

        const getBrands = async () => {

            loading.value = true;

            try {
                const response = await axios.get(`${apiURL}/brands_list`);
                brands.value = response.data.brandList;

                if (!response.data.success) {
                    Swal.fire('Error', response.data.message, 'error');
                } else {
                    nextTick(() => refreshDataTable());
                }
            } catch (error) {
                Swal.fire('Error', 'Failed to get brands', 'error');
            } finally {
                loading.value = false;
            }
        };

        const addBrand = async () => {
            try {
                const formData = new FormData();
                formData.append('name', newBrand.value.name);
                formData.append('status', newBrand.value.status);
                if (newBrand.value.logo.file) {
                    formData.append('logo', newBrand.value.logo.file);
                }

                const response = await axios.post(`${apiURL}/add_brand`, formData);

                if (response.data.success) {

                    Swal.fire('Success', 'Brand successfully added!', 'success').then(() => {
                        document.querySelector('#add-brand .btn-cancel').click();

                    });

                } else {
                    Swal.fire('Error', response.data.message, 'error');
                }
                getBrands();
            } catch (error) {
                Swal.fire('Error', 'Failed to add brand', 'error');
            }
        };

        const openEditModal = async (id) => {
            const response = await axios.get(`${apiURL}/get_brand/${id}`);
            const brand = response.data.brand;
            editBrand.value = {
                _id: brand._id,
                name: brand.name,
                logo: { url: `${imageURL}${brand.logo}`, file: null },
                status: brand.status,
            };
        };

        const updateBrand = async () => {
            try {
                const formData = new FormData();
                formData.append('name', editBrand.value.name); // Ensure `editBrand.value.name` exists
                formData.append('status', editBrand.value.status);
                formData.append('logoRemoved', editBrand.value.isLogoRemoved) // Ensure `editBrand.value.status` exists
                if (editBrand.value.logo.file) {
                    formData.append('logo', editBrand.value.logo.file); // Only append if a new file is selected
                }

                const response = await axios.patch(`${apiURL}/edit_brand/${editBrand.value._id}`, formData);

                if (response.data.success) {
                    Swal.fire('Success', 'Brand updated successfully!', 'success').then(() => {

                        document.querySelector('#edit-brand .btn-cancel').click(); // Close modal
                    });
                } else {
                    Swal.fire('Error', response.data.message, 'error');
                }
                getBrands(); // Refresh the brand list
            } catch (error) {
                console.error('Error in updateBrand:', error);
                Swal.fire('Error', error.message, 'error');
            }
        };


        const deleteBrand = async (id) => {
            Swal.fire({
                title: 'Are you sure?',
                text: 'You are about to delete this brand!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, delete it!',
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const response = await axios.patch(`${apiURL}/edit_brand/${id}`, {
                            status: 'deleted',
                            deletedAt: Date.now(),
                        });
                        if (response.data.success) {
                            Swal.fire('Success', 'Brand deleted successfully!', 'success');
                            getBrands();
                        } else {
                            Swal.fire('Error', response.data.message, 'error');
                        }
                    } catch (error) {
                        Swal.fire('Error', 'Failed to delete brand', 'error');
                    }
                }
            });
        };

        const triggerFileInput = (brand) => {
            if (brand === 'new') {
                document.querySelector('#new-brand-file-input').click();
            } else if (brand === 'edit') {
                document.querySelector('#edit-brand-file-input').click();
            }
        };

        const onFileChange = (brand, event) => {
            const file = event.target.files[0];
            if (file) {
                const logoData = { file, url: URL.createObjectURL(file) };
                if (brand === 'new') {
                    newBrand.value.logo = logoData;
                } else if (brand === 'edit') {
                    editBrand.value.logo = logoData;
                }
            }
        };

        const removeImage = (brand) => {
            if (brand === 'new') {
                newBrand.value.logo = { file: null, url: null };
            } else if (brand === 'edit') {
                editBrand.value.logo = { file: null, url: null };
                editBrand.value.isLogoRemoved = true;
            }
            console.log(editBrand.value.logo)
        };

        onMounted(async () => {
            try {
                await nextTick();
                await getBrands();
                initializeDataTable();
                await feather.replace();
            } catch (error) {
                console.error(error);
            }
        });

        return {
            brands,
            newBrand,
            editBrand,
            loading,
            getBrands,
            addBrand,
            updateBrand,
            deleteBrand,
            openEditModal,
            triggerFileInput,
            onFileChange,
            removeImage,
            imageURL,
            apiURL,
        };
    },
};
</script>

<style scoped>
.profile-pic-upload {
    display: flex;
    align-items: center;
}

.profile-pic.brand-pic {
    width: 120px;
    /* Set width for the add image button */
    height: 120px;
    /* Set height to match the image preview */
    background-color: #f1f1f1;
    /* Optional: Add background color */
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    border-radius: 8px;
    border: 1px solid #ddd;
    /* Optional: Add border */
}

.image-preview-wrapper {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 120px;
    /* Same width as the add image button */
    height: 120px;
    /* Same height as the add image button */
}

.image-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
    /* Ensure the image covers the area while maintaining its aspect ratio */
    border-radius: 8px;
    /* Optional: Add border radius */
}

.remove-image-btn {
    position: absolute;
    top: 5px;
    right: 5px;
    background-color: rgb(228, 0, 0);
    /* Optional: Dark background for the close button */
    padding: 1px;

    z-index: 10;
}
</style>