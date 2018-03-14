# [Jdenticon](https://jdenticon.com)
JavaScript library for generating highly recognizable identicons using HTML5 canvas or SVG.

![Sample identicons](https://jdenticon.com/hosted/github-samples.png)

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
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/jdenticon@2.0.0"></script>

<!-- OR -->

<!-- Hosting it yourself -->
<script type="text/javascript" src="-path-to-/jdenticon.min.js"></script>
```
That's it!

## Other resources
### API documentation
For more usage examples and API documentation, please see:

https://jdenticon.com

### Jdenticon .NET Edition
Same icons, same configuration options, but ported to .NET and easily integrated into your ASP.NET websites.

https://github.com/dmester/jdenticon-net/

### Jdenticon Swift Edition
Ported also to Swift. Easily integrate into your iOS application.

https://github.com/aleph7/jdenticon-swift

### Hosted Jdenticon
Same icons but generated server-side without a server. Service provided by [Aaroh Mankad](https://github.com/aarohmankad).

http://identicon-api.herokuapp.com/

### Third-party extensions
If your're into Polymer, [Pascal Gula](https://github.com/MeTaNoV) has created a nice Polymer element.

https://github.com/GeoloeG/identicon-element

## License
Jdenticon is released under the [MIT license](https://github.com/dmester/jdenticon/blob/master/LICENSE).
