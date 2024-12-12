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
                <tr v-for="user in users" :key="user._id">
                  <td>{{ user.firstName }} {{ user.lastName }}</td>
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
                      <a class="me-2 p-2" href="#" data-bs-toggle="modal" data-bs-target="#edit-user"
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

  <div>
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
                        <div class="profile-pic user-pic position-relative">
                          <span v-if="addUserImage">
                            <img :src="addUserImage" alt="" />
                          </span>
                          <span v-else><img src="/default-profile.png" alt="" /></span>
                          <button v-if="addUserImage" class="btn btn-sm btn-danger position-absolute top-0 end-0"
                            @click="removeAddUserImage">
                            Remove
                          </button>
                        </div>
                        <div class="image-upload mb-0">
                          <input type="file" id="add-user-logo" name="user_profile" @change="previewAddUserImage" />
                          <div class="image-uploads">
                            <h4>Change Image</h4>
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
<!-- 
    <div class="modal fade" id="edit-users">
      <div class="modal-dialog modal-dialog-centered custom-modal-two">
        <div class="modal-content">
          <div class="page-wrapper-new p-0">
            <div class="content">
              <div class="modal-header border-0 custom-modal-header">
                <div class="page-title">
                  <h4>Edit User</h4>
                </div>
                <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div class="modal-body custom-modal-body new-employee-field">
                <form id="editUserForm" enctype="multipart/form-data">
                  <div class="row">
                    <div class="col-lg-12">
                      <label class="form-label">User Profile</label>
                      <div class="profile-pic-upload mb-3">
                        <div class="profile-pic user-pic position-relative">
                          <span v-if="addUserImage"><img :src="addUserImage" alt="" /></span>
                          <span v-else><img src="/default-profile.png" alt="" /></span>
                          <button v-if="addUserImage" class="btn btn-sm btn-danger position-absolute top-0 end-0"
                            @click="removeAddUserImage">
                            Remove
                          </button>
                        </div>
                        <div class="image-upload mb-0">
                          <input type="file" id="add-user-logo" name="user_profile" @change="previewAddUserImage" />
                          <div class="image-uploads">
                            <h4>Change Image</h4>
                          </div>
                        </div>
                      </div>
                    </div>
                    Other Input Fields -->
                  <!-- </div>
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
    </div>-->
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
    const users = ref([]);
    const loading = ref(false);

    const addUserImage = ref(null);

    const newUser = ref({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      birthdate: '',
      role: 'Cashier',
      password: '',
      confPassword: '',
    });
    // const editUser = ref({
    //   firstName: '',
    //   lastName: '',
    //   phone: '',
    //   email: '',
    //   birthdate: '',
    //   role: '',
    //   password: '',
    //   confPassword: '',
    //   status: '',
    // });

    const editUserImage = ref(null);

    const previewAddUserImage = (event) => {
      const file = event.target.files[0];
      if (file) {
        addUserImage.value = URL.createObjectURL(file);
      }
    };

    const removeAddUserImage = () => {
      addUserImage.value = null;
      document.getElementById('add-user-logo').value = '';
      nextTick(() => feather.replace());
    };

    const previewEditUserImage = (event) => {
      const file = event.target.files[0];
      if (file) {
        editUserImage.value = URL.createObjectURL(file);
        nextTick(() => feather.replace());
      }
    };

    const removeEditUserImage = () => {
      editUserImage.value = null;
      document.getElementById('edit-user-logo').value = '';
      nextTick(() => feather.replace());
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
      if (addUserImage.value) {
        formData.append('image', addUserImage.value);
      }


      try {
        const response = await axios.post(`${apiURL}/add_user`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (response.data.success) {
          Swal.fire('Success', 'User added successfully!', 'success');
          document.querySelector('#add-user .btn-cancel').click();

        } else {
          Swal.fire('Error', response.data.error, 'error');
          document.querySelector('#add-user .btn-cancel').click();
        }


      } catch (error) {
        console.error('Error adding user:', error.message);
        console.error('Error adding user:', error.response.data.message || error.message);
      } finally {
        getUsers();
      }
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
      addUserImage,
      editUserImage,
      previewAddUserImage,
      removeAddUserImage,
      previewEditUserImage,
      removeEditUserImage,
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