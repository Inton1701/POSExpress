<script>
import JsBarcode from 'jsbarcode';
import { onMounted, watch, ref, nextTick } from 'vue';

export default {
  props: {
    sku: {
      type: String,
      default: ''
    },
    productName: {
      type: String,
      default: 'Product Name'
    },
    format: {
      type: String,
      default: 'EAN13'
    },
    lineColor: {
      type: String,
      default: '#000000'
    },
    width: {
      type: Number,
      default: 4
    },
    height: {
      type: Number,
      default: 100
    }
  },
  setup(props) {
    const svgRef = ref(null);
    const errorMessage = ref('');
    const showProductName = ref(true);

    const generateBarcode = async (sku) => {
      try {
        if (!sku || typeof sku !== 'string') {
          throw new Error('Invalid SKU: Must be a string.');
        }

        // Validate based on barcode format (e.g., EAN13 requires 13 digits)
        if (props.format === 'EAN13' && (!/^\d{13}$/.test(sku))) {
          throw new Error('Invalid EAN13 SKU: Must be 13 numeric digits.');
        }

        errorMessage.value = '';
        await nextTick();

        // Generate barcode directly from the user input
        JsBarcode(svgRef.value, sku, {
          format: props.format,
          lineColor: props.lineColor,
          width: props.width,
          height: props.height,
          displayValue: true
        });
      } catch (error) {
        console.error(error.message);
        errorMessage.value = error.message;

        // Display fallback barcode if input is invalid
        JsBarcode(svgRef.value, '0000000000000', {
          format: 'CODE128',
          lineColor: props.lineColor,
          width: props.width,
          height: props.height,
          displayValue: true
        });
      }
    };

    const downloadBarcode = () => {
      const svg = svgRef.value;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height + (showProductName.value ? 30 : 0);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(img, 0, 0);

        if (showProductName.value) {
          ctx.font = 'bold 20px  Courier New';
          ctx.fillStyle = 'black';
          ctx.textAlign = 'center';
          ctx.fillText(props.productName, canvas.width / 2, img.height + 20);
        }

        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `${props.productName}_barcode.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    };

    onMounted(() => generateBarcode(props.sku));
    watch(
      () => props.sku,
      (newSku) => {
        generateBarcode(newSku);
      }
    );

    return {
      svgRef,
      errorMessage,
      downloadBarcode,
      showProductName
    };
  }
};
</script>

<template>
  <div class="row px-5">
    <div class="row">
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      <svg ref="svgRef"></svg>
      <div v-if="showProductName" class="product-name text-center">{{ productName }}</div>
    </div>
    <div class="row ps-4 pe-3">
      <button class="btn btn-primary fs-6" @click="downloadBarcode">
        <span>Download </span>
        <font-awesome-icon icon="download" style="color: #ffffff;" />
      </button>
    </div>
    <!-- Toggle for controlling visibility of the product name -->
    <div class="row">
      <label class="show-name-label">
  <input type="checkbox" v-model="showProductName" />
  <span class="text-secondary">Show Product Name</span>
</label>
   
    </div>
  </div>
</template>

<style scoped>
.error-message {
  color: red;
  font-weight: bold;
  margin-top: 10px;
}

.product-name {
  display: flex;
  font-family: 'Roboto Mono', 'Courier New', monospace;
  justify-content: center;
  align-items: center;
  text-align: center;
  font-size: 16px;
  margin-top: 5px;
  margin-left: auto;
  margin-right: auto;
  color: black;
  font-weight: bold;
  word-break: break-word;
  max-width: 80%;
}
.show-name-label {
  display: flex;
  align-items: center;
}

.show-name-label input {
  margin-right: 8px;
}
</style>