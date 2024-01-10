/// <reference path='../../../../typings/jquery/jquery.d.ts'/>
/// <reference path='../../../../typings/kendo-ui/kendo.all.d.ts'/>

let g_logMod = '';
let g_logIp = '';
let g_logPort = '';
let g_logDeviceId = '';
let g_logStatus = '';

$(window).resize(function() {
    resizeWindow();
})

$(document).ready(function() {
    resizeWindow();

    getLogInfo();

    $('#btnRefresh').on('click', function() { getLogInfo(); });
});

function resizeWindow() {
    const panel_h = parseFloat($('.panel').height());
    const panel_heading_h = parseFloat($('.panel-heading').height());
    const panel_heading_padding_top = parseFloat($('.panel-heading').css('padding-top'));
    const panel_heading_padding_bottom = parseFloat($('.panel-heading').css('padding-bottom'));

    $('.panel-primary .panel-body').height(panel_h - panel_heading_h - panel_heading_padding_top - panel_heading_padding_bottom);
}

/**
 * kdh 20180920 '통신로그보기' Title Data Load
 */
function getLogInfo() {
    $.ajax({
        async: true,
        type: 'GET',
        dataType: 'json',
        url: `/api/popup/log/info?equip_id=${g_equipId}`
    }).done(function(data) {
        g_logMod = data.log_mod;
        g_logIp = data.ip;
        g_logPort = data.port;
        g_logDeviceId = data.device_id;
        g_logStatus = data.log_status;

        showLogTitleInfo();
    }).fail(function(err_code) {
        alert('오류가 발생했습니다. 다시 시도해주세요.');
        console.error('[getLogInfo] ' + err_code);
    }).always(function() {
        getLogData();
    });
}

/**
 * kdh 20180920 '통신로그보기' Title Load
 */
function showLogTitleInfo() {
    $('#logMod').text(g_logMod);
    $('#logIp').text(g_logIp);
    $('#logPort').text(g_logPort);
    $('#logDeviceId').text(g_logDeviceId);
    markLogStatus();
}

/**
 * kdh 20180920 Title '통신상태' 레벨에 따른 스타일 적용
 */
function markLogStatus() {
    let style_value = { 'padding': '0px 4px 0px 3px', 'color': '#ffffff', 'border-radius': '4px' };
    switch(g_logStatus) {
        case '정상': style_value['background-color'] = '#0161b8'; break;
        case '주의': style_value['background-color'] = '#ff9c01'; break;
        case '경고': style_value['background-color'] = '#fe6102'; break;
        case '위험': style_value['background-color'] = '#de0303'; break;
        case '응답없음': style_value['background-color'] = '#511a81'; break;
        case '통신불량': style_value['background-color'] = '#000000'; break;
        case '사용안함': style_value['background-color'] = '#656565'; break;
        case 'Unknown': style_value['background-color'] = '#2F4F4F'; break;
        default: style_value['color'] = '#000000';
    }
    $('#logStatus').text(g_logStatus).css(style_value);
}

/**
 * kdh 20180920 로그 data
 */
function getLogData() {
    $.ajax({
        async: true,
        type: 'GET',
        url: `/api/popup/log/data?equip_id=${g_equipId}&log_mod=${g_logMod}&ip=${g_logIp}&port=${g_logPort}&d_id=${g_logDeviceId}`
    }).done(function(data) {
        const result = data.logData;
        const err = data.stderr;
        const error = data.error;
        
        if(err || error) {
            // alert('통신로그 데이터를 가져오는 데에 오류가 발생했습니다. 다시 시도해주세요.');
            console.log(err);
            console.log(error);
        }
        
        if(result.length == 0) {
            $('#log').text('확인 가능한 log 데이터가 없습니다.');
            return;
        }

        let resultStr = result.split('\n');

        resultStr.forEach(function(str, idx, arr) {
            let searchStr = str.substr(26, 1);
            
            if(searchStr == 4) {
                $('#log').append('<span class="L4">' + str + '</span>');
            } else if(searchStr > 4) {
                $('#log').append('<span class="L5">' + str + '</span>');
            } else $('#log').append('<span>' + str + '</span>');

            if(arr.length == idx+1) return;
            else $('#log').append('\n');
        });
    }).fail(function(xhr, textStatus, error) {
        alert('통신로그 데이터를 가져오는 데에 실패했습니다. 다시 시도해주세요.');
        console.log(xhr.responseText);
        console.log(xhr.statusText);
        console.log(textStatus);
        console.log(error);
    }).always(function() {
        $('.panel-primary .panel-body').mCustomScrollbar({
            theme: 'minimal-dark',
            axis: 'y',
            scrollbarPosition: 'outside'
        }).mCustomScrollbar('scrollTo', 'bottom', { scrollInertia: 0 });
    });
}