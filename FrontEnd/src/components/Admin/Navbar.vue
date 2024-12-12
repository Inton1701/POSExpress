<template>

  <div class="main-wrapper">
    <div class="header">
      <div class="header-left active">
        <a href="#" class="logo logo-normal">
          <img src="assets/img/logo.png" alt />
        </a>
        <a href="index.html" class="logo logo-white">
          <img src="assets/img/logo-white.png" alt />
        </a>
        <a href="index.html" class="logo-small">
          <img src="assets/img/logo-small.png" alt />
        </a>
        <a id="toggle_btn" href="javascript:void(0);">
          <i data-feather="chevrons-left" class="feather-16"></i>
        </a>
      </div>
      <a id="mobile_btn" class="mobile_btn" href="#sidebar">
        <span class="bar-icon">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </a>
      <ul class="nav user-menu">
        <li class="nav-item nav-searchinputs">

        </li>
        <li class="nav-item nav-item-box">
          <a href="#" type="button" @click="toggleFullScreen" id="btnFullscreen">

            <font-awesome-icon v-if="!isFullScreen" icon="expand" style="color: #56c49b;" />

          </a>
        </li>
        <li class="nav-item dropdown nav-item-box">
          <a href="javascript:void(0);" class="dropdown-toggle nav-link" data-bs-toggle="dropdown">
            <i data-feather="bell"></i><span class="badge rounded-pill">2</span>
          </a>
          <div class="dropdown-menu notifications">
            <div class="topnav-dropdown-header">
              <span class="notification-title">Notifications</span>
              <a href="javascript:void(0)" class="clear-noti"> Clear All </a>
            </div>
            <div class="noti-content">
              <ul class="notification-list">
                <li class="notification-message">
                  <a href="activities.html">
                    <div class="media d-flex">
                      <span class="avatar flex-shrink-0">
                        <img alt src="assets/img/profiles/avatar-13.jpg" />
                      </span>
                      <div class="media-body flex-grow-1">
                        <p class="noti-details">
                          <span class="noti-title">Bernardo Galaviz</span>
                          added new task
                          <span class="noti-title">Private chat module</span>
                        </p>
                        <p class="noti-time">
                          <span class="notification-time">2 days ago</span>
                        </p>
                      </div>
                    </div>
                  </a>
                </li>
              </ul>
            </div>
            <div class="topnav-dropdown-footer">
              <a href="activities.html">View all Notifications</a>
            </div>
          </div>
        </li>

        <li class="nav-item nav-item-box">
          <a href="general-settings.html"><i data-feather="settings"></i></a>
        </li>
        <li class="nav-item dropdown has-arrow main-drop">
          <a href="javascript:void(0);" class="dropdown-toggle nav-link userset" data-bs-toggle="dropdown">
            <span class="user-info">
              <span class="user-letter">
                <img src="assets/img/profiles/avator1.jpg" alt class="img-fluid" />
              </span>
              <span class="user-detail">
                <span class="user-name">Ariston Pogi</span>
                <span class="user-role">Super Admin</span>
              </span>
            </span>
          </a>
          <div class="dropdown-menu menu-drop-user">
            <div class="profilename">
              <div class="profileset">
                <span class="user-img"><img src="assets/img/profiles/avator1.jpg" alt />
                  <span class="status online"></span></span>
                <div class="profilesets">
                  <h6>Ariston Pogi</h6>
                  <h5>Super Admin</h5>
                </div>
              </div>
              <hr class="m-0" />
              <a class="dropdown-item" href="profile.html">
                <i class="me-2" data-feather="user"></i> My Profile</a>
              <a class="dropdown-item" href="general-settings.html"><i class="me-2"
                  data-feather="settings"></i>Settings</a>
              <hr class="m-0" />
              <a class="dropdown-item logout pb-0" href="signin.html"><img src="/src/assets/img/icons/log-out.svg"
                  class="me-2" alt="img" />Logout</a>
            </div>
          </div>
        </li>
      </ul>

      <div class="dropdown mobile-user-menu">
        <a href="javascript:void(0);" class="nav-link dropdown-toggle" data-bs-toggle="dropdown"
          aria-expanded="false"><i class="fa fa-ellipsis-v"></i></a>
        <div class="dropdown-menu dropdown-menu-right">
          <a class="dropdown-item" href="profile.html">My Profile</a>
          <a class="dropdown-item" href="general-settings.html">Settings</a>
          <a class="dropdown-item" href="signin.html">Logout</a>
        </div>
      </div>

    </div>

    <div class="sidebar" id="sidebar">
      <div class="sidebar-inner slimscroll">
        <div id="sidebar-menu" class="sidebar-menu">
          <ul>
            <li class="submenu-open">
              <h6 class="submenu-hdr">Main</h6>
              <ul>

                <ul>
                  <li>
                    <router-link to="/"><i data-feather="grid"></i><span>Admin Dashboard</span></router-link>
                  </li>
                </ul>


              </ul>
            </li>
            <li class="submenu-open">
              <h6 class="submenu-hdr">Inventory</h6>
              <ul>
                <li>
                  <router-link to="/products"><i data-feather="box"></i><span>Products</span></router-link>
                </li>
                <li>
                  <router-link to="/create-product"><i data-feather="plus-square"></i><span>Create
                      Product</span></router-link>
                </li>

                <li>
                  <router-link to="/manage-stocks"><i data-feather="package"></i><span>Manage Stock</span></router-link>
                </li>
                <li>
                  <router-link to="/category"><i data-feather="codepen"></i><span>Category</span></router-link>
                </li>

                <li>
                  <router-link to="/brands"><i data-feather="tag"></i><span>Brands</span></router-link>
                </li>
                <li>
                  <router-link to="/units"><i data-feather="speaker"></i><span>Units</span></router-link>
                </li>

              </ul>
            </li>
      
            <li class="submenu-open">
              <h6 class="submenu-hdr">Sales</h6>
              <ul>

                <li>
                  <router-link to="transactions"><i data-feather="file-text"></i><span>Transactions</span></router-link>
                </li>
                <li>
                  <a href="returns"><i data-feather="copy"></i><span>Sales Return</span></a>
                </li>
                <li>
                  <a href="voids"><i data-feather="alert-octagon"></i><span>Voids</span></a>
                </li>
                <li>
                  <a href="pos"><i data-feather="hard-drive"></i><span>POS</span></a>
                </li>
              </ul>
            </li>
            <li class="submenu-open">
              <h6 class="submenu-hdr">Promo</h6>
              <ul>
                <li>
                  <a href="coupons"><i data-feather="shopping-cart"></i><span>Coupons</span></a>
                </li>
              </ul>
            </li>
            <li class="submenu-open">
              <h6 class="submenu-hdr">Peoples</h6>
              <ul>
                <li>
                  <router-link to="customers"><i data-feather="user"></i><span>Customers</span></router-link>
                </li>
                <li>
                  <router-link to="staffs"><i data-feather="users"></i><span>Staffs</span></router-link>
                </li>
              </ul>
            </li>



            <li class="submenu-open">
              <h6 class="submenu-hdr">Settings</h6>
              <ul>
                <li class="submenu">
                  <a href="javascript:void(0);"><i data-feather="settings"></i><span>Settings</span></a>
      
                </li>


                <li>
                  <a href="logout"><i data-feather="log-out"></i><span>Logout</span>
                  </a>
                </li>
              </ul>
            </li>

          </ul>
        </div>
      </div>
    </div>
  </div>


</template>
<script>
import { ref, onMounted, nextTick } from 'vue';
import feather from 'feather-icons';

export default {
  name: 'Navbar',
  setup() {
    const isFullScreen = ref(false);

    const toggleFullScreen = async () => {
      try {
        if (!document.fullscreenElement) {

          await document.documentElement.requestFullscreen();
          isFullScreen.value = true;

        } else {
          await document.exitFullscreen();
          isFullScreen.value = false;
        }





      } catch (err) {
        console.error(`Error attempting to change fullscreen mode: ${err.message}`);
      }
    };

    onMounted(() => {
      feather.replace();
    });

    return {
      isFullScreen,
      toggleFullScreen
    };
  }
};
</script>
<style scoped>
.sidebar {
  overflow-y: auto; /* Enables vertical scrolling */
  max-height: 100vh; /* Ensures it doesn't exceed the viewport height */
}
</style>