export function disposeScript() {
    console.log("Cleaning up...");
  
    // Cleanup DataTables
    if ($.fn.DataTable) {
      // Destroy all DataTables
      $('.dataTable').each(function() {
        if ($.fn.DataTable.isDataTable(this)) {
          $(this).DataTable().destroy();
        }
      });
    }
  
    // Cleanup Select2
    if ($.fn.select2) {
      const selectElements = $('.select2');
  
      selectElements.each(function() {
        // Check if this element has been initialized with Select2
        if ($(this).hasClass('select2-hidden-accessible')) {
          $(this).select2('destroy'); // Only destroy if initialized
        }
      });
    }
  
    console.log("Cleanup completed.");
  }