function Mediator () {
    let components = {};

    function debug (args) {
        args = Array.prototype.slice.call(arguments);
        console.log(args.join(' | '));
    }

    function broadcast (event, args, source) {
        if (!event) {
            return;
        }

        args = args || [];
        for (let c in components) {
            if (typeof components[c]['on' + event] == 'function') {
                try {
                    source = source || components[c];
                    components[c]['on' + event].apply(source, args);
                }
                catch (err) {
                    debug(['Mediator error.', event, args, source, err].join(' '));
                }
            }
        }
    }

    function addComponent (name, component, replaceDuplicate) {
        if (name in components) {
            if (replaceDuplicate) {
                removeComponent(name);
            }
            else {
                throw new Error('Mediator name conflict: ' + name);
            }
        }
        components[name] = component;
    }

    function removeComponent (name) {
        if (name in components) {
            delete components[name];
        }
    }

    function getComponent (name) {
        return components[name];
    }

    function hasComponent (name) {
        return (name in components);
    }

    return {
        broadcast: broadcast,
        addComponent: addComponent,
        removeComponent: removeComponent,
        getComponent: getComponent,
        hasComponent: hasComponent,
    };
}

// Export an instance/singleton
export default (Mediator());
