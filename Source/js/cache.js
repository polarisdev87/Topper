function Cache () {
    let items = {};

    function get (name) {
        return items[name];
    }

    function set (name, value, replaceDuplicate) {
        if (name in items) {
            if (replaceDuplicate) {
                del(name);
            }
            else {
                throw new Error('Name conflict: ' + name);
            }
        }
        items[name] = value;
    }

    function del (name) {
        if (name in items) {
            delete items[name];
        }
    }

    function has (name) {
        return (name in items);
    }

    return {
        get: get,
        set: set,
        del: del,
        has: has,
    }
}

// Export an instance/singleton
export default (Cache());
