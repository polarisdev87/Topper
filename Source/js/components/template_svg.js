import { SVG } from '@svgdotjs/svg.js';

/**
 *
 * @param tplData
 *  Example:
 *  {
 *      "Height": 11,
 *      "Width": 8.5,
 *      "MarginTop": 0.83,
 *      "MarginLeft": 0.68,
 *      "VerticalSpacing": 0.28,
 *      "HorizontalSpacing": 0.37,
 *      "TopperHeight": 3.5,
 *      "TopperWidth": 3.5,
 *      "Matrix": "r4c4,r2c2",
 *      "TopperShape": "round",
 *  }
 */
export default function TemplateSVG (tplData) {

    /**
     *
     * @param config
     *  Example:
     *  {
     *      "width": 10,
     *      "height: 20,
     *      "color": "#FF0000",
     *      "opacity": "0.7"
     *  }
     *
     *  @return SVG object
     */
    function drawEntireSheet (config) {

        let resolution, width, height, svg, paper, mask, paperMask, topperMask, cx, cy, columns, rows;

        if (config.width) {
            resolution = config.width / tplData['Width'];
            width = config.width;
            height = resolution * tplData['Height'];
        }
        else if (config.height) {
            resolution = config.height / tplData['Height'];
            height = config.height;
            width = resolution * tplData['Width'];
        }

        svg = SVG().size("100%", "100%").viewbox(0, 0, width, height);
        paper = svg.rect(width, height).attr({
            'fill': config.color,
            'fill-opacity': config.opacity,
        });
        mask = svg.mask();
        paperMask = svg.rect(width, height).fill('#FFF');

        switch (tplData['TopperShape']) {
            case 'round':
                topperMask = svg.circle(
                    tplData['TopperWidth'] * resolution,
                ).fill('#000');
                break;
            case 'rectangular':
                topperMask = svg.rect(
                    tplData['TopperWidth'] * resolution,
                    tplData['TopperHeight'] * resolution,
                ).fill('#000');
                break;
        }

        mask.add(paperMask);

        // Only get the first data (index 0)
        columns = tplData['Matrix'].split(",")[0].split('c')[1];
        rows = tplData['Matrix'].split(",")[0].split('c')[0].split('r')[1];

        if (columns !== undefined && rows !== undefined) {
            for (let x = 0; x < rows; x++) {
                for (let y = 0; y < columns; y++) {
                    cx = tplData['MarginLeft'];
                    cx += y * (tplData['TopperWidth'] + tplData['HorizontalSpacing']);
                    cx += tplData['TopperWidth'] / 2;
                    cx *= resolution;

                    cy = tplData['MarginTop'];
                    cy += x * (tplData['TopperHeight'] + tplData['VerticalSpacing']);
                    cy += tplData['TopperHeight'] / 2;
                    cy *= resolution;

                    mask.add(topperMask.clone().center(cx, cy));
                }
            }
        }

        paper.maskWith(mask);
        topperMask.remove();

        return svg;
    }

    /**
     *
     * @returns SVG object
     */
    function drawThumbnail () {
        let options;

        options = {
            color: '#f4f4f4',
            opacity: 0.9,
        };

        if (tplData['Width'] > tplData['Height']) {
            options.width = 104;
        }
        else {
            options.height = 138;
        }

        return drawEntireSheet(options);
    }

    function drawViewport () {
        return drawEntireSheet({
            width: 462,
            color: '#C2D1E1',
            opacity: 0.9
        });
    }

    return {
        drawEntireSheet: drawEntireSheet,
        drawThumbnail: drawThumbnail,
        drawViewport: drawViewport
    };
}
