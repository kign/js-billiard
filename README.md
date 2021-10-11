# Variation of a classical billiard game in JavaScript

## Live demo

[https://kign.github.io/js-billiard](https://kign.github.io/js-billiard)

![Game Screenshot](https://github.com/kign/xonix/blob/main/src/net/inet_lab/xonix/public/Xonix1.png?raw=true "Game Screenshot" )


## Installation

To install all `node.js` dependencies:

```bash
npm install
```

To compile directly with TypeScript compiler (JavaScript files will be generated in `js`);
these files are not used for anything right now

```bash
tsc
```

To start dev server

```bash
npm start
```

`Zig` source code compilation to `wasm`

```bash
zig build-lib src/animation.zig -target wasm32-wasi --output-dir dist
```

To comple bundle with `webpack` (bundle will be generated in `dist`)

```bash
npm run-script build
zig build-lib src/animation.zig -target wasm32-wasi --output-dir dist && rm dist/*.o && chmod a-x dist/*
cp assets/favicon.png dist
```

[TypeScript in Webpack](https://webpack.js.org/guides/typescript/)

[HtmlWebpackPlugin templates](https://github.com/jantimon/html-webpack-plugin#writing-your-own-templates)
