;(function () {
  'use strict'

  // Polyfill Element.closest() for IE9+
  if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector ||
      Element.prototype.webkitMatchesSelector
  }

  if (!Element.prototype.closest) {
    Element.prototype.closest = function (s) {
      var el = this
      if (!document.documentElement.contains(el)) return null
      do {
        if (el.matches(s)) return el
        el = el.parentElement || el.parentNode
      } while (el !== null && el.nodeType === 1)
      return null
    }
  }

  /**
   * Helper function to create HTML element from HTML string
   *
   * @param htmlString
   * @returns {Element}
   */
  var createElementFromHTML = function (htmlString) {
    var div = document.createElement('div')
    div.innerHTML = htmlString.trim()

    return div.firstElementChild
  }

  /**
   * Helper function to insert HTML element after referenceNode
   *
   * @param newNode
   * @param referenceNode
   */
  var insertAfter = function (newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling)
  }

  /**
   * Helper function to get current element position
   *
   * @param element
   * @returns {{left: number, top: number}}
   */
  var getElementPosition = function (element) {
    var doc = element && element.ownerDocument
    var win = doc.defaultView || doc.parentWindow || window
    var docElem = doc.documentElement
    var clientTop = docElem.clientTop || 0
    var clientLeft = docElem.clientLeft || 0
    var box = {top: 0, left: 0}
    if (element.getBoundingClientRect) {
      box = element.getBoundingClientRect()
    }

    return {
      left: box.left - clientLeft,
      top: box.top - clientTop
    }
  }

  /**
   *  Helper function to merge two object non-recursively
   */
  var merge = function () {
    var obj = {}
    var key
    var il = arguments.length
    var i = 0

    for (; i < il; i++) {
      for (key in arguments[i]) {
        if (arguments[i].hasOwnProperty(key)) {
          obj[key] = arguments[i][key]
        }
      }
    }

    return obj
  }

  /**
   * Helper function to filter duplicate element from Array
   *
   * @param arr
   * @returns {array}
   */
  var uniqueArray = function (arr) {
    var onlyUnique = function (value, index, self) {
      return self.indexOf(value) === index
    }
    var unique = arr.filter(onlyUnique)

    return unique
  }

  /**
   * The ColorPicker
   *
   * @param arg
   * @constructor
   */
  var ColorPicker = function (arg) {
    /**
     * Default options value
     */
    var options = {
      selector: null,
      templateSelector: null,
      localStorageKey: '_color-picker',
      defaultColorPalette: [],
      initialColorValue: null,
      renderCallback: null,
      triggerOn: 'click',
      marginTop: 30,
      marginLeft: 0
    }

    /**
     * HTML element on color picker template
     */
    var attachedOnElement
    var pickerElm
    var colorDiscElm
    var luminanceBarElm
    var coverLayerElm
    var barWhiteLayerElm
    var barBGLayerElm
    var discCursorElm
    var barCursorElm
    var hexValueBoxElm
    var colorPaletteElm
    var paletteAddElm
    var customizerElm

    /**
     * Reference to this object
     *
     * @type {ColorPicker}
     */
    var self = this

    /**
     * Hold state of this object already rendered or not
     *
     * @type {boolean}
     */
    var rendered = false

    /**
     * Hold state if user change color via color disc customizer
     *
     * @type {boolean}
     */
    var updateTheColorPalette = false

    /**
     * Color data to be rendered
     *
     * @type {Array}
     */
    var colorPalette = []

    /**
     * Mouse position start point on mousemove event
     */
    var mouseMoveStartPoint = {top: 0, left: 0}

    /**
     * Hold render timer interval, will be used for cancelling timer interval
     */
    var renderTimer

    /**
     * Hold flag whenever render will recursively call requestAnimationFrame or not
     */
    var renderRecursiveLoop

    /**
     *
     * @type {boolean}
     */
    var isAfterMouseMove = false

    /**
     *
     * @type {boolean}
     */
    var needToCallRenderCallback = false

    /**
     * Hold HTML element that is targeted on click/drag event
     */
    var currentMouseEventTarget

    /**
     * Instance of Colors library
     *
     * @type {Window.Colors}
     */
    var Color = new Colors({color: 'rgb(255, 255, 255'})

    /**
     * Draw colors disc
     *
     * @param context
     * @param radius
     */
    var drawDisc = function (context, radius) {
      var xAxis = radius[0] || radius // radius on x-axis
      var yAxis = radius[1] || radius // radius on y-axis
      var steps = 1
      var angle = 360
      var coef = Math.PI / 180
      var gradient

      context.save()
      context.scale(xAxis, yAxis)

      for (; angle > 0; angle -= steps) {
        context.beginPath()
        if (steps !== 360) {
          context.moveTo(1, 1) // stroke
        }
        context.arc(
          1, 1, 1,
          (angle - (steps / 2) - 1) * coef,
          (angle + (steps / 2) + 1) * coef
        )

        gradient = context.createRadialGradient(1, 1, 1, 1, 1, 0)
        gradient.addColorStop(0, 'hsl(' + (360 - angle) + ', 100%, 50%)')
        gradient.addColorStop(1, '#FFFFFF')

        context.fillStyle = gradient
        context.fill()
      }
      context.restore()
    }

    /**
     * Draw luminance bar
     *
     * @param context
     */
    var drawLuminanceBar = function (context) {
      var gradient = context.createLinearGradient(0, 0, 200, 20)

      gradient.addColorStop(0, 'transparent')
      gradient.addColorStop(1, 'black')

      context.fillStyle = gradient
      context.fillRect(0, 0, 200, 20)
    }

    /**
     * Render the picker and color changes
     */
    var doRender = function () {
      var colorDiscRadius = colorDiscElm.offsetHeight / 2
      var luminanceBarWidth = luminanceBarElm.offsetWidth
      var pi2 = Math.PI * 2
      var x = Math.cos(pi2 - (Color.colors.hsv.h * pi2))
      var y = Math.sin(pi2 - (Color.colors.hsv.h * pi2))
      var r = Color.colors.hsv.s * (colorDiscRadius - 10)

      coverLayerElm.style.opacity = 1 - Color.colors.hsv.v
      barWhiteLayerElm.style.opacity = 1 - Color.colors.hsv.s

      barBGLayerElm.style.backgroundColor = 'rgb(' +
        Color.colors.hueRGB.r + ',' +
        Color.colors.hueRGB.g + ',' +
        Color.colors.hueRGB.b + ')'

      discCursorElm.style.cssText =
        'left: ' + ((x * r) + colorDiscRadius) + 'px;' +
        'top: ' + ((y * r) + colorDiscRadius) + 'px;' +
        'border-color: ' + (Color.colors.RGBLuminance > 0.22 ? '#666;' : '#ddd')

      barCursorElm.style.left = ((1 - Color.colors.hsv.v) * (luminanceBarWidth - 20)) + 'px'

      if (document.activeElement != hexValueBoxElm) {
        hexValueBoxElm.value = '#' + Color.colors.HEX
      }

      if (options.renderCallback && typeof options.renderCallback === 'function' && needToCallRenderCallback) {
        options.renderCallback(self)
      }

      if (renderRecursiveLoop) {
        window.requestAnimationFrame(doRender)
      }
    }

    /**
     * Stop render timer interval
     */
    var stopRender = function () {
      renderRecursiveLoop = false
      window.cancelAnimationFrame(renderTimer)
    }

    /**
     * Start render timer interval
     *
     * @param oneTime
     */
    var startRender = function (oneTime) {
      if (oneTime) {
        renderRecursiveLoop = false
        doRender()
        stopRender()
      } else {
        renderRecursiveLoop = true
        renderTimer = window.requestAnimationFrame(doRender)
      }
    }

    /**
     * Callback on mousemove event
     *
     * @param event
     */
    var mouseMove = function (event) {
      var radius, width, hue, saturation, value, clientX, clientY, x, y

      isAfterMouseMove = true

      if (event.touches === undefined) {
        clientX = event.clientX
        clientY = event.clientY
      } else {
        clientX = event.touches[0].clientX
        clientY = event.touches[0].clientY
      }

      if (currentMouseEventTarget === colorDiscElm.parentNode) {
        // Curent target is color disc
        radius = currentMouseEventTarget.offsetHeight / 2
        x = clientX - mouseMoveStartPoint.left - radius
        y = clientY - mouseMoveStartPoint.top - radius
        hue = 360 - (((Math.atan2(y, x) * 180) / Math.PI) + (y < 0 ? 360 : 0))
        saturation = (Math.sqrt((x * x) + (y * y)) / radius) * 100

        Color.setColor({h: hue, s: saturation}, 'hsv')
      } else if (currentMouseEventTarget === luminanceBarElm.parentNode) {
        // Current target is luminanceBar
        width = currentMouseEventTarget.offsetWidth
        value = ((width - (clientX - mouseMoveStartPoint.left)) / width) * 100

        Color.setColor({v: value}, 'hsv')
      }
    }

    /**
     * Callback on mousedown event
     *
     * @param event
     */
    var mouseDown = function (event) {
      var target = event.target || event.srcElement

      if (target === hexValueBoxElm) {
        return
      }

      if (event.preventDefault) {
        event.preventDefault()
      }

      currentMouseEventTarget = target.parentNode
      mouseMoveStartPoint = getElementPosition(currentMouseEventTarget)

      // Hide the cursor
      customizerElm.classList.add('no-cursor')

      // Flag color palette need to be updated
      updateTheColorPalette = true

      window.addEventListener('mousemove', mouseMove, false)
      window.addEventListener('touchmove', mouseMove, false)

      mouseMove(event)
      startRender()
    }

    /**
     * Reset default color value from Colors instance. Make it more bright.
     */
    var makesColorBrighter = function () {
      var currentHue = Color.colors.hsv.h
      var currentSaturation = Color.colors.hsv.s

      Color.setColor({h: (currentHue * 100), s: (currentSaturation * 100), v: 100}, 'hsv')
    }

    /**
     * Create color paletter squar item
     *
     * @param data
     * @returns {HTMLDivElement}
     */
    var createColorPaletteElement = function (data) {
      var element = document.createElement('div')
      element.className = 'color-picker-palette-square'
      element.style.cssText = 'background-color: ' + data

      return element
    }

    /**
     * Create "+" button in the palette
     *
     * @returns {HTMLDivElement}
     */
    var createAddButtonElement = function () {
      var element = document.createElement('div')
      element.className = 'color-picker-palette-add color-picker-palette-square'

      return element
    }

    /**
     * Insert palette squares into color picker
     */
    var drawDefaultPaletteSquares = function () {
      var i, i2, len, len2, colorPaletteGroup, element
      var colorPaletteGroupIndex = 0

      for (i = 0, len = colorPaletteElm.children.length; i < len; ++i) {
        colorPaletteGroup = colorPaletteElm.children[i]

        if (!colorPaletteGroup.classList.contains('color-picker-palette-group')) {
          continue
        }

        colorPaletteGroup.innerHTML = ''

        if (colorPaletteGroupIndex === 0) {
          // First item is square box with 'plus' symbol
          paletteAddElm = createAddButtonElement()
          colorPaletteGroup.appendChild(paletteAddElm)
        }

        for (i2 = 0, len2 = colorPalette[colorPaletteGroupIndex].length; i2 < len2; ++i2) {
          element = createColorPaletteElement(colorPalette[colorPaletteGroupIndex][i2])
          colorPaletteGroup.appendChild(element)
        }
        colorPaletteGroupIndex += 1
      }
    }

    /**
     * Refresh palette squares, maybe there are a new data
     */
    var refreshThePalette = function () {
      var colorValue, dataString
      var data = []

      if (updateTheColorPalette) {
        colorValue = '#' + self.Color.colors.HEX
        dataString = window.localStorage.getItem(options.localStorageKey)

        if (dataString) {
          try {
            data = JSON.parse(dataString)
          } catch (e) {
            data = []
          }
        }

        data.unshift(colorValue)
        data = uniqueArray(data)
        dataString = JSON.stringify(data)
        window.localStorage.setItem(options.localStorageKey, dataString)

        colorPalette = options.defaultColorPalette.slice(0)
        if (data.length > 0) {
          colorPalette.unshift(data)
        }

        drawDefaultPaletteSquares()
      }

      updateTheColorPalette = false
    }

    /**
     * Mouse event
     */
    var bindMouseEvent = function () {
      // Core color picker event
      customizerElm.addEventListener('mousedown', mouseDown, false)
      customizerElm.addEventListener('touchstart', mouseDown, false)
      window.addEventListener('mouseup', function (e) {
        window.removeEventListener('mousemove', mouseMove, false)
        customizerElm.classList.remove('no-cursor')
        stopRender()
      }, false)
      window.addEventListener('touchend', function (e) {
        window.removeEventListener('touchmove', mouseMove, false)
        customizerElm.classList.remove('no-cursor')
        stopRender()
      }, false)

      window.addEventListener('click', function (e) {
        var target = e.target
        var onAddBtn = target === paletteAddElm
        var onCallerBtn = target === attachedOnElement
        var onPaletteSquare = target.closest('.color-picker-palette-square')
        var inCustomizer = target.closest('.color-picker-customizer')

        // This if is hack for  Chrome. Because Chrome will fire click event after mouseup
        if (!isAfterMouseMove) {
          if (onCallerBtn) {
            pickerElm.classList.toggle('color-picker-active')
          } else if (onAddBtn) {
            customizerElm.classList.toggle('color-picker-active')
            startRender(true)
          } else if (onPaletteSquare) {
            Color.setColor(e.target.style.backgroundColor)
            needToCallRenderCallback = true
            startRender(true)
            needToCallRenderCallback = false
          } else if (!onCallerBtn && !onAddBtn && !inCustomizer && target.closest('.color-picker')) {
            customizerElm.classList.remove('color-picker-active')
            Color.setColor('#FFFFFF')
            refreshThePalette()
          } else if (!onCallerBtn && !onAddBtn && !target.closest('.color-picker')) {
            pickerElm.classList.remove('color-picker-active')
            customizerElm.classList.remove('color-picker-active')
            Color.setColor('#FFFFFF')
            refreshThePalette()
          } else if (target === hexValueBoxElm) {
            hexValueBoxElm.setSelectionRange(0, 7)
          }
        }

        // This event is hack for Chrome
        window.addEventListener('mousedown', function (e) {
          isAfterMouseMove = false

          if (e.target.closest('.color-picker')) {
            needToCallRenderCallback = true
          }
        }, false)

        // This event is hack for Chrome
        window.addEventListener('touchstart', function (e) {
          isAfterMouseMove = false

          if (e.target.closest('.color-picker')) {
            needToCallRenderCallback = true
          }
        }, false)

        window.addEventListener('mouseup', function (e) {
          needToCallRenderCallback = false
        })

        window.addEventListener('touchend', function (e) {
          needToCallRenderCallback = false
        })
      }, false)
    }

    var bindHexValueBoxChanges = function () {
      hexValueBoxElm.addEventListener('keyup', function (event) {
        var target = event.target
        var inputValue = target.value.replace('#', '');
        var value = '000000';

        if (inputValue.length <= 6) {
          // No brain solution, :(
          switch ( inputValue.length ) {
            case 1:
              value = inputValue + inputValue + inputValue + inputValue + inputValue + inputValue
              break;
            case 2:
              value = inputValue + inputValue + inputValue
              break;
            case 3:
              value = inputValue + inputValue
            case 4:
              value = inputValue + inputValue.substring(0, 2)
            case 5:
              value = inputValue + inputValue.substring(0, 1)
            case 6:
              value = inputValue
          }
        } else {
          value = inputValue.substring(0, 6)
        }

        Color.setColor(value)
        needToCallRenderCallback = true
        doRender()
      })

      hexValueBoxElm.addEventListener('keydown', function (event) {
        if (event.which == 13) {
          pickerElm.classList.remove('color-picker-active')
          customizerElm.classList.remove('color-picker-active')
        }
      })
    }

    /**
     * Makes Color accessible publicly
     *
     * @type {Window.Colors}
     */
    this.Color = Color

    /**
     * Initial render the color picker
     */
    this.render = function () {
      var data = []
      var dataString = localStorage.getItem(options.localStorageKey)

      if (!rendered) {
        colorPalette = options.defaultColorPalette.slice(0)

        if (dataString) {
          try {
            data = JSON.parse(dataString)
          } catch (e) {}
        }

        data = uniqueArray(data)
        colorPalette.unshift(data)

        makesColorBrighter()

        drawDefaultPaletteSquares()
        drawDisc(colorDiscElm.getContext('2d'), [colorDiscElm.width / 2, colorDiscElm.height / 2])
        drawLuminanceBar(luminanceBarElm.getContext('2d'))
        insertAfter(pickerElm, attachedOnElement)

        if (options.initialColorValue) {
          Color.setColor(options.initialColorValue())
        }

        doRender()
        bindMouseEvent()
        bindHexValueBoxChanges()
      }

      rendered = true
    }

    options = merge(options, arg)
    attachedOnElement = document.querySelector(options.selector)
    pickerElm = createElementFromHTML(document.querySelector(options.templateSelector).innerHTML)
    colorDiscElm = pickerElm.querySelector('.color-picker-disc')
    luminanceBarElm = pickerElm.querySelector('.color-picker-luminance-bar')
    coverLayerElm = pickerElm.querySelector('.color-picker-cover')
    barWhiteLayerElm = pickerElm.querySelector('.color-picker-bar-white')
    barBGLayerElm = pickerElm.querySelector('.color-picker-bar-bg')
    discCursorElm = pickerElm.querySelector('.color-picker-disc-cursor')
    barCursorElm = pickerElm.querySelector('.color-picker-bar-cursor')
    hexValueBoxElm = pickerElm.querySelector('.color-picker-hex')
    colorPaletteElm = pickerElm.querySelector('.color-picker-palette')
    paletteAddElm = pickerElm.querySelector('.color-picker-palette-add')
    customizerElm = pickerElm.querySelector('.color-picker-customizer')

    attachedOnElement.addEventListener(options.triggerOn, function (e) {
      var positions = e.target.getBoundingClientRect()
      var top, left

      self.render()

      top = positions.top + options.marginTop - pickerElm.offsetHeight
      left = positions.left + options.marginLeft

      pickerElm.style.cssText = 'left: ' + left + 'px; top: ' + top + 'px'
    }, false)
  }

  /**
   * Export to global window object
   * @type {ColorPicker}
   */
  window.ColorPicker = ColorPicker
}())
