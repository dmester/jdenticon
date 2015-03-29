
Jdenticon
======================================

http://jdenticon.com

Copyright (c) 2015 Daniel Mester Pirttijärvi


Description
-----------

This is a JavaScript library for generating identicons from a hash using canvas.


Files
-----

You got a number of files when you extracted the script library:

File             | Description
---------------- | ----------------------------------------------------
jdenticon.min.js | Compressed and obfuscated, to be used in production.
jdenticon.js     | Commented source file for your reference.


How to use
----------

Add a canvas element where you want to render the identicon. Use the `data-jdenticon-hash`
attribute to specify that an identicon should be rendered on the canvas.

```HTML
<canvas width="80" height="80" data-jdenticon-hash="ff8adece0631821959f443c9d956fc39"></canvas>
```

Include the Jdenticon library somewhere on your page.

```HTML
<script type="text/javascript" src="jdenticon.min.js"></script>
```

That's it! For more usage examples, please see:

http://jdenticon.com