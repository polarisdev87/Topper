function LocalStorage () {

    function setItem (key, value) {
        window.localStorage.setItem(key, JSON.stringify(value));
    }

    function getItem (key, defaultVal) {
        let item;

        if (typeof defaultVal === 'undefined') {
            defaultVal = null;
        }

        item = window.localStorage.getItem(key);

        if (item === null) {
            item = defaultVal;
        }
        else {
            item = JSON.parse(item);
        }

        return item;
    }

    function hasItem (key) {
        let item = getItem(key);

        return !!item;
    }

    function removeItem (key) {
        window.localStorage.removeItem(key);
    }

    function clear () {
        window.localStorage.clear();
    }

    return {
        setItem: setItem,
        getItem: getItem,
        hasItem: hasItem,
        removeItem: removeItem,
        clear: clear,
    };
}

export default localStorage = LocalStorage();
