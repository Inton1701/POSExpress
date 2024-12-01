export const modalController = {
    /**
     * Show a modal by its ID.
     * @param {string} modalId - The ID of the modal to show.
     */
    show(modalId) {
      const modalElement = document.getElementById(modalId);
      if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      } else {
        console.error(`Modal with ID "${modalId}" not found.`);
      }
    },
  
    /**
     * Hide a modal by its ID.
     * @param {string} modalId - The ID of the modal to hide.
     */
    hide(modalId) {
      const modalElement = document.getElementById(modalId);
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        } else {
          console.error(`No Bootstrap instance found for modal with ID "${modalId}".`);
        }
      } else {
        console.error(`Modal with ID "${modalId}" not found.`);
      }
    },
    focus(modalId){
        const modalElement = document.getElementById(modalId);
        modalElement.addEventListener('shown.bs.modal', () => {
                const inputField = modalElement.querySelector('input');
                if (inputField) {
                  inputField.focus();
                }
    })
    }
  };
  