const escpos = require('escpos');
escpos.USB = require('escpos-usb');

// Define the Vendor ID (VID) and Product ID (PID)
const vendorId = 0x01; // Replace with your device's VID
const productId = 0xff; // Replace with your device's PID

// Find the device by its VID and PID
const device = escpos.USB.findByIds(vendorId, productId);

if (device) {
  const printer = new escpos.Printer(device);

  device.open((error) => {
    if (error) {
      console.error('Failed to connect to the printer:', error);
      return;
    }

    printer
      .text('Hello, world!')
      .cut()
      .close(() => {
        console.log('Test print successful!');
      });
  });
} else {
  console.log('Device not found!');
}
