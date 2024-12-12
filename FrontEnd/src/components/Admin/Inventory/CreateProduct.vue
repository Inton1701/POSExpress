<template>
    <Navbar />

    <div class="page-wrapper">
        <div class="content">
            <div class="page-header">
                <div class="add-item d-flex">
                    <div class="page-title">
                        <h4>New Product</h4>
                        <h6>Create new product</h6>
                    </div>
                </div>
                <ul class="table-top-head">
                    <li>
                        <div class="page-btn">
                            <router-link to="products" class="btn btn-secondary"><i data-feather="arrow-left"
                                    class="me-2"></i>Back to Product</router-link>
                        </div>
                    </li>
                    <li>
                        <a data-bs-toggle="tooltip" data-bs-placement="top" title="Collapse" id="collapse-header"><i
                                data-feather="chevron-up" class="feather-chevron-up"></i></a>
                    </li>
                </ul>
            </div>
            <div class="row justify-content-center">
                <div class="col-lg-4 col-md-6 col-sm-8 col-12">
                    <div class="mb-3 add-product text-center">
                        <!-- Show/hide barcode and error messages -->
                        <div v-show="inputedProduct.sku.length === 13 || inputedProduct.sku.length === 0">
                            <!-- Error Message for invalid SKU -->
                            <div v-if="inputedProduct.sku.length !== 13 && inputedProduct.sku.length > 0"
                                class="text-danger">
                                SKU must be exactly 13 digits.
                            </div>

                            <!-- Barcode rendering -->
                            <Barcode v-if="inputedProduct.sku.length === 13" ref="barcodeRef" :sku="inputedProduct.sku"
                                :productName="inputedProduct.name" />
                        </div>
                    </div>
                </div>
            </div>
            <form @submit.prevent="addProduct">
                <div class="card">
                    <div class="card-body add-product pb-0">
                        <div class="accordion-card-one accordion" id="accordionExample">
                            <div class="accordion-item">
                                <div class="accordion-header" id="headingOne">
                                    <div class="accordion-button" data-bs-toggle="collapse"
                                        data-bs-target="#collapseOne" aria-controls="collapseOne">
                                        <div class="addproduct-icon">
                                            <h5>
                                                <i data-feather="info" class="add-info"></i><span>Product
                                                    Information</span>
                                            </h5>
                                            <a href="javascript:void(0);"><i data-feather="chevron-down"
                                                    class="chevron-down-add"></i></a>
                                        </div>
                                    </div>
                                </div>
                                <div id="collapseOne" class="accordion-collapse collapse show"
                                    aria-labelledby="headingOne" data-bs-parent="#accordionExample">
                                    <div class="accordion-body">


                                        <div class="row">
                                            <div class="col-lg-5 col-sm-6 col-12">
                                                <div class="mb-3 add-product">
                                                    <label class="form-label">Status</label>
                                                    <div
                                                        class="status-toggle modal-status d-flex justify-content-between">
                                                        <span class="form-label">{{ inputedProduct.status }}</span>
                                                        <input type="checkbox" id="user4" class="check"
                                                            :checked="inputedProduct.status === 'active'"
                                                            @change="toggleStatus" />
                                                        <label for="user4" class="checktoggle"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-lg-5 col-sm-6 col-12">
                                                <div class="input-blocks add-product list">
                                                    <label data-bs-toggle="tooltip"
                                                        title="Note: it must be 13 numbers">SKU
                                                        <i class="mb-1" data-feather="help-circle"
                                                            style="height: 15px"></i>
                                                    </label>
                                                    <input type="text" id="sku" class="form-control list"
                                                        placeholder="Enter SKU manually" :maxlength="13"
                                                        v-model="inputedProduct.sku"
                                                        @input="inputedProduct.sku = filterNumInput($event.target.value)"
                                                        :class="{ 'is-invalid': inputedProduct.sku.length !== 13 && inputedProduct.sku.length > 0 }"
                                                        required />
                                                    <p class="mt-1 text-danger">{{ skuError }}</p>
                                                    <div class="d-flex align-items-center mt-2">
                                                        <button type="button" class="btn btn-primaryadd"
                                                            @click="autoGenerateSKU">Auto Generate</button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-lg-5 col-sm-6 col-12">
                                                <div class="mb-3 add-product">
                                                    <label class="form-label">Product Name</label>
                                                    <input type="text" class="form-control"
                                                        placeholder="Product name here." :maxlength="35"
                                                        v-model="inputedProduct.name"
                                                        @input="productName = filterTextInput($event.target.value)"
                                                        required />
                                                    <p class="mt-1">Maximum of 35 Characters</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="addservice-info">
                                            <div class="row">
                                                <div class="col-lg-4 col-sm-6 col-12">
                                                    <div class="mb-3 add-product">
                                                        <div class="add-newplus">
                                                            <label class="form-label">Category</label>
                                                            <a href="javascript:void(0);" data-bs-toggle="modal"
                                                                data-bs-target="#add-units-category"><i
                                                                    data-feather="plus-circle"
                                                                    class="plus-down-add"></i><span>Add New</span></a>
                                                        </div>
                                                        <select class="form-control" v-model="inputedProduct.category">
                                                            <option value="None">None</option>
                                                            <option v-for="category in categories" :key="category._id"
                                                                :value="category.name">
                                                                {{ category.name }}
                                                            </option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div class="col-lg-4 col-sm-6 col-12">
                                                    <div class="mb-3 add-product">
                                                        <div class="add-newplus">
                                                            <label class="form-label">Unit</label>
                                                            <a href="javascript:void(0);" data-bs-toggle="modal"
                                                                data-bs-target="#add-unit"><i data-feather="plus-circle"
                                                                    class="plus-down-add"></i><span>Add New</span></a>
                                                        </div>
                                                        <select class="form-control" v-model="inputedProduct.unit">
                                                            <option selected value="None">None</option>
                                                            <option v-for="unit in units" :key="unit._id"
                                                                :value="unit.name">
                                                                {{ unit.name }}
                                                            </option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div class="col-lg-4 col-sm-6 col-12">
                                                    <div class="mb-3 add-product">
                                                        <div class="add-newplus">
                                                            <label class="form-label">Brand</label>
                                                            <a href="javascript:void(0);" data-bs-toggle="modal"
                                                                data-bs-target="#add-units-brand"><i
                                                                    data-feather="plus-circle"
                                                                    class="plus-down-add"></i><span>Add New</span></a>
                                                        </div>
                                                        <div>
                                                            <select class="form-control" v-model="inputedProduct.brand">
                                                                <option v-for="brand in brands" :key="brand._id"
                                                                :value="brand.name">
                                                                {{ brand.name }}
                                                            </option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-lg-12">
                                            <div class="input-blocks summer-description-box transfer mb-3">
                                                <label>Description</label>
                                                <textarea class="form-control h-100" rows="5"
                                                    placeholder="Please type here the description" :maxlength="150"
                                                    v-model="inputedProduct.description"
                                                    @input="productDescription = filterTextInput($event.target.value)"></textarea>
                                                <p class="mt-1">Maximum of 150 Characters</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Product Pricing Section -->
                        <div class="accordion-card-one accordion" id="accordionExample2">
                            <div class="accordion-item">
                                <div class="accordion-header" id="headingTwo">
                                    <div class="accordion-button" data-bs-toggle="collapse"
                                        data-bs-target="#collapseTwo" aria-controls="collapseTwo">
                                        <div class="text-editor add-list">
                                            <div class="addproduct-icon list icon">
                                                <h5>
                                                    <i data-feather="life-buoy" class="add-info"></i><span>Product
                                                        Pricing</span>
                                                </h5>
                                                <a href="javascript:void(0);"><i data-feather="chevron-down"
                                                        class="chevron-down-add"></i></a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div id="collapseTwo" class="accordion-collapse collapse show"
                                    aria-labelledby="headingTwo" data-bs-parent="#accordionExample2">
                                    <div class="accordion-body">
                                        <div class="row">
                                            <div class="col-lg-4 col-sm-6 col-12">
                                                <div class="mb-3 add-product">
                                                    <label class="form-label">Price</label>
                                                    <input type="number"  step="0.01"   min="0"  class="form-control"
                                                        v-model="inputedProduct.price" required placeholder="0.00" />
                                                </div>
                                            </div>
                                            <div class="col-lg-4 col-sm-6 col-12">
                                                <div class="mb-3 add-product">
                                                    <label class="form-label">Cost</label>
                                                    <input type="number"  step="0.01"  min="0"  class="form-control"
                                                        v-model="inputedProduct.cost" required placeholder="0.00" />
                                                </div>
                                            </div>
                                            <div class="col-lg-4 col-sm-6 col-12">
                                                <div class="mb-3 add-product">
                                                    <label class="form-label">Tax Type</label>
                                                    <select class="form-control" v-model="inputedProduct.taxType">
                                                        <option selected value="vatable">Vatable Sales</option>
                                                        <option value="non-vatable">None Vatable Sales</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="collapseThree" class="accordion-collapse collapse show" aria-labelledby="headingThree"
                        data-bs-parent="#accordionExample3">
                        <div class="accordion-body">
                            <div class="text-editor add-list add">
                                <div class="col-lg-12">
                                    <div class="add-choosen">
                                        <div class="input-blocks">
                                            <div class="image-upload">
                                                <!-- File input field for image upload -->
                                                <input type="file" @change="onFileChange" />
                                                <!-- Display the placeholder when no image is uploaded -->
                                                <div class="image-uploads" v-if="!inputedProduct.image.url">
                                                    <i data-feather="plus-circle"></i>
                                                    <h4>Add Images</h4>
                                                </div>
                                            </div>
                                        </div>
                                        <!-- Display the uploaded image with a remove button -->
                                        <div class="phone-img" v-if="inputedProduct.image.url">
                                            <img :src="inputedProduct.image.url" alt="Uploaded image" />
                                            <a href="javascript:void(0);" @click="removeImage">
                                                <i data-feather="x" class="x-square-add remove-product"></i>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- Save Buttons -->

                </div>
                <div class="col-lg-12">
                    <div class="btn-addproduct mb-4">
                        <button type="button" class="btn btn-cancel me-2">Cancel</button>
                        <button type="submit" class="btn btn-submit">Save Product</button>
                    </div>
                </div>
            </form>
        </div>

    </div>

    <div class="modal fade" id="add-units">
        <div class="modal-dialog modal-dialog-centered stock-adjust-modal">
            <div class="modal-content">
                <div class="page-wrapper-new p-0">
                    <div class="content">
                        <div class="modal-header border-0 custom-modal-header">
                            <div class="page-title">
                                <h4>Add Variation Attribute</h4>
                            </div>
                            <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body custom-modal-body">
                            <div class="row">
                                <div class="col-lg-12">
                                    <div class="input-blocks">
                                        <label>Attribute Name</label>
                                        <input type="text" class="form-control" v-model="inputedProduct.variant" />
                                    </div>
                                </div>
                                <div class="col-lg-12">
                                    <div class="input-blocks">
                                        <label>Add Value</label>
                                        <input type="text" class="form-control" />
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-lg-6">

                                </div>
                                <div class="col-lg-6">
                                    <div class="modal-footer-btn popup">
                                        <a href="javascript:void(0);" class="btn btn-cancel me-2"
                                            data-bs-dismiss="modal">Cancel</a>
                                        <a href="javascript:void(0);" class="btn btn-submit"
                                            data-bs-dismiss="modal">Create Attribute</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="modal fade" id="add-units-category">
        <div class="modal-dialog modal-dialog-centered custom-modal-two">
            <div class="modal-content">
                <div class="page-wrapper-new p-0">
                    <div class="content">
                        <div class="modal-header border-0 custom-modal-header">
                            <div class="page-title">
                                <h4>Add New Category</h4>
                            </div>
                            <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body custom-modal-body">
                            <div class="mb-3">
                                <label class="form-label">Name</label>
                                <input type="text" class="form-control" />
                            </div>
                            <div class="modal-footer-btn">
                                <a href="javascript:void(0);" class="btn btn-cancel me-2"
                                    data-bs-dismiss="modal">Cancel</a>
                                <a href="add-product.html" class="btn btn-submit">Submit</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="add-units-brand">
        <div class="modal-dialog modal-dialog-centered custom-modal-two">
            <div class="modal-content">
                <div class="page-wrapper-new p-0">
                    <div class="content">
                        <div class="modal-header border-0 custom-modal-header">
                            <div class="page-title">
                                <h4>Add New Brand</h4>
                            </div>
                            <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body custom-modal-body">
                            <div class="mb-3">
                                <label class="form-label">Brand</label>
                                <input type="text" class="form-control" />
                            </div>
                            <div class="modal-footer-btn">
                                <a href="javascript:void(0);" class="btn btn-cancel me-2"
                                    data-bs-dismiss="modal">Cancel</a>
                                <a href="add-product.html" class="btn btn-submit">Submit</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="add-unit">
        <div class="modal-dialog modal-dialog-centered custom-modal-two">
            <div class="modal-content">
                <div class="page-wrapper-new p-0">
                    <div class="content">
                        <div class="modal-header border-0 custom-modal-header">
                            <div class="page-title">
                                <h4>Add Unit</h4>
                            </div>
                            <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body custom-modal-body">
                            <div class="mb-3">
                                <label class="form-label">Unit</label>
                                <input type="text" class="form-control" />
                            </div>
                            <div class="modal-footer-btn">
                                <a href="javascript:void(0);" class="btn btn-cancel me-2"
                                    data-bs-dismiss="modal">Cancel</a>
                                <a href="add-product.html" class="btn btn-submit">Submit</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="add-variation">
        <div class="modal-dialog modal-dialog-centered custom-modal-two">
            <div class="modal-content">
                <div class="page-wrapper-new p-0">
                    <div class="content">
                        <div class="modal-header border-0 custom-modal-header">
                            <div class="page-title">
                                <h4>Add Variation</h4>
                            </div>
                            <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body custom-modal-body">
                            <div class="modal-title-head people-cust-avatar">
                                <h6>Variant Thumbnail</h6>
                            </div>
                            <div class="new-employee-field">
                                <div class="profile-pic-upload">
                                    <div class="profile-pic">
                                        <span><i data-feather="plus-circle" class="plus-down-add"></i>
                                            Add Image</span>
                                    </div>
                                    <div class="mb-3">
                                        <div class="image-upload mb-0">
                                            <input type="file" />
                                            <div class="image-uploads">
                                                <h4>Change Image</h4>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer-btn">
                                <a href="javascript:void(0);" class="btn btn-cancel me-2"
                                    data-bs-dismiss="modal">Cancel</a>
                                <a href="add-product.html" class="btn btn-submit">Submit</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import axios from 'axios';
import 'select2';
import feather from 'feather-icons';
import Navbar from '/src/components/Admin/Navbar.vue';
import Barcode from './Barcode.vue';
import Swal from 'sweetalert2';

export default {
    components: {
    
        Navbar,
        Barcode
    },
    setup() {
        const apiURL = process.env.VUE_APP_URL;
        const inputedProduct = ref({
            sku: '',
            name: '',
            description: '',
            price: '',
            cost: '',
            category: '',
            unit: '',
            brand: '',
            taxType: 'vatable',
            status: 'inactive',
            image: '',
        });
        const skuError = ref(null);
        const select = ref('.select');
        const categories = ref([]);
        const units = ref([]);
        const brands = ref([]);
        const barcodeRef = ref(null);

        const triggerDownloadBarcode = () => {
            if (barcodeRef.value) {
                barcodeRef.value.downloadBarcode(); // Access the method on the Barcode component
            }
        };
        const getSelection = async () => {
            try {
                const categoryResponse = await axios.get(`${apiURL}/get_category_list`);
                const unitResponse = await axios.get(`${apiURL}/get_units_list`);
                const brandResponse = await axios.get(`${apiURL}/brands_list`);

                if (categoryResponse.data.success) categories.value = categoryResponse.data.categories; else Swal.fire('Error', categoryResponse.data.message, 'error');
                if (unitResponse.data.success) units.value = unitResponse.data.unitList; else Swal.fire('Error', unitResponse.data.message, 'error');
                if (brandResponse.data.success) brands.value = brandResponse.data.brandList; else Swal.fire('Error', brandResponse.data.message, 'error');
            } catch (error) {
                Swal.fire('Error', 'Failed to fetch selection data', 'error');
            }
        };



        onMounted(async () => {
            try {
                await $(select.value).select2();
                await feather.replace();
                await getSelection();
            } catch (error) {
                console.log(error);
            }
        });

        onBeforeUnmount(() => {
            $(select.value).select2('destroy');
        });

        const toggleStatus = (event) => {
            inputedProduct.value.status = event.target.checked ? 'active' : 'inactive';
        };

        const autoGenerateSKU = async () => {
            const generatedSku = generateEAN13();
            inputedProduct.value.sku = generatedSku;


        };

        const generateEAN13 = () => {
            let digits = '4'; // Start with a fixed number (you can choose a different prefix)
            // Generate 12 random digits
            for (let i = 0; i < 11; i++) {
                digits += Math.floor(Math.random() * 10).toString();
            }

            let sumOdd = 0;
            let sumEven = 0;

            // Loop through the first 12 digits and calculate the sums
            for (let i = 0; i < 12; i++) {
                const digit = parseInt(digits[i], 10);
                if (i % 2 === 0) {
                    sumOdd += digit; // Odd positions (0, 2, 4, etc.)
                } else {
                    sumEven += digit; // Even positions (1, 3, 5, etc.)
                }
            }

            // Calculate the total sum for checksum calculation
            const totalSum = sumOdd + (sumEven * 3);
            const checksum = (10 - (totalSum % 10)) % 10;

            // Return the 12 random digits and the calculated checksum
            return digits + checksum;
        };

        // Watch for changes to the SKU and update the barcode
        watch(() => inputedProduct.value.sku, async (newSku) => {
            if (newSku.length === 13) {
                try {
                    // Send the SKU to the backend for existence check
                    const response = await axios.get(`${apiURL}/check_sku/${newSku}`);
                    console.log(response.data.exists);
                    if (response.data.exists) {
                        // SKU already exists, reset the SKU input and show an error message
                        inputedProduct.value.sku = ''; // Clear the SKU input
                        skuError.value = 'SKU already exists. Please generate a different SKU.'; // Set error message
                    } else {
                        // SKU does not exist, clear the error and accept the SKU
                        skuError.value = ''; // Clear any existing error
                    }
                } catch (error) {
                    // Handle Axios errors properly
                    console.error('Error checking SKU:', error);
                    if (error.response) {
                        // Backend returned an error (status 400 or 500)
                        console.error('Backend error:', error.response.data);
                        skuError.value = `${error.response.data.message}`;
                    } else {
                        // Network or other issues
                        skuError.value = 'Network error. Please check your connection.';
                    }
                }
            }
        });

        const addProduct = async () => {
            try {
                const formData = new FormData();
                formData.append('sku', inputedProduct.value.sku);
                formData.append('name', inputedProduct.value.name);
                formData.append('description', inputedProduct.value.description);
                formData.append('price', inputedProduct.value.price);
                formData.append('cost', inputedProduct.value.cost);
                formData.append('category', inputedProduct.value.category);
                formData.append('unit', inputedProduct.value.unit);
                formData.append('brand', inputedProduct.value.brand);
                formData.append('taxType', inputedProduct.value.taxType);
                formData.append('status', inputedProduct.value.status);

                // Append image file if it exists
                if (inputedProduct.value.image.file) {
                    formData.append('image', inputedProduct.value.image.file);
                }

                const response = await axios.post(`${apiURL}/add_products`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });


                if (response.data.success) {
                  await  Swal.fire('Success', 'Product added successfully!', 'succss');
                    router.push({ name: 'ProductList' });
                } else {
                    Swal.fire('Error', 'Failed to add product', 'error');
                }
            } catch (error) {
                console.error('Error adding product:', error);
                alert('An error occurred while adding the product');
            }
        };

        // Image upload and removal methods
        const onFileChange = (event) => {
            const file = event.target.files[0];
            if (file) {
                inputedProduct.value.image = { file, url: URL.createObjectURL(file) };
                nextTick(() => {
                    feather.replace();
                });
            }
        };

        const removeImage = () => {
            inputedProduct.value.image = { url: '' }; // Clear the image
        };

        return {
            inputedProduct,
            select,
            addProduct,
            autoGenerateSKU,
            toggleStatus,
            onFileChange,
            removeImage,
            barcodeRef,
            triggerDownloadBarcode,
            skuError,
            categories,
            getSelection,
            units,
            brands,

        };
    },
    methods: {
        filterTextInput(value) {
            return value.replace(/\D/g, ''); // Remove non-numeric characters
        },
        filterNumInput(value) {
            return value.replace(/[^0-9.]/g, ''); // Allow only numbers and decimal points
        }
    }
};
</script>


<style scoped>
.is-invalid {
    border-color: red;
}

.text-danger {
    color: red;
}
</style>