<template>
    <div id="receipt-area">
      <div class="receipt">
        <h2>Store Name</h2>
        <p>Date: {{ transaction.date }}</p>
        <p>Transaction ID: {{ transaction.transactionId }}</p>
        <hr />
  
        <table class="receipt-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in transaction.cart" :key="item._id">
              <td>{{ item.name }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.price }}</td>
              <td>{{ (item.price * item.quantity).toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
  
        <hr />
        <p>Subtotal: {{ transaction.subtotal.toFixed(2) }}</p>
        <p>VAT ({{ transaction.VAT }}%): {{ transaction.vatAmount.toFixed(2) }}</p>
        <p>Discount: {{ transaction.discount.toFixed(2) }}</p>
        <h3>Total: {{ transaction.totalAmount.toFixed(2) }}</h3>
        <p>Change: {{ transaction.change.toFixed(2) }}</p>
  
        <hr />
        <!-- Barcode Container -->
        <svg ref="barcode" class="barcode"></svg>
      </div>
    </div>
  </template>
  
  <script>
  import JsBarcode from "jsbarcode";
  
  export default {
    props: {
      transaction: {
        type: Object,
        required: true,
      },
    },
    mounted() {
      // Generate Barcode for the Transaction ID
      JsBarcode(this.$refs.barcode, this.transaction.transactionId, {
        format: "CODE128", // Barcode format
        lineColor: "#000", // Barcode color
        width: 2, // Bar width
        height: 50, // Bar height
        displayValue: true, // Show value below the barcode
      });
    },
  };
  </script>
  
  <style scoped>
  .receipt {
    font-family: Arial, sans-serif;
    max-width: 300px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #ddd;
  }
  .receipt-table {
    width: 100%;
    text-align: left;
    border-collapse: collapse;
  }
  .receipt-table th,
  .receipt-table td {
    border-bottom: 1px solid #ddd;
    padding: 5px 0;
  }
  .barcode {
    display: block;
    margin: 10px auto;
  }
  @media print {
    body * {
      visibility: hidden;
    }
    #receipt-area {
      visibility: visible;
      position: absolute;
      top: 0;
      left: 0;
    }
  }
  </style>
  