import { Parser } from 'json2csv';

export function exportToCSV(products, baseFilename) {
  try {
    if (!products || products.length === 0) {
      console.error('No data to export');
      return;
    }

    // Header with uppercase fields
    const fields = Object.keys(products[0]).map(field => field.toUpperCase());

    // Generate CSV data
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(products.map(product => {
      const upperCaseProduct = {};
      for (const key in product) {
        upperCaseProduct[key.toUpperCase()] = product[key];
      }
      return upperCaseProduct;
    }));

    // Create and download the CSV file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10); // Add the date
    const filename = `${baseFilename}_${date}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Error exporting CSV:', err);
  }
}
