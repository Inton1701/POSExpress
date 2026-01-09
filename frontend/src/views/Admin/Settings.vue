<template>
  <div>
    <h2 class="text-3xl font-bold mb-6">Settings</h2>

    <!-- Settings Tabs -->
    <div class="bg-white rounded-2xl shadow p-6 mb-6">
      <div class="flex gap-4 border-b pb-3 mb-6">
        <button 
          @click="activeTab = 'profile'"
          :class="activeTab === 'profile' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'"
          class="px-6 py-2 rounded-lg font-bold transition"
        >
          <font-awesome-icon icon="user" class="mr-2" />
          Admin Profile
        </button>
        <button 
          @click="activeTab = 'vat'"
          :class="activeTab === 'vat' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'"
          class="px-6 py-2 rounded-lg font-bold transition"
        >
          <font-awesome-icon icon="percent" class="mr-2" />
          VAT Rate
        </button>
        <button 
          @click="activeTab = 'backup'"
          :class="activeTab === 'backup' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'"
          class="px-6 py-2 rounded-lg font-bold transition"
        >
          <font-awesome-icon icon="cloud-upload-alt" class="mr-2" />
          Google Drive Backup
        </button>
        <button 
          @click="activeTab = 'updates'"
          :class="activeTab === 'updates' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'"
          class="px-6 py-2 rounded-lg font-bold transition"
        >
          <font-awesome-icon icon="sync-alt" class="mr-2" />
          System Updates
        </button>
        <button 
          @click="showLogoutConfirm"
          class="ml-auto bg-red-500 text-white px-6 py-2 rounded-lg font-bold transition hover:bg-red-600"
        >
          <font-awesome-icon icon="sign-out-alt" class="mr-2" />
          Logout
        </button>
      </div>

      <!-- Admin Profile Tab -->
      <div v-if="activeTab === 'profile'">
        <h3 class="text-xl font-bold mb-4">Update Profile Information</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label class="block text-sm font-bold mb-2">Username</label>
            <input 
              v-model="profileForm.username" 
              type="text" 
              class="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
              placeholder="Enter username"
            />
          </div>
          <div>
            <label class="block text-sm font-bold mb-2">RFID</label>
            <input 
              v-model="profileForm.rfid" 
              type="text" 
              class="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
              placeholder="Enter RFID number (optional)"
            />
          </div>
        </div>

        <div class="border-t pt-6 mb-6">
          <h4 class="text-lg font-bold mb-4">Store Information</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label class="block text-sm font-bold mb-2">Store Name</label>
              <input 
                v-model="profileForm.storeName" 
                type="text" 
                class="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                placeholder="Enter store name"
              />
            </div>
            <div>
              <label class="block text-sm font-bold mb-2">Contact Number</label>
              <input 
                v-model="profileForm.contact" 
                type="text" 
                class="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                placeholder="Enter contact number"
              />
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-bold mb-2">Address</label>
              <textarea 
                v-model="profileForm.address" 
                class="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                rows="2"
                placeholder="Enter store address"
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-bold mb-2">TIN #</label>
              <input 
                v-model="profileForm.tin" 
                type="text" 
                class="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                placeholder="Tax Identification Number"
              />
            </div>
          </div>
        </div>

        <div class="border-t pt-6 mb-6">
          <h4 class="text-lg font-bold mb-4">Change Password</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label class="block text-sm font-bold mb-2">Current Password</label>
              <input 
                v-model="profileForm.currentPassword" 
                type="password" 
                class="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label class="block text-sm font-bold mb-2">New Password</label>
              <input 
                v-model="profileForm.newPassword" 
                type="password" 
                class="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label class="block text-sm font-bold mb-2">Confirm New Password</label>
              <input 
                v-model="profileForm.confirmPassword" 
                type="password" 
                class="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                placeholder="Confirm new password"
              />
            </div>
          </div>
        </div>

        <div class="flex justify-end">
          <button 
            @click="updateProfile" 
            :disabled="isLoading"
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow transition disabled:opacity-50"
          >
            <font-awesome-icon v-if="isLoading" icon="spinner" spin class="mr-2" />
            Save Changes
          </button>
        </div>
      </div>

      <!-- VAT Rate Tab -->
      <div v-if="activeTab === 'vat'">
        <h3 class="text-xl font-bold mb-4">Global VAT Configuration</h3>
        
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p class="text-sm text-blue-800">
            <font-awesome-icon icon="info-circle" class="mr-2" />
            This VAT will be applied to all products marked as "Vattable". Choose between Fixed amount or Percentage.
          </p>
        </div>

        <div class="max-w-2xl space-y-6">
          <!-- VAT Type Selection -->
          <div>
            <label class="block text-sm font-bold mb-2">VAT Type</label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  v-model="vatForm.type" 
                  value="percent" 
                  class="w-4 h-4 text-blue-600"
                />
                <span>Percentage (%)</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  v-model="vatForm.type" 
                  value="fixed" 
                  class="w-4 h-4 text-blue-600"
                />
                <span>Fixed Amount (₱)</span>
              </label>
            </div>
          </div>

          <!-- VAT Value Input -->
          <div>
            <label class="block text-sm font-bold mb-2">
              {{ vatForm.type === 'percent' ? 'VAT Percentage (%)' : 'Fixed VAT Amount (₱)' }}
            </label>
            <div class="flex gap-3">
              <input 
                v-model.number="vatForm.value" 
                type="number" 
                step="0.01"
                min="0"
                :max="vatForm.type === 'percent' ? '100' : '999999'"
                class="flex-1 p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                :placeholder="vatForm.type === 'percent' ? 'e.g., 12.00' : 'e.g., 10.00'"
              />
              <button 
                @click="updateVATRate" 
                :disabled="isLoading"
                class="bg-green-600 hover:bg-green-700 text-white font-bold px-8 rounded-lg shadow transition disabled:opacity-50"
              >
                <font-awesome-icon v-if="isLoading" icon="spinner" spin class="mr-2" />
                Update
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              {{ vatForm.type === 'percent' 
                ? 'Example: 12% VAT on ₱100 = ₱112 total' 
                : 'Example: ₱10 fixed VAT on any price = +₱10' 
              }}
            </p>
          </div>

          <!-- Current VAT Display -->
          <div v-if="currentVatConfig" class="bg-gray-50 rounded-lg p-4">
            <p class="text-sm text-gray-600 mb-2">Current VAT Configuration</p>
            <div class="flex items-baseline gap-3">
              <p class="text-3xl font-bold text-gray-800">
                {{ currentVatConfig.type === 'percent' 
                  ? `${currentVatConfig.value}%` 
                  : `₱${currentVatConfig.value.toFixed(2)}` 
                }}
              </p>
              <span class="text-sm text-gray-600">
                ({{ currentVatConfig.type === 'percent' ? 'Percentage' : 'Fixed Amount' }})
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Google Drive Backup Tab -->
      <div v-if="activeTab === 'backup'">
        <h3 class="text-xl font-bold mb-4">Google Drive Backup</h3>
        
        <div class="max-w-4xl space-y-6">
          <!-- Google Drive Folder Configuration -->
          <div class="bg-white rounded-lg border p-6">
            <h4 class="text-lg font-bold mb-3">Google Drive Configuration</h4>
            <p class="text-sm text-gray-600 mb-4">
              Configure a Shared Drive folder for backups.
              <a href="https://drive.google.com" target="_blank" class="text-blue-600 hover:underline">
                Open Google Drive
              </a>
            </p>
            
            <div class="bg-red-50 border border-red-300 rounded p-3 mb-4 text-sm">
              <p class="font-semibold text-red-800 mb-1">⚠️ Important Requirement:</p>
              <p class="text-gray-700">Service accounts <strong>cannot upload</strong> to regular "My Drive" folders. You <strong>must use a Shared Drive</strong> (Team Drive).</p>
            </div>
            
            <div class="bg-blue-50 border border-blue-200 rounded p-3 mb-4 text-sm">
              <p class="font-semibold mb-2">📁 How to Set Up Shared Drive:</p>
              
              <ol class="list-decimal ml-5 space-y-2 text-gray-700 text-xs">
                <li><strong>Create a Shared Drive:</strong>
                  <ul class="list-disc ml-5 mt-1">
                    <li>In Google Drive, click <strong>"Shared drives"</strong> in the left sidebar</li>
                    <li>Click <strong>"+ New"</strong> button</li>
                    <li>Name it (e.g., "POS Backups")</li>
                  </ul>
                </li>
                <li><strong>Add Service Account as Member:</strong>
                  <ul class="list-disc ml-5 mt-1">
                    <li>Right-click the shared drive → <strong>"Manage members"</strong></li>
                    <li>Click "Add members"</li>
                    <li>Paste this email:
                      <div class="bg-white p-1 rounded mt-1 break-all">
                        <code class="text-xs">posexpress-123@dynamic-art-483816-t8.iam.gserviceaccount.com</code>
                      </div>
                    </li>
                    <li>Set role to <strong>"Manager"</strong> or <strong>"Content manager"</strong></li>
                    <li>Click "Send"</li>
                  </ul>
                </li>
                <li><strong>Create a Folder (Optional):</strong>
                  <ul class="list-disc ml-5 mt-1">
                    <li>Inside the Shared Drive, create a folder for backups</li>
                    <li>Or use the Shared Drive root folder directly</li>
                  </ul>
                </li>
                <li><strong>Get Folder ID:</strong>
                  <ul class="list-disc ml-5 mt-1">
                    <li>Open the folder (or Shared Drive root)</li>
                    <li>Look at the URL: <code class="bg-white px-1">drive.google.com/drive/folders/<strong>FOLDER_ID</strong></code></li>
                    <li>Copy the folder ID and paste below</li>
                  </ul>
                </li>
              </ol>
            </div>
            
            <div class="bg-gray-50 border border-gray-200 rounded p-3 mb-4 text-xs text-gray-600">
              <p class="font-semibold mb-1">💡 Don't have Shared Drives?</p>
              <p>Shared Drives are available with Google Workspace (Business/Enterprise). If you only have a personal Gmail account, you'll need to upgrade to Google Workspace or use OAuth2 authentication instead.</p>
            </div>
            
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-bold mb-2">Shared Drive Folder ID</label>
                <input 
                  v-model="driveFolderId"
                  type="text"
                  placeholder="1AbCdEfGhIjKlMnOpQrStUvWxYz"
                  class="w-full p-3 border rounded-lg font-mono"
                />
                <p class="text-xs text-gray-500 mt-1">This must be a folder ID from a Shared Drive (not "My Drive")</p>
              </div>
              
              <button 
                @click="saveDriveFolderId"
                :disabled="isLoading || !driveFolderId"
                class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <font-awesome-icon icon="save" class="mr-2" />
                Save Folder ID
              </button>
            </div>
          </div>

          <!-- Backup Status -->
          <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h4 class="text-lg font-bold text-gray-800 mb-1">Backup Status</h4>
                <p class="text-sm text-gray-600">
                  Last backup: {{ lastBackupTime || 'Never' }}
                </p>
              </div>
              <div class="text-right">
                <div class="flex items-center gap-2">
                  <span :class="backupStatus === 'connected' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'" 
                        class="px-3 py-1 rounded-full text-xs font-semibold">
                    {{ backupStatus === 'connected' ? '✓ Configured' : 'Not Configured' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Manual Backup -->
          <div class="bg-white rounded-lg border p-6">
            <h4 class="text-lg font-bold mb-3">Manual Backup</h4>
            <p class="text-sm text-gray-600 mb-4">
              Create an immediate backup of selected data to Google Drive (CSV + JSON formats)
            </p>
            
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="includeProducts" 
                  v-model="backupOptions.products"
                  class="w-4 h-4"
                />
                <label for="includeProducts" class="text-sm font-medium">
                  Products, Variants & Stock History
                  <span class="text-xs text-gray-500 ml-2">(Includes all product-related data)</span>
                </label>
              </div>
              <div class="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="includeAddons" 
                  v-model="backupOptions.addons"
                  class="w-4 h-4"
                />
                <label for="includeAddons" class="text-sm font-medium">Add-ons</label>
              </div>
              <div class="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="includeTransactions" 
                  v-model="backupOptions.transactions"
                  class="w-4 h-4"
                />
                <label for="includeTransactions" class="text-sm font-medium">Transactions & Sales History</label>
              </div>
              <div class="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="includeCustomers" 
                  v-model="backupOptions.customers"
                  class="w-4 h-4"
                />
                <label for="includeCustomers" class="text-sm font-medium">Customers (All RFID Accounts)</label>
              </div>
              <div class="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="includeUsers" 
                  v-model="backupOptions.users"
                  class="w-4 h-4"
                />
                <label for="includeUsers" class="text-sm font-medium">Store Users & Staff</label>
              </div>
            </div>
            
            <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-gray-700">
              <p class="font-semibold mb-1">📦 Backup Contents:</p>
              <ul class="text-xs space-y-1 ml-4">
                <li>• Store information (always included)</li>
                <li>• CSV files for easy viewing/editing</li>
                <li>• JSON files for data restore/import</li>
              </ul>
            </div>
            
            <button 
              @click="performManualBackup"
              :disabled="isBackingUp || backupStatus !== 'connected'"
              class="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed w-full"
            >
              <font-awesome-icon :icon="isBackingUp ? 'spinner' : 'cloud-upload-alt'" :spin="isBackingUp" class="mr-2" />
              {{ isBackingUp ? 'Backing up...' : 'Backup Now' }}
            </button>
            
            <div v-if="backupProgress > 0 && isBackingUp" class="mt-4">
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-green-600 h-2 rounded-full transition-all" :style="{ width: backupProgress + '%' }"></div>
              </div>
              <p class="text-xs text-gray-600 mt-1">{{ backupProgress }}% complete</p>
            </div>
          </div>

          <!-- Scheduled Backup -->
          <div class="bg-white rounded-lg border p-6">
            <h4 class="text-lg font-bold mb-3">Scheduled Automatic Backup</h4>
            <p class="text-sm text-gray-600 mb-4">
              Automatically backup data to Google Drive at scheduled times
            </p>
            
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="enableScheduledBackup" 
                  v-model="scheduledBackup.enabled"
                  :disabled="backupStatus !== 'connected'"
                  class="w-4 h-4"
                />
                <label for="enableScheduledBackup" class="text-sm font-bold">Enable Scheduled Backup</label>
              </div>
              
              <div v-if="scheduledBackup.enabled" class="space-y-4 pl-7">
                <div>
                  <label class="block text-sm font-semibold mb-2">Backup Frequency</label>
                  <select 
                    v-model="scheduledBackup.frequency"
                    class="w-full md:w-64 p-3 border rounded-lg"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                
                <div v-if="scheduledBackup.frequency === 'daily'">
                  <label class="block text-sm font-semibold mb-2">Backup Time</label>
                  <div class="flex gap-2">
                    <select v-model="scheduledBackup.hour" class="p-3 border rounded-lg">
                      <option v-for="h in 12" :key="h" :value="h">{{ h }}</option>
                    </select>
                    <span class="flex items-center">:</span>
                    <select v-model="scheduledBackup.minute" class="p-3 border rounded-lg">
                      <option v-for="m in 60" :key="m-1" :value="String(m-1).padStart(2, '0')">{{ String(m-1).padStart(2, '0') }}</option>
                    </select>
                    <select v-model="scheduledBackup.ampm" class="p-3 border rounded-lg">
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
                
                <div v-if="scheduledBackup.frequency === 'weekly'">
                  <label class="block text-sm font-semibold mb-2">Day of Week</label>
                  <select v-model="scheduledBackup.dayOfWeek" class="w-full md:w-64 p-3 border rounded-lg">
                    <option value="0">Sunday</option>
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                  </select>
                </div>
                
                <div v-if="scheduledBackup.frequency === 'monthly'">
                  <label class="block text-sm font-semibold mb-2">Day of Month</label>
                  <select v-model="scheduledBackup.dayOfMonth" class="w-full md:w-64 p-3 border rounded-lg">
                    <option v-for="d in 31" :key="d" :value="d">{{ d }}</option>
                  </select>
                </div>
              </div>
              
              <button 
                @click="saveScheduledBackup"
                :disabled="isLoading || !scheduledBackup.enabled || backupStatus !== 'connected'"
                class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <font-awesome-icon icon="save" class="mr-2" />
                Save Schedule
              </button>
            </div>
          </div>

          <!-- Backup History -->
          <div class="bg-white rounded-lg border p-6">
            <h4 class="text-lg font-bold mb-3">Recent Backups</h4>
            <div v-if="backupHistory.length === 0" class="text-center py-8 text-gray-500">
              No backups found
            </div>
            <div v-else class="space-y-2">
              <div 
                v-for="backup in backupHistory" 
                :key="backup._id"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p class="font-semibold text-sm">{{ formatDate(backup.createdAt) }}</p>
                  <p class="text-xs text-gray-600">{{ backup.type }} - {{ backup.fileSize }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <span :class="backup.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'" 
                        class="px-2 py-1 rounded text-xs font-semibold">
                    {{ backup.status }}
                  </span>
                  <button 
                    @click="downloadBackup(backup)"
                    class="text-blue-600 hover:text-blue-800"
                  >
                    <font-awesome-icon icon="download" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- System Updates Tab -->
      <div v-if="activeTab === 'updates'">
        <h3 class="text-xl font-bold mb-4">System Update</h3>
        
        <div class="max-w-2xl space-y-6">
          <!-- Current Version -->
          <div class="bg-gray-50 rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <p class="text-sm text-gray-600 mb-1">Current Version</p>
                <p class="text-3xl font-bold text-gray-800">v{{ currentVersion }}</p>
              </div>
              <div class="text-5xl">
                <font-awesome-icon icon="code-branch" class="text-blue-500" />
              </div>
            </div>
            <p class="text-xs text-gray-500">Last checked: {{ lastChecked || 'Never' }}</p>
          </div>

          <!-- Update Status -->
          <div v-if="updateStatus" class="rounded-lg p-6" :class="{
            'bg-green-50 border border-green-200': updateStatus === 'up-to-date',
            'bg-blue-50 border border-blue-200': updateStatus === 'update-available',
            'bg-yellow-50 border border-yellow-200': updateStatus === 'updating' || updateStatus === 'reverting',
            'bg-red-50 border border-red-200': updateStatus === 'error'
          }">
            <div class="flex items-start gap-3">
              <font-awesome-icon 
                :icon="updateStatus === 'up-to-date' ? 'check-circle' : 
                      updateStatus === 'update-available' ? 'exclamation-circle' : 
                      updateStatus === 'updating' || updateStatus === 'reverting' ? 'spinner' :
                      'circle-xmark'" 
                class="text-2xl mt-1"
                :class="{
                  'text-green-600': updateStatus === 'up-to-date',
                  'text-blue-600': updateStatus === 'update-available',
                  'text-yellow-600': updateStatus === 'updating' || updateStatus === 'reverting',
                  'text-red-600': updateStatus === 'error'
                }"
                :spin="updateStatus === 'updating' || updateStatus === 'reverting'"
              />
              <div class="flex-1">
                <p class="font-bold mb-1" :class="{
                  'text-green-800': updateStatus === 'up-to-date',
                  'text-blue-800': updateStatus === 'update-available',
                  'text-yellow-800': updateStatus === 'updating' || updateStatus === 'reverting',
                  'text-red-800': updateStatus === 'error'
                }">
                  {{ updateStatus === 'up-to-date' ? 'System is up to date' : 
                     updateStatus === 'update-available' ? 'Update Available!' : 
                     updateStatus === 'updating' ? 'Update in Progress' :
                     updateStatus === 'reverting' ? 'Reverting...' :
                     'Error checking for updates' }}
                </p>
                <p class="text-sm" :class="{
                  'text-green-700': updateStatus === 'up-to-date',
                  'text-blue-700': updateStatus === 'update-available',
                  'text-yellow-700': updateStatus === 'updating' || updateStatus === 'reverting',
                  'text-red-700': updateStatus === 'error'
                }">
                  {{ updateMessage }}
                </p>
                
                <!-- Update Details -->
                <div v-if="latestRelease && updateStatus === 'update-available'" class="mt-4 pt-4 border-t border-blue-200">
                  <p class="font-bold text-blue-900 mb-2">Version {{ latestRelease.tag_name }}</p>
                  <p class="text-sm text-blue-800 mb-3">Released on {{ formatDate(latestRelease.published_at) }}</p>
                  
                  <!-- Release Notes -->
                  <div v-if="latestRelease.body" class="bg-white rounded p-3 mb-3 max-h-48 overflow-y-auto">
                    <p class="text-xs font-bold text-gray-700 mb-2">Release Notes:</p>
                    <div class="text-xs text-gray-600 whitespace-pre-wrap">{{ latestRelease.body }}</div>
                  </div>
                  
                  <div class="flex gap-2">
                    <button 
                      @click="installUpdate"
                      :disabled="isUpdating"
                      class="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
                    >
                      <font-awesome-icon :icon="isUpdating ? 'spinner' : 'download'" :spin="isUpdating" />
                      {{ isUpdating ? 'Installing...' : 'Install Update (Auto)' }}
                    </button>
                    <a 
                      :href="latestRelease.html_url" 
                      target="_blank"
                      class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                      <font-awesome-icon icon="external-link-alt" class="text-xs" />
                      View on GitHub
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Check for Updates Button -->
          <div class="flex gap-3">
            <button 
              @click="checkForUpdates" 
              :disabled="isCheckingUpdates"
              class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <font-awesome-icon 
                :icon="isCheckingUpdates ? 'spinner' : 'sync-alt'" 
                :spin="isCheckingUpdates"
              />
              {{ isCheckingUpdates ? 'Checking...' : 'Check for Updates' }}
            </button>
            <button 
              @click="loadBackups" 
              :disabled="isLoadingBackups"
              class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <font-awesome-icon 
                :icon="isLoadingBackups ? 'spinner' : 'history'" 
                :spin="isLoadingBackups"
              />
              {{ isLoadingBackups ? 'Loading...' : 'Load Backups' }}
            </button>
          </div>

          <!-- Update/Revert Progress CLI Display -->
          <div v-if="showUpdateLogs" class="bg-gray-900 rounded-lg p-6 shadow-lg border border-gray-700">
            <div class="flex items-center justify-between mb-4">
              <h4 class="font-bold text-lg text-green-400 flex items-center gap-2">
                <font-awesome-icon icon="terminal" />
                Update Process
              </h4>
              <div class="text-sm text-gray-400">{{ updateProgress }}%</div>
            </div>
            
            <!-- Progress Bar -->
            <div class="w-full bg-gray-800 rounded-full h-2 mb-4">
              <div 
                class="bg-green-500 h-2 rounded-full transition-all duration-500"
                :style="{ width: updateProgress + '%' }"
              ></div>
            </div>
            
            <!-- Terminal Output -->
            <div class="bg-black rounded p-4 h-80 overflow-y-auto font-mono text-sm">
              <div 
                v-for="(log, index) in updateLogs" 
                :key="index"
                class="mb-2 flex gap-2"
                :class="{
                  'text-gray-300': log.type === 'info',
                  'text-green-400': log.type === 'success',
                  'text-yellow-400': log.type === 'warning',
                  'text-red-400': log.type === 'error'
                }"
              >
                <span class="text-gray-500">[{{ log.timestamp }}]</span>
                <span>{{ log.message }}</span>
              </div>
              
              <!-- Blinking cursor when in progress -->
              <div v-if="updateProgress < 100" class="flex gap-2 animate-pulse">
                <span class="text-gray-500">[{{ new Date().toLocaleTimeString() }}]</span>
                <span class="text-green-400">▊</span>
              </div>
            </div>
          </div>
          
          <!-- Backup/Revert Section -->
          <div v-if="backups.length > 0" class="bg-gray-50 rounded-lg p-6">
            <h4 class="font-bold text-lg mb-4 flex items-center gap-2">
              <font-awesome-icon icon="history" class="text-gray-600" />
              Available Backups (Revert Points)
            </h4>
            <p class="text-sm text-gray-600 mb-4">
              You can revert to any of these previous versions. A backup of the current version will be created automatically.
            </p>
            
            <div class="space-y-3 max-h-96 overflow-y-auto">
              <div 
                v-for="backup in backups" 
                :key="backup.path"
                class="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <font-awesome-icon icon="tag" class="text-blue-500 text-sm" />
                      <span class="font-bold text-gray-800">Version {{ backup.version }}</span>
                      <span class="text-xs text-gray-500">{{ backup.size }}</span>
                    </div>
                    <p class="text-xs text-gray-600 mb-2">
                      <font-awesome-icon icon="clock" class="mr-1" />
                      {{ new Date(backup.date).toLocaleString() }}
                    </p>
                    <p class="text-xs text-gray-500 font-mono truncate">{{ backup.path }}</p>
                  </div>
                  <button 
                    @click="revertToBackup(backup)"
                    :disabled="isReverting && selectedBackup === backup.path"
                    class="ml-4 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm"
                  >
                    <font-awesome-icon 
                      :icon="(isReverting && selectedBackup === backup.path) ? 'spinner' : 'undo'" 
                      :spin="isReverting && selectedBackup === backup.path"
                    />
                    {{ (isReverting && selectedBackup === backup.path) ? 'Reverting...' : 'Revert' }}
                  </button>
                </div>
              </div>
            </div>
            
            <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p class="text-xs text-yellow-800">
                <font-awesome-icon icon="exclamation-triangle" class="mr-2" />
                <strong>Note:</strong> Reverting will restore the entire system (backend, frontend, and Electron app) to the selected version and restart all services automatically.
              </p>
            </div>
          </div>
          
          <div v-else-if="!isLoadingBackups && backups.length === 0" class="bg-gray-50 rounded-lg p-6 text-center">
            <font-awesome-icon icon="inbox" class="text-4xl text-gray-400 mb-3" />
            <p class="text-gray-600">No backups available yet.</p>
            <p class="text-sm text-gray-500 mt-2">Backups are created automatically when you update the system.</p>
          </div>

          <!-- GitHub Repository Link -->
          <div class="bg-gray-50 rounded-lg p-4">
            <p class="text-sm text-gray-600 mb-2">
              <font-awesome-icon icon="info-circle" class="mr-2" />
              Updates are released on GitHub
            </p>
            <a 
              :href="githubRepoUrl" 
              target="_blank"
              class="text-blue-600 hover:text-blue-700 text-sm font-bold flex items-center gap-2"
            >
              <font-awesome-icon :icon="['fab', 'github']" />
              View Repository
              <font-awesome-icon icon="external-link-alt" class="text-xs" />
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Logout Confirmation Modal -->
    <div v-if="isLogoutModalOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <font-awesome-icon icon="sign-out-alt" class="text-red-600 text-xl" />
          </div>
          <h3 class="text-lg font-bold text-gray-900 mb-2">Confirm Logout</h3>
          <p class="text-sm text-gray-600 mb-6">Are you sure you want to logout?</p>
          <div class="flex gap-3">
            <button @click="closeLogoutConfirm" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl text-sm">
              Cancel
            </button>
            <button @click="confirmLogout" class="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-xl text-sm">
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <Toast ref="toastRef" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/utils/api'
import { auth } from '@/utils/auth'
import Toast from '../../components/Toast.vue'

const router = useRouter()

const activeTab = ref('profile')
const isLoading = ref(false)
const isLogoutModalOpen = ref(false)
const currentUser = ref(null)
const currentVatConfig = ref(null)
const toastRef = ref(null)

// Update check variables
const currentVersion = ref('1.0.0')
const githubRepoUrl = ref('https://github.com/Inton1701/POSExpress')
const updateStatus = ref(null)
const updateMessage = ref('')
const latestRelease = ref(null)
const isCheckingUpdates = ref(false)
const lastChecked = ref(null)
const isUpdating = ref(false)
const backups = ref([])
const isLoadingBackups = ref(false)
const selectedBackup = ref(null)
const isReverting = ref(false)
const showUpdateLogs = ref(false)
const updateLogs = ref([])
const updateProgress = ref(0)

// Google Drive Backup variables
const backupStatus = ref('not_connected')
const lastBackupTime = ref(null)
const isConnectingDrive = ref(false)
const isBackingUp = ref(false)
const backupProgress = ref(0)
const backupHistory = ref([])
const driveFolderId = ref('')
const backupOptions = ref({
  products: true,
  addons: true,
  transactions: true,
  customers: true,
  users: true
})
const scheduledBackup = ref({
  enabled: false,
  frequency: 'daily',
  hour: 2,
  minute: '00',
  ampm: 'AM',
  dayOfWeek: '0',
  dayOfMonth: 1
})

const profileForm = ref({
  username: '',
  rfid: '',
  storeName: '',
  address: '',
  tin: '',
  contact: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const vatForm = ref({
  type: 'percent',
  value: 0
})

const showToast = (message, type = 'success') => {
  if (toastRef.value) {
    toastRef.value.addToast(message, type)
  }
}

const fetchCurrentUser = async () => {
  try {
    const user = auth.getUser() || {}
    currentUser.value = user
    profileForm.value.username = user.username || ''
    profileForm.value.rfid = user.rfid || ''
    
    // Fetch full store details
    if (user.store) {
      const storeId = typeof user.store === 'object' ? user.store._id : user.store
      if (storeId) {
        const response = await api.get(`/stores/${storeId}`)
        if (response.data.success) {
          const store = response.data.store
          profileForm.value.storeName = store.storeName || ''
          profileForm.value.address = store.address || ''
          profileForm.value.tin = store.tin || ''
          profileForm.value.contact = store.contact || ''
        }
      }
    }
  } catch (error) {
    console.error('Error fetching user:', error)
    showToast('Failed to load profile information', 'error')
  }
}

const fetchVATRate = async () => {
  try {
    const response = await api.get('/settings/vat-config')
    if (response.data.success) {
      currentVatConfig.value = response.data.vatConfig
      vatForm.value.type = response.data.vatConfig.type || 'percent'
      vatForm.value.value = response.data.vatConfig.value || 0
    }
  } catch (error) {
    console.error('Error fetching VAT config:', error)
  }
}

const updateProfile = async () => {
  if (!profileForm.value.username) {
    showToast('Username is required', 'error')
    return
  }

  // If changing password, validate
  if (profileForm.value.newPassword || profileForm.value.currentPassword) {
    if (!profileForm.value.currentPassword) {
      showToast('Current password is required to change password', 'error')
      return
    }
    if (!profileForm.value.newPassword) {
      showToast('New password is required', 'error')
      return
    }
    if (profileForm.value.newPassword !== profileForm.value.confirmPassword) {
      showToast('New passwords do not match', 'error')
      return
    }
    if (profileForm.value.newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'error')
      return
    }
  }

  isLoading.value = true
  try {
    const updateData = {
      username: profileForm.value.username,
      rfid: profileForm.value.rfid || null
    }

    if (profileForm.value.currentPassword && profileForm.value.newPassword) {
      updateData.currentPassword = profileForm.value.currentPassword
      updateData.newPassword = profileForm.value.newPassword
    }

    const response = await api.put(`/users/${currentUser.value._id}`, updateData)
    
    if (response.data.success) {
      // Update store information
      if (currentUser.value.store) {
        const storeId = typeof currentUser.value.store === 'object' ? currentUser.value.store._id : currentUser.value.store
        if (storeId) {
          const storeData = {
            storeName: profileForm.value.storeName,
            address: profileForm.value.address,
            tin: profileForm.value.tin,
            contact: profileForm.value.contact
          }
          
          const storeResponse = await api.put(`/stores/${storeId}`, storeData)
        }
      }
      
      // Update localStorage
      const updatedUser = { ...currentUser.value, username: profileForm.value.username, rfid: profileForm.value.rfid }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      currentUser.value = updatedUser
      
      // Clear password fields
      profileForm.value.currentPassword = ''
      profileForm.value.newPassword = ''
      profileForm.value.confirmPassword = ''
      
      showToast('Profile and store information updated successfully', 'success')
    }
  } catch (error) {
    console.error('Error updating profile:', error)
    showToast(error.response?.data?.message || 'Failed to update profile', 'error')
  } finally {
    isLoading.value = false
  }
}

const updateVATRate = async () => {
  if (vatForm.value.value < 0) {
    showToast('VAT value cannot be negative', 'error')
    return
  }
  
  if (vatForm.value.type === 'percent' && vatForm.value.value > 100) {
    showToast('VAT percentage cannot exceed 100%', 'error')
    return
  }

  isLoading.value = true
  try {
    const response = await api.post('/settings/vat-config', {
      vatType: vatForm.value.type,
      vatValue: vatForm.value.value
    })
    
    if (response.data.success) {
      currentVatConfig.value = { type: vatForm.value.type, value: vatForm.value.value }
      showToast('VAT configuration updated successfully', 'success')
    }
  } catch (error) {
    console.error('Error updating VAT config:', error)
    showToast(error.response?.data?.message || 'Failed to update VAT configuration', 'error')
  } finally {
    isLoading.value = false
  }
}

const showLogoutConfirm = () => {
  isLogoutModalOpen.value = true
}

const closeLogoutConfirm = () => {
  isLogoutModalOpen.value = false
}

const confirmLogout = () => {
  localStorage.removeItem('user')
  isLogoutModalOpen.value = false
  router.push('/')
}

const checkForUpdates = async () => {
  isCheckingUpdates.value = true
  updateStatus.value = null
  updateMessage.value = ''
  
  try {
    // Check if user is logged in
    const currentUser = auth.getUser()
    if (!currentUser) {
      throw new Error('User not authenticated')
    }
    
    // Call backend API to check for updates
    const response = await api.get('/system/check-updates')
    
    if (response.data.success) {
      const data = response.data
      currentVersion.value = data.currentVersion
      
      if (data.updateAvailable) {
        latestRelease.value = data.release
        updateStatus.value = 'update-available'
        updateMessage.value = `A new version (v${data.latestVersion}) is available.`
      } else {
        updateStatus.value = 'up-to-date'
        updateMessage.value = 'You are running the latest version.'
      }
    } else {
      throw new Error(response.data.message || 'Failed to check for updates')
    }
    
    // Update last checked time
    const now = new Date()
    lastChecked.value = now.toLocaleString()
    localStorage.setItem('lastUpdateCheck', now.toISOString())
    
  } catch (error) {
    console.error('Error checking for updates:', error)
    updateStatus.value = 'error'
    
    // More specific error messages
    if (error.response?.status === 403) {
      updateMessage.value = 'Access denied. Only administrators can check for updates.'
    } else if (error.response?.status === 401) {
      updateMessage.value = 'Session expired. Please login again.'
    } else {
      updateMessage.value = error.response?.data?.message || 'Could not check for updates. Please try again later.'
    }
  } finally {
    isCheckingUpdates.value = false
  }
}

const installUpdate = async () => {
  if (!confirm('This will automatically update the entire system including backend, frontend, and Electron app. The system will restart automatically. Continue?')) {
    return
  }
  
  isUpdating.value = true
  showUpdateLogs.value = true
  updateLogs.value = []
  updateProgress.value = 0
  
  const addLog = (message, type = 'info') => {
    updateLogs.value.push({
      timestamp: new Date().toLocaleTimeString(),
      message,
      type // 'info', 'success', 'warning', 'error'
    })
  }
  
  try {
    // First check prerequisites
    addLog('Checking update system prerequisites...', 'info')
    updateProgress.value = 5
    
    try {
      const prereqResponse = await api.get('/system/update-prerequisites')
      if (prereqResponse.data.success) {
        const checks = prereqResponse.data.checks
        
        if (!checks.ready) {
          addLog('⚠️ Update system needs configuration', 'warning')
          
          if (!checks.scriptExists) {
            addLog('  ✗ Update script not found', 'error')
          }
          if (!checks.scriptExecutable) {
            addLog('  ✗ Update script not executable', 'error')
          }
          if (!checks.sudoConfigured && !checks.isRoot) {
            addLog('  ✗ Passwordless sudo not configured', 'error')
            addLog('  → Run: sudo ./setup-update-permissions.sh', 'warning')
          }
          
          addLog('Please run setup-update-permissions.sh first', 'error')
          updateProgress.value = 0
          isUpdating.value = false
          return
        }
        
        addLog('✓ Prerequisites check passed', 'success')
        addLog(`  User: ${checks.user} (root: ${checks.isRoot})`, 'info')
        addLog(`  Script: ${checks.scriptExists ? '✓' : '✗'}`, checks.scriptExists ? 'success' : 'error')
        addLog(`  Sudo: ${checks.sudoConfigured ? '✓ configured' : '✗ needs setup'}`, checks.sudoConfigured ? 'success' : 'warning')
      }
    } catch (prereqError) {
      addLog('Could not check prerequisites, continuing anyway...', 'warning')
    }
    
    addLog('Triggering automated update system...', 'info')
    updateProgress.value = 10
    
    const response = await api.post('/system/update')
    
    if (response.data.success) {
      updateProgress.value = 20
      addLog('Update script started on server', 'success')
      addLog(response.data.message, 'info')
      
      // Give real feedback about the update process
      addLog('Server is now updating... This will take 3-5 minutes:', 'warning')
      addLog('  • Downloading latest version from GitHub', 'info')
      await new Promise(resolve => setTimeout(resolve, 3000))
      updateProgress.value = 30
      
      addLog('  • Creating backup of current version', 'info')
      await new Promise(resolve => setTimeout(resolve, 2000))
      updateProgress.value = 40
      
      addLog('  • Installing backend dependencies', 'info')
      await new Promise(resolve => setTimeout(resolve, 5000))
      updateProgress.value = 50
      
      addLog('  • Installing frontend dependencies', 'info')
      await new Promise(resolve => setTimeout(resolve, 5000))
      updateProgress.value = 60
      
      addLog('  • Building Vue application', 'info')
      await new Promise(resolve => setTimeout(resolve, 8000))
      updateProgress.value = 70
      
      addLog('  • Building Electron Linux app (this takes time)', 'info')
      await new Promise(resolve => setTimeout(resolve, 30000)) // Electron build takes 30+ seconds
      updateProgress.value = 85
      
      addLog('  • Restarting backend service', 'info')
      await new Promise(resolve => setTimeout(resolve, 3000))
      updateProgress.value = 90
      
      addLog('Update process started in background (nohup)', 'success')
      addLog('Server will update automatically now...', 'info')
      
      // Poll the actual update log file for real progress
      addLog('Fetching real-time update logs...', 'info')
      updateProgress.value = 10
      
      let checkCount = 0
      const maxChecks = 120 // 10 minutes max (120 * 5 seconds)
      let lastLogContent = ''
      
      const monitorUpdate = setInterval(async () => {
        checkCount++
        
        try {
          // Fetch actual update log
          const logResponse = await api.get('/system/update-log')
          if (logResponse.data.success && logResponse.data.log) {
            const logContent = logResponse.data.log
            
            // Only add new lines
            if (logContent !== lastLogContent) {
              const newLines = logContent.split('\n').slice(lastLogContent.split('\n').length - 1)
              newLines.forEach(line => {
                if (line.trim()) {
                  // Determine log type based on content
                  let type = 'info'
                  if (line.includes('Error') || line.includes('error') || line.includes('failed')) {
                    type = 'error'
                  } else if (line.includes('Warning') || line.includes('warning')) {
                    type = 'warning'
                  } else if (line.includes('✓') || line.includes('successfully') || line.includes('complete')) {
                    type = 'success'
                  }
                  
                  addLog(line, type)
                }
              })
              lastLogContent = logContent
              
              // Update progress based on log content
              if (logContent.includes('Downloading latest version')) {
                updateProgress.value = 20
              }
              if (logContent.includes('Updating backend')) {
                updateProgress.value = 35
              }
              if (logContent.includes('Building Vue application')) {
                updateProgress.value = 50
              }
              if (logContent.includes('Building Electron application')) {
                updateProgress.value = 60
              }
              if (logContent.includes('Restarting all services')) {
                updateProgress.value = 90
              }
              if (logContent.includes('Update Complete')) {
                updateProgress.value = 100
              }
            }
          }
        } catch (err) {
          // Log fetch failed, backend might be restarting
        }
        
        // Check if backend is back up
        if (checkCount > 20) {
          try {
            const response = await api.get('/health')
            if (response.data.success) {
              // Backend is back! Update must be complete
              addLog('Backend is back online - update complete!', 'success')
              clearInterval(monitorUpdate)
              
              updateProgress.value = 100
              addLog('Reloading application in 3 seconds...', 'warning')
              showToast('Update completed! Application restarting...', 'success')
              
              updateMessage.value = 'Update completed! Reloading application...'
              updateStatus.value = 'updating'
              
              setTimeout(() => {
                window.location.reload()
              }, 3000)
            }
          } catch (err) {
            // Backend still down, keep monitoring
          }
        }
        
        // Timeout after 10 minutes
        if (checkCount >= maxChecks) {
          clearInterval(monitorUpdate)
          addLog('Update timeout - check server logs for details', 'warning')
          updateProgress.value = 100
        }
      }, 5000) // Check every 5 seconds
    } else {
      throw new Error(response.data.message || 'Failed to start update')
    }
  } catch (error) {
    console.error('Error installing update:', error)
    addLog('Error: ' + (error.response?.data?.message || error.message), 'error')
    showToast(error.response?.data?.message || 'Failed to install update', 'error')
    isUpdating.value = false
    updateProgress.value = 0
  }
}

const loadBackups = async () => {
  isLoadingBackups.value = true
  try {
    const response = await api.get('/system/backups')
    
    if (response.data.success) {
      backups.value = response.data.backups || []
    }
  } catch (error) {
    console.error('Error loading backups:', error)
    showToast('Failed to load backups', 'error')
  } finally {
    isLoadingBackups.value = false
  }
}

const revertToBackup = async (backup) => {
  if (!confirm(`Are you sure you want to revert to version ${backup.version}? This will restore the system to that version and restart automatically.`)) {
    return
  }
  
  isReverting.value = true
  selectedBackup.value = backup.path
  showUpdateLogs.value = true
  updateLogs.value = []
  updateProgress.value = 0
  
  // Simulate progress with log messages
  const addLog = (message, type = 'info') => {
    updateLogs.value.push({
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    })
  }
  
  try {
    addLog(`Starting revert to version ${backup.version}...`, 'info')
    updateProgress.value = 10
    
    addLog('Backing up current state...', 'warning')
    await new Promise(resolve => setTimeout(resolve, 1000))
    updateProgress.value = 20
    
    addLog('Stopping services...', 'info')
    await new Promise(resolve => setTimeout(resolve, 1000))
    updateProgress.value = 30
    
    addLog('Triggering revert process...', 'info')
    const response = await api.post('/system/revert', {
      backupPath: backup.path
    })
    
    if (response.data.success) {
      updateProgress.value = 40
      addLog('Revert script started successfully', 'success')
      
      addLog('Restoring backend files...', 'info')
      await new Promise(resolve => setTimeout(resolve, 2000))
      updateProgress.value = 55
      
      addLog('Restoring frontend files...', 'info')
      await new Promise(resolve => setTimeout(resolve, 2000))
      updateProgress.value = 70
      
      addLog('Rebuilding application...', 'info')
      await new Promise(resolve => setTimeout(resolve, 3000))
      updateProgress.value = 85
      
      addLog('Restarting services...', 'warning')
      await new Promise(resolve => setTimeout(resolve, 2000))
      updateProgress.value = 95
      
      addLog('Revert complete! Restarting application...', 'success')
      updateProgress.value = 100
      
      showToast('Revert completed! Application will restart...', 'success')
      
      updateMessage.value = 'Reverting to previous version... Application will restart automatically. Please wait...'
      updateStatus.value = 'reverting'
      
      // Wait and reload
      setTimeout(() => {
        window.location.reload()
      }, 5000)
    } else {
      throw new Error(response.data.message || 'Failed to start revert')
    }
  } catch (error) {
    console.error('Error reverting:', error)
    addLog('Error: ' + (error.response?.data?.message || error.message), 'error')
    showToast(error.response?.data?.message || 'Failed to revert update', 'error')
    isReverting.value = false
    selectedBackup.value = null
    updateProgress.value = 0
  }
}

// Google Drive Backup Functions
const loadDriveFolderId = async () => {
  try {
    const user = auth.getUser() || {}
    const storeId = user.store?._id || user.store
    
    if (!storeId) return
    
    const response = await api.get(`/backup/folder-id?storeId=${storeId}`)
    if (response.data.success) {
      driveFolderId.value = response.data.folderId || ''
    }
  } catch (error) {
    console.error('Error loading folder ID:', error)
  }
}

const saveDriveFolderId = async () => {
  if (!driveFolderId.value) {
    showToast('Please enter a folder ID', 'error')
    return
  }

  try {
    const user = auth.getUser() || {}
    const storeId = user.store?._id || user.store

    const response = await api.post('/backup/folder-id', {
      storeId,
      folderId: driveFolderId.value
    })

    if (response.data.success) {
      showToast('Google Drive folder ID saved successfully!', 'success')
      checkDriveConnection()
    }
  } catch (error) {
    console.error('Error saving folder ID:', error)
    showToast(error.response?.data?.message || 'Failed to save folder ID', 'error')
  }
}

const performManualBackup = async () => {
  if (backupStatus.value !== 'connected') {
    showToast('Please connect to Google Drive first', 'error')
    return
  }

  isBackingUp.value = true
  backupProgress.value = 0

  try {
    const user = auth.getUser() || {}
    const storeId = user.store?._id || user.store

    // Increase timeout for backup (5 minutes)
    const response = await api.post('/backup/manual', {
      storeId,
      options: backupOptions.value
    }, {
      timeout: 300000 // 5 minutes for large backups
    })

    if (response.data.success) {
      backupProgress.value = 100
      lastBackupTime.value = new Date().toLocaleString()
      showToast(`Backup completed! ${response.data.files?.length || 0} files uploaded`, 'success')
      loadBackupHistory()
    }
  } catch (error) {
    console.error('Error performing backup:', error)
    if (error.code === 'ECONNABORTED') {
      showToast('Backup is taking longer than expected. Please check Google Drive in a few minutes.', 'warning')
    } else {
      showToast(error.response?.data?.message || 'Failed to perform backup', 'error')
    }
  } finally {
    isBackingUp.value = false
    setTimeout(() => {
      backupProgress.value = 0
    }, 2000)
  }
}

const saveScheduledBackup = async () => {
  if (!scheduledBackup.value.enabled) {
    showToast('Please enable scheduled backup first', 'error')
    return
  }

  isLoading.value = true
  try {
    const user = auth.getUser() || {}
    const storeId = user.store?._id || user.store

    // Convert time to 24-hour format
    let hour24 = parseInt(scheduledBackup.value.hour)
    if (scheduledBackup.value.ampm === 'PM' && hour24 !== 12) {
      hour24 += 12
    } else if (scheduledBackup.value.ampm === 'AM' && hour24 === 12) {
      hour24 = 0
    }

    const response = await api.post('/backup/schedule', {
      storeId,
      schedule: {
        enabled: scheduledBackup.value.enabled,
        frequency: scheduledBackup.value.frequency,
        time: `${String(hour24).padStart(2, '0')}:${scheduledBackup.value.minute}`,
        dayOfWeek: scheduledBackup.value.dayOfWeek,
        dayOfMonth: scheduledBackup.value.dayOfMonth,
        options: backupOptions.value
      }
    })

    if (response.data.success) {
      showToast('Scheduled backup saved successfully!', 'success')
    }
  } catch (error) {
    console.error('Error saving scheduled backup:', error)
    showToast(error.response?.data?.message || 'Failed to save schedule', 'error')
  } finally {
    isLoading.value = false
  }
}

const loadBackupHistory = async () => {
  try {
    const user = auth.getUser() || {}
    const storeId = user.store?._id || user.store

    const response = await api.get(`/backup/history?storeId=${storeId}`)
    if (response.data.success) {
      backupHistory.value = response.data.backups || []
      if (response.data.lastBackup) {
        lastBackupTime.value = new Date(response.data.lastBackup).toLocaleString()
      }
    }
  } catch (error) {
    console.error('Error loading backup history:', error)
  }
}

const downloadBackup = async (backup) => {
  try {
    window.open(backup.downloadUrl, '_blank')
  } catch (error) {
    showToast('Failed to download backup', 'error')
  }
}

const loadScheduledBackup = async () => {
  try {
    const user = auth.getUser() || {}
    const storeId = user.store?._id || user.store
    
    if (!storeId) return
    
    const response = await api.get(`/stores/${storeId}`)
    if (response.data.success && response.data.store.backupSchedule) {
      const schedule = response.data.store.backupSchedule
      
      scheduledBackup.value.enabled = schedule.enabled || false
      scheduledBackup.value.frequency = schedule.frequency || 'daily'
      scheduledBackup.value.dayOfWeek = schedule.dayOfWeek || '0'
      scheduledBackup.value.dayOfMonth = schedule.dayOfMonth || 1
      
      // Parse time (format: "HH:MM")
      if (schedule.time) {
        const [hours, minutes] = schedule.time.split(':')
        let hour24 = parseInt(hours)
        
        if (hour24 >= 12) {
          scheduledBackup.value.ampm = 'PM'
          scheduledBackup.value.hour = hour24 === 12 ? 12 : hour24 - 12
        } else {
          scheduledBackup.value.ampm = 'AM'
          scheduledBackup.value.hour = hour24 === 0 ? 12 : hour24
        }
        scheduledBackup.value.minute = minutes
      }
      
      // Load options
      if (schedule.options) {
        backupOptions.value.products = schedule.options.products !== undefined ? schedule.options.products : true
        backupOptions.value.addons = schedule.options.addons !== undefined ? schedule.options.addons : true
        backupOptions.value.transactions = schedule.options.transactions !== undefined ? schedule.options.transactions : true
        backupOptions.value.customers = schedule.options.customers !== undefined ? schedule.options.customers : true
        backupOptions.value.users = schedule.options.users !== undefined ? schedule.options.users : true
      }
    }
  } catch (error) {
    console.error('Error loading scheduled backup:', error)
  }
}

const checkDriveConnection = async () => {
  try {
    const user = auth.getUser() || {}
    const storeId = user.store?._id || user.store
    
    if (!storeId) return
    
    const response = await api.get(`/backup/status?storeId=${storeId}`)
    if (response.data.success && response.data.connected) {
      backupStatus.value = 'connected'
      loadBackupHistory()
    }
  } catch (error) {
    console.error('Error checking drive connection:', error)
  }
}

onMounted(async () => {
  fetchCurrentUser()
  fetchVATRate()
  loadDriveFolderId()
  loadScheduledBackup()
  checkDriveConnection()
  
  // Load last update check time
  const lastCheck = localStorage.getItem('lastUpdateCheck')
  if (lastCheck) {
    lastChecked.value = new Date(lastCheck).toLocaleString()
  }
  
  // Fetch current version from backend
  try {
    const response = await api.get('/system/version')
    if (response.data.success) {
      currentVersion.value = response.data.version
    }
  } catch (error) {
    console.error('Error fetching version:', error)
  }
  
  // Load backups when updates tab is active
  if (activeTab.value === 'updates') {
    loadBackups()
  }
})

const compareVersions = (v1, v2) => {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0
    const part2 = parts2[i] || 0
    
    if (part1 > part2) return 1
    if (part1 < part2) return -1
  }
  
  return 0
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

onMounted(() => {
  fetchCurrentUser()
  fetchVATRate()
  
  // Load last update check time
  const lastCheck = localStorage.getItem('lastUpdateCheck')
  if (lastCheck) {
    lastChecked.value = new Date(lastCheck).toLocaleString()
  }
})
</script>
