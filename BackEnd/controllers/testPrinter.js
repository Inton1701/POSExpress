const escpos = require("escpos");
const USB = require("escpos-usb");

escpos.USB = USB;

const device = new escpos.USB();
const printer = new escpos.Printer(device);

device.open((error) => {
  if (error) {
    return console.error("Failed to connect to the printer:", error);
  }

  printer
    .text("Hello, world!")
    .cut()
    .close(() => {
      console.log("Test print successful!");
    });
});
