var debug = process.env.NODE_ENV !== "production";
var webpack = require('webpack');
var path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

debug = true;

module.exports = {
  mode:"production",
  context: path.join(__dirname, "src"),
  devtool: debug ? "inline-sourcemap" : false,
  entry: "./index.js",
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env','@babel/preset-react'],
          plugins: [//'transform-decorators-legacy',
          "@babel/plugin-syntax-dynamic-import",
          "@babel/plugin-syntax-import-meta",
          "@babel/plugin-proposal-class-properties",
          "@babel/plugin-proposal-json-strings"]
        }
      },{
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      }
    ]
  },
  output: {
    path: __dirname + '/dist/',
    filename: "bioviz.js",
    library: 'bioviz',
    libraryTarget: 'umd'
  },
  externals:{
    d3: {
      commonjs:"d3",commonjs2:"d3","amd":"d3"
    }
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            comments: false,
          },
        },
      }),
    ]
},
plugins: debug ? [] : [
  new webpack.NoEmitOnErrorsPlugin(),
  new webpack.ProvidePlugin({
    React: 'react'
  }),
  new webpack.DefinePlugin({
    'process.env': {
      'NODE_ENV': 'development'
    }
  }),

],
};