/**
 * MBL ~ Mad Basic Loader
 *
 * Functionality: 
 * - Loads images, fires callbacks & triggers events
 */

var extend   = require('mextend')
var trigger  = require('etrig')
var sanitize = require('sanitize-elements')
var Emitter  = require('tiny-emitter')

module.exports = function($images, opts) {

  var events = new Emitter()

  var options = extend({
    'sourceAttr' : 'data-src',
    'sequential' : false,
    'bgMode'     : false,
    'success'    : function(i, elem) { }, // called on each image successful load
    'error'      : function(i, elem) { }, // called on each image error
    'begin'      : function() { }, // called once loading begins
    'complete'   : function() { } // called once all images have completed (error/success agnostic)
  }, opts)

  var data = {
    'total' : 0,
    'count' : 0
  }

  var init = function() {
    if ($images = sanitize($images, true)) {
      data.total = $images.length
    } else {
      console.warn('no images here!')
      return
    }
    kickoff()
  }

  var kickoff = function() {
    begin()
    if (data.total <= 0) {
      complete()
    } else {
      if (!options.sequential) {
        flood()
      } else {
        sequential()
      }
    }
  }

  var flood = function() {
    for (var i = 0; i < data.total; i++) {
      loadImage(i)
    }
  }

  var sequential = function() {
    loadImage(0)
  }

  // Should split up this function someday
  var loadImage = function(index) {

    if (index < data.total) {

      var elem   = $images[index]
      var src    = elem.getAttribute(options.sourceAttr)
      var next   = index + 1
      var img    = new Image() // create new image
      var loaded = false

      // behavior on image load
      img.addEventListener('load', function() {
        if (!loaded) {
          loaded = true
          if (options.bgMode || elem.hasAttribute('data-bgmode')) {
            elem.style.backgroundImage = "url('" + src + "')"
          } else {
            $images[index].setAttribute('src', src)
          }
          elem.setAttribute('data-mbl-complete', '')
          success(index, elem)
          if (options.sequential) {
            loadImage(next)
          }
          data.count++ 
          if (data.count >= data.total) {
            complete()
          }
        }
      })

      // behavior on image error
      img.addEventListener('error', function() {
        if (!loaded) {
          loaded = true
          error(index, elem)
          if (options.sequential) {
            loadImage(next)
          }
          data.count++ 
          if (data.count >= data.total) {
            complete()
          }
        }
      })

      // set img src
      img.src = src

      if (img.complete) {
        etrig(img, 'load') // ensure even cached image triggers load
      }

    }

  }

  var success = function(index, elem) {
    options.success(index, elem)
    events.emit('success', {
      'element' : elem,
      'index' : index
    })
  }

  var error = function(index, elem) {
    options.error(index, elem)
    events.emit('error', {
      'element' : elem,
      'index' : index
    })
  }

  var begin = function() {
    options.begin()
    events.emit('begin')
  }

  var complete = function() {
    options.complete()
    events.emit('complete')
  }

  return {
    'start' : init,
    'on' : function(ev, cb){ events.on(ev, cb) }
  }

}