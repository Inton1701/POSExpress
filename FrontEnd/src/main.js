import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index.js';
import { loadScript } from './utils/loadScript';
import { disposeScript } from './utils/disposeScript';
import { exportToCSV } from './utils/exportCSV';
import { exportToPDF } from './utils/exportPDF';
import { formatDate } from './utils/formatDate';
import { showAlert } from '@/utils/alertService';
import { csvToJson } from '@/utils/importJSON';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';  // Import only needed icons
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import 'select2';
import 'slimscroll/lib/slimscroll.js';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';
import 'bootstrap'
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import $ from 'jquery';

// Initialize app
const app = createApp(App);

// Add only the required icons to the library
library.add(fas);

// Register global properties
app.config.globalProperties.$exportToCSV = exportToCSV;
app.config.globalProperties.$exportToPDF = exportToPDF;
app.config.globalProperties.$showAlert = showAlert;
app.config.globalProperties.$csvToJson = csvToJson;
app.config.globalProperties.$formatDate = formatDate;
window.$ = $;           // Attach jQuery to the global window object
window.jQuery = $; 




// Register FontAwesomeIcon component globally
app.component('font-awesome-icon', FontAwesomeIcon);

// Use router
app.use(router);

// Mount the app
app.mount('#app');
