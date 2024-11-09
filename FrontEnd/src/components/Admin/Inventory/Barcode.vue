<script>
import JsBarcode from 'jsbarcode';
import { onMounted, watch, ref } from 'vue';

export default {
  props: {
    sku: {
      type: String,
      default: '' // Ensure a default value to avoid undefined
    }
  },
  setup(props) {
    const svgRef = ref(null);
    const errorMessage = ref(''); // Ref to store error message
    const fallbackSku = '0000000000000'; // Default SKU for fallback barcode


    const calculateEAN13Checksum = (sku) => {
      const digits = sku.split('').map(Number);
      let sum = 0;

      for (let i = 0; i < 12; i++) {
        sum += (i % 2 === 0 ? digits[i] : digits[i] * 3);
      }


      const checksum = (10 - (sum % 10)) % 10;
      return checksum;
    };

    const generateBarcode = (sku) => {
      // Check if SKU exists and is a string with a length property
      if (!sku || typeof sku !== 'string') {
        console.error('Invalid SKU:', sku);
        errorMessage.value = 'Invalid SKU';
        // Generate a fallback barcode if SKU is invalid
        JsBarcode(svgRef.value, fallbackSku, {
          format: 'CODE128', // Alternative barcode format
          lineColor: '#000',
          width: 2,
          height: 50,
          displayValue: true
        });
        return;
      }
      
      // Pad or truncate SKU to ensure it’s exactly 13 characters for EAN-13 format
      if (sku.length < 13) {
        sku = sku.padStart(13, '0'); // Pad with leading zeros
      } else if (sku.length > 13) {
        sku = sku.slice(0, 13); // Truncate if longer than 13
      }

      // Ensure the SKU is numeric and exactly 13 digits long
      if (sku.length !== 13 || !/^\d{13}$/.test(sku)) {
        console.error('Invalid SKU format:', sku);
        errorMessage.value = 'Invalid SKU format: must be numeric and 13 digits.';
        // Generate a fallback barcode in this case as well
        JsBarcode(svgRef.value, fallbackSku, {
          format: 'CODE128', // Alternative barcode format
          lineColor: '#000',
          width: 2,
          height: 50,
          displayValue: true
        });
        return;
      }

      // Calculate the checksum and append it to the SKU if necessary
      const checksum = calculateEAN13Checksum(sku);
      sku = sku.slice(0, 12) + checksum; // Append checksum to the first 12 digits

      // Clear error message if valid SKU is detected
      errorMessage.value = '';

      // Generate the barcode using JsBarcode
      JsBarcode(svgRef.value, sku, {
        format: 'EAN13',
        lineColor: '#000',
        width: 2,
        height: 50,
        displayValue: true
      });
    };

    // Generate barcode on component mount
    onMounted(() => generateBarcode(props.sku));

    // Watch for SKU changes
    watch(() => props.sku, (newSku) => {
      generateBarcode(newSku);
    });

    return {
      svgRef,
      errorMessage
    };
  }
};
</script>


<template>
  <div>
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <svg ref="svgRef"></svg>
  </div>
</template>

<style scoped>
.error-message {
  color: red;
  font-weight: bold;
  margin-top: 10px;
}
</style>
