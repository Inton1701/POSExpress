import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index.js';
import { loadScript } from './utils/loadScript';
import { disposeScript } from './utils/disposeScript';
import { exportToCSV } from './utils/exportCSV';
import { exportToPDF } from './utils/exportPDF';
import { showAlert } from '@/utils/alertService';
import { csvToJson } from '@/utils/importJSON';

import 'select2';

const app = createApp(App);


app.config.globalProperties.$exportToCSV = exportToCSV;
app.config.globalProperties.$exportToPDF = exportToPDF;
app.config.globalProperties.$showAlert = showAlert;
app.config.globalProperties.$csvToJson = csvToJson;

// Handle scripts loading on route changes
// router.afterEach(async () => {
//   try {
//     disposeScript(); 
//     await loadScript('./assets/js/script.js'); 
//   } catch (error) {
//     console.error(error);
//   }
// });

app.use(router);
app.mount('#app');
