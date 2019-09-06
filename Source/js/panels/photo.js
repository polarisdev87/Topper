import cache from '../cache';
import { renderPanelTemplate as renderTemplate } from '../helper';
import DnDUploader from '../components/dnd_uploader';
import UserPhotos from '../components/user_photos';

export default function Photo () {
    function onSidebarPhotoMenuClicked () {
        let templateData,
            render,
            photosData = [],
            jsonUrl = cache.get('APP_API_URL') + '/ui',
            photos = UserPhotos().get();

        for (let photo of photos) {
            photosData.push({ photo_file: ' src="/images/' + photo +'" '});
        }

        templateData = {
            app_api_url: cache.get('APP_API_URL'),
            photos: photosData,
        };

        render = renderTemplate('photo', jsonUrl, {}, () => templateData, true);

        render.then(() => DnDUploader());
    }

    return {
        onSidebarPhotoMenuClicked: onSidebarPhotoMenuClicked,
    };
}
