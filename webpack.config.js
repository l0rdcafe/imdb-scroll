module.exports = {
  devServer: {
    open: true
  },
  entry: {
    app: ["babel-polyfill", "./src/main.js"]
  },
  output: {
    path: __dirname,
    filename: "bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        query: {
          presets: ["env", "stage-0"]
        }
      }
    ]
  }
};
