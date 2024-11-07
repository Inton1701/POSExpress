<template>
    <Navbar />

    <div class="page-wrapper">
        <div class="content">
            <div class="page-header">
                <div class="add-item d-flex">
                    <div class="page-title">
                        <h4>Edit Product</h4>
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

            <form action="add-product.html">
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
                                            <div class="col-lg-4 col-sm-6 col-12">
                                                <div class="mb-3 add-product">
                                                    <label class="form-label">Status</label>
                                                    <div
                                                        class="status-toggle modal-status d-flex justify-content-between ">
                                                        <span class="form-label">Active</span>
                                                        <input type="checkbox" id="user4" class="check" checked />
                                                        <label for="user4" class="checktoggle"></label>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                        <div class="row">
                                            <div class="col-lg-5 col-sm-6 col-12">
                                                <div class="input-blocks add-product list">
                                                    <label data-bs-toggle="tooltip"
                                                        title="Note: it must be 13 numbers">
                                                        SKU
                                                        <i class="mb-1" data-feather="help-circle"
                                                            style="height: 15px"></i>
                                                    </label>
                                                    <input type="text" 
                                                        id="sku"
                                                        class="form-control list"
                                                        placeholder="Enter SKU manually" 
                                                        :maxlength="13"

                                                        v-model="sku"
                                                        @input="sku = filterNumInput($event.target.value)" 
                                                         :class="{ 'is-invalid': sku.length !== 13 && sku.length > 0 }"
                                                         
                                                        />
                                                    <div class="d-flex align-items-center mt-2">
                                                        <button  type="button"
                                                                 class="btn btn-primaryadd"
                                                                 @click="autoGenerateSKU();">
                                                            Auto Generate
                                                        </button>
                                                        

                                                    </div>
                                  
                                                </div>
                                            </div>
                                            <div class="col-lg-5 col-sm-6 col-12">
                                                <div class="mb-3 add-product">
                                                    <label class="form-label">Product Name</label>
                                                    <input type="text" class="form-control"
                                                        placeholder="Product name here." :maxlength="60"
                                                        v-model="productName"
                                                        @input="productName = filterTextInput($event.target.value)" />
                                                    <p class="mt-1">Maximum of 60 Characters</p>
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
                                                        <select class="select">
                                                            <option>None</option>
                                                            <option>Lenovo</option>
                                                            <option>Electronics</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div class="col-lg-4 col-sm-6 col-12">
                                                    <div class="mb-3 add-product">
                                                        <label class="form-label">Sub Category</label>
                                                        <select class="select">
                                                            <option>None</option>
                                                            <option>Lenovo</option>
                                                            <option>Electronics</option>
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
                                                        <select class="select">
                                                            <option>No Brand</option>
                                                            <option>Nike</option>
                                                            <option>Bolt</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="add-product-new">
                                            <div class="row">

                                                <div class="col-lg-4 col-sm-6 col-12">
                                                    <div class="mb-3 add-product">
                                                        <div class="add-newplus">
                                                            <label class="form-label">Unit</label>
                                                            <a href="javascript:void(0);" data-bs-toggle="modal"
                                                                data-bs-target="#add-unit"><i data-feather="plus-circle"
                                                                    class="plus-down-add"></i><span>Add New</span></a>
                                                        </div>
                                                        <select class="select">
                                                            <option>None</option>

                                                        </select>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>


                                        <div class="col-lg-12">
                                            <div class="input-blocks summer-description-box transfer mb-3">
                                                <label>Description</label>
                                                <textarea class="form-control h-100"
                                                         rows="5"
                                                         placeholder="Please type here the description"
                                                         :maxlength="150"
                                                         v-model="productDescription"
                                                         @input="productDescription = filterTextInput($event.target.value)"
                                                         ></textarea>
                                                <p class="mt-1">Maximum of 150 Characters</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-card-one accordion" id="accordionExample2">
                            <div class="accordion-item">
                                <div class="accordion-header" id="headingTwo">
                                    <div class="accordion-button" data-bs-toggle="collapse"
                                        data-bs-target="#collapseTwo" aria-controls="collapseTwo">
                                        <div class="text-editor add-list">
                                            <div class="addproduct-icon list icon">
                                                <h5>
                                                    <i data-feather="life-buoy" class="add-info"></i><span>Pricing &
                                                        Stocks</span>
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
                                        <div class="input-blocks add-products">
                                            <label class="d-block">Product Type</label>
                                            <div class="single-pill-product">
                                                <ul class="nav nav-pills" id="pills-tab1" role="tablist">
                                                    <li class="nav-item" role="presentation">
                                                        <span class="custom_radio me-4 mb-0 active" id="pills-home-tab"
                                                            data-bs-toggle="pill" data-bs-target="#pills-home"
                                                            role="tab" aria-controls="pills-home" aria-selected="true">
                                                            <input type="radio" class="form-control" name="payment" />
                                                            <span class="checkmark"></span> Single
                                                            Product</span>
                                                    </li>
                                                    <li class="nav-item" role="presentation">
                                                        <span class="custom_radio me-2 mb-0" id="pills-profile-tab"
                                                            data-bs-toggle="pill" data-bs-target="#pills-profile"
                                                            role="tab" aria-controls="pills-profile"
                                                            aria-selected="false">
                                                            <input type="radio" class="form-control" name="sign" />
                                                            <span class="checkmark"></span> Variable
                                                            Product</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div class="tab-content" id="pills-tabContent">
                                            <div class="tab-pane fade show active" id="pills-home" role="tabpanel"
                                                aria-labelledby="pills-home-tab">
                                                <div class="row">
                                                    <div class="col-lg-3 col-sm-6 col-12">
                                                        <div class="input-blocks add-product">
                                                            <label>Price</label>
                                                            <input type="text" class="form-control"
                                                                placeholder="0.00" />
                                                        </div>
                                                    </div>
                                                    <div class="col-lg-3 col-sm-6 col-12">
                                                        <div class="input-blocks add-product">
                                                            <label>Cost</label>
                                                            <input type="text" class="form-control"
                                                                placeholder="0.00" />
                                                        </div>
                                                    </div>
                                                    <div class="col-lg-3 col-sm-6 col-12">
                                                        <div class="input-blocks add-product">
                                                            <label>Quantity</label>
                                                            <input type="text" class="form-control" placeholder="0" />
                                                        </div>
                                                    </div>

                                                    <div class="col-lg-3 col-sm-6 col-12">
                                                        <div class="input-blocks add-product">
                                                            <label>Quantity Alert</label>
                                                            <input type="text" class="form-control" value="10" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="row">
                                                    <div class="col-lg-4 col-sm-6 col-12">
                                                        <div class="input-blocks add-product">
                                                            <label>Discount Type</label>
                                                            <select class="select">
                                                                <option>None</option>
                                                                <option>Percentage</option>
                                                                <option>Cash</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div class="col-lg-4 col-sm-6 col-12">
                                                        <div class="input-blocks add-product">
                                                            <label>Discount Value</label>
                                                            <input type="text" placeholder="00.00" />
                                                        </div>
                                                    </div>

                                                    <div class="col-lg-4 col-sm-6 col-12">
                                                        <div class="input-blocks add-product">
                                                            <label>Tax Type</label>
                                                            <select class="select">
                                                                <option>No Tax</option>
                                                                <option>Exclusive</option>
                                                                <option>Sales Tax</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="accordion-card-one accordion" id="accordionExample3">
                                                    <div class="accordion-item">
                                                        <div class="accordion-header" id="headingThree">
                                                            <div class="accordion-button" data-bs-toggle="collapse"
                                                                data-bs-target="#collapseThree"
                                                                aria-controls="collapseThree">
                                                                <div class="addproduct-icon list">
                                                                    <h5>
                                                                        <i data-feather="image"
                                                                            class="add-info"></i><span>Images</span>
                                                                    </h5>

                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div id="collapseThree" class="accordion-collapse collapse show"
                                                            aria-labelledby="headingThree"
                                                            data-bs-parent="#accordionExample3">
                                                            <div class="accordion-body">
                                                                <div class="text-editor add-list add">
                                                                    <div class="col-lg-12">
                                                                        <div class="add-choosen">
                                                                            <div class="input-blocks">
                                                                                <div class="image-upload">
                                                                                    <input type="file" />
                                                                                    <div class="image-uploads">
                                                                                        <i data-feather="plus-circle"
                                                                                            class="plus-down-add me-0"></i>
                                                                                        <h4>Add Images</h4>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div class="phone-img">
                                                                                <img src="/assets/img/products/phone-add-2.png"
                                                                                    alt="image" />
                                                                                <a href="javascript:void(0);"><i
                                                                                        data-feather="x"
                                                                                        class="x-square-add remove-product"></i></a>
                                                                            </div>

                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="tab-pane fade" id="pills-profile" role="tabpanel"
                                                aria-labelledby="pills-profile-tab">
                                                <div class="row select-color-add">
                                                    <div class="col-lg-6 col-sm-6 col-12">
                                                        <div class="input-blocks add-product">
                                                            <label>Variant Attribute</label>
                                                            <div class="row">
                                                                <div class="col-lg-10 col-sm-10 col-10">
                                                                    <select
                                                                        class="form-control variant-select select-option"
                                                                        id="colorSelect">
                                                                        <option>Choose</option>
                                                                        <option>Color</option>
                                                                        <option value="red">Red</option>
                                                                        <option value="black">Black</option>
                                                                    </select>
                                                                </div>
                                                                <div class="col-lg-2 col-sm-2 col-2 ps-0">
                                                                    <div class="add-icon tab">
                                                                        <a class="btn btn-filter" data-bs-toggle="modal"
                                                                            data-bs-target="#add-units"><i
                                                                                class="feather feather-plus-circle"></i></a>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="selected-hide-color" id="input-show">
                                                            <div class="row align-items-center">
                                                                <div class="col-sm-10">
                                                                    <div class="input-blocks">
                                                                        <input class="input-tags form-control"
                                                                            id="inputBox" type="text"
                                                                            data-role="tagsinput" name="specialist"
                                                                            value="red, black" />
                                                                    </div>
                                                                </div>
                                                                <div class="col-lg-2">
                                                                    <div class="input-blocks">
                                                                        <a href="javascript:void(0);"
                                                                            class="remove-color"><i
                                                                                class="far fa-trash-alt"></i></a>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-12">
                    <div class="btn-addproduct mb-4">
                        <router-link to="products" type="button" class="btn btn-cancel me-2">
                            Cancel
                        </router-link >
                        <button type="submit" class="btn btn-submit">
                            Update Product
                        </button>
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
                                        <input type="text" class="form-control" />
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
                                    <ul class="nav user-menu">
                                        <li class="nav-item nav-searchinputs">
                                            <div class="top-nav-search">
                                                <form action="#" class="dropdown">
                                                    <div class="searchinputs list dropdown-toggle"
                                                        id="dropdownMenuClickable2" data-bs-toggle="dropdown"
                                                        data-bs-auto-close="false">
                                                        <input type="text" placeholder="Search" />
                                                        <i data-feather="search" class="feather-16 icon"></i>
                                                        <div class="search-addon d-none">
                                                            <span><i data-feather="x-circle"
                                                                    class="feather-14"></i></span>
                                                        </div>
                                                    </div>
                                                    <div class="dropdown-menu search-dropdown idea"
                                                        aria-labelledby="dropdownMenuClickable2">
                                                        <div class="search-info">
                                                            <p>Black</p>
                                                            <p>Red</p>
                                                            <p>Green</p>
                                                            <p>S</p>
                                                            <p>M</p>
                                                        </div>
                                                    </div>
                                                </form>
                                            </div>
                                        </li>
                                    </ul>
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
                            <div class="row">
                                <div class="col-lg-6 pe-0">
                                    <div class="mb-3">
                                        <label class="form-label">Barcode Symbology</label>
                                        <select class="select">
                                            <option>Choose</option>
                                            <option>Code34</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-lg-6 pe-0">
                                    <div class="mb-3">
                                        <div class="input-blocks add-product list">
                                            <label>Item Code</label>
                                            <input type="text" class="form-control list" value="455454478844" />
                                            <button type="submit" class="btn btn-primaryadd">
                                                Generate Code
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-lg-12">
                                    <div class="input-blocks image-upload-down">
                                        <div class="image-upload download">
                                            <input type="file" />
                                            <div class="image-uploads">
                                                <img src="/assets/img/download-img.png" alt="img" />
                                                <h4>Drag and drop a <span>file to upload</span></h4>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="accordion-body">
                                        <div class="text-editor add-list add">
                                            <div class="col-lg-12">
                                                <div class="add-choosen mb-3">
                                                    <div class="phone-img ms-0">
                                                        <img src="/assets/img/products/phone-add-2.png" alt="image" />
                                                        <a href="javascript:void(0);"><i data-feather="x"
                                                                class="x-square-add remove-product"></i></a>
                                                    </div>
                                                    <div class="phone-img">
                                                        <img src="/assets/img/products/phone-add-1.png" alt="image" />
                                                        <a href="javascript:void(0);"><i data-feather="x"
                                                                class="x-square-add remove-product"></i></a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-lg-6 pe-0">
                                    <div class="mb-3">
                                        <label class="form-label">Quantity</label>
                                        <input type="text" class="form-control" />
                                    </div>
                                </div>
                                <div class="col-lg-6 pe-0">
                                    <div class="mb-3">
                                        <label class="form-label">Quantity Alert</label>
                                        <input type="text" class="form-control" />
                                    </div>
                                </div>
                                <div class="col-lg-6 pe-0">
                                    <div class="mb-3">
                                        <label class="form-label">Tax Type</label>
                                        <select class="select">
                                            <option>Choose</option>
                                            <option>Direct</option>
                                            <option>Indirect</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-lg-6 pe-0">
                                    <div class="mb-3">
                                        <label class="form-label">Tax </label>
                                        <select class="select">
                                            <option>Choose</option>
                                            <option>Income Tax</option>
                                            <option>Service Tax</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-lg-12 pe-0">
                                    <div class="mb-3">
                                        <label class="form-label">Discount Type </label>
                                        <select class="select">
                                            <option>Choose</option>
                                            <option>Percentage</option>
                                            <option>Early Payment</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-lg-12 pe-0">
                                    <div>
                                        <label class="form-label">Discount Value</label>
                                        <input type="text" class="form-control" />
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
import { ref, onMounted, onBeforeUnmount } from 'vue';

import 'select2';
import feather from 'feather-icons'

import Sidebar from '/src/components/Admin/Sidebar.vue';
import Navbar from '/src/components/Admin/Navbar.vue';


export default {
    components: {
        Sidebar,
        Navbar,
    },
    data() {
        return {
            productStatus: true,
            sku: '',
            productName: '',
            productCategory: '',
            productSubcategory: '',
            productBrand: '',
            productUnits: '',
            productDescription: '',
            productPrice: '',
            productCost: '',
            productQuantity: '',
            productQuantityAlert: '',
            productDiscountType: '',
            productDiscountValue: '',
            productTaxType: '',
            productVariants: '',
            productImages: '',


        };
    },
    setup() {
        const select = ref('.select');
        onMounted(async () => {
            try {
                // Initialize the select2 plugin
                await $(select.value).select2();
                // Initialize the feather icons
                await feather.replace();
            } catch (error) {
                console.log(error);
            }

        });
        onBeforeUnmount(() => {
            // Destroy the select2 plugin to avoid memory leaks when component is unmounted
            $(select.value).select2('destroy');
        });
        return {
            select
        };
    },
    methods: {

        filterTextInput(value) {
            return  value.replace(/[^a-zA-Z0-9.\-() ]/g, '');
        },
        // Allow only numbers and dots
        filterNumInput(value) {
            return value.replace(/[^0-9.]/g, '');
        },
         generateEAN13() {
            let digits = '';
            for (let i = 0; i < 12; i++) {
                digits +=  Math.floor(Math.random() * 10).toString();
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

            // Return the complete EAN-13 code
            return digits + checksum;
        },
        autoGenerateSKU() {
         this.sku = this.generateEAN13(); // Set sku to generated EAN-13
        }
    },
    watch:{
        checkLength(value, length){
            if(value.length != length){
                
            }
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