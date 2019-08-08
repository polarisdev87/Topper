import cache from '../cache';
import { renderPanelTemplate as renderTemplate } from '../helper';

export default function Library () {
    function onSidebarLibraryMenuClicked () {
        let json_url = cache.get('APP_BASE_URL') + '/ui';
        renderTemplate('library', json_url, {}, (data) => data, true);
    }

    return {
        onSidebarLibraryMenuClicked: onSidebarLibraryMenuClicked,
    };
}
