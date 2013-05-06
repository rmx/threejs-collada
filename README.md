Collada loder for three.js
==========================

An alternative loader for COLLADA files, to be used with the [three.js](http://github.com/mrdoob/three.js) library.

Building
========

If you know how to use coffeescript, compile the file `ColladaLoader2.coffee`. Otherwise, follow these instructions:
* Clone this repository
* Install [node](http://nodejs.org/)
* Open the command line, go to the repository directory and type `npm update`
* If you are a windows user, type `make`. If you are a linux user, read that file and figure out what to do.

Example
======

For an example of how to use the loader, open the file example.html. The example won't work if you open the file locally (see the troubleshooting section below).

Viewer
======

Loads and shows collada files.

* Open the file view.html in your web browser.
* Drag-and-drop a collada file from your file system into the black area.

Troubleshooting
===============

#### Using the web pages locally

* Texture loading will not work if you use the web pages locally unless you follow one of the following steps.
	* The reason is that you will get cross-origin resource loading errors, since local files are never considered as coming from the [same origin](http://en.wikipedia.org/wiki/Same_origin_policy).
* Set `loader.options.localImageMode = true` to tell the loader it should only use textures that you have manually provided with `loader.addCachedTextures`.
* Alternatively, use the chrome browser switch `--allow-file-access-from-files` or the firefox setting `security.fileuri.strict_origin_policy`
	* Those switches are a security risk, don't forget to change them back.

#### Using the web pages though a web server

* You can use the file simpleServer.js to start a simple HTTP server using node
	* If you have node installed, type `node simpleServer` and open http://127.0.0.1:8125/example.html in your browser.
* The texture most likely has to come from the same domain as the web page.
	* Hotlinking textures from the three.js project example page won't work.

