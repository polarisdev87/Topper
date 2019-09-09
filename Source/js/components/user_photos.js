import localStorage from '../local_storage';

export default function UserPhotos () {
    const userPhotosStorageKey = 'tpr_user_photos';

    function get() {
        return localStorage.getItem(userPhotosStorageKey, []);
    }

    function add(fileName) {
        let userPhotos;

        userPhotos = localStorage.getItem(userPhotosStorageKey, []);
        userPhotos.push(fileName);

        localStorage.setItem(userPhotosStorageKey, userPhotos);

        return userPhotos;
    }

    function remove() {
        // @todo Implementation
    }

    return {
        get: get,
        add: add,
        remove: remove
    }
}
