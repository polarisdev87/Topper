var CMF = CMF || {};

CMF.template = (function($)
{
    function Template (data, productID)
    {
        this.data = data;
        this.data['ProductID'] = productID;
        this.svg = null;

        return this;
    }

    /**
     * Retrieves the value of a template property.
     *
     * @param key
     * @returns {*}
     */
    Template.prototype.get = function (key)
    {
        return this.data[key];
    };

    Template.prototype.getData = function ()
    {
        return this.data;
    };

    Template.prototype.drawEntireSheet = function (config)
    {
        var tpl = this;
        var height, width;

        /**
         * The ratio between the physical size of the template (e.g. 11 inches)
         * and the size of the template on screen, in pixels.
         *
         * @type {number}
         */
        var resolution;

        if (config.width) {
            resolution = config.width / tpl.data['Width'];
            width = config.width;
            height = resolution * tpl.data['Height'];
        } else if (config.height) {
            resolution = config.height / tpl.data['Height'];
            height = config.height;
            width = resolution * tpl.data['Width'];
        }

        this.svg = SVG(config.containerID).size(width, height);
        var paper = this.svg.rect(width, height).attr({
            'fill': config.color,
            'fill-opacity': config.opacity
        });
        var mask = this.svg.mask();
        var paperMask = this.svg.rect(width, height).fill('#FFF');
        var topperMask;
        var x, y;
        var cx, cy;

        switch (tpl.data['Topper']['Shape']) {
            case 'round':
                topperMask = this.svg.circle(
                    tpl.data['Topper']['Width'] * resolution    // width == height == diameter
                ).fill('#000');
                break;
            case 'rectangular':
                topperMask = this.svg.rect(
                    tpl.data['Topper']['Width'] * resolution,
                    tpl.data['Topper']['Height'] * resolution
                ).fill('#000');
                break;
        }

        mask.add(paperMask);

        for (x = 0; x < tpl.data['Matrix'].length; x++) {
            for (y = 0; y < tpl.data['Matrix'][0].length; y++) {
                if (tpl.data['Matrix'][x][y] == 0) {
                    continue;
                }

                cx = tpl.data['Margins']['Left'];
                cx += y * (tpl.data['Topper']['Width'] + tpl.data['Margins']['Horizontal']);
                cx += tpl.data['Topper']['Width'] / 2;
                cx *= resolution;

                cy = tpl.data['Margins']['Top'];
                cy += x * (tpl.data['Topper']['Height'] + tpl.data['Margins']['Vertical']);
                cy += tpl.data['Topper']['Height'] / 2;
                cy *= resolution;

                mask.add(topperMask.clone().center(cx, cy));
            }
        }

        paper.maskWith(mask);
        topperMask.remove();

        return {
            height: height,
            width: width
        };
    };

    Template.prototype.drawEditorPreview = function ()
    {
        var container = document.getElementById('tpr-template-editor-preview');
        var size;

        container.innerHTML = '';   // remove the existing preview, if any
        container.style.display = 'block';

        size = this.drawEntireSheet({
            containerID: 'tpr-template-editor-preview',
            width: 462,
            color: '#17a086',
            opacity: 0.7
        });

        document.getElementsByClassName('viewport')[0].style.height = size.height + 'px';
    }

    Template.prototype.drawViewport = function ()
    {
        this.drawEntireSheet({
            containerID: 'tpr-template-viewport',
            width: 462,
            color: '#C2D1E1',
            opacity: 0.9
        });
    };

    /**
     * Draw the template thumbnail SVG.
     *
     * @param width The width of the thumbnail on screen, specified in pixels.
     */
    Template.prototype.drawThumbnail = function (containerID)
    {
        var tpl = this;

        if (typeof containerID == 'undefined') {
            //containerID = 'tpr-product-thumb-' + tpl.data['ID'];
            containerID = 'tpr-product-thumb-' + this.data['ProductID'];
        }

        var options = {
            containerID: containerID,
            color: '#C2D1E1',
            opacity: 0.9
        };

        if (tpl.data['Width'] > tpl.data['Height']) {
            options.width = 80;
        } else {
            options.height = 100;
        }

        this.drawEntireSheet(options);
    };

    Template.prototype.drawSingleTopper = function ()
    {
        var tpl = this;

        var width = 462;

        /**
         * The ratio between the physical size of the topper (e.g. 2.1 inches)
         * and the size of the topper on screen, in pixels.
         *
         * @type {number}
         */
        var resolution = width / tpl.data['Topper']['Width'];

        var height = resolution * tpl.data['Topper']['Height'];
        var draw = SVG('tpr-template-viewport').size(width, height);
        var paper = draw.rect(width, height).attr({
            'fill': '#C2D1E1',
            'fill-opacity': 0.9
        });
        var mask = draw.mask();
        var paperMask = draw.rect(width, height).fill('#FFF');
        var topperMask;

        switch (tpl.data['Topper']['Shape']) {
            case 'round':
                topperMask = draw.circle(width).fill('#000');
                break;
            case 'rectangular':
                topperMask = draw.rect(width, height).fill('#000');
                break;
        }

        mask.add(paperMask);
        mask.add(topperMask.center(width/2, height/2));
        paper.maskWith(mask);
    };

    Template.prototype.hasMultipleToppers = function ()
    {
        if (this.data['DisallowDesignReplication'] == 1) {
            return false;
        }

        return !(
            typeof this.data['Matrix'][0][1] == 'undefined'
            && typeof this.data['Matrix'][1] == 'undefined'
        );
    };

    Template.prototype.getDefaultName = function ()
    {
        var topperCount = this.data['Matrix'].length * this.data['Matrix'][0].length;
        var name = '';

        switch (this.data['Topper']['Shape']) {
            case 'round':
                name = this.data['Topper']['Width'] + '" ';
                break;
            case 'rectangular':
                name = this.data['Topper']['Width'] + '" × ' + this.data['Topper']['Height'] + '" ';
                break;
        }

        name += this.data['Topper']['Shape'] + ' (' + topperCount + ')';

        return name;
    };

    Template.prototype.getDefaultDescription = function ()
    {
        return this.data['Width'] + '" × ' + this.data['Height'] + '" sheet';
    };

    Template.prototype._getSheetHeightOnScreen = function ()
    {
        var resolution = 462 / this.data['Width'];
        return resolution * this.data['Height'];
    };

    Template.prototype._getTopperHeightOnScreen = function ()
    {
        var resolution = 462 / this.data['Topper']['Width'];
        return resolution * this.data['Topper']['Height'];
    };

    Template.prototype.getPixelSize = function (surface, unit)
    {
        var value;

        if (surface == 'sheet') {
            value = this.data['Width'] / 462;
        } else {
            value = this.data['Topper']['Width'] / 462;
        }

        if (unit == 'cm') {
            value *= 2.54;
        }

        return value;
    };

    return Template;

})(jQuery);
