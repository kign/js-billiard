# js-billard
Pool table in JavaScript

To compile directly with TypeScript compiler (JavaScript files will be generated in `js`)

```bash
tsc
```

To comple bundle with `webpack` (bundle will be generated in `dist`)

```bash
npm install
```

To start dev server

```bash
npm start
```

`Zig` source code compilation to `wasm`

```bash
zig build-lib src/animation.zig -target wasm32-wasi --output-dir dist
```

[TypeScript in Webpack](https://webpack.js.org/guides/typescript/)

[HtmlWebpackPlugin templates](https://github.com/jantimon/html-webpack-plugin#writing-your-own-templates)
