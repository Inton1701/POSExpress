const escpos = require('escpos');
const USB = require('escpos-usb');

// Find your printer
const device = new USB();

// Create a printer instance
const printer = new escpos.Printer(device);

device.open(function() {
  printer
    .text('Hello, world!')
    .cut()
    .close();
});
