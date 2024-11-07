import Papa from 'papaparse';

export function csvToJson(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true, // Use the first row as the JSON keys
      skipEmptyLines: true, // Skip empty lines
      complete: (result) => {
        resolve(result.data); // Resolve the promise with the parsed JSON data
      },
      error: (error) => {
        reject(error); // Reject the promise with an error if parsing fails
      },
    });
  });
}