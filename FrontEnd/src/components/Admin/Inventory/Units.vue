<template>
  <Navbar />
  <div class="page-wrapper">

      <div class="content">
          <div class="page-header">
              <div class="add-item d-flex">
                  <div class="page-title">
                      <h4>Units</h4>
                      <h6>Manage your product units</h6>
                  </div>
              </div>
              <div class="page-btn">
                  <a href="#" class="btn btn-added" data-bs-toggle="modal" data-bs-target="#add-units">
                      <i data-feather="plus-circle" class="me-2"></i>Add New Units</a>
              </div>
          </div>
          <div class="card table-list-card">
              <div class="card-body">
                  <div class="table-responsive">
                    <ClipLoader v-if="loading" />
                      <table v-else class="table datanew" id="unit-table">
                          <thead>
                              <tr>
                                  <th>Units</th>
                                  <th>Short Name</th>
                                  <th>Created On</th>
                                  <th>Status</th>
                                  <th class="no-sort">Action</th>
                              </tr>
                          </thead>
                          <tbody>

                              <tr v-if="units.length <= 0">
                                  <td colspan="8">No products available</td>
                              </tr>
                              <tr v-else v-for="unit in units" :key="unit.id">
                                  <td>{{ unit.name }}</td>
                                  <td>{{ unit.shortname }}</td>
                                  <td>{{ $formatDate(unit.createdAt) }}</td>
                                  <td>

                                      <span :class="{
                                          'badge': true,
                                          'badge-linesuccess': unit.status === 'active',
                                          'badge-linewarning': unit.status === 'inactive'
                                      }">
                                          {{ unit.status }}
                                      </span>
                                  </td>

                                  <td class="action-table-data">
                                      <div class="edit-delete-action">
                                          <a class="me-2 p-2" href="#" data-bs-toggle="modal"
                                              data-bs-target="#edit-units" @click="openEditModal(unit._id)">
                                              <i data-feather="edit" class="feather-edit"></i>
                                          </a>
                                          <a class="confirm-text p-2" href="javascript:void(0);"
                                              @click="deleteUnits(unit._id)">
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

  <!-- Add units Modal -->
  <div class="modal fade" id="add-units">
      <div class="modal-dialog modal-dialog-centered custom-modal-two">
          <div class="modal-content">
              <div class="modal-header border-0 custom-modal-header">
                  <div class="page-title">
                      <h4>Create units</h4>
                  </div>
                  <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                      <span aria-hidden="true">&times;</span>
                  </button>
              </div>
              <div class="modal-body custom-modal-body">
                  <form @submit.prevent="addUnits">
                      <div class="mb-3">
                          <label class="form-label">units</label>
                          <input type="text" class="form-control" v-model="newUnits.name" required />
                      </div>
                      <div class="mb-3">
                          <label class="form-label">short name</label>
                          <input type="text" class="form-control" v-model="newUnits.shortname" required />
                      </div>
                      <div class="mb-0">
                          <div class="status-toggle modal-status d-flex justify-content-between">
                              <span class="form-label">{{ newUnits.status }}</span>
                              <input type="checkbox" id="add-units-status" class="check"
                                  v-model="newUnits.status" :true-value="'active'" :false-value="'inactive'" />
                              <label for="add-units-status" class="checktoggle"></label>
                          </div>
                      </div>
                      <div class="modal-footer-btn">
                          <button type="button" class="btn btn-cancel me-2" data-bs-dismiss="modal">Cancel</button>
                          <button type="submit" class="btn btn-submit">Create units</button>
                      </div>
                  </form>
              </div>
          </div>
      </div>
  </div>

  <!-- Edit units Modal -->
  <div class="modal fade" id="edit-units">
      <div class="modal-dialog modal-dialog-centered ">
          <div class="modal-content">
              <div class="modal-header border-0">
                  <div class="page-title">
                      <h4>Edit units</h4>
                  </div>
                  <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                      <span aria-hidden="true">&times;</span>
                  </button>
              </div>
              <div class="modal-body ">
                  <form @submit.prevent="updateUnits">
                      <div class="mb-3">
                          <label class="form-label">units</label>
                          <input type="text" class="form-control" v-model="editUnits.name" required />
                      </div>
                      <div class="mb-3">
                          <label class="form-label">short name</label>
                          <input type="text" class="form-control" v-model="editUnits.shortname" required />
                      </div>
                      <div class="mb-0">
                          <div class="status-toggle modal-status d-flex justify-content-between">
                              <span class="form-label">{{ editUnits.status }}</span>
                              <input type="checkbox" id="edit-units-status" class="check"
                                  v-model="editUnits.status" :true-value="'active'" :false-value="'inactive'" />
                              <label for="edit-units-status" class="checktoggle"></label>
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
import { ref, onMounted, onBeforeMount,nextTick } from 'vue';
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
    const units = ref([]);
    const newUnits = ref({
      name: '',
      shortname: '',
      status: 'inactive'
    });
    const editUnits = ref({
      _id: null,
      name: '',
      shortname: '',
      status: 'inactive'
    });
      const loading = ref(true);


      const initializeDataTable = () => {
            const tableElement = $('#unit-table');

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
            const table = $('#unit-table').DataTable();
            table.destroy();
            initializeDataTable();
        };


      const getUnits = async () => {
          loading.value = true;
          try {
              const response = await axios.get(`${apiURL}/get_units_list`);
              units.value = response.data.unitList;
              if (!response.data.success) {
                  Swal.fire('Error', response.data.message, 'errror');
              }else{
                nextTick(() => refreshDataTable());
              }
          } catch (error) {
              console.error(error);
              Swal.fire('Error', 'Unable to fetch units', 'error');
          }
          finally {
              loading.value = false;
          }
      };



      const addUnits = async () => {
          try {
              const response = await axios.post(`${apiURL}/add_units`, newUnits.value);

              if (response.data.success) {
                  Swal.fire('Success', 'units added successfully!', 'success');

                  document.querySelector('#add-units .btn-cancel').click();
                 

              } else {
                  Swal.fire('Error', response.data.message || 'Failed to add units', 'error');
                  
                  document.querySelector('#add-units .btn-cancel').click();
              }
              getUnits();
          } catch (error) {
              console.error(error);
              const errorMessage = error.response?.data?.message || 'An unexpected error occurred';
              Swal.fire('Error', errorMessage, 'error');
          }
        //   getUnits();
      };

      const openEditModal = async (id) => {
          const response = await axios.get(`${apiURL}/get_unit/${id}`);
          editUnits.value = response.data.unit;
      };
      const toggleStatus = (data, event) => {
          data.status = event.target.checked ? 'active' : 'inactive';
      };

      const updateUnits = async () => {
          try {
              const response = await axios.patch(`${apiURL}/edit_unit/${editUnits.value._id}`, editUnits.value);
              if (!response.data.success) {
                  Swal.fire('Error', response.data.message, 'error');
              } else {
                  Swal.fire('Success', 'units updated successfully!', 'success');
              }
              document.querySelector('#edit-units .btn-cancel').click();
              getUnits();

          } catch (error) {
              console.error(error);
              Swal.fire('Error', 'Failed to update units', 'error');
          }
      };

      const deleteUnits = async (id) => {
          Swal.fire({
              title: 'Are you sure?',
              text: 'You are about to delete this units!',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Yes, delete it!',
          }).then(async (result) => {
              if (result.isConfirmed) {
                  try {
                      const response = await axios.patch(`${apiURL}/edit_unit/${id}`, { status: 'deleted', deletedAt: Date.now()});
                      if(response.data.success) {
                          Swal.fire('Deleted!', 'units has been deleted.', 'success');
                      }else{
                          Swal.fire('Error', response.data.message, 'error');
                      }
                     
                      getUnits();
                  } catch (error) {
                      console.error(error);
                      Swal.fire('Error', 'Failed to delete units', 'error');
                  }
              }
          });
      };


      onMounted(async () => {
          try {
              await nextTick()
              await getUnits();
         
              initializeDataTable();
              await feather.replace();
    
          } catch (error) {
              console.log(error);
          }
      });
      onBeforeMount(async () => {
          try {
              await getUnits();
             feather.replace();
           

          } catch (error) {
              console.error(error);
          }
      })

      return {
          units,
          newUnits,
          editUnits,
          getUnits,
          addUnits,
          openEditModal,
          updateUnits,
          deleteUnits,
          toggleStatus,
          loading,
          imageURL,
          apiURL,

      };
  },
};
</script>
