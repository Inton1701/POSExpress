const { defineConfig } = require('@vue/cli-service')
const dotenv = require('dotenv');

dotenv.config();
module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    resolve: {
      fallback: {
        "stream": require.resolve("stream-browserify"),
        "os": require.resolve("os-browserify/browser")
      }
    }
  }
})
