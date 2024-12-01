import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Format date function for filenames
function formatDate(date) {
  const options = { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  };
  return new Intl.DateTimeFormat('en-US', options).format(date).replace(/[/, :]/g, '-'); // Safe filename format
}

// Function to export data to PDF
export function exportToPDF(header, products, filenamePrefix = 'PosExpress') {
  if (!products || products.length === 0) {
    console.error('No products to export');
    return;
  }

  // Create jsPDF instance with landscape orientation
  const doc = new jsPDF('landscape'); // 'landscape' orientation

  // Set the font size to be smaller
  doc.setFontSize(8); // Set font size to 8, you can adjust this as needed

  // Set up PDF headers
  const headers = Object.keys(products[0]).map((key) => ({
    title: key.toUpperCase(),
    dataKey: key,
  }));

  // Generate a formatted date string for the filename
  const timestamp = formatDate(new Date());
  const filename = `${filenamePrefix}-${timestamp}.pdf`; // Filename with prefix and timestamp

  // Add header text
  doc.text(header, 14, 10); // Title at position (14, 10)

  // Add the table with the data
  doc.autoTable({
    head: [headers.map(header => header.title)], // Column headers
    body: products.map(product => headers.map(header => product[header.dataKey])), // Rows based on dataKey
    startY: 20, // Table starts 20 units below the title
    theme: 'grid', // Table theme
    styles: {
      fontSize: 8, // Ensure font size is set for table data
      cellWidth: 'auto', // Cells adjust to content size
      overflow: 'linebreak', // Enable line wrapping
    }
  });

  // Save the PDF with the generated filename
  doc.save(filename);
}
