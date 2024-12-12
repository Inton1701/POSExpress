<template>
  <Navbar/>
  <div class="page-wrapper">
    <div class="content settings-content">
      <div class="page-header settings-pg-header">
        <div class="add-item d-flex">
          <div class="page-title">
            <h4>Settings</h4>
            <h6>Manage your settings on portal</h6>
          </div>
        </div>
        <ul class="table-top-head">
          <li>
            <a data-bs-toggle="tooltip" data-bs-placement="top" title="Refresh"><i data-feather="rotate-ccw"
                class="feather-rotate-ccw"></i></a>
          </li>
          <li>
            <a data-bs-toggle="tooltip" data-bs-placement="top" title="Collapse" id="collapse-header"><i
                data-feather="chevron-up" class="feather-chevron-up"></i></a>
          </li>
        </ul>
      </div>
      <div class="row">
        <div class="col-xl-12">
          <div class="settings-wrapper d-flex">
            <div class="sidebars settings-sidebar theiaStickySidebar" id="sidebar2">
              <div class="sidebar-inner slimscroll">
                <div id="sidebar-menu5" class="sidebar-menu">
                  <ul>
                    <li class="submenu-open">
                      <ul>
                        <li class="submenu">
                          <a href="javascript:void(0);"><i data-feather="settings"></i><span>General
                              Settings</span><span class="menu-arrow"></span></a>
                          <ul>
                            <li>
                              <a href="general-settings.html">Profile</a>
                            </li>
                            <li>
                              <a href="security-settings.html">Security</a>
                            </li>
                            <li>
                              <a href="notification.html">Notifications</a>
                            </li>
                            <li>
                              <a href="connected-apps.html">Connected Apps</a>
                            </li>
                          </ul>
                        </li>
                        <li class="submenu">
                          <a href="javascript:void(0);"><i data-feather="airplay"></i><span>Website Settings</span><span
                              class="menu-arrow"></span></a>
                          <ul>
                            <li>
                              <a href="system-settings.html">System Settings</a>
                            </li>
                            <li>
                              <a href="company-settings.html">Company Settings
                              </a>
                            </li>
                            <li>
                              <a href="localization-settings.html">Localization</a>
                            </li>
                            <li><a href="prefixes.html">Prefixes</a></li>
                            <li>
                              <a href="preference.html">Preference</a>
                            </li>
                            <li>
                              <a href="appearance.html">Appearance</a>
                            </li>
                            <li>
                              <a href="social-authentication.html">Social Authentication</a>
                            </li>
                            <li>
                              <a href="language-settings.html">Language</a>
                            </li>
                          </ul>
                        </li>
                        <li class="submenu">
                          <a href="javascript:void(0);" class="active subdrop"><i data-feather="archive"></i><span>App
                              Settings</span><span class="menu-arrow"></span></a>
                          <ul>
                            <li>
                              <a href="invoice-settings.html" class="active">Invoice</a>
                            </li>
                            <li>
                              <a href="printer-settings.html">Printer </a>
                            </li>
                            <li><a href="pos-settings.html">POS</a></li>
                            <li>
                              <a href="custom-fields.html">Custom Fields</a>
                            </li>
                          </ul>
                        </li>
                        <li class="submenu">
                          <a href="javascript:void(0);"><i data-feather="server"></i><span>System Settings</span><span
                              class="menu-arrow"></span></a>
                          <ul>
                            <li><a href="email-settings.html">Email</a></li>
                            <li>
                              <a href="sms-gateway.html">SMS Gateways</a>
                            </li>
                            <li><a href="otp-settings.html">OTP</a></li>
                            <li>
                              <a href="gdpr-settings.html">GDPR Cookies</a>
                            </li>
                          </ul>
                        </li>
                        <li class="submenu">
                          <a href="javascript:void(0);"><i data-feather="credit-card"></i><span>Financial
                              Settings</span><span class="menu-arrow"></span></a>
                          <ul>
                            <li>
                              <a href="payment-gateway-settings.html">Payment Gateway</a>
                            </li>
                            <li>
                              <a href="bank-settings-grid.html">Bank Accounts
                              </a>
                            </li>
                            <li><a href="tax-rates.html">Tax Rates</a></li>
                            <li>
                              <a href="currency-settings.html">Currencies</a>
                            </li>
                          </ul>
                        </li>
                        <li class="submenu">
                          <a href="javascript:void(0);"><i data-feather="layout"></i><span>Other Settings</span><span
                              class="menu-arrow"></span></a>
                          <ul>
                            <li>
                              <a href="storage-settings.html">Storage</a>
                            </li>
                            <li>
                              <a href="ban-ip-address.html">Ban IP Address
                              </a>
                            </li>
                          </ul>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="settings-page-wrap">
              <form action="invoice-settings.html">
                <div class="setting-title">
                  <h4>Invoice Settings</h4>
                </div>
                <div class="company-info border-0">
                  <ul class="logo-company">
                    <li>
                      <div class="row">
                        <div class="col-md-4">
                          <div class="logo-info me-0 mb-3 mb-md-0">
                            <h6>Invoice Logo</h6>
                            <p>
                              Upload Logo of your Company to display in
                              Invoice
                            </p>
                          </div>
                        </div>
                        <div class="col-md-6">
                          <div class="profile-pic-upload mb-0 me-0">
                            <div class="new-employee-field">
                              <div class="mb-3 mb-md-0">
                                <div class="image-upload mb-0">
                                  <input type="file" />
                                  <div class="image-uploads">
                                    <h4>
                                      <i data-feather="upload"></i>Upload
                                      Photo
                                    </h4>
                                  </div>
                                </div>
                                <span>For better preview recommended size is
                                  450px x 450px. Max size 5mb.</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="col-md-2">
                          <div class="new-logo ms-auto">
                            <a href="#"><img src="assets/img/logo-small.png" alt="Logo" /></a>
                          </div>
                        </div>
                      </div>
                    </li>
                  </ul>
                  <div class="localization-info">
                    <div class="row align-items-center">
                      <div class="col-sm-4">
                        <div class="setting-info">
                          <h6>Invoice Prefix</h6>
                          <p>Add prefix to your invoice</p>
                        </div>
                      </div>
                      <div class="col-sm-4">
                        <div class="localization-select">
                          <input type="text" class="form-control" value="INV -" />
                        </div>
                      </div>
                    </div>
                    <div class="row align-items-center">
                      <div class="col-sm-4">
                        <div class="setting-info">
                          <h6>Invoice Due</h6>
                          <p>Select due date to display in Invoice</p>
                        </div>
                      </div>
                      <div class="col-sm-4">
                        <div class="localization-select d-flex align-items-center fixed-width">
                          <select class="select">
                            <option>5</option>
                            <option>6</option>
                            <option>7</option>
                          </select>
                          <span class="ms-2">Days</span>
                        </div>
                      </div>
                    </div>
                    <div class="row align-items-center">
                      <div class="col-sm-4">
                        <div class="setting-info">
                          <h6>Invoice Round Off</h6>
                          <p>Value Roundoff in Invoice</p>
                        </div>
                      </div>
                      <div class="col-sm-4">
                        <div class="localization-select d-flex align-items-center width-custom">
                          <div
                            class="status-toggle modal-status d-flex justify-content-between align-items-center me-3">
                            <input type="checkbox" id="user3" class="check" checked />
                            <label for="user3" class="checktoggle"></label>
                          </div>
                          <select class="select">
                            <option>Round Off Up</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div class="row align-items-center">
                      <div class="col-sm-4">
                        <div class="setting-info">
                          <h6>Show Company Details</h6>
                          <p>Show / Hide Company Details in Invoice</p>
                        </div>
                      </div>
                      <div class="col-sm-4">
                        <div class="localization-select d-flex align-items-center">
                          <div
                            class="status-toggle modal-status d-flex justify-content-between align-items-center me-3">
                            <input type="checkbox" id="user4" class="check" checked />
                            <label for="user4" class="checktoggle"></label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="row">
                      <div class="col-sm-4">
                        <div class="setting-info">
                          <h6>Invoice Header Terms</h6>
                        </div>
                      </div>
                      <div class="col-sm-8">
                        <div class="mb-3">
                          <textarea rows="4" class="form-control" placeholder="Type your message"></textarea>
                        </div>
                      </div>
                    </div>
                    <div class="row">
                      <div class="col-sm-4">
                        <div class="setting-info">
                          <h6>Invoice Footer Terms</h6>
                        </div>
                      </div>
                      <div class="col-sm-8">
                        <div class="mb-3">
                          <textarea rows="4" class="form-control" placeholder="Type your message"></textarea>
                        </div>
                      </div>
                    </div>
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
import { useRouter } from 'vue-router';
import axios from 'axios';
import { exportToCSV } from '@/utils/exportCSV';
import { exportToPDF } from '@/utils/exportPDF';
import Papa from 'papaparse';
import 'select2';
import feather from 'feather-icons';
import ClipLoader from 'vue-spinner/src/ClipLoader.vue';
import Swal from 'sweetalert2';
import Navbar from '/src/components/Admin/Navbar.vue';
import $ from 'jquery';

export default {
  components: {
    Navbar,
    ClipLoader,
  },
  setup() { }
}
</script>