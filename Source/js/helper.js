import $ from 'jquery';
import mustache from 'mustache';
import cache from './cache';

export function renderPanelTemplate (name, json_url, json_params, process_data, has_mobile) {
    let $scrollSidebar = cache.get('$scrollSidebar'),
        $mScrollSidebar = cache.get('$mScrollSidebar'),
        template_class = 'sidebar-' + name + '-component';

    if (typeof has_mobile === 'undefined') {
        has_mobile = false;
    }

    return new Promise((resolve, reject) => {
        let rendered_flag_name = template_class + '_rendered',
            rendered = cache.get(rendered_flag_name),
            app_base_url = cache.get('APP_BASE_URL');

        if (!rendered) {
            let xhr = $.get(json_url, json_params, 'json');
            xhr.done((data) => {
                let xhr = $.get(app_base_url + '/views/partials/' + name + '.html');
                xhr.done((html) => {
                    let desktop = $('#desktop', html),
                        mobile;

                    if (has_mobile) {
                        mobile = $('#mobile', html);
                    }

                    data = process_data(data);

                    $scrollSidebar.append(mustache.render(desktop.html(), data));

                    if (has_mobile) {
                        $mScrollSidebar.append(mustache.render(mobile.html(), data));
                    }

                    cache.set(rendered_flag_name, true);
                    resolve();
                });
                xhr.fail(() => reject());
            });
            xhr.fail(() => reject());
        }
        else {
            resolve();
        }

        // Show component template
        $scrollSidebar.find('.' + template_class).show();
        if (has_mobile) {
            $mScrollSidebar.find('.' + template_class).show();
        }

        if (has_mobile) {
            // This component have separated template for mobile and desktop
            $scrollSidebar.addClass('desktop-only');
            $mScrollSidebar.removeClass('hide');
        }
        else {
            // This component only have one template for mobile and desktop
            $scrollSidebar.removeClass('desktop-only');
            cache.get('$mScrollSidebar').addClass('hide');
        }
    });
}

export function getCurrencySymbol (currency) {
    let symbol = currency;
    switch (currency) {
        case 'USD':
            symbol = '$';
            break;
        case 'GBP':
            symbol = '£';
    }

    return symbol;
}

export function getQueryStringVal (name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    let regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    let results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

export function getNested (path, obj) {
    return path.split('.').reduce((xs, x) =>
        (xs && xs[x]) ? xs[x] : undefined, obj);
}

export function unserializeConfigObject (config) {
    for (let key in config) {
        if (config.hasOwnProperty(key)) {
            if (key === 'callbacks') {
                for (let cb in config[key]) {
                    if (config[key].hasOwnProperty(cb)) {
                        config[key][cb] = new Function('return ' + config[key][cb])();
                    }
                }
            }
        }
    }

    return config;
}
