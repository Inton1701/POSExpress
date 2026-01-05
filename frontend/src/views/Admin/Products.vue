<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-3xl font-bold">Products</h2>
      <div class="flex gap-3">
        <button @click="openPrintModal" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-2xl shadow-md" title="Print Product Report">
          <font-awesome-icon :icon="['fas', 'print']" />
        </button>
        <button @click="openAddModal" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-2xl shadow-md" title="Add Product">
          <font-awesome-icon :icon="['fas', 'plus']" />
        </button>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="mb-6">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="Search by SKU, Name, or Category..." 
        class="w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
    </div>

    <div class="bg-white rounded-2xl shadow overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th @click="sortTable('sku')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
              SKU
              <span v-if="sortColumn === 'sku'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortTable('name')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
              Name
              <span v-if="sortColumn === 'name'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortTable('price')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
              Price
              <span v-if="sortColumn === 'price'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortTable('status')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
              Status
              <span v-if="sortColumn === 'status'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortTable('createdAt')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
              Date Added
              <span v-if="sortColumn === 'createdAt'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th class="px-6 py-3 text-center text-sm font-bold sticky right-0 bg-gray-200 shadow-[-2px_0_4px_rgba(0,0,0,0.1)] min-w-[140px]">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="6" class="px-6 py-8 text-center text-gray-500">Loading products...</td>
          </tr>
          <tr v-else-if="filteredProducts.length === 0">
            <td colspan="6" class="px-6 py-4 text-center text-gray-500">No products found</td>
          </tr>
          <tr v-else v-for="product in paginatedProducts" :key="product._id" class="border-t hover:bg-gray-50">
            <td class="px-6 py-4">{{ product.sku }}</td>
            <td class="px-6 py-4">{{ product.name }}</td>
            <td class="px-6 py-4">₱{{ product.price.toFixed(2) }}</td>
            <td class="px-6 py-4">
              <span :class="getStatusClass(product.status)" class="px-3 py-1 rounded-full text-xs font-bold">
                {{ product.status }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">
              {{ formatDate(product.createdAt) }}
            </td>
            <td class="px-6 py-4 text-center sticky right-0 bg-white shadow-[-2px_0_4px_rgba(0,0,0,0.1)] whitespace-nowrap min-w-[140px]">
              <button @click="showBarcode(product)" class="text-purple-500 hover:text-purple-700 mr-2" title="View Barcode">
                <font-awesome-icon :icon="['fas', 'barcode']" class="text-lg" />
              </button>
              <button v-if="canEditProduct(product)" @click="openEditModal(product)" class="text-blue-500 hover:text-blue-700 mr-2" title="Edit">
                <font-awesome-icon :icon="['fas', 'edit']" class="text-lg" />
              </button>
              <span v-else class="text-gray-400 mr-2" title="You cannot edit this product">
                <font-awesome-icon :icon="['fas', 'edit']" class="text-lg" />
              </span>
              <button v-if="!hasVariants(product) && canDeleteProduct(product)" @click="deleteProduct(product._id)" class="text-red-500 hover:text-red-700" title="Delete">
                <font-awesome-icon :icon="['fas', 'trash']" class="text-lg" />
              </button>
              <span v-else class="text-gray-400" :title="hasVariants(product) ? 'Products with variants can only be deleted from edit mode' : 'You cannot delete this product'">
                <font-awesome-icon :icon="['fas', 'trash']" class="text-lg" />
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- Pagination Controls -->
      <div class="flex justify-between items-center px-6 py-4 bg-gray-50 border-t">
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600">Items per page:</label>
          <select v-model.number="itemsPerPage" @change="currentPage = 1" class="border border-gray-300 rounded px-2 py-1 text-sm">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
          <span class="text-sm text-gray-600 ml-4">
            Showing {{ Math.min((currentPage - 1) * itemsPerPage + 1, filteredProducts.length) }} 
            to {{ Math.min(currentPage * itemsPerPage, filteredProducts.length) }} 
            of {{ filteredProducts.length }} products
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button 
            @click="currentPage = 1" 
            :disabled="currentPage === 1"
            class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
            First
          </button>
          <button 
            @click="currentPage--" 
            :disabled="currentPage === 1"
            class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
            Previous
          </button>
          <span class="text-sm text-gray-600">Page {{ currentPage }} of {{ totalPages }}</span>
          <button 
            @click="currentPage++" 
            :disabled="currentPage >= totalPages"
            class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
            Next
          </button>
          <button 
            @click="currentPage = totalPages" 
            :disabled="currentPage >= totalPages"
            class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
            Last
          </button>
        </div>
      </div>
    </div>

    <Modal :is-open="isModalOpen" :title="editingProduct ? 'Edit Product' : 'Add Product'" @close="closeModal">
      <div v-if="isEditingGlobalProduct" class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
        <div class="flex items-start gap-2">
          <font-awesome-icon :icon="['fas', 'exclamation-triangle']" class="text-yellow-600 mt-0.5" />
          <div>
            <p class="text-sm font-bold text-yellow-800">Limited Editing</p>
            <p class="text-xs text-yellow-700">This is a global product. You can only change its status.</p>
          </div>
        </div>
      </div>
      <form @submit.prevent="submitForm" class="space-y-3 max-h-[75vh] overflow-y-auto pr-2">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold mb-1">SKU</label>
            <div class="flex gap-1">
              <input v-model="form.sku" @input="generateBarcode" type="text" required :disabled="isEditingGlobalProduct" class="flex-1 p-2 text-sm rounded-lg border border-gray-300" :class="{ 'bg-gray-100': isEditingGlobalProduct }" />
              <button v-if="!isEditingGlobalProduct" type="button" @click="generateUniqueSKU" class="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-2 rounded-lg whitespace-nowrap" title="Generate SKU">
                <font-awesome-icon :icon="['fas', 'sync']" class="text-xs" />
              </button>
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold mb-1">Name</label>
            <input v-model="form.name" type="text" required :disabled="isEditingGlobalProduct" class="w-full p-2 text-sm rounded-lg border border-gray-300" :class="{ 'bg-gray-100': isEditingGlobalProduct }" />
          </div>
        </div>

        <!-- Barcode Preview -->
        <div v-if="form.sku" class="bg-gray-50 p-2 rounded-lg">
          <label class="block text-xs font-bold mb-1">Barcode Preview</label>
          <div class="flex justify-center bg-white p-2 rounded-lg">
            <canvas ref="barcodeCanvas"></canvas>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold mb-1">Price</label>
            <input v-model="form.price" type="number" step="0.01" required :disabled="isEditingGlobalProduct" class="w-full p-2 text-sm rounded-lg border border-gray-300" :class="{ 'bg-gray-100': isEditingGlobalProduct }" />
          </div>
          <div>
            <label class="block text-xs font-bold mb-1">Cost</label>
            <input v-model="form.cost" type="number" step="0.01" required :disabled="isEditingGlobalProduct" class="w-full p-2 text-sm rounded-lg border border-gray-300" :class="{ 'bg-gray-100': isEditingGlobalProduct }" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold mb-1">Category</label>
            <div class="relative">
              <!-- Dropdown Button -->
              <button
                type="button"
                @click="isCategoryDropdownOpen = !isCategoryDropdownOpen"
                :disabled="isEditingGlobalProduct"
                class="w-full p-2 text-sm text-left rounded-lg border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-between"
                :class="{ 'bg-gray-100 cursor-not-allowed': isEditingGlobalProduct }"
              >
                <span v-if="!form.category" class="text-gray-400">Select category...</span>
                <span v-else class="text-gray-700">{{ form.category }}</span>
                <svg class="w-4 h-4 text-gray-500 transition-transform" :class="{ 'rotate-180': isCategoryDropdownOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <!-- Dropdown List -->
              <div v-if="isCategoryDropdownOpen && !isEditingGlobalProduct" class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                <!-- Search Input -->
                <div class="p-2 border-b border-gray-200">
                  <input
                    v-model="categorySearchQuery"
                    type="text"
                    placeholder="Search categories..."
                    class="w-full p-2 text-xs rounded border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    @click.stop
                  />
                </div>
                
                <!-- Categories List -->
                <div class="max-h-48 overflow-y-auto p-2">
                  <div v-if="searchedCategories.length === 0" class="text-gray-400 text-xs italic text-center py-4">
                    {{ categorySearchQuery ? 'No categories found' : 'No categories available' }}
                  </div>
                  <div v-else class="space-y-1">
                    <button
                      type="button"
                      v-for="category in searchedCategories"
                      :key="category._id"
                      @click.stop="selectCategory(category.name)"
                      class="w-full text-left p-2 hover:bg-gray-100 rounded text-sm"
                      :class="{ 'bg-green-50 text-green-700 font-semibold': form.category === category.name }"
                    >
                      {{ category.name }}
                    </button>
                  </div>
                </div>
                
                <!-- Clear Selection Footer -->
                <div v-if="form.category" class="p-2 border-t border-gray-200 bg-gray-50">
                  <button
                    type="button"
                    @click.stop="clearCategory"
                    class="w-full text-center text-xs text-red-500 hover:text-red-700 font-semibold"
                  >
                    Clear selection
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold mb-1">Status</label>
            <select v-model="form.status" required class="w-full p-2 text-sm rounded-lg border border-gray-300">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <!-- Vattable Checkbox -->
        <div v-if="!isEditingGlobalProduct" class="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="isVattable" 
            v-model="form.isVattable" 
            class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
          />
          <label for="isVattable" class="text-sm font-semibold cursor-pointer">
            Apply VAT to this product
          </label>
        </div>

        <!-- Add-ons Section -->
        <div v-if="!isEditingGlobalProduct" class="border-t pt-3 mt-3">
          <label class="block text-xs font-bold mb-2">Add-ons (Optional)</label>
          <div class="relative">
            <!-- Dropdown Button -->
            <button
              type="button"
              @click="isAddonsDropdownOpen = !isAddonsDropdownOpen"
              class="w-full p-2 text-sm text-left rounded-lg border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-between"
            >
              <span v-if="form.addons.length === 0" class="text-gray-400">Select add-ons...</span>
              <span v-else class="text-gray-700">{{ form.addons.length }} add-on(s) selected</span>
              <svg class="w-4 h-4 text-gray-500 transition-transform" :class="{ 'rotate-180': isAddonsDropdownOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <!-- Dropdown List -->
            <div v-if="isAddonsDropdownOpen" class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
              <!-- Search Input -->
              <div class="p-2 border-b border-gray-200">
                <input
                  v-model="addonSearchQuery"
                  type="text"
                  placeholder="Search add-ons..."
                  class="w-full p-2 text-xs rounded border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  @click.stop
                />
              </div>
              
              <!-- Add-ons List -->
              <div class="max-h-48 overflow-y-auto p-2">
                <div v-if="searchedAddons.length === 0" class="text-gray-400 text-xs italic text-center py-4">
                  {{ addonSearchQuery ? 'No add-ons found' : 'No add-ons available' }}
                </div>
                <div v-else class="space-y-1">
                  <label
                    v-for="addon in searchedAddons"
                    :key="addon._id"
                    class="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                    @click.stop
                  >
                    <input
                      type="checkbox"
                      :value="addon._id"
                      @change="toggleAddon(addon._id)"
                      :checked="form.addons.some(a => a.addon === addon._id)"
                      class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span class="text-sm">{{ addon.name }}</span>
                  </label>
                </div>
              </div>
              
              <!-- Selected Count Footer -->
              <div v-if="form.addons.length > 0" class="p-2 border-t border-gray-200 bg-gray-50">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-gray-600">{{ form.addons.length }} selected</span>
                  <button
                    type="button"
                    @click.stop="form.addons = []"
                    class="text-red-500 hover:text-red-700 font-semibold"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Selected Add-ons with Quantities -->
          <div v-if="form.addons.length > 0" class="mt-3 space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div class="text-xs font-bold text-gray-700 mb-2">Add-on Quantities per Product</div>
            <div v-for="addonItem in form.addons" :key="addonItem.addon" class="flex items-center gap-2">
              <span class="text-xs flex-1 text-gray-700">{{ getAddonName(addonItem.addon) }}</span>
              <div class="flex items-center gap-1">
                <span class="text-xs text-gray-600">Qty:</span>
                <input
                  v-model.number="addonItem.quantity"
                  type="number"
                  min="1"
                  class="w-16 p-1.5 text-xs rounded border border-gray-300"
                  placeholder="1"
                />
              </div>
              <button
                type="button"
                @click="removeAddon(addonItem.addon)"
                class="text-red-500 hover:text-red-700 font-bold text-xs"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <!-- Variants Section -->
        <div v-if="!isEditingGlobalProduct" class="border-t pt-2 mt-2">
          <div class="flex justify-between items-center mb-2">
            <label class="block text-xs font-bold">Variants (Optional)</label>
            <button type="button" @click="addVariant" class="text-green-500 hover:text-green-700 font-bold text-xs">+ Add</button>
          </div>
          <div v-if="form.variants.length > 0" class="space-y-1">
            <!-- Column Headers -->
            <div class="flex gap-1 items-center px-1">
              <div class="w-24 text-xs font-semibold text-gray-600">Variant Name</div>
              <div class="w-16 text-xs font-semibold text-gray-600">+Price</div>
              <div class="w-16 text-xs font-semibold text-gray-600">+Cost</div>
              <div class="flex-1 text-xs font-semibold text-gray-600">SKU</div>
              <div class="w-6"></div>
              <div class="w-16 text-xs font-semibold text-gray-600">Status</div>
              <div class="w-6"></div>
            </div>
            <!-- Variant Rows -->
            <div v-for="(variant, index) in form.variants" :key="index" class="flex gap-1 items-center">
              <input v-model="variant.value" type="text" placeholder="e.g., Small" class="w-24 p-1.5 text-xs rounded border border-gray-300" />
              <input v-model="variant.price" type="number" step="0.01" placeholder="0" class="w-16 p-1.5 text-xs rounded border border-gray-300" />
              <input v-model="variant.cost" type="number" step="0.01" placeholder="0" class="w-16 p-1.5 text-xs rounded border border-gray-300" />
              <input v-model="variant.sku" type="text" placeholder="Auto-generated" class="flex-1 p-1.5 text-xs rounded border border-gray-300" />
              <button type="button" @click="generateVariantSKU(index)" class="text-blue-500 hover:text-blue-700 px-1" title="Generate SKU">
                <font-awesome-icon :icon="['fas', 'sync']" class="text-xs" />
              </button>
              <button 
                type="button" 
                @click="toggleVariantStatus(index)" 
                :class="variant.status === 'inactive' ? 'bg-gray-400' : 'bg-green-500'" 
                class="px-2 py-1 rounded text-white text-xs font-semibold hover:opacity-80"
                :title="variant.status === 'inactive' ? 'Click to activate' : 'Click to deactivate'"
              >
                {{ variant.status === 'inactive' ? 'Off' : 'On' }}
              </button>
              <button type="button" @click="confirmRemoveVariant(index)" class="text-red-500 hover:text-red-700 px-1 text-lg">×</button>
            </div>
          </div>
          <p v-else class="text-gray-400 text-xs italic">No variants added</p>
        </div>

        <div class="flex gap-2 pt-2 mt-2 border-t">
          <button type="button" @click="closeModal" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl text-sm">Cancel</button>
          <button type="submit" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-xl text-sm">Save</button>
        </div>
      </form>
    </Modal>

    <!-- Barcode Print Modal -->
    <Modal :is-open="isBarcodeModalOpen" :title="'Print Barcodes - ' + (selectedProduct?.name || '')" size="lg" @close="closeBarcodeModal">
      <div class="space-y-4">
        <!-- Product Barcode -->
        <div class="border rounded-lg p-3 bg-gray-50">
          <div class="flex items-center justify-between mb-2">
            <div>
              <p class="text-sm font-bold text-gray-700">{{ selectedProduct?.name }}</p>
              <p class="text-xs text-gray-500">SKU: {{ selectedProduct?.sku }}</p>
            </div>
            <button @click="downloadSingleBarcode('product')" class="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-1.5 px-3 rounded-lg">
              Download
            </button>
          </div>
          <div class="flex justify-center bg-white p-3 rounded">
            <div class="text-center">
              <canvas ref="printBarcodeCanvas"></canvas>
              <p class="text-xs font-semibold text-gray-700 mt-2">{{ selectedProduct?.name }}</p>
            </div>
          </div>
        </div>
        
        <!-- Variant Barcodes Table -->
        <div v-if="selectedVariants.length > 0">
          <h3 class="text-sm font-bold text-gray-700 mb-2">Variants</h3>
          <div class="border rounded-lg overflow-hidden">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-bold text-gray-600">Variant</th>
                  <th class="px-3 py-2 text-left text-xs font-bold text-gray-600">SKU</th>
                  <th class="px-3 py-2 text-left text-xs font-bold text-gray-600">Price</th>
                  <th class="px-3 py-2 text-center text-xs font-bold text-gray-600">Barcode</th>
                  <th class="px-3 py-2 text-center text-xs font-bold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(variant, index) in selectedVariants" :key="variant._id" class="border-t hover:bg-gray-50">
                  <td class="px-3 py-2">
                    <p class="text-sm font-semibold">{{ selectedProduct?.name }}</p>
                    <p class="text-xs text-gray-500">{{ variant.value }}</p>
                  </td>
                  <td class="px-3 py-2 text-xs text-gray-600">{{ variant.sku }}</td>
                  <td class="px-3 py-2 text-xs text-green-600 font-semibold">Base +₱{{ variant.price }}</td>
                  <td class="px-3 py-2">
                    <div class="flex justify-center bg-white p-2 rounded">
                      <div class="text-center">
                        <canvas :ref="el => variantBarcodeRefs[index] = el"></canvas>
                        <p class="text-xs font-semibold text-gray-700 mt-1">{{ selectedProduct?.name }} - {{ variant.value }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-3 py-2 text-center">
                    <button @click="downloadSingleBarcode('variant', index)" class="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-1 px-2 rounded">
                      Download
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="flex gap-2 pt-2 border-t">
          <button @click="closeBarcodeModal" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl">
            Close
          </button>
          <button @click="downloadAllBarcodes" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-xl">
            Download All
          </button>
        </div>
      </div>
    </Modal>

    <!-- Print Report Modal -->
    <Modal :is-open="isPrintModalOpen" title="Print Product Report" @close="closePrintModal">
      <form @submit.prevent="printProductReport" class="space-y-4">
        <div>
          <label class="block text-sm font-bold mb-2">Report Type</label>
          <select v-model="printForm.reportType" @change="onReportTypeChange" class="w-full p-3 rounded-xl border border-gray-300">
            <option value="all">All Products</option>
            <option value="category">By Category</option>
            <option value="price-range">By Price Range</option>
            <option value="status">By Status</option>
          </select>
        </div>
        
        <div v-if="printForm.reportType === 'category'">
          <label class="block text-sm font-bold mb-2">Select Category</label>
          <select v-model="printForm.category" required class="w-full p-3 rounded-xl border border-gray-300">
            <option value="">-- Select a category --</option>
            <option value="all">All Categories</option>
            <option v-for="category in filteredCategories" :key="category._id" :value="category.name">
              {{ category.name }}
            </option>
          </select>
        </div>
        
        <div v-if="printForm.reportType === 'price-range'" class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold mb-2">Min Price (₱)</label>
            <input v-model.number="printForm.minPrice" type="number" step="0.01" min="0" required class="w-full p-3 rounded-xl border border-gray-300" />
          </div>
          <div>
            <label class="block text-sm font-bold mb-2">Max Price (₱)</label>
            <input v-model.number="printForm.maxPrice" type="number" step="0.01" min="0" required class="w-full p-3 rounded-xl border border-gray-300" />
          </div>
        </div>
        
        <div v-if="printForm.reportType === 'status'">
          <label class="block text-sm font-bold mb-2">Select Status</label>
          <select v-model="printForm.status" required class="w-full p-3 rounded-xl border border-gray-300">
            <option value="">-- Select status --</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        
        <div class="flex gap-4 pt-4">
          <button type="button" @click="closePrintModal" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
          <button type="button" @click="exportToExcel" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-2xl">
            <font-awesome-icon :icon="['fas', 'file-excel']" class="mr-2" />
            Export Excel
          </button>
          <button type="submit" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-2xl">
            <font-awesome-icon :icon="['fas', 'print']" class="mr-2" />
            Print
          </button>
        </div>
      </form>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal :is-open="isDeleteModalOpen" title="Confirm Delete" size="sm" @close="closeDeleteModal">
      <div class="text-center py-2">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-3">
          <font-awesome-icon :icon="['fas', 'exclamation-circle']" class="text-red-600 text-2xl" />
        </div>
        <p class="text-sm font-semibold text-gray-900 mb-2">Are you sure you want to delete this product?</p>
        <p class="text-xs text-gray-600 mb-4">This action cannot be undone.</p>
        <div class="flex gap-3">
          <button @click="closeDeleteModal" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl text-sm">Cancel</button>
          <button @click="confirmDelete" class="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-2xl text-sm">Delete</button>
        </div>
      </div>
    </Modal>

    <!-- Delete Variant Confirmation Modal -->
    <Modal :is-open="isDeleteVariantModalOpen" title="Remove Variant" size="sm" @close="closeDeleteVariantModal">
      <div class="text-center py-2">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-3">
          <font-awesome-icon :icon="['fas', 'exclamation-circle']" class="text-red-600 text-2xl" />
        </div>
        <p class="text-sm font-semibold text-gray-900 mb-2">Are you sure you want to remove this variant?</p>
        <p class="text-xs text-gray-600 mb-4">This will remove the variant from the product.</p>
        <div class="flex gap-3">
          <button @click="closeDeleteVariantModal" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl text-sm">Cancel</button>
          <button @click="confirmRemoveVariantDelete" class="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-2xl text-sm">Remove</button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed, inject } from 'vue'
import Modal from '../../components/Modal.vue'
import JsBarcode from 'jsbarcode'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faBarcode, faEdit, faTrash, faSync, faCheckCircle, faExclamationCircle, faPrint, faPlus, faExclamationTriangle, faFileExcel } from '@fortawesome/free-solid-svg-icons'
import { api } from '@/utils/api'
import { auth } from '@/utils/auth'

library.add(faBarcode, faEdit, faTrash, faSync, faCheckCircle, faExclamationCircle, faPrint, faPlus, faExclamationTriangle, faFileExcel)

const toast = inject('toast')

const products = ref([])
const categories = ref([])
const addons = ref([])
const searchQuery = ref('')
const categorySearchQuery = ref('')
const addonSearchQuery = ref('')
const isCategoryDropdownOpen = ref(false)
const isAddonsDropdownOpen = ref(false)
const isModalOpen = ref(false)
const isBarcodeModalOpen = ref(false)
const isPrintModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const isDeleteVariantModalOpen = ref(false)
const productToDelete = ref(null)
const variantToDelete = ref(null)
const editingProduct = ref(null)
const selectedProduct = ref(null)
const selectedVariants = ref([])
const barcodeCanvas = ref(null)
const printBarcodeCanvas = ref(null)
const variantBarcodeRefs = ref([])
const sortColumn = ref('')
const sortDirection = ref('asc')
const isLoading = ref(false)

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)

const currentUserRole = ref('')
const currentUserStore = ref(null)
const printForm = ref({
  reportType: 'all',
  category: '',
  minPrice: 0,
  maxPrice: 0,
  status: ''
})

const form = ref({
  sku: '',
  name: '',
  price: 0,
  cost: 0,
  category: '',
  status: 'active',
  variants: [],
  addons: []
})

const sortedProducts = computed(() => {
  let filtered = products.value
  
  // Apply role-based filtering
  if (currentUserRole.value === 'Co-Admin' && currentUserStore.value) {
    filtered = filtered.filter(product => {
      // Show global products (created by Admin)
      if (product.isGlobal) return true
      // Show products assigned to this Co-Admin's store
      if (product.stores && Array.isArray(product.stores)) {
        return product.stores.some(store => {
          const storeId = typeof store === 'object' ? store._id : store
          return storeId === currentUserStore.value
        })
      }
      return false
    })
  }
  
  if (!sortColumn.value) return filtered
  
  return [...filtered].sort((a, b) => {
    let aVal = a[sortColumn.value]
    let bVal = b[sortColumn.value]
    
    if (aVal === null || aVal === undefined) aVal = ''
    if (bVal === null || bVal === undefined) bVal = ''
    
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }
    
    if (sortDirection.value === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
    }
  })
})

const filteredProducts = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return sortedProducts.value
  
  return sortedProducts.value.filter(product => {
    return (
      product.sku?.toLowerCase().includes(query) ||
      product.name?.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query)
    )
  })
})

const totalPages = computed(() => {
  return Math.ceil(filteredProducts.value.length / itemsPerPage.value)
})

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredProducts.value.slice(start, end)
})

const filteredCategories = computed(() => {
  // Admin sees all categories
  if (currentUserRole.value === 'Admin') {
    return categories.value
  }
  
  // Co-Admin sees only global categories and their store's categories
  if (currentUserRole.value === 'Co-Admin' && currentUserStore.value) {
    return categories.value.filter(category => {
      // Show global categories (created by Admin)
      if (category.isGlobal) return true
      // Show categories assigned to this Co-Admin's store
      if (category.stores && Array.isArray(category.stores)) {
        return category.stores.some(store => {
          const storeId = typeof store === 'object' ? store._id : store
          return storeId === currentUserStore.value
        })
      }
      return false
    })
  }
  
  return categories.value
})

const searchedCategories = computed(() => {
  const query = categorySearchQuery.value.toLowerCase().trim()
  if (!query) return filteredCategories.value
  
  return filteredCategories.value.filter(category => {
    return category.name?.toLowerCase().includes(query)
  })
})

const filteredAddons = computed(() => {
  // Admin sees all addons
  if (currentUserRole.value === 'Admin') {
    return addons.value
  }
  
  // Co-Admin sees only global addons and their store's addons
  if (currentUserRole.value === 'Co-Admin' && currentUserStore.value) {
    return addons.value.filter(addon => {
      // Show global addons (created by Admin)
      if (addon.isGlobal) return true
      // Show addons assigned to this Co-Admin's store
      if (addon.stores && Array.isArray(addon.stores)) {
        return addon.stores.some(store => {
          const storeId = typeof store === 'object' ? store._id : store
          return storeId === currentUserStore.value
        })
      }
      return false
    })
  }
  
  return addons.value
})

const searchedAddons = computed(() => {
  const query = addonSearchQuery.value.toLowerCase().trim()
  if (!query) return filteredAddons.value
  
  return filteredAddons.value.filter(addon => {
    return addon.name?.toLowerCase().includes(query)
  })
})

const canEditProduct = (product) => {
  // Admin can edit all products
  if (currentUserRole.value === 'Admin') return true
  // Co-Admin can only edit products that are NOT global (store-specific products)
  if (currentUserRole.value === 'Co-Admin') {
    return !product.isGlobal
  }
  return false
}

const canDeleteProduct = (product) => {
  // Admin can delete all products
  if (currentUserRole.value === 'Admin') return true
  // Co-Admin cannot delete global products
  if (currentUserRole.value === 'Co-Admin') {
    return !product.isGlobal
  }
  return false
}

const isEditingGlobalProduct = computed(() => {
  return currentUserRole.value === 'Co-Admin' && editingProduct.value?.isGlobal === true
})

const sortTable = (column) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

const getStatusClass = (status) => {
  const classes = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    'sold out': 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const generateBarcode = async () => {
  await nextTick()
  if (form.value.sku && barcodeCanvas.value) {
    try {
      JsBarcode(barcodeCanvas.value, form.value.sku, {
        format: 'CODE128',
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 14
      })
    } catch (error) {
      console.error('Barcode generation error:', error)
    }
  }
}

const showBarcode = async (product) => {
  selectedProduct.value = product
  selectedVariants.value = []
  variantBarcodeRefs.value = []
  isBarcodeModalOpen.value = true
  
  await nextTick()
  
  // Generate product barcode
  if (printBarcodeCanvas.value) {
    try {
      JsBarcode(printBarcodeCanvas.value, product.sku, {
        format: 'CODE128',
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 12
      })
    } catch (error) {
      console.error('Barcode generation error:', error)
    }
  }
  
  // Fetch and generate variant barcodes
  try {
    const response = await api.get(`/variants/product/${product._id}`)
    selectedVariants.value = response.data.variants || []
    
    await nextTick()
    
    // Generate barcode for each variant
    selectedVariants.value.forEach((variant, index) => {
      const canvas = variantBarcodeRefs.value[index]
      if (canvas && variant.sku) {
        try {
          JsBarcode(canvas, variant.sku, {
            format: 'CODE128',
            width: 1.5,
            height: 50,
            displayValue: true,
            fontSize: 10
          })
        } catch (error) {
          console.error('Variant barcode generation error:', error)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching variants:', error)
  }
}

const downloadSingleBarcode = (type, index = null) => {
  let canvas = null
  let filename = ''
  
  if (type === 'product') {
    canvas = printBarcodeCanvas.value
    filename = `barcode-${selectedProduct.value.sku}.png`
  } else if (type === 'variant' && index !== null) {
    canvas = variantBarcodeRefs.value[index]
    const variant = selectedVariants.value[index]
    filename = `barcode-${variant.sku}.png`
  }
  
  if (canvas) {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
    })
  }
}

const downloadAllBarcodes = async () => {
  // Download product barcode
  if (printBarcodeCanvas.value) {
    await new Promise(resolve => {
      printBarcodeCanvas.value.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `barcode-${selectedProduct.value.sku}.png`
        link.click()
        URL.revokeObjectURL(url)
        resolve()
      })
    })
  }
  
  // Download all variant barcodes
  for (let i = 0; i < selectedVariants.value.length; i++) {
    const canvas = variantBarcodeRefs.value[i]
    const variant = selectedVariants.value[i]
    if (canvas) {
      await new Promise(resolve => {
        setTimeout(() => {
          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `barcode-${variant.sku}.png`
            link.click()
            URL.revokeObjectURL(url)
            resolve()
          })
        }, 100 * i) // Small delay between downloads
      })
    }
  }
}

const closeBarcodeModal = () => {
  isBarcodeModalOpen.value = false
  selectedProduct.value = null
  selectedVariants.value = []
  variantBarcodeRefs.value = []
}

const addVariant = () => {
  form.value.variants.push({ value: '', price: 0, cost: 0, sku: '', status: 'active' })
}

const confirmRemoveVariant = (index) => {
  variantToDelete.value = index
  isDeleteVariantModalOpen.value = true
}

const closeDeleteVariantModal = () => {
  isDeleteVariantModalOpen.value = false
  variantToDelete.value = null
}

const confirmRemoveVariantDelete = () => {
  if (variantToDelete.value !== null) {
    form.value.variants.splice(variantToDelete.value, 1)
    closeDeleteVariantModal()
  }
}

const toggleVariantStatus = (index) => {
  const variant = form.value.variants[index]
  variant.status = variant.status === 'active' ? 'inactive' : 'active'
}

const removeVariant = (index) => {
  form.value.variants.splice(index, 1)
}

// Generate unique SKU for product
const generateUniqueSKU = async () => {
  try {
    let isUnique = false
    let attempts = 0
    let newSKU = ''
    
    while (!isUnique && attempts < 10) {
      // Generate random alphanumeric SKU (CODE128 compatible)
      const prefix = form.value.name ? form.value.name.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') : 'PRD'
      const randomNum = Math.floor(100000 + Math.random() * 900000)
      newSKU = `${prefix}${randomNum}`
      
      // Check if SKU exists
      const response = await api.get('/products')
      const existingSKUs = response.data.products.map(p => p.sku)
      
      // Also check variants
      const variantsResponse = await api.get('/variants')
      const existingVariantSKUs = variantsResponse.data.variants.map(v => v.sku)
      
      if (!existingSKUs.includes(newSKU) && !existingVariantSKUs.includes(newSKU)) {
        isUnique = true
      }
      attempts++
    }
    
    if (isUnique) {
      form.value.sku = newSKU
      await nextTick()
      generateBarcode()
    } else {
      console.error('Failed to generate unique SKU after 10 attempts')
    }
  } catch (error) {
    console.error('Error generating SKU:', error)
  }
}

// Generate unique SKU for variant
const generateVariantSKU = async (index) => {
  try {
    const variant = form.value.variants[index]
    
    if (!form.value.sku) {
      console.error('Please set product SKU first')
      return
    }
    
    if (!variant.value) {
      console.error('Please enter variant value first')
      return
    }
    
    let isUnique = false
    let attempts = 0
    let newSKU = ''
    
    while (!isUnique && attempts < 10) {
      // Generate variant SKU based on product SKU and variant value
      const suffix = variant.value.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '')
      const randomNum = Math.floor(10 + Math.random() * 90)
      newSKU = `${form.value.sku}-${suffix}${randomNum}`
      
      // Check if SKU exists
      const response = await api.get('/products')
      const existingSKUs = response.data.products.map(p => p.sku)
      
      const variantsResponse = await api.get('/variants')
      const existingVariantSKUs = variantsResponse.data.variants.map(v => v.sku)
      
      // Also check other variants in current form
      const currentFormSKUs = form.value.variants.map((v, i) => i !== index ? v.sku : null).filter(Boolean)
      
      if (!existingSKUs.includes(newSKU) && !existingVariantSKUs.includes(newSKU) && !currentFormSKUs.includes(newSKU)) {
        isUnique = true
      }
      attempts++
    }
    
    if (isUnique) {
      form.value.variants[index].sku = newSKU
    } else {
      console.error('Failed to generate unique variant SKU')
    }
  } catch (error) {
    console.error('Error generating variant SKU:', error)
  }
}

// Fetch all products
const fetchProducts = async () => {
  try {
    isLoading.value = true
    const response = await api.get('/products')
    const productsData = response.data.products || []
    
    // Check variants for each product
    const productsWithVariantInfo = await Promise.all(
      productsData.map(async (product) => {
        try {
          const variantsResponse = await api.get(`/variants/product/${product._id}`)
          return {
            ...product,
            hasVariants: (variantsResponse.data.variants || []).length > 0
          }
        } catch (error) {
          return { ...product, hasVariants: false }
        }
      })
    )
    
    products.value = productsWithVariantInfo
  } catch (error) {
    console.error('Error fetching products:', error)
    toast('Failed to fetch products', 'error')
  } finally {
    isLoading.value = false
  }
}

const hasVariants = (product) => {
  return product.hasVariants === true
}

// Fetch all categories
const fetchCategories = async () => {
  try {
    const response = await api.get('/categories')
    categories.value = response.data.categories.filter(c => c.status === 'active') || []
  } catch (error) {
    console.error('Error fetching categories:', error)
  }
}

// Fetch all addons
const fetchAddons = async () => {
  try {
    const response = await api.get('/addons')
    addons.value = response.data.addons.filter(a => a.status === 'active') || []
  } catch (error) {
    console.error('Error fetching addons:', error)
  }
}

const openAddModal = () => {
  editingProduct.value = null
  form.value = { 
    sku: '', 
    name: '', 
    price: 0, 
    cost: 0, 
    category: '', 
    status: 'active',
    variants: [],
    addons: [], // Array of { addon: addonId, quantity: number }
    isVattable: false
  }
  isModalOpen.value = true
}

const openEditModal = async (product) => {
  try {
    editingProduct.value = product
    form.value = { 
      sku: product.sku,
      name: product.name,
      price: product.price,
      cost: product.cost,
      category: product.category || '',
      status: product.status,
      variants: [],
      addons: product.addons ? product.addons.map(a => ({
        addon: typeof a === 'object' ? (a.addon?._id || a._id) : a,
        quantity: typeof a === 'object' ? (a.quantity || 1) : 1
      })) : [],
      isVattable: product.isVattable || false
    }
    
    // Fetch variants for this product
    const variantsResponse = await api.get(`/variants/product/${product._id}`)
    form.value.variants = (variantsResponse.data.variants || []).map(v => ({
      ...v,
      status: v.status || 'active'
    }))
    
    isModalOpen.value = true
    await nextTick()
    generateBarcode()
  } catch (error) {
    console.error('Error loading product:', error)
    toast('Failed to load product details', 'error')
  }
}

const selectCategory = (categoryName) => {
  form.value.category = categoryName
  isCategoryDropdownOpen.value = false
  categorySearchQuery.value = ''
}

const clearCategory = () => {
  form.value.category = ''
  isCategoryDropdownOpen.value = false
  categorySearchQuery.value = ''
}

const closeModal = () => {
  isModalOpen.value = false
  editingProduct.value = null
  isCategoryDropdownOpen.value = false
  categorySearchQuery.value = ''
  isAddonsDropdownOpen.value = false
  addonSearchQuery.value = ''
}

const toggleAddon = (addonId) => {
  const index = form.value.addons.findIndex(a => a.addon === addonId)
  if (index > -1) {
    // Remove addon
    form.value.addons.splice(index, 1)
  } else {
    // Add addon with default quantity of 1
    form.value.addons.push({ addon: addonId, quantity: 1 })
  }
}

const removeAddon = (addonId) => {
  const index = form.value.addons.findIndex(a => a.addon === addonId)
  if (index > -1) {
    form.value.addons.splice(index, 1)
  }
}

const getAddonName = (addonId) => {
  const addon = addons.value.find(a => a._id === addonId)
  return addon ? addon.name : 'Unknown'
}

const submitForm = async () => {
  try {
    isLoading.value = true
    
    // If Co-Admin is editing a global product, only allow status change
    if (isEditingGlobalProduct.value) {
      const response = await api.put(`/products/${editingProduct.value._id}`, {
        status: form.value.status
      })
      toast('Product status updated successfully', 'success')
      closeModal()
      fetchProducts()
      return
    }
    
    // Prepare product data
    const productData = {
      sku: form.value.sku,
      name: form.value.name,
      price: parseFloat(form.value.price),
      cost: parseFloat(form.value.cost),
      category: form.value.category,
      status: form.value.status,
      addons: form.value.addons || [],
      isVattable: form.value.isVattable || false
    }
    
    // Add store assignment based on role
    if (currentUserRole.value === 'Co-Admin' && currentUserStore.value) {
      productData.stores = [currentUserStore.value]
      productData.isGlobal = false
    } else if (currentUserRole.value === 'Admin') {
      // Admin creates global products by default (no store assignment)
      productData.stores = []
      productData.isGlobal = true
    }
    
    let productId = editingProduct.value?._id
    
    if (editingProduct.value) {
      // Update existing product
      await api.put(`/products/${productId}`, productData)
      
      // Delete old variants and create new ones
      const oldVariants = await api.get(`/variants/product/${productId}`)
      for (const variant of oldVariants.data.variants || []) {
        await api.delete(`/variants/${variant._id}`)
      }
    } else {
      // Create new product
      const response = await api.post('/products', productData)
      productId = response.data.product._id
    }
    
    // Create/update variants if any
    if (form.value.variants.length > 0) {
      const variantsData = {
        productId: productId,
        variants: form.value.variants.map(v => ({
          name: 'Variant',
          value: v.value,
          price: parseFloat(v.price) || 0,
          cost: parseFloat(v.cost) || 0,
          sku: v.sku || `${form.value.sku}-${v.value.substring(0, 3).toUpperCase()}`,
          status: v.status || 'active',
          quantity: v.quantity !== undefined ? parseFloat(v.quantity) : 0,
          quantityAlert: v.quantityAlert !== undefined ? parseFloat(v.quantityAlert) : 5
        }))
      }
      await api.post('/variants', variantsData)
    }
    
    toast(`Product ${editingProduct.value ? 'updated' : 'created'} successfully`, 'success')
    closeModal()
    fetchProducts()
  } catch (error) {
    console.error('Error saving product:', error)
    const errorMessage = error.response?.data?.message || 'Failed to save product'
    toast(errorMessage, 'error')
  } finally {
    isLoading.value = false
  }
}

const openPrintModal = () => {
  isPrintModalOpen.value = true
  printForm.value = {
    reportType: 'all',
    category: '',
    minPrice: 0,
    maxPrice: 0,
    status: ''
  }
}

const closePrintModal = () => {
  isPrintModalOpen.value = false
}

const onReportTypeChange = () => {
  // Reset form fields when report type changes
  printForm.value.category = ''
  printForm.value.minPrice = 0
  printForm.value.maxPrice = 0
  printForm.value.status = ''
}

const exportToExcel = () => {
  // Use sortedProducts to respect role-based filtering
  let reportProducts = [...sortedProducts.value]
  let reportTitle = 'Product Report'
  
  // Filter based on report type
  if (printForm.value.reportType === 'category') {
    if (printForm.value.category && printForm.value.category !== 'all') {
      reportProducts = reportProducts.filter(p => p.category === printForm.value.category)
      reportTitle = `Products - Category: ${printForm.value.category}`
    } else {
      reportTitle = 'Products - All Categories'
    }
  } else if (printForm.value.reportType === 'price-range') {
    reportProducts = reportProducts.filter(p => 
      p.price >= printForm.value.minPrice && p.price <= printForm.value.maxPrice
    )
    reportTitle = `Products - Price Range: ${printForm.value.minPrice} - ${printForm.value.maxPrice}`
  } else if (printForm.value.reportType === 'status') {
    reportProducts = reportProducts.filter(p => p.status === printForm.value.status)
    reportTitle = `Products - Status: ${printForm.value.status.charAt(0).toUpperCase() + printForm.value.status.slice(1)}`
  } else {
    reportTitle = 'All Products'
  }
  
  // Create CSV content
  let csvContent = `${reportTitle}\n`
  csvContent += `Generated on: ${new Date().toLocaleString()}\n`
  csvContent += `Total Products: ${reportProducts.length}\n\n`
  
  // Add headers
  csvContent += 'SKU,Product Name,Category,Price,Cost,Profit Margin,Status\n'
  
  // Add data rows
  reportProducts.forEach(product => {
    const profitMargin = product.price - product.cost
    csvContent += `"${product.sku}","${product.name}","${product.category || 'N/A'}",${product.price.toFixed(2)},${product.cost.toFixed(2)},${profitMargin.toFixed(2)},"${product.status}"\n`
  })
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${reportTitle.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  toast('Excel report exported successfully', 'success')
  closePrintModal()
}

const printProductReport = () => {
  // Use sortedProducts to respect role-based filtering
  let reportProducts = [...sortedProducts.value]
  let reportTitle = 'Product Report'
  
  // Filter based on report type
  if (printForm.value.reportType === 'category') {
    if (printForm.value.category && printForm.value.category !== 'all') {
      reportProducts = reportProducts.filter(p => p.category === printForm.value.category)
      reportTitle = `Products - Category: ${printForm.value.category}`
    } else {
      reportTitle = 'Products - All Categories'
    }
  } else if (printForm.value.reportType === 'price-range') {
    reportProducts = reportProducts.filter(p => 
      p.price >= printForm.value.minPrice && p.price <= printForm.value.maxPrice
    )
    reportTitle = `Products - Price Range: ₱${printForm.value.minPrice} - ₱${printForm.value.maxPrice}`
  } else if (printForm.value.reportType === 'status') {
    reportProducts = reportProducts.filter(p => p.status === printForm.value.status)
    reportTitle = `Products - Status: ${printForm.value.status.charAt(0).toUpperCase() + printForm.value.status.slice(1)}`
  } else {
    reportTitle = 'All Products'
  }
  
  // Generate print content
  const printWindow = window.open('', '_blank')
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${reportTitle}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 10px; font-size: 9px; }
        h1 { text-align: center; color: #333; font-size: 14px; margin: 5px 0; }
        .meta { text-align: center; color: #666; margin-bottom: 8px; font-size: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 3px 5px; text-align: left; font-size: 8px; }
        th { background-color: #4CAF50; color: white; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .text-right { text-align: right; }
        @media print { body { padding: 5px; } }
      </style>
    </head>
    <body>
      <h1>${reportTitle}</h1>
      <div class="meta">Generated on ${new Date().toLocaleString()}</div>
      <div class="meta">Total Products: ${reportProducts.length}</div>
      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Product Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Cost</th>
            <th>Profit</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${reportProducts.map(product => {
            const profitMargin = product.price - product.cost
            return `
            <tr>
              <td>${product.sku}</td>
              <td>${product.name}</td>
              <td>${product.category || 'N/A'}</td>
              <td class="text-right">₱${product.price.toFixed(2)}</td>
              <td class="text-right">₱${product.cost.toFixed(2)}</td>
              <td class="text-right">₱${profitMargin.toFixed(2)}</td>
              <td>${product.status}</td>
            </tr>
            `
          }).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `
  
  printWindow.document.write(printContent)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
  
  closePrintModal()
}

const deleteProduct = (id) => {
  const product = products.value.find(p => p._id === id)
  if (!canDeleteProduct(product)) {
    toast('You cannot delete this product', 'error')
    return
  }
  productToDelete.value = id
  isDeleteModalOpen.value = true
}

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false
  productToDelete.value = null
}

const confirmDelete = async () => {
  if (!productToDelete.value) return
  
  try {
    isLoading.value = true
    await api.delete(`/products/${productToDelete.value}`)
    toast('Product deleted successfully', 'success')
    fetchProducts()
    closeDeleteModal()
    closeModal() // Close edit modal if open
  } catch (error) {
    console.error('Error deleting product:', error)
    toast(error.response?.data?.message || 'Failed to delete product', 'error')
  } finally {
    isLoading.value = false
  }
}

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  const dropdown = event.target.closest('.relative')
  if (!dropdown) {
    if (isAddonsDropdownOpen.value) {
      isAddonsDropdownOpen.value = false
      addonSearchQuery.value = ''
    }
    if (isCategoryDropdownOpen.value) {
      isCategoryDropdownOpen.value = false
      categorySearchQuery.value = ''
    }
  }
}

onMounted(() => {
  // Get current user info from auth
  const currentUser = auth.getUser() || {}
  currentUserRole.value = currentUser.role || 'Admin'
  currentUserStore.value = currentUser.store?._id || null
  
  fetchProducts()
  fetchCategories()
  fetchAddons()
  
  // Add click outside listener
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  // Remove click outside listener
  document.removeEventListener('click', handleClickOutside)
})
</script>
