const tabList = [
    { Name: '온습도통계', Content: '온습도통계', url: '/reports/wrfis/temphumi' },
    { Name: 'UPS전력 사용현황', Content: 'UPS전력 사용현황', url: '/reports/wrfis/datadaily' },
    { Name: '항온항습기 운영현황', Content: '항온항습기 운영현황', url: '/reports/wrfis/datadaily' },
    { Name: 'PMS 사용현황', Content: 'PMS 사용현황', url: '/reports/wrfis/datadaily' },
    { Name: '설비 점검일지', Content: '설비 점검일지', url: '/reports/wrfis/datadaily' },
    { Name: '위험물 점검일지', Content: '위험물 점검일지', url: '/reports/wrfis/datadaily' },
    { Name: '전기 점검일지', Content: '전기 점검일지', url: '/reports/wrfis/datadaily' },
    { Name: 'DATA 운영관리일지', Content: 'DATA 운영관리일지', url: '/reports/wrfis/datadaily' },
    { Name: 'UPS 일지', Content: 'UPS 일지', url: '/reports/wrfis/upsdaily' },
    { Name: '전기 확인명세서', Content: '전기 확인명세서', url: '/reports/wrfis/datadaily' },
    { Name: '기계 확인명세서', Content: '기계 확인명세서', url: '/reports/wrfis/datadaily' }
]

$(window).resize(function() {
    resizeWindow();
});

$(document).ready(function() {
    resizeWindow();
    
    initTabStrip();
});

/**********************************************************************************************************************************************/
/* by shkoh 20200813: resizing start                                                                                                          */
/**********************************************************************************************************************************************/
function resizeWindow() {
    const content_h = tabStripContentHeight();
    $('.k-tabstrip .k-content').height(content_h);
    $('.tree-content').height(treeContentHeight(content_h));
    $('.report-content').height(reportContentHeight(content_h));
}

function tabStripContentHeight() {
    const viewer_h = parseFloat(parent['mainViewer'].innerHeight || parent['mainViewer'].clientHeight);
    const tab_items_h = parseFloat($('.k-tabstrip-items').height()) + 16;
    return viewer_h < tab_items_h ? tab_items_h : viewer_h;
}

function treeContentHeight(top_height) {
    const content_padding_h = 16;
    const panel_heading_h = parseFloat($('.panel-heading').height()) + 6;
    const panel_heading_padding_h = 8;
    return top_height - content_padding_h - panel_heading_h - panel_heading_padding_h;
}

function reportContentHeight(top_height) {
    const content_padding_h = 16;
    const header_h = parseFloat($('.panel-header').height()) + 10;
    const border_h = 6;

    const panel_heading_h = parseFloat($('.panel-heading').height()) + 6;
    const panel_heading_padding_h = 8;
    return top_height - content_padding_h - header_h - border_h - panel_heading_h - panel_heading_padding_h;
}
/**********************************************************************************************************************************************/
/* by shkoh 20200813: resizing end                                                                                                            */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20200813: tabstraip start                                                                                                         */
/**********************************************************************************************************************************************/
function initTabStrip() {
    $('#report-tab').kendoTabStrip({
        tabPosition: 'left',
        animation: {
            open: { effects: 'fadeIn' }
        },
        dataTextField: 'Name',
        dataContentUrlField: 'url',
        dataSource: tabList,
        contentLoad: function(e) {
            e.contentElement.style.height = tabStripContentHeight() + 'px';
        }
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20200813: tabstraip end                                                                                                           */
/**********************************************************************************************************************************************/

