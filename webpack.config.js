const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const config = (env, argv) => {
  const outDir = "build";
  const port = 4000;

  return {
    entry: "./index",
    output: {
      path: path.join(__dirname, outDir),
      filename: "[name].bundle.js",
    },
    devServer: {
      contentBase: path.join(__dirname, outDir),
      compress: true,
      port,
    },
    devtool: "source-map",
    resolve: {
      extensions: [".js"],
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.pug$/,
          use: ["pug-loader"],
        },
        {
          test: /\.(jpe?g|png|gif|glb|gltf)$/,
          use: ["file-loader"],
        },
      ],
    },
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: "./views/pug/index.pug",
        inject: true,
      }),
    ],
  };
};
module.exports = config;
