/// <reference path='../../../../typings/jquery/jquery.d.ts'/>

let g_treeViewController = undefined;

$(window).resize(function() {
    resizeWindow();
});

$(document).ready(function() {
    resizeWindow();

    initTreeView();
});

/***************************************************************************************************************/
/* by shkoh 20190214: Resizing Code Start                                                                      */
/***************************************************************************************************************/
function resizeWindow() {
    const mainViewer_height = parseFloat(parent['mainViewer'].innerHeight || parent['mainViewer'].clientHeight) - 54;
    $('.panel-body').height(mainViewer_height);
}
/***************************************************************************************************************/
/* by shkoh 20190214: Resizing Code End                                                                        */
/***************************************************************************************************************/

/***************************************************************************************************************/
/* by shkoh 20190215: Tree View Control Code Start                                                             */
/***************************************************************************************************************/
function initTreeView() {
    g_treeViewController = new TreeViewContent('#tree-content', {});
    g_treeViewController.CreateTreeView();

    $('#tree-content').mCustomScrollbar({
        theme: 'minimal-dark',
        axis: 'xy',
        scrollbarPosition: 'outside',
        mouseWheel: {
            preventDefault: true
        }
    });
}
/***************************************************************************************************************/
/* by shkoh 20190215: Tree View Control Code End                                                               */
/***************************************************************************************************************/