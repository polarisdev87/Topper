import cache from '../cache';
import { renderPanelTemplate as renderTemplate } from '../helper';

export default function Photo () {
    function onSidebarColorMenuClicked () {
        let json_url = cache.get('APP_BASE_URL') + '/ui';
        renderTemplate('color', json_url, {}, (data) => data, true);
    }

    return {
        onSidebarColorMenuClicked: onSidebarColorMenuClicked,
    };
}
