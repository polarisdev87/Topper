import cache from '../cache';
import { renderPanelTemplate as renderTemplate } from '../helper';
import DnDUploader from '../components/dnd_uploader'

export default function Photo () {
    function onSidebarPhotoMenuClicked () {
        let json_url = cache.get('APP_BASE_URL') + '/ui';
        let render = renderTemplate('photo', json_url, {}, (data) => data, true);

        render.then(() => DnDUploader());
    }

    return {
        onSidebarPhotoMenuClicked: onSidebarPhotoMenuClicked,
    };
}
