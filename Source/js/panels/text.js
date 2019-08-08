import cache from '../cache';
import { renderPanelTemplate as renderTemplate } from '../helper';

export default function Photo () {
    function onSidebarTextMenuClicked () {
        let json_url = cache.get('APP_API_URL') + '/ui';
        renderTemplate('text', json_url, {}, (data) => data, true);
    }

    return {
        onSidebarTextMenuClicked: onSidebarTextMenuClicked,
    };
}
