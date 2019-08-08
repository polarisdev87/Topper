import $ from 'jquery';
import cache from './cache';
import mediator from './mediator';
import { unserializeConfigObject } from './helper';

import SideBar from './components/sidebar';
import TemplatesPanel from './panels/templates';
import LibraryPanel from './panels/library';
import PhotoPanel from './panels/photo';
import TextPanel from './panels/text';
import ColorPanel from './panels/color';
import WorkspacePanel from './panels/workspace';
import PopUpModal from './components/popup_modal';

const referrer = document.referrer.split('/')[0] + '//' + document.referrer.split('/')[2];

// Store the environment variables value into cache. Don't want to call `process.env` in other files.
cache.set('APP_BASE_URL', process.env.APP_BASE_URL);
cache.set('APP_API_URL', process.env.APP_API_URL);

// Store dashboard's sections selector in cache
cache.set('$document', $(document));
cache.set('$body', $('body'));
cache.set('$sideBar', $('.main-sidebar'));
cache.set('$navigationTabs', $('.main-sidebar a'));
cache.set('$scrollSidebar', $('.scroll-sidebar'));
cache.set('$mScrollSidebar', $('.app-mobile-tab'));
cache.set('$toolPanel', $('.top-panel'));
cache.set('$designPort', $('.main-template'));
cache.set('$actionPanel', $('.workspace-actions'));
cache.set('$loader', $('#loader'));


// Wrap register components into function and will executed when CONFIG ready
function registerComponents () {
    mediator.addComponent('main_menu', SideBar());
    mediator.addComponent('template_panel', TemplatesPanel());
    mediator.addComponent('library_panel', LibraryPanel());
    mediator.addComponent('photo_panel', PhotoPanel());
    mediator.addComponent('text_panel', TextPanel());
    mediator.addComponent('color_panel', ColorPanel());
    mediator.addComponent('workspace_panel', WorkspacePanel());
    mediator.addComponent('popup_modal', PopUpModal());
}


// Tell parent window if DOM is ready
window.parent.postMessage({ topperooAppReady: true }, referrer);

// Wait parent window to send CONFIG
window.addEventListener('message', event => {
    let config;

    if (event.origin !== referrer) {
        return;
    }

    if (typeof event.data.instanceId === 'undefined') {
        return;
    }

    config = unserializeConfigObject(event.data);

    cache.set('INSTANCE_ID', event.data.instanceId);
    cache.set('CONFIG', config);

    registerComponents();
});

// Show the rendered page
window.addEventListener('load', () => {
    setTimeout(() => {
        cache.get('$loader').fadeOut();
        cache.get('$body').addClass('body-show');
    }, 1000);
});


