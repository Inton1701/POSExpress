import Swal from 'sweetalert2';

export function showAlert({
  title = '',
  text = '',
  icon = 'info',
  confirmButtonText = 'OK',
  showCancelButton = false,
  cancelButtonText = 'Cancel',
} = {}) {
  return Swal.fire({
    title,
    text,
    icon,
    confirmButtonText,
    showCancelButton,
    cancelButtonText,
  });
}
