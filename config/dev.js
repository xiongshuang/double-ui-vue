const { resolve, join } = require('path');
const { merge } = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin'); // 自动生成index.html
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const chalk = require('chalk');

const baseConfig = require('./base');

// 获取本机ip
const getIp = require('../get_ip');

const port = 3003;

const config = {
	entry: {
		index: resolve(__dirname, '../src/main.ts') // 入口文件
	},
	output: {
		path: resolve(__dirname, '../development'),
		filename: '[name].js', // [name] 是entry的key
		publicPath: '/',
		assetModuleFilename: 'images/[name].[ext][query]'
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: join(__dirname, '../src/indexDev.html'), // 引入模版
			favicon: join(__dirname, '../src/assets/favicon.ico'),
			filename: 'index.html',
			minify: {
				// 对index.html压缩
				collapseWhitespace: false, // 去掉index.html的空格
				removeAttributeQuotes: false // 去掉引号
			},
			hash: true, // 去掉上次浏览器的缓存（使浏览器每次获取到的是最新的html）
			inlineSource: '.(js|css)'
		}),
		new ProgressBarPlugin({
			format: chalk.blue.bold(
				`* double-ui-vue build [:bar ${chalk.green(':percent')}] (:elapsed seconds)`
			),
			clear: true,
			summary: false,
			customSummary: () => {
				console.log(
					chalk.yellow('double-ui-vue dev server running at:'),
					'\n',
					`   http://${getIp()}:${port}/`,
					'\n',
					`   http://localhost:${port}/`
				);
			}
		})
	],
	cache: true,
	devtool: 'inline-source-map',
	devServer: {
		static: {
			directory: join(__dirname, '../development'),
		},
		compress: true, // 开启Gzip压缩
		host: '0.0.0.0', // 设置服务器的ip地址，默认localhost
		port, // 端口号
		hot: true,
		client: {
			overlay: true,
			progress: true
		}
		// historyApiFallback: { // 当使用 HTML5 History API 时，任意的 404 响应都可能需要被替代为 /
		//     rewrites: [{ from: /./, to: '/' }]
		// }
	}
};

module.exports = merge(baseConfig, config);