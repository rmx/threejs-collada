ColladaAnimationCompress
========================

A tool for selectively removing animation keyframes from collada files.

Building
========

If you have coffeescript, compile the file `ColladaLoader2.coffee`. Otherwise, follow these instructions:
* Clone this repository
* Install node (http://nodejs.org/)
* Open the command line, go to the repository directory and type `npm update`
* If you are a windows user, type `makeColladaLoader2`. If you are a linux user, read that file and figure out what to do.

Viewer
======

Loads and shows collada files.

* Open the file view.html in your web browser.
* Drag-and-drop a collada file from your file system into the black area.


Compressor
==========

Selectively removes animation keyframes from collada files.

* Open the file compress.html in your web browser
* Read the embedded help section.

Troubleshooting
===============

#### Using the web pages locally

* Texture loading will not work if you use the web pages locally unless you follow all of the following steps.
* Set `loader.options.useLocalTextureLoading = true` to enable simple texture loading in the ColladaLoader2 class.
  Otherwise you will get `Cross-origin image load denied by Cross-Origin Resource Sharing policy.`
* Start the chrome browser with `--allow-file-access-from-files`
  Otherwise you will get DOM security expections 18
* That switch is a security risk, don't forget to change it back.

#### Using the web pages though a web server

* Set `loader.options.useLocalTextureLoading = false` to enable proper texture loading in the ColladaLoader2 class.
* The texture most likely has to come from the same domain as the web page.
  Hotlinking textures from the three.js project example page won't work.

