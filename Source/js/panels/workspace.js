import $ from 'jquery';
import cache from '../cache';
import { getNested } from '../helper';
import TemplateSVG from '../components/template_svg';

export default function Workspace () {
    const $toolPanel = cache.get('$toolPanel');
    const $designPort = cache.get('$designPort');
    const $viewPort = $designPort.children('#viewport').eq(0);

    function onTemplateItemSelected (data) {
        let productName = getNested('Name', data);
        let productDescription = getNested('Description', data);

        $viewPort.html(TemplateSVG(data).drawViewport().svg());

        if (productName) {
            $toolPanel.find('.mr10').html(productName);
        }

        if (productDescription) {
            $toolPanel.find('.fs-extra-small').html(productDescription);
        }
    }

    return {
        onTemplateItemSelected: onTemplateItemSelected,
    };
}
