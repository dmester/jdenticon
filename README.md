# [Jdenticon](https://jdenticon.com)
JavaScript library for generating highly recognizable identicons using HTML5 canvas or SVG.

![Sample identicons](https://jdenticon.com/hosted/github-samples.png)

[![Tests](https://img.shields.io/github/actions/workflow/status/dmester/jdenticon/tests.js.yml?branch=master&style=flat-square)](https://github.com/dmester/jdenticon/actions)
[![Downloads](https://img.shields.io/npm/dt/jdenticon.svg?style=flat-square)](https://www.npmjs.com/package/jdenticon)
[![jsDelivr](https://data.jsdelivr.com/v1/package/npm/jdenticon/badge?style=square)](https://www.jsdelivr.com/package/npm/jdenticon)
[![npm bundle size](https://img.shields.io/bundlephobia/min/jdenticon.svg?style=flat-square)](https://bundlephobia.com/result?p=jdenticon)
[![License MIT](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](https://github.com/dmester/jdenticon/blob/master/LICENSE)

## Live demo
https://jdenticon.com

## Getting started
Using Jdenticon is simple. Follow the steps below to integrate Jdenticon into your website.

### 1. Add identicon placeholders
Jdenticon is able to render both raster and vector identicons. Raster icons are rendered 
slightly faster than vector icons, but vector icons scale better on high resolution screens.
Add a canvas to render a raster icon, or an inline svg element to render a vector icon.

```HTML
<!-- Vector icon -->
<svg width="80" height="80" data-jdenticon-value="icon value"></svg>

<!-- OR -->

<!-- Raster icon -->
<canvas width="80" height="80" data-jdenticon-value="icon value"></canvas>
```

### 2. Add reference to Jdenticon
Include the Jdenticon library somewhere on your page. You can either host it yourself or 
use it right off [jsDelivr](https://www.jsdelivr.com).

```HTML
<!-- Using jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/jdenticon@3.3.0/dist/jdenticon.min.js"
        integrity="sha384-LfouGM03m83ArVtne1JPk926e3SGD0Tz8XHtW2OKGsgeBU/UfR0Fa8eX+UlwSSAZ"
        crossorigin="anonymous">
</script>

<!-- OR -->

<!-- Hosting it yourself -->
<script src="-path-to-/jdenticon.min.js"></script>
```
That's it!

## Other resources
### API documentation
For more usage examples and API documentation, please see:

https://jdenticon.com

### Other platforms
There are ports or bindings for Jdenticon available for the following platforms:

* [PHP](https://github.com/dmester/jdenticon-php/)
* [React](https://www.npmjs.com/package/react-jdenticon)
* [Vue](https://www.npmjs.com/package/vue-jdenticon)
* [Angular](https://www.npmjs.com/package/ngx-jdenticon)
* [.NET](https://github.com/dmester/jdenticon-net/)
* [Rust](https://github.com/jay3332/rdenticon)
* [Polymer](https://github.com/GeoloeG/identicon-element)
* [Swift](https://github.com/aleph7/jdenticon-swift)
* [Java](https://github.com/sunshower-io/sunshower-arcus/tree/master/arcus-identicon)
* [Dart/Flutter](https://pub.dartlang.org/packages/jdenticon_dart)
* [Kotlin](https://github.com/WycliffeAssociates/jdenticon-kotlin)

## License
Jdenticon is available under the [MIT license](https://github.com/dmester/jdenticon/blob/master/LICENSE).
