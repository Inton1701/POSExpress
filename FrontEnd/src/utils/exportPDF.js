import jsPDF from 'jspdf';
import 'jspdf-autotable';

function formatDate(date) {
  const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
  return new Intl.DateTimeFormat('en-US', options).format(date).replace(/[/, :]/g, '-'); // Replace slashes and colons for safe filenames
}

export function exportToPDF(header, products, filenamePrefix = 'PosExpress') {
  if (!products || products.length === 0) {
    console.error('No products to export');
    return;
  }

  const doc = new jsPDF();

  // Set up PDF headers
  const headers = Object.keys(products[0]).map((key) => ({
    title: key.toUpperCase(),
    dataKey: key,
  }));

  // Generate a formatted date string
  const timestamp = formatDate(new Date());
  const filename = `${filenamePrefix}-${timestamp}.pdf`; // Use the prefix and timestamp for the filename

  doc.text(header, 14, 10); // Title

  // Generate table with headers and body data
  doc.autoTable({
    head: [headers.map(header => header.title)], // Use titles for column headers
    body: products.map(product => headers.map(header => product[header.dataKey])), // Populate each row based on dataKey
    startY: 20, // Vertical offset from top
    theme: 'grid',
  });

  doc.save(filename);
}
