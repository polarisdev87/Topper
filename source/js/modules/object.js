var CMF = CMF || {};

CMF.Object = (function($, undefined){

    var $doc;
    var $objects;
    var $grips;
    var $detailsList;

    var cache = false;  // determine whether or not the module has cached its needed jqueryfied elements (above)

    var _PI2 = Math.PI / 2;
    var _3PI2 = 3 * Math.PI / 2;
    var _2PI = 2 * Math.PI;

    var pixelSize = 0;


    function buildCache() {
        $doc = $(document);
        $objects = $(".objects");
        $grips = $(".grips");
        $detailsList = $(".objectsDetailsList");
    }


    /**
     * Radians to degrees angle conversion
     */
    function rad2deg(angle) {
        return angle * 180 / Math.PI;
    }

    /**
     * Degrees to radians angle conversion
     */
    function deg2rad(angle) {
        return angle * Math.PI / 180;
    }


    function setPixelSize ()
    {
        pixelSize = CMF.viewport.getPixelSize();
        return pixelSize;
    }


    /**
     * Constructor for design objects
     */
    function CmfObject(data) {

        // Check if jqueryfied elements exist within the module cache
        if (!cache) {
            buildCache();
            cache = true;
        }

        // Generic properties, applicable to all types of objects
        this.id = data.id;
        this.type = data.type || "image";                       // types: image|qr|text
        this.url = data.url || null;
        this.angle = data.angle || 0;                           // rotation angle (degrees)
        this.zIndex = data.zIndex;
        this.pxWidth = data.pxWidth || 1;                       // width in pixels for the original variant of the image
        this.pxHeight = data.pxHeight || 1;                     // height in pixels for the original variant of the image
        this.inWidth = data.inWidth || this.pxWidth;            // width in inches for the original variant of the image
        this.inHeight = data.inHeight || this.pxHeight;         // height in inches for the original variant of the image
        this.top = data.top || null;
        this.left = data.left || null;
        this.width = data.width || null;                        // width of the design object, within the viewport (in pixels)
        this.height = data.height || null;                      // height of the design object, within the viewport (in pixels)
        this.aspectRatio = this.inWidth / this.inHeight;
        this.maxQualityThreshold = 1;                           // the limit at which the image's quality indicator begins to decrease from 100%;
                                                                // it is expressed as the ratio between the original files's (px) height and the
                                                                // (px) height of the printable sheet associated with the selected product
        // SVG-related elements and properties
        this.svg = {};
        this.svg.canvas = undefined;                            // SVG canvas used to draw the object image on
        this.svg.image = undefined;                             // SVG image representing the design object
        this.scaleFactor = data.scaleFactor || 1;               // indicates the current scaling factor with regard to the original size of the viewport image
        this.cache = {                                          // a cache for the elements associated with the design object
            dom : {},       // "raw" DOM elements
            jq : {}         // "jquerified" DOM elements
        };

        if (!this.width || !this.height) {
            if (this.type !== "text") {
                this.setDefaultSize();
            } else {
                this.width = this.pxWidth;
                this.height = this.pxHeight;
            }
        }

        if (!this.left || !this.top) {
            this.setDefaultPosition();
        }

        // Properties specific to "Text" and "QR" objects
        this.text = data.text || "";

        // Properties specific to "Text" objects
        this.color = data.color || "#000000";
        this.fontSize = data.fontSize || 24;                    // expressed in pixels
        this.fontFamily = data.fontFamily || "Arial";
        this.fontWeight = data.fontWeight || "normal";          // values: bold|normal
        this.fontStyle = data.fontStyle || "normal";            // values: italic|normal
        this.textAlign = data.textAlign || "left";              // values: left|right|center
        this.textDecoration = data.textDecoration || "none";    // values: none|underline|line-through
        this.textCurvature = data.textCurvature || "0";

        return this;
    }


    /**
     * Returns the filename for the object images (identical for all variants)
     * @return {string}
     */
    CmfObject.prototype.getFilename = function() {
        return this.url.replace(/^.*[\\\/]/, '');
    };


    /**
     * Computes a default size for the CmfObject image within the viewport
     */
    CmfObject.prototype.setDefaultSize = function() {
        if (this.aspectRatio >= 1) {    // width >= height
            this.width = Math.round(CMF.viewport.get('width') * 0.5);
            this.height = Math.round(this.width / this.aspectRatio);
        } else {    // width < height
            this.height = Math.round(CMF.viewport.get('height') * 0.5);
            this.width = Math.round(this.height * this.aspectRatio);
        }

        return this;
    };


    /**
     * Computes a default position (centered) for the CmfObject
     */
    CmfObject.prototype.setDefaultPosition = function() {
        this.left = Math.round((CMF.viewport.get('width') - this.width) / 2);
        this.top = Math.round((CMF.viewport.get('height') - this.height) / 2);

        return this;
    };


    /**
     * Retrieves the components corresponding to a single design object (i.e. viewport image, viewport grip, details list item)
     */
    CmfObject.prototype.cacheComponents = function()
    {
        // Cache the DOM elements
        this.cache.dom = {
            image : document.getElementById("designObject-"+this.id),
            grip : document.getElementById("grip-"+this.id),
            listItem : document.getElementById("listItem-"+this.id),
            qualityIndicator: document.getElementById("qualityIndicator-"+this.id),
            inWidthIndicator: document.getElementById("grip-"+this.id).getElementsByClassName('tpr-widthIndicator')[0],
            inHeightIndicator: document.getElementById("grip-"+this.id).getElementsByClassName('tpr-heightIndicator')[0],
            cmWidthIndicator: document.getElementById("grip-"+this.id).getElementsByClassName('tpr-widthIndicator')[1],
            cmHeightIndicator: document.getElementById("grip-"+this.id).getElementsByClassName('tpr-heightIndicator')[1]
        };

        // Cache the "jquerified" DOM elements
        this.cache.jq = {
            image : $(this.cache.dom.image),
            grip : $(this.cache.dom.grip),
            listItem : $(this.cache.dom.listItem),
            qualityIndicator: $(this.cache.dom.qualityIndicator),
            inWidthIndicator: $(this.cache.dom.inWidthIndicator),
            inHeightIndicator: $(this.cache.dom.inHeightIndicator),
            cmWidthIndicator: $(this.cache.dom.cmWidthIndicator),
            cmHeightIndicator: $(this.cache.dom.cmHeightIndicator)
        };

        return this;
    };


    /**
     * Computes the position and the size of the object's grip element and applies them to that element
     */
    CmfObject.prototype.adjustGrip = function()
    {
        var bbox = this.svg.image.getBBox();
        var borderWidth = 1;

        this.cache.jq.grip.css({
            left: bbox.x - borderWidth,             // account for the width of the border
            top: bbox.y - borderWidth,              // account for the width of the border
            width: bbox.width + 2 * borderWidth,    // the box must be visible outside the object, hence 2px bigger
            height: bbox.height + 2 * borderWidth   // the box must be visible outside the object, hence 2px bigger
        });
    };


    /**
     * Creates the object image SVG canvas, then creates the actual image and appends it to the canvas
     */
    CmfObject.prototype.addImageToViewport = function() {

        var template = $("#cmfObjectTemplate").html();
        var data = {
            id: this.id,
            zIndex: this.zIndex
        };

        $objects.append(Mustache.render(template,data));

        // Create the new object's SVG canvas
        this.svg.canvas = Raphael("designObject-"+this.id, CMF.viewport.get('width'), CMF.viewport.get('height'));

        // Create the image and append it to the SVG canvas
        this.svg.image = this.svg.canvas.image(this.url, this.left, this.top, this.width, this.height);

        return this;
    };


    CmfObject.prototype.setSizeOnPaper = function ()
    {
        var inWidth, inHeight;
        var cmWidth, cmHeight;

        setPixelSize();

        inWidth = (pixelSize * this.width).toFixed(1);
        inHeight = (pixelSize * this.height).toFixed(1);
        cmWidth = (inWidth * 2.54).toFixed(1);
        cmHeight = (inHeight * 2.54).toFixed(1);

        this.cache.dom.inWidthIndicator.innerHTML = inWidth;
        this.cache.dom.inHeightIndicator.innerHTML = inHeight;
        this.cache.dom.cmWidthIndicator.innerHTML = cmWidth;
        this.cache.dom.cmHeightIndicator.innerHTML = cmHeight;

        return this;
    }


    /**
     * Creates and appends the grip element associated with the design object, which will be
     * added on top of the product schematic and be used for manipulating the object image
     */
    CmfObject.prototype.addGripToViewport = function() {

        var template = $("#cmf-"+this.type+"ObjectGripTemplate").html();
        var data = {
            id: this.id,
            left: this.left - 2,        // substract the width of the border
            top: this.top - 2,          // substract the width of the border
            width: this.width,
            height: this.height,
            zIndex: this.zIndex
        };

        $grips.append(Mustache.render(template,data));

        return this;
    };


    /**
     * Add an item to the design objects details list, corresponding to the current design object
     */
    CmfObject.prototype.addToDetailsList = function() {

        var templateId = "cmf-"+this.type+"ObjectDetailsTemplate";
        var template = $("#"+templateId).html();
        var data = {
            id: this.id,
            src: this.url,
            text: this.text
        };

        $detailsList.prepend(Mustache.render(template,data));
        return this;
    };


    /**
     * Creates a collection of DOM elements associated with the selected design object and appends them to the UI viewport
     */
    CmfObject.prototype.addToUi = function() {
        this.addImageToViewport();
        this.addGripToViewport();
        this.addToDetailsList();
        this.cacheComponents();
        this.applyTransformations();    // applies stored svg transformations, if any; useful when duplicating or loading objects.

        return this;
    };


    /**
     * Removes the design object completely, both from the UI and the CMF.ui.objects array
     */
    CmfObject.prototype.remove = function(callback) {

        var self = this;
        var duration = 50; // animation duration

        // Remove the corresponding list item from the design objects details list
        self.cache.jq.listItem.hide(duration, function() {
            self.cache.jq.listItem.remove();
        });

        // Remove the viewport object
        self.cache.jq.image.fadeOut(duration, function() {
            self.cache.jq.image.remove();
        });

        // Remove the viewport object grip
        self.cache.jq.grip.fadeOut(duration, function() {
            self.cache.jq.grip.remove();

            if (typeof callback === "function") {
                callback();
            }
        });

        return this;
    };


    /**
     * Highlights a design object's grip element and corresponding item in the objects details list
     */
    CmfObject.prototype.select = function() {

        var zIndex;

        // If the targeted object is already selected, exit
        if (this.isSelected()) {
            return this;
        }

        CMF.design.clearSelection();

        this.cache.jq.listItem.addClass("selected");
        this.cache.jq.image.addClass("selected");
        this.cache.jq.grip.addClass("selected");

        // In order for the control elements within the grip of the selected object
        // to be clickable, the grip itself must gain a z-index above all other grips
        zIndex = parseInt(this.cache.jq.grip.css("z-index"),10);
        zIndex += 999;
        this.cache.jq.grip.css("z-index",zIndex);

        this.setSizeOnPaper();

        return this;
    };


    /**
     * Removes the highlight from a design object
     */
    CmfObject.prototype.deselect = function() {

        this.cache.jq.listItem.removeClass("selected");
        this.cache.jq.image.removeClass("selected");
        this.cache.jq.grip.removeClass("selected").css("z-index",this.zIndex);

        return this;
    };


    CmfObject.prototype.isSelected = function ()
    {
        return this.cache.jq.listItem.hasClass("selected");
    }


    /**
     * Moves the current object to a specified depth (z-index)
     * @param  {number} depth
     * @return {object}
     */
    CmfObject.prototype.moveToDepth = function(depth) {
        var previousDepth = this.zIndex;

        // Reposition the viewport elements
        this.zIndex = depth;
        this.cache.jq.image.css("z-index", depth);
        this.cache.jq.grip.css("z-index", depth + 999);

        return this;
    };


    /**
     * Pushes the current object on top of all its siblings in the viewport
     */
    CmfObject.prototype.highlightImage = function() {
        var zIndex;

        // Push the actual image on top of all others by increasing its current z-index
        zIndex = parseInt(this.cache.jq.image.css("z-index"), 10);
        zIndex += 999;
        this.cache.jq.image.css("z-index", zIndex);
    };


    /**
     * Applies effects to the current object that are common to any type of transformation (scale | rotate | translate)
     * return {object}
     */
    CmfObject.prototype.addTransformFx = function() {
        // Push the selected object on top of all other design objects in the viewport
        this.highlightImage();

        // Apply styling to the image
        this.cache.jq.image.addClass("dragged");

        // Hide the grip
        this.cache.jq.grip.addClass("tpr-invisible");

        return this;
    };


    /**
     * Removes the common effects that were applied during last transformation
     * @return {object}
     */
    CmfObject.prototype.removeTransformFx = function() {
        // Return the object to its original depth (z-index before dragging started)
        this.cache.jq.image.css("z-index", this.zIndex);

        // Remove styling applied to the image
        this.cache.jq.image.removeClass("dragged");

        // Show the object's grip
        this.cache.jq.grip.removeClass("tpr-invisible");

        return this;
    };


    /**
     * Initiates the dragging of the viewport object
     * @param {Number} The initial horizontal coordinate of pointer
     * @param {Number} The initial vertical coordinate of pointer
     */
    CmfObject.prototype.dragStart = function(x0, y0) {

        var self = this;
        var translation = [0,0];    // horizontal and vertical position adjustment

        $doc.one("mousemove touchmove", function(){
            self.addTransformFx();
        });

        // move the selected object in relation to its original position
        $doc.on({
            mousemove: function (event) {
                translation = self.drag(event.pageX, event.pageY, x0, y0);
            },
            touchmove: function (event) {
                var touch = event.originalEvent.targetTouches[0];     // only the first finger counts
                translation = self.drag(touch.pageX, touch.pageY, x0, y0);
            }
        });

        $doc.on("mouseup touchend", function(){
            CMF.dashboard.enableWindowScrolling();
            self.dragEnd(translation);
        });

        return self;
    };


    /**
     * Drag the selected object to a new (i.e. "current") position
     * @param  Integer  x   The current horizontal coordinate of the pointer
     * @param  Integer  y   The current vertical coordinate of the pointer
     * @param  Integer  x0  The initial horizontal coordinate of the pointer
     * @param  Integer  y0  The initial vertical coordinate of the pointer
     */
    CmfObject.prototype.drag = function(x, y, x0, y0) {

        var xTranslation = x - x0;
        var yTranslation  = y - y0;

        this.svg.image.transform("T"+xTranslation+","+yTranslation+"R"+(-this.angle));

        return [xTranslation, yTranslation];
    };


    /**
     * Finalize the dragging of the object by saving its new position and detaching the "mousemove" event handler
     * @param  Array  The last horizontal (x) and vertical (y) translation values
     */
    CmfObject.prototype.dragEnd = function(translation) {

        // Store the new left|top coordinates after the transformation
        this.left += translation[0];
        this.top += translation[1];

        // Modify the x|y parameters of the svg image to reflect the new position after the transformation,
        // or otherwise on the next transformation, the original coordinates (x:0, y:0) will be used.
        this.svg.image.attr({
            "x" : this.left,
            "y" : this.top
        });

        // Reset the translation transformation, because the translation
        // is already reflected in the new (x,y) coordinates
        this.svg.image.transform("T0,0R"+(-this.angle));

        // Remove the "drag" event handler
        $doc.off("mousemove mouseup touchmove touchend");

        // Adjust the position and size of the object's grip element before making it visible again
        this.adjustGrip();

        // Remove drag-related styling from the design object's elements
        return this.removeTransformFx();
    };


    /**
     * Retrieves the coordinates of the object's pivot point coordinates. This is, by default, the same as the object's center.
     * @param  Boolean relateToDocument  Determines whether to compute the center coordinates in relation to the document margins or not
     * @return Array
     */
    CmfObject.prototype.getRotationPivotCoordinates = function(relateToDocument) {

        var xp = this.left + this.width/2;
        var yp = this.top + this.height/2;
        var offset = CMF.viewport.get('offset');

        if (relateToDocument === true) {
            xp += offset.left;
            yp += offset.top;
        }

        return {
            x: xp,
            y: yp
        };
    };


    /**
     * Computes the radius of the circle that will border the viewport object during rotation
     * @return Integer
     */
    CmfObject.prototype.getRotationCircleRadius = function() {

        var circleDiameter = Math.sqrt(Math.pow(this.width,2) + Math.pow(this.height,2));
        return (circleDiameter/2);
    };


    /**
     * Applies rotation-relation styling to a design object
     */
    CmfObject.prototype.addRotationEffects = function() {

        var center = this.getRotationPivotCoordinates();
        var radius = this.getRotationCircleRadius();

        // Append a rotation circle around the object image
        CMF.viewport.addRotationOutline(center, radius, {
            "stroke": "#000",
            "stroke-width" : 1
        });

        this.addTransformFx();

        return this;
    };


    /**
     * Removes any styling applied to the object during its rotation
     */
    CmfObject.prototype.removeRotationEffects = function() {

        CMF.viewport.removeRotationOutline();
        this.removeTransformFx();

        return this;
    };


    /**
     * Prepares an object for rotation
     * @param {Number} xc Initial cursor horizontal coordinate
     * @param {Number} yc Initial cursor vertical coordinate
     */
    CmfObject.prototype.rotateStart = function(xc, yc) {

        var self = this;

        // Determine the coordinates for the object's pivot point in relation to the document margins
        var pivot = this.getRotationPivotCoordinates(true);

        // Initial cursor coordinates in relation to the document margins
        var x0 = xc - pivot.x;
        var y0 = -(yc - pivot.y);

        // Compute the original angle
        var alpha0 = Math.atan(y0/x0);

        $doc.one("mousemove touchmove", function(){
            self.addRotationEffects();
        });

        $doc.on({
            mousemove: function (event) {
                self.rotate((event.pageX - pivot.x), -(event.pageY - pivot.y), alpha0);
            },
            touchmove: function (event) {
                var touch = event.originalEvent.targetTouches[0];     // only the first finger counts
                self.rotate((touch.pageX - pivot.x), -(touch.pageY - pivot.y), alpha0);
            }
        });

        $doc.on("mouseup touchend", function(){
            self.rotateEnd();
            CMF.dashboard.enableWindowScrolling();
        });

        return self;
    };


    /**
     * Rotate the object around its pivot point, P(0,0)
     */
    CmfObject.prototype.rotate = function(x, y, alpha0) {

        var alpha;  // the rotation angle

        // Determine the angle between the abscissa of the Cartesian system whose origin is the object's
        // pivot point, and the segment between the same system's origin and the current position of the pointer.
        if (x > 0) {
            if (y > 0) {
                // ===[ Quadrant I ]===
                alpha = Math.atan(y/x);
            } else if (y < 0) {
                // ===[ Quadrant IV ]===
                alpha = Math.atan(x/(-y)) + _3PI2;
            } else {    // y == 0
                alpha = 0;
            }
        } else if (x < 0) {
            if (y > 0) {
                // ===[ Quadrant II ]===
                alpha = Math.atan((-x)/y) + _PI2;
            } else if (y < 0) {
                // ===[ Quadrant III ]===
                // Non-optimized expression:  alpha = Math.atan((-y)/(-x)) + Math._PI2;
                alpha = Math.atan(y/x) + Math.PI;
            } else {    // x == 0
                alpha = Math.PI;
            }
        } else {    // x == 0
            if (y > 0) {
                alpha = _PI2;
            } else if (y < 0) {
                alpha = _3PI2;
            } else {    // y == 0
                /**
                 * In this scenario, the object needs to remain in its current position
                 */
                return this;
            }
        }

        // Determine the current rotation angle
        alpha = alpha - alpha0 + deg2rad(this.angle);

        // Filter the angle
        if (alpha < 0) {
            alpha += _2PI;
        }
        alpha = rad2deg(alpha) % 360;


        // "Snap" the object to 90x angles
        if ((alpha >= CMF.config.snapLimits.low360) || (alpha <= CMF.config.snapLimits.high360)) {
            alpha = 0;
        } else if ((alpha >= CMF.config.snapLimits.low270) && (alpha <= CMF.config.snapLimits.high270)) {
            alpha = 270;
        } else if ((alpha >= CMF.config.snapLimits.low180) && (alpha <= CMF.config.snapLimits.high180)) {
            alpha = 180;
        } else if ((alpha >= CMF.config.snapLimits.low90) && (alpha <= CMF.config.snapLimits.high90)) {
            alpha = 90;
        }

        // Rotate the object
        this.svg.image.transform("R"+(-alpha));   // Raphael.js rotates in a CW direction, while all calculations are made CCW. Hence the "-" sign.

        return this;
    };


    /**
     * Finalizes the rotation by saving the current rotation angle
     */
    CmfObject.prototype.rotateEnd = function() {

        var matrix = this.svg.image.matrix.split();
        this.angle = -(matrix.rotate);   // the SVG rotation transformation occurs CW, hence the "-" needed to convert it to CCW direction
        if (this.angle < 0) {
            this.angle += 360;
        }

        // Detach the "rotate" event handler
        $doc.off("mousemove touchmove").off("mouseup touchend");

        // Adjust the position and size of the object's grip element before making it visible again
        this.adjustGrip();

        // Remove all rotation-related styling and additional effects/elements
        this.removeRotationEffects();

        return this;
    };

    /**
     *
     * @param x0 Cursor's initial horizontal position
     * @param y0 Cursor's initial vertical position
     * @param sDir Scale direction
     * @returns {CMF.Object}
     */
    CmfObject.prototype.resizeStart = function(x0, y0, sDir)
    {
        var self = this;
        var bbox = this.svg.image.getBBox();
        var scx, scy, relscx, relscy;
        var w0, h0;
        var atan0;
        var limitScaleFactor;
        var offset = $objects.offset();

        switch (sDir) {
            case "se":
                scx = bbox.x;
                scy = bbox.y;
                break;
            case "sw":
                scx = bbox.x2;
                scy = bbox.y;
                break;
            case "nw":
                scx = bbox.x2;
                scy = bbox.y2;
                break;
            case "ne":
                scx = bbox.x;
                scy = bbox.y2;
                break;
        }

        w0 = bbox.width;
        h0 = bbox.height;

        atan0 = Math.atan(h0 / w0);
        relscx = scx + offset.left;
        relscy = scy + offset.top;
        limitScaleFactor = CMF.config.minObjectSize / w0;

        $doc.one("mousemove touchmove", function(){
            self.addTransformFx();
        });

        $doc.on({
            mousemove: function (event) {
                self.resize(event.pageX, event.pageY, scx, scy, relscx, relscy, bbox, atan0, limitScaleFactor);
            },
            touchmove: function (event) {
                var touch = event.originalEvent.targetTouches[0];     // only the first finger counts
                self.resize(touch.pageX, touch.pageY, scx, scy, relscx, relscy, bbox, atan0, limitScaleFactor);
            }
        });

        $doc.on("mouseup touchend", function(){
            CMF.dashboard.enableWindowScrolling();
            self.resizeEnd();
        });

        return self;
    };

    /**
     * @param x Current cursor horizontal coordinate
     * @param y Current cursor horizontal coordinate
     * @param scx Scale center horizontal coordinate, relative to SVG canvas
     * @param scy Scale center vertical coordinate, relative to SVG canvas
     * @param relscx Scale center horizontal coordinate, relative to document
     * @param relscy Scale center vertical coordinate, relative to document
     * @param w0 Initial object bounding box width
     * @param h0 Initial object bounding box height
     * @param atan0 Arctangent of bounding box inner angle
     * @param limitScaleFactor The value of the minimum accepted scale factor
     */
    CmfObject.prototype.resize = function(x, y, scx, scy, relscx, relscy, bbox, atan0, limitScaleFactor)
    {
        var rotation, scale;
        var dx = Math.abs(relscx - x);
        var dy = Math.abs(relscy - y);
        var atan1 = Math.atan(dy/dx);

        if (!CMF.config.shiftKey) {
            if (atan1 <= atan0) {
                this.scaleFactor = dy / bbox.height;
            } else {
                this.scaleFactor = dx / bbox.width;
            }
        } else {
            scx = bbox.x + bbox.width / 2;
            scy = bbox.y + bbox.height / 2;

            if (atan1 <= atan0) {
                this.scaleFactor = (2 * dy - bbox.height) / bbox.height;
            } else {
                this.scaleFactor = (2 * dx - bbox.width) / bbox.width;
            }
        }

        if (this.scaleFactor < limitScaleFactor) {
            this.scaleFactor = limitScaleFactor;
        }

        rotation = "R" + (-this.angle);
        scale = "S" + this.scaleFactor + "," + this.scaleFactor + "," + scx + "," + scy;

        this.svg.image.transform(rotation + scale);
    };

    /**
     *
     */
    CmfObject.prototype.resizeEnd = function()
    {
        var bbox = this.svg.image.getBBox();

        this.width *= this.scaleFactor;
        this.height *= this.scaleFactor;

        this.left = bbox.cx - this.width/2;
        this.top = bbox.cy - this.height/2;

        // Store the new width and height of the image
        this.svg.image.attr({
            width: this.width,
            height: this.height,
            x: this.left,
            y: this.top
        });

        // Remove the last resizing transformation effect by the applying a new scaling transformation
        // once the new width, height, x and y attributes of the SVG image have been changed
        this.svg.image.transform("S1R"+(-this.angle));

        // Reset the scaling transformation, because the size of the object
        // is now reflected in the new svg (width, height) attributes
        this.scaleFactor = 1;

        // Detach the "rotate" event handler
        $doc.off("mousemove touchmove").off("mouseup touchend");

        // Adjust the position and size of the object's grip element before making it visible again
        this.adjustGrip();

        this.setSizeOnPaper();

        // Remove all rotation-related styling and additional effects/elements
        return this.removeTransformFx();
    };


    CmfObject.prototype.getData = function(pxPositionCorrection) {
        if (!pxPositionCorrection) {
            pxPositionCorrection = 0;
        }

        var data = {
            type: this.type,
            url: this.url,
            angle: this.angle,
            pxWidth: this.pxWidth,
            pxHeight: this.pxHeight,
            inWidth: this.inWidth,
            inHeight: this.inHeight,
            width: parseInt(this.width, 10),
            height: parseInt(this.height, 10),
            left: parseInt(this.left + pxPositionCorrection, 10),
            top: parseInt(this.top + pxPositionCorrection, 10),
            trueLeft: parseInt(this.cache.dom.grip.style.left, 10) + 2,		// we're adding [borderWidth]px, the width of the grip's border, because the grip is positioned by -[borderWidth]px in regard to the object's actual top & left position
            trueTop: parseInt(this.cache.dom.grip.style.top, 10) + 2,
            zIndex: this.zIndex
        };

        if (this.type === "text") {
            $.extend(data, {
                color: this.color,
                fontSize: this.fontSize,
                fontFamily: this.fontFamily,
                fontWeight: this.fontWeight,
                fontStyle: this.fontStyle,
                textAlign: this.textAlign,
                textDecoration: this.textDecoration,
                textCurvature: this.textCurvature
            });
        }

        if (this.type !== "image") {
            data.text = this.text;
        }

        return data;
    };


    CmfObject.prototype.getTextStylingData = function() {
        if (this.type !== "text") {
            return;
        }

        return {
            "color": this.color,
            "font-family": this.fontFamily,
            "font-size": this.fontSize,
            "font-weight": this.fontWeight,
            "font-style": this.fontStyle,
            "text-decoration": this.textDecoration,
            "text-align": this.textAlign,
            "text-curvature": this.textCurvature
        };
    };


    CmfObject.prototype.applyTransformations = function() {

        this.svg.image.attr({
            width: this.width,
            height: this.height
        });

        // Reset the translation transformation, because the translation
        // is already reflected in the new (x,y) coordinates
        this.svg.image.transform("T0,0R"+(-this.angle));

        this.adjustGrip();

        this.select();

        return this;
    };

    return CmfObject;

})(jQuery);