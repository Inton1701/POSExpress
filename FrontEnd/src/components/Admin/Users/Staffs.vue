<template>
  <Navbar />
  <Sidebar />
  <div class="page-wrapper">
    <div class="content">
      <div class="page-header">
        <div class="add-item d-flex">
          <div class="page-title">
            <h4>User List</h4>
            <h6>Manage Your Users</h6>
          </div>
        </div>

        <div class="page-btn">
          <a href="#" class="btn btn-added" data-bs-toggle="modal" data-bs-target="#add-users"><i
              data-feather="plus-circle" class="me-2"></i>Add New User</a>
        </div>
      </div>

      <div class="card table-list-card">
        <div class="card-body">
          <div class="table-responsive">
            <ClipLoader v-if="loading" />
            <table v-else class="table" id="user-table">
              <thead>
                <tr>
                  <th>User Full Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Login-Time</th>
                  <th>Logout-Time</th>
                  <th>Role</th>
                  <th>Created On</th>
                  <th class="no-sort">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user._id" class="table-cell">
                  <td>
                    <div class="productimgname">
                      <a href="javascript:void(0);" class="product-img stock-img">
                        <img v-if="user.image" :src="`${imageURL}${user.image}`"
                          alt="/img/icons/no-image-icon.png" />
                        <img v-else :src="`/img/icons/no-image-icon.png`" />
                      </a>
                      <a href="javascript:void(0);"> {{ user.firstName }} {{ user.lastName }}</a>
                    </div>
                  </td>
                  <td>{{ user.phone }}</td>
                  <td>{{ user.email }}</td>
                  <td> <span :class="{
                    'badge': true,
                    'badge-linesuccess': user.status === 'Online',
                    'badge-linewarning': user.status === 'Offline'
                  }">
                      {{ user.status }}
                    </span></td>
                  <td>{{ new Date(user.login).toLocaleString() }}</td>
                  <td>{{ new Date(user.logout).toLocaleString() }}</td>
                  <td>{{ user.role }}</td>
                  <td>{{ new Date(user.createdAt).toLocaleString() }}</td>
                  <td class="action-table-data">
                    <div class="edit-delete-action">
                      <a class="me-2 p-2" href="#" data-bs-toggle="modal" data-bs-target="#edit-users"
                        @click="openEditModal(user._id)">
                        <i data-feather="edit" class="feather-edit"></i>
                      </a>
                      <a class="confirm-text p-2" href="javascript:void(0);" @click="deleteUser(user._id)">
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


  <div class="modal fade" id="add-users">
    <div class="modal-dialog modal-dialog-centered custom-modal-two">
      <div class="modal-content">
        <div class="page-wrapper-new p-0">
          <div class="content">
            <div class="modal-header border-0 custom-modal-header">
              <div class="page-title">
                <h4>Add User</h4>
              </div>
              <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body custom-modal-body new-employee-field">
              <form @submit.prevent="addUser">
                <div class="row">
                  <div class="col-lg-12">
                    <label class="form-label">User Profile</label>
                    <div class="profile-pic-upload mb-3">
                      <!-- Add Image -->
                      <div v-if="!newUser.image.url" class="profile-pic brand-pic" @click="triggerFileInput('new')">
                        <input id="new-User-file-input" type="file" @change="onFileChange('new', $event)" hidden />
                        <span><i data-feather="plus-circle" class="plus-down-add"></i> Add Image</span>
                      </div>

                      <!-- Image Preview -->
                      <div class="phone-img" v-else>
                        <div class="image-preview-wrapper">
                          <img :src="newUser.image.url" alt="Uploaded image" class="image-preview" />
                          <a @click="removeImage('new')" class="remove-image-btn">
                            <font-awesome-icon icon="xmark" style="color: #ffffff;" class="mx-2" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="col-lg-6">
                    <div class="input-blocks">
                      <label>First Name</label>
                      <input type="text" class="form-control" v-model="newUser.firstName" />
                    </div>
                  </div>
                  <div class="col-lg-6">
                    <div class="input-blocks">
                      <label>Last Name</label>
                      <input type="text" class="form-control" v-model="newUser.lastName" />
                    </div>
                  </div>
                  <div class="col-lg-6">
                    <div class="input-blocks">
                      <label>Phone</label>
                      <input type="text" class="form-control" v-model="newUser.phone" />
                    </div>
                  </div>
                  <div class="col-lg-6">
                    <div class="input-blocks">
                      <label>Email</label>
                      <input type="email" class="form-control" v-model="newUser.email" />
                    </div>
                  </div>
                  <div class="col-lg-6">
                    <div class="input-blocks">
                      <label>Birthdate</label>
                      <input type="date" class="form-control" v-model="newUser.birthdate" />
                    </div>
                  </div>
                  <div class="col-lg-6">
                    <div class="input-blocks">
                      <label>Role</label>
                      <select class="form-control" v-model="newUser.role">
                        <option value="Admin">Admin</option>
                        <option value="Cashier">Cashier</option>
                      </select>
                    </div>
                  </div>
                  <div class="col-lg-6">
                    <div class="input-blocks">
                      <label>Password</label>
                      <div class="pass-group">
                        <input type="password" id="add-password" class="pass-input" v-model="newUser.password" />
                        <span class="fas toggle-password fa-eye-slash"></span>
                      </div>
                    </div>
                  </div>
                  <div class="col-lg-6">
                    <div class="input-blocks">
                      <label>Confirm Password</label>
                      <div class="pass-group">
                        <input type="password" id="add-conf-password" class="pass-input"
                          v-model="newUser.confPassword" />
                        <span class="fas toggle-password fa-eye-slash"></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="modal-footer-btn">
                  <button type="button" class="btn btn-cancel me-2" data-bs-dismiss="modal">
                    Cancel
                  </button>
                  <button type="submit" class="btn btn-submit">Submit</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>


  <div class="modal fade" id="edit-users">
    <div class="modal-dialog modal-dialog-centered custom-modal-two">
      <div class="modal-content">
        <div class="page-wrapper-new p-0">
          <div class="content">
            <div class="modal-header border-0 custom-modal-header">
              <div class="page-title">
                <h4 class="status-wrapper">
                  Edit User
                  <span class="status-container">
                    <span class="status-indicator" :class="isOnline"></span>
                    <span class="status-text">{{ editUser.status }}</span>
                  </span>
                </h4>

              </div>
              <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body custom-modal-body new-employee-field">

              <form @submit.prevent="updateUser">
                <input type="hidden" v-model="editUser._id">
                <div class="row">
                  <div class="col-lg-12">

                    <div class="row">
                      <div class="col-6">
                        <label class="form-label">User Profile</label>

                        <div class="profile-pic-upload mb-3">
                          <!-- Add Image -->
                          <div v-if="!editUser.image.url" class="profile-pic brand-pic"
                            @click="triggerFileInput('edit')">
                            <input id="edit-User-file-input" type="file" @change="onFileChange('edit', $event)"
                              hidden />
                            <span><i data-feather="plus-circle" class="plus-down-add"></i> Add Image</span>
                          </div>

                          <!-- Image Preview -->
                          <div class="phone-img" v-else>
                            <div class="image-preview-wrapper">
                              <img :src="editUser.image.url" alt="Uploaded image" class="image-preview" />
                              <a @click="removeImage('edit')" class="remove-image-btn">
                                <font-awesome-icon icon="xmark" style="color: #ffffff;" class="mx-2" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="col-5">
                        <p class="form-label">Set User Status to:</p>
                        <div class="status-toggle modal-status d-flex justify-content-between align-items-center">
                          <span>{{ editUser.userStatus }}</span>
                          <input type="checkbox" id="add-category-status" class="check" v-model="editUser.userStatus"
                            :true-value="'Enabled'" :false-value="'Disabled'" />
                          <label for="add-category-status" class="checktoggle"></label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-lg-6">
                    <div class="input-blocks">
                      <label>First Name</label>
                      <input type="text" class="form-control" v-model="editUser.firstName" />
                    </div>
                  </div>
                  <div class="col-lg-6">
                    <div class="input-blocks">
                      <label>Last Name</label>
                      <input type="text" class="form-control" v-model="editUser.lastName" />
                    </div>
                  </div>
                  <div class="col-lg-6">
                    <div class="input-blocks">
                      <label>Phone</label>
                      <input type="text" class="form-control" v-model="editUser.phone" />
                    </div>
                  </div>
                  <div class="col-lg-6">
                    <div class="input-blocks">
                      <label>Email</label>
                      <input type="email" class="form-control" v-model="editUser.email" />
                    </div>
                  </div>
                  <div class="col-lg-6">
                    <div class="input-blocks">
                      <label>Birthdate</label>
                      <input type="date" class="form-control" v-model="editUser.birthdate" />
                    </div>
                  </div>
                  <div class="col-lg-6">
                    <div class="input-blocks">
                      <label>Role</label>
                      <select class="form-control" v-model="editUser.role">
                        <option value="Admin">Admin</option>
                        <option value="Cashier">Cashier</option>
                      </select>
                    </div>
                  </div>
                  <div class="col-lg-6">
                    <div class="input-blocks">
                      <label>Password</label>
                      <div class="pass-group">
                        <input :type="passwordVisible ? 'text' : 'password'" id="add-password" class="pass-input"
                          v-model="editUser.password" />
                        <font-awesome-icon :icon="passwordVisible ? 'fa-eye' : 'fa-eye-slash'" @click="togglePassword()"
                          class="toggle-password fa-xs" style="font-size: 8px;" />
                      </div>
                    </div>
                  </div>
                  <div class="col-lg-6">
                    <div class="input-blocks">
                      <label>Confirm Password</label>
                      <div class="pass-group">
                        <input type="password" id="add-conf-password" class="pass-input"
                          v-model="editUser.confPassword" />
                        <font-awesome-icon :icon="passwordVisible ? 'fa-eye' : 'fa-eye-slash'" @click="togglePassword()"
                          class="toggle-password fa-xs" style="font-size: 8px;" />
                      </div>
                    </div>
                  </div>
                </div>
                <p style="font-size: 10px;">
                  Last Login: {{ new Date(editUser.login).toLocaleString() }},
                  Last Logout: {{ new Date(editUser.logout).toLocaleString() }}
                </p>
                <div class="modal-footer-btn">
                  <button type="button" class="btn btn-cancel me-2" data-bs-dismiss="modal">
                    Cancel
                  </button>
                  <button type="submit" class="btn btn-submit">Submit</button>
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
import { ref, onMounted, nextTick } from 'vue';
import { modalController } from '@/utils/modalController';
import 'select2';
import feather from 'feather-icons';
import Swal from 'sweetalert2';
import Navbar from '/src/components/Admin/Navbar.vue';
import ClipLoader from 'vue-spinner/src/ClipLoader.vue';
import $ from 'jquery';
import axios from 'axios';

export default {
  components: {
    Navbar,
    ClipLoader
  },
  setup() {
    const apiURL = process.env.VUE_APP_URL;
    const imageURL = process.env.VUE_APP_IMAGE_URL;
    const users = ref([]);
    const loading = ref(false);
    const isOnline = ref('Online')
    const passwordVisible = ref(false)  



    const newUser = ref({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      birthdate: '',
      role: 'Cashier',
      password: '',
      confPassword: '',
      image: { file: null, url: null },
    });
    const editUser = ref({
      _id: '',
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      birthdate: '',
      role: '',
      password: '',
      confPassword: '',
      status: '',
      login: '',
      logout: '',
      image: { file: null, url: null },
      userStatus: 'Disabled',
      isImageRemoved: false,
    });

    const triggerFileInput = (User) => {
      if (User === 'new') {
        document.querySelector('#new-User-file-input').click();
      } else if (User === 'edit') {
        document.querySelector('#edit-User-file-input').click();
      }
    };

    const onFileChange = (User, event) => {
      const file = event.target.files[0];
      if (file) {
        const imageData = { file, url: URL.createObjectURL(file) };
        if (User === 'new') {
          newUser.value.image = imageData;
        } else if (User === 'edit') {
          editUser.value.image = imageData;
        }
      }
    };

    const removeImage = (User) => {
      if (User === 'new') {
        newUser.value.image = { file: null, url: null };
      } else if (User === 'edit') {
        editUser.value.image = { file: null, url: null };
        editUser.value.isimageRemoved = true;
      }
      console.log(editUser.value.image)
    };

    const initializeDataTable = () => {
      const tableElement = $('#user-table');
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
      const table = $('#user-table').DataTable();
      table.destroy();
      initializeDataTable();
    };

    const getUsers = async () => {
      try {
        loading.value = true;
        const response = await axios.get(`${apiURL}/get_all_users`);
        users.value = response.data.users;

        this.$nextTick(() => refreshDataTable());
      } catch (error) {
        console.error('Error fetching users:', error.message);
      } finally {
        loading.value = false;
      }
    };

    const togglePassword = ()=>{
      passwordVisible.value = !passwordVisible.value;
    } 
    const addUser = async () => {


      if (newUser.value.password !== newUser.value.confPassword) {
        Swal.fire('Error', 'Passwords do not match', 'error');
        return;
      }

      const formData = new FormData();
      formData.append('firstName', newUser.value.firstName);  // Ensure firstName is not empty
      formData.append('lastName', newUser.value.lastName);    // Ensure lastName is not empty
      formData.append('email', newUser.value.email);          // Ensure email is not empty
      formData.append('phone', newUser.value.phone);          // Ensure phone is not empty
      formData.append('birthdate', newUser.value.birthdate);  // Ensure birthdate is not empty
      formData.append('role', newUser.value.role);            // Ensure role is not empty
      formData.append('password', newUser.value.password);    // Ensure password is not empty
      if (newUser.value.image.file) {
        formData.append('image', newUser.value.image.file);
      }


      try {
        const response = await axios.post(`${apiURL}/add_user`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (response.data.success) {
          Swal.fire('Success', 'User added successfully!', 'success');
          document.querySelector('#add-users .btn-cancel').click();

        } else {
          Swal.fire('Error', response.data.error, 'error');
          document.querySelector('#add-users .btn-cancel').click();
        }


      } catch (error) {
        console.error('Error adding user:', error.message);
        console.error('Error adding user:', error.response.data.message || error.message);
      } finally {
        getUsers();
      }
    };

    const openEditModal = async (id) => {
      const response = await axios.get(`${apiURL}/get_user/${id}`);
      const user = response.data.user;
      editUser.value = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        birthdate:new Date(user.birthdate).toISOString().split("T")[0],
        role: user.role,
        status: user.status,
        login: user.login,
        logout: user.logout,
        image: { file: null, url: `${imageURL}${user.image}` },
        userStatus: user.userStatus || 'Disabled'
      };
      isOnline.value = user.status;
    };

  const updateUser = async () =>{
    if (editUser.value.password !== editUser.value.confPassword  ) {
        Swal.fire('Error', 'Passwords do not match', 'error');
        return;
      }


      const formData = new FormData();
      formData.append('firstName', editUser.value.firstName); 
      formData.append('lastName', editUser.value.lastName);   
      formData.append('email', editUser.value.email);        
      formData.append('phone', editUser.value.phone);      
      formData.append('birthdate', editUser.value.birthdate); 
      formData.append('role', editUser.value.role);           
      formData.append('imageRemoved' , editUser.isImageRemoved)
      formData.append('userStatus', editUser.value.userStatus);
 

      if (editUser.value.image.file) {
        formData.append('image', editUser.value.image.file);
      }
      console.log(editUser);

      try {
        const response = await axios.patch(`${apiURL}/edit_user/${editUser.value._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (response.data.success) {
          Swal.fire('Success', 'User udpated successfully!', 'success');
          document.querySelector('#edit-users .btn-cancel').click();

        } else {
          Swal.fire('Error', response.data.error, 'error');
          document.querySelector('#edit-users .btn-cancel').click();
        }


      } catch (error) {
        console.error('Error editing user:', error.message);
        console.error('Error editing user:', error.response.data.message || error.message);
      } finally {
        getUsers();
      }
    };

    const deleteUser = async (id) => {
            Swal.fire({
                title: 'Are you sure?',
                text: 'You are about to delete this user!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, delete it!',
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const response = await axios.delete(`${apiURL}/delete_user/${id}`, {
                            status: 'deleted',
                            deletedAt: Date.now(),
                        });
                        if (response.data.success) {
                            Swal.fire('Success', 'user deleted successfully!', 'success');
                            getUsers();
                        } else {
                            Swal.fire('Error', response.data.message, 'error');
                        }
                    } catch (error) {
                        Swal.fire('Error', 'Failed to delete user', 'error');
                    }
                }
            });
        };




    

    onMounted(async () => {
      await getUsers();
      feather.replace();
      initializeDataTable();
    });

    return {
      users,
      addUser,
      newUser,
      loading,
      removeImage,
      onFileChange,
      triggerFileInput,
      openEditModal,
      editUser,
      imageURL,
      isOnline,
      togglePassword,
      passwordVisible,
      updateUser,
      deleteUser


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

.status-wrapper {
  display: flex;
  align-items: center;
  font-size: 12px;
}

.status-text {
  font-weight: normal;
  font-size: 12px;
}

.status-container {
  display: flex;
  align-items: center;
  margin-left: 8px;
  /* Adds space between "Edit User" and status */
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
  /* Adds space between indicator and text */
}

.Online {
  background-color: #28a745;
  /* Green for Online */
}

.Offline {
  background-color: #dc3545;
  /* Red for Offline */
}
.table-cell td {
  overflow: hidden;         /* Hides the overflowing content */
  text-overflow: ellipsis;  /* Displays '...' for overflowed text */
  white-space: nowrap;      /* Prevents text from wrapping */
  max-width: 170px;         /* Sets a maximum width for the cell (optional) */
}
</style>