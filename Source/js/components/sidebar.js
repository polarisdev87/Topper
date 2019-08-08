import $ from 'jquery';
import mediator from '../mediator';
import cache from '../cache';

export default function SideBar ()
{
    const $sideBar = cache.get('$sideBar');
    const $subMenu = $sideBar.find('.sub-menu');
    const $navigationTabs = cache.get('$navigationTabs');

    // noinspection JSMismatchedCollectionQueryUpdate
    /**
     * Determines the relationships between the sidebar
     * buttons and the events which must be broadcast when
     * one of them is clicked, to open the associated panel.
     * @type {*[]}
     */
    let broadcastClickEvent = (targetPanel) =>
    {
        let event;

        switch (targetPanel) {
            case '#templates':     event = 'SidebarLayoutMenuClicked'; break;
            case '#saved-designs': event = 'SidebarSavedDesignMenuClicked'; break;
            case '#library':       event = 'SidebarLibraryMenuClicked'; break;
            case '#photo':         event = 'SidebarPhotoMenuClicked'; break;
            case '#text':          event = 'SidebarTextMenuClicked'; break;
            case '#clip-art':      event = 'SidebarClipArtMenuClicked'; break;
            case '#color':         event = 'SidebarColorMenuClicked'; break;
        }

        mediator.broadcast(event);
    };

    /**
     * Changes the side panel content, based on the
     * sidebar navigation item that was clicked on.
     * @param event
     */
    let changeSidebarPanel = (event) =>
    {
        const $clickTarget = $(event.currentTarget);
        const targetPanel = $clickTarget.attr('href');
        const $clickedTab = $clickTarget.parent();
        const navLevel = $clickedTab.attr('data-level');

        hideCurrentPanel();
        broadcastClickEvent(targetPanel);

        $clickedTab.addClass('active');
        $clickedTab.siblings().removeClass('active');

        if (navLevel === 'primary') {
            if (navigationTabHasSubMenu($clickedTab)) {
                toggleTabSubMenuVisibility($clickedTab, true);
            } else {
                toggleTabSubMenuVisibility($clickedTab, false);
            }
        }
    };

    /**
     * Determines whether the indication navigation bar
     * tab has a sub-menu of navigation tabs.
     * @param $tab
     * @returns {boolean}
     */
    let navigationTabHasSubMenu = ($tab) =>
    {
        return !!$tab.find('ul').length;
    };

    /**
     * Toggles the visibility of the indicated navigation
     * bar tab's submenu, either on or off.
     * @param $tab
     * @param visible
     */
    let toggleTabSubMenuVisibility = ($tab, visible) =>
    {
        if (visible) {
            $subMenu.addClass('open-desktop');
            $subMenu.children().first().addClass('active');
        } else {
            $subMenu.removeClass('open-desktop');
            $subMenu.children().removeClass('active');
        }
    };

    /**
     * Hides the currently visible content panel,
     * next to the navigation sidebar.
     */
    let hideCurrentPanel = () =>
    {
        cache.get('$scrollSidebar').find('.component-template').hide();
        cache.get('$mScrollSidebar').find('.component-template').hide();
    };

    let setEventListeners = () =>
    {
        $navigationTabs.on('click', changeSidebarPanel);
    };

    setEventListeners();

    $(() => {
        $sideBar.find('a[href="#templates"]').trigger('click');
    });

    return {};
}
