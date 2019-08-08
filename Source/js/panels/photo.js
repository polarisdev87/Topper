import cache from '../cache';
import { renderPanelTemplate as renderTemplate } from '../helper';
import DnDUploader from '../components/dnd_uploader'

export default function Photo () {
    function onSidebarPhotoMenuClicked () {
        let json_url = cache.get('APP_API_URL') + '/ui';
        let templateData = {
            app_api_url: cache.get('APP_API_URL')
        };
        let render = renderTemplate('photo', json_url, {}, () => templateData, true);

        render.then(() => DnDUploader());
    }

    return {
        onSidebarPhotoMenuClicked: onSidebarPhotoMenuClicked,
    };
}
