/// <reference path='../../typings/jquery/jquery.d.ts'/>

// by shkoh 20180903: 브라우저의 Web Socket global 변수
let g_ws = undefined;
// by shkoh 20181105: 이벤트 알람 정보를 다룰 global 변수
let g_alarm_notification = undefined;

let g_is_sound = false;

let g_alarm_timer = undefined;
let g_alarm_list = [];

/***************************************************************************************************************/
/* by shkoh 20181105: Top Menu Event Start                                                                     */
/***************************************************************************************************************/
// by shkoh 20220321: iframe child로부터 데이터 처리 필요
$(window).on('message', function(e) {
    const { origin, data } = e.originalEvent;

    // by shkoh 20220321: kepco의 넥스챌의 대시보드와의 연계를 위해서 사용함
    let child_url = '';
    if($('body').hasClass('kepco')) {
        child_url = 'http://' + $('.fms_menu.has_outsourcing.dashboard').attr('viewer-host') + ':8081';
    }
    
    if(origin === child_url && data.equip_id) {
        onVerifyAlarmEquipment(data.equip_id);
    }
});

$(function() {
    // by shkoh 20220311: footer에 contextmenu 기능 끔
    $('footer').on('contextmenu', function() { return false; });

    getSessionInfoAndLoadViewer(true);
    
    // by shkoh 20181025: 알람팝업
    $("#popover-content").mCustomScrollbar({
        theme: "minimal-dark",
        axis: "y",
        scrollbarPosition: "outside"
    });

    // by shkoh 20180412: 현재 알람 버튼 클릭 시 [알람팝업]을 키고 끊다
    $('#current_alarm').on('click', function() {
        let alarm_cnt = $('#current_alarm .badge').text();

        if(parseInt(alarm_cnt) == 0) {
            $('#popoverAlarm').css({ display: 'none' });
        } else {
            if($('#popoverAlarm').css('display') == 'block') {
                $('#popoverAlarm').css({ display: 'none' });
            } else if($('#popoverAlarm').css('display') == 'none') {
                $('#popoverAlarm').css({ display: 'block' });
            }
        }
    });

    // by shkoh 20181105: 해당 클라이언트에서 알람 여부 변경
    $('#alarm-icon').on('click', function() {
        const child_document = $('#mainViewer').get(0).contentWindow || $('#mainViewer').get(0).contentDocument;
        if($(this).hasClass('alarm-status')) {
            $(this).removeClass('alarm-status').addClass('alarm-status-off');
        } else if($(this).hasClass('alarm-status-off')) {
            $(this).removeClass('alarm-status-off').addClass('alarm-status');
        }
    });

    $('.popover_top_header_button').on('click', function() {
        const result = confirm('미인지된 장애알람이 모두 삭제됩니다. 진행하시겠습니까?');
        
        if(result) onCloseAllAlarmPopup();
    });

    $('#logout').on('click', function() {
        let modal = confirm("로그아웃 하시겠습니까?");
        if(modal == false) return;

        $.ajax({
            async: true,
            type: 'POST',
            url: '/logout'
        }).always(function() {
            if(g_ws && g_ws.readyState === WebSocket.OPEN) {
                g_ws.close();
            }

            closeSettingWindow();
            
            $.session.clear();
            location.reload(true);
        });
    });

    // by shkoh 20180412: 메뉴 선택 시 클릭
    $('.fms_menu').on('click', function() {
        // by shkoh 20210219: 우리FIS에서는 현 시점에 메뉴를 표시
        $('.dropdown.wrfis, .dropdown.kepco').find('span').removeClass('selected-menu-wrfis');
        $(this).parents('.dropdown.wrfis, .dropdown.kepco').find('span').addClass('selected-menu-wrfis');
        
        const id = $(this).attr('data');
        const name = $(this).text();
        // by shkoh 20190116: 선택한 메뉴에서 dropdown 클래스를 가지고 있는 부모 클래스로부터 다시 span 클래스를 가진 자식노드의 text를 취한다
        const middle_text = $(this).parents('.dropdown').find('span').text();
        // by shkoh 20190116: 선택한 메뉴에서 기본메뉴인 경우 공란을 하위메뉴인 경우에는 하위 메뉴의 텍스트를 취함
        const end_text = $(this).hasClass('draopdown-toggle') == false ? $(this).text() : '';
        
        onSelectViewer(id, middle_text, end_text, name);
    });

    // by shkoh 20181011: 상단 메뉴를 클릭했을 때 기존의 iframe을 삭제한 후에 새로 변경된 trigger를 보내어 iframe 내 상황을 변경함
    $('.iframe-viewer-container').on('change', function(event, params) {
        // by shkoh 20210315: 이전 페이지의 URL이 메인이라면 Top 메뉴를 다시 나타나도록 애니메이션 적용
        // by shkoh 20210315: 경우에 따라서 아래에 다수 페이지에 애니메이션 효과를 적용시킬 수 있음
        // by shkoh 20211202: Top과 Header의 애니메이션 상태를 제거시킬 URL인지 판단하여 애니메이션 해제
        if(isCustomDashboard(params.previous)) offUnvisibleHeaderAndFooter();

        // by shkoh 20181011: iframe 내 화면이 변경될 때, 서버와의 연결이 끊어졌다면 클라이언트 페이지는 도로 login 페이지로 자동 이동함
        if(g_ws && g_ws.readyState === WebSocket.CLOSED) {
            alert('서버와의 연결이 알 수 없는 이유로 끊어졌습니다.\n다시 연결을 시도하시기 바랍니다.');

            closeSettingWindow();
        
            $.session.clear();
            location.reload(true);

            return;
        }

        const iframe = $('<iframe id="mainViewer" src="' + params.url + '" frameborder="0" allowfullscreen referrerpolicy="no-referrer" allowpaymentrequest="false"></iframe>');
        iframe.on('load', function() {
            // by shkoh 20180412: 상단 메뉴가 보이는 상황에서 iframe 영역을 선택하여도 메뉴가 사라지지 않는다.
            //                    그래서 강제적으로 iframe 영역을 선택할 때 열려 있는 메뉴를 강제적으로 닫음
            $(this).contents().find('body').on('click', function() {
                $('[data-toggle="dropdown"').each(function() {
                    if($(this).attr('aria-expanded') == 'true') $(this).dropdown('toggle');
                });
            });

            // by shkoh 20210315: 현재 열릴 페이지의 URL이 메인이면, Top Header 메뉴에 애니메이션 적용
            if(isCustomDashboard(params.url)) onUnvisibleHeaderAndFooter();
        });
        
        $('.iframe-viewer-container').append(iframe);
    });

    // by shkoh 20210420: alarm sound 초기화
    $('#alarmSound, #alarmSound1, #alarmSound2, #alarmSound3, #alarmSound4, #alarmSound5').on('ended', function() {
        g_is_sound = false;
    });
});
/***************************************************************************************************************/
/* by shkoh 20181105: Top Menu Event End                                                                       */
/***************************************************************************************************************/

/***************************************************************************************************************/
/* by shkoh 20181105: Top Menu Basic Functions Start                                                           */
/***************************************************************************************************************/
function recountAlarm(alarm_count) {
    $('#current_alarm .badge').text(alarm_count);

    // by shkoh 20181105: 알람의 개수가 0개일 경우에는 팝업 메시지를 완전히 보이지 않도록 수정함
    // by shkoh 20181105: 알람의 개수에 따라서 이하일 때에는 popover에 표시되는 화살표를 이동함
    if(alarm_count == 0) {
        $('#popoverAlarm').css({ display: 'none' });
    } else {
        // by shkoh 20210317: popover 알람의 arrow의 위치가 알람 개수에 따라서 조금씩 이동을 해야함
        // by shkoh 20210317: 따라서 전체 popover 사이즈에서 오른쪽 공백에서 badge 사이즈의 중간만큼 이동하여 arrow 화살표를 배치함
        const popover_width = parseFloat($('#popoverAlarm').width());
        const badge_width = parseFloat($('#current_alarm .badge').width()) / 2;
        const right_space_width = 98;
        $('.arrow').css({ left: (popover_width - right_space_width - badge_width).toString() + 'px' });
    }
}

/**
 * by shkoh 20180411: 웹서버로부터 사용자 정보를 가져온 후 시작 viewer를 로드함
 * by shkoh 20180806: 웹서버에서 사용자 기본 정보를 가져온 후부터 FMS 서비스가 시작됨. 순서가 중요!
 * 
 * @param {Boolen} true일 경우 시작 페이지를 로드함
 */
function getSessionInfoAndLoadViewer(isLoadaStartView) {
    $.ajax({
        async: true,
        url: '/',
        type: 'POST',
        dataType: 'json'
    }).done(function(sessionInfo) {
        if(sessionInfo) {
            $.session.set('user-id', sessionInfo.id);
            $.session.set('user-name', sessionInfo.user_name);
            $.session.set('user-grade', sessionInfo.grade);
            $.session.set('user-start-id', sessionInfo.basic_group_id);
        }
    }).always(function() {
        var userId = $.session.get('user-id');
        var userName = $.session.get('user-name');
        $('#navbar_user').text(userName ? userName + '(' + userId + ')' : userId);
    }).then(function() {
        // by shkoh 20180806: 로그인 후, 우선적으로 수행할 일은 사용자 정보를 session 페이지에 기록하는 일이다.
        // by shkoh 20180806: session 기록이 끝난 후에야 iframe에 추가할 내용을 호출함
        // by shkoh 20180806: start_viewer_url은 /views/index.ejs에 정의. router 호출과 연계를 짓기 위해서 일부러 사용함
        // by shkoh 20190116: start_middle_text은 /views/index.ejs에 정의. router 호출과 연계를 짓기 위해서 일부러 사용함
        // by shkoh 20190116: start_end_text은 /views/index.ejs에 정의. router 호출과 연계를 짓기 위해서 일부러 사용함
        if(isLoadaStartView) onSelectViewer(start_viewer_url, start_middle_text, start_end_text);
    }).then(function() {
        // by shkoh 20190103: 모든 페이지가 로드가 된 후에 웹소켓을 열고, 알람 Notification을 엶
        if(g_ws == undefined) initWebSocket();
        if(g_alarm_notification == undefined) initAlarmNotification();
    });
}

/**
 * iframe 내 URL 변경 함수
 * by shkoh 20180412: iframe 전환에 사용
 * 
 * @param {String} id Top Menu에서 선택한 고유 ID
 */
function onSelectViewer(id, middle_text, end_text, name = '') {
    let link_url = '';

    switch(id) {
        // by shkoh 20190313: 모니터링
        case 'monitoring': link_url = '/monitoring'; break;

        // by shkoh 20190313: 장애관리 >> 장애현황, 장애이력
        case 'dashboard_fault': link_url = '/alarm/dashboard'; break;
        case 'history_alarm': link_url = '/alarm/history'; break;
        
        // by shkoh 20190313: 데이터통계
        case 'statistics_data': link_url = '/data/statistics'; break;
        // by shkoh 20190925: 데이터 보고서
        case 'report_data': link_url = '/data/report'; break;
        // by shkoh 20190313: 설비정보(자산관리)
        case 'asset': link_url = '/data/asset'; break;
        // by shkoh 20231106: 작업 로그
        case 'worklog': link_url = '/data/worklog'; break;
        // by shkoh 20200812: 보고서
        case 'reports': link_url = '/reports'; break;

        /******************************************************************************/
        /* by shkoh 20200817: 우리FIS 전용 페이지 시작                                     */
        /******************************************************************************/
        case 'wrfis': link_url = '/wrfis'; break;
        case 'wrfis_pms': link_url = '/wrfis/pms/main'; break;
        case 'wrfis_pms_4f': link_url = '/wrfis/pms/4f'; break;
        case 'wrfis_pms_7f': link_url = '/wrfis/pms/7f'; break;
        case 'wrfis_bms': link_url = '/wrfis/bms/main'; break;
        case 'wrfis_bms_lead': link_url = '/wrfis/bms/lead'; break;
        case 'wrfis_bms_lithium': link_url = '/wrfis/bms/lithium'; break;
        case 'wrfis_cfd_8f': link_url = '/wrfis/cfd/8f'; break;
        case 'wrfis_pue': link_url = '/wrfis/pue'; break;
        case 'wrfis_pue_extra': link_url = '/wrfis/pueextra'; break;
        case 'reports_wrfis_hvacdiagram': link_url = '/reports/wrfis/hvacdiagram'; break;
        case 'reports_wrfis_thdiagram': link_url = '/reports/wrfis/thdiagram'; break;
        case 'reports_wrfis_temphumi': link_url = '/reports/wrfis/temphumi'; break;
        case 'reports_wrfis_temphumi_avg': link_url = '/reports/wrfis/temphumiavg'; break;
        case 'reports_wrfis_upsdaily': link_url = '/reports/wrfis/upsdaily'; break;
        case 'reports_wrfis_datadaily': link_url = '/reports/wrfis/datadaily'; break;
        case 'reports_wrfis_equipdaily': link_url = '/reports/wrfis/equipdaily'; break;
        case 'reports_wrfis_saftycheckdaily': link_url = '/reports/wrfis/saftycheckdaily'; break;
        case 'reports_wrfis_electriccheckdaily': link_url = '/reports/wrfis/electriccheckdaily'; break;
        case 'reports_wrfis_electricspec': link_url = '/reports/wrfis/electricspec'; break;
        case 'reports_wrfis_ups': link_url = '/reports/wrfis/upsusage'; break;
        case 'reports_wrfis_hvac': link_url = '/reports/wrfis/hvac'; break;
        case 'reports_wrfis_pms': link_url = '/reports/wrfis/pms'; break;
        case 'reports_wrfis_pue': link_url = '/reports/wrfis/pue'; break;
        case 'reports_wrfis_pue_extra': link_url = '/reports/wrfis/pueextra'; break;
        case 'setting_wemb': link_url = '/wrfis/wemb'; break;
        case 'setting_icomer': link_url = '/wrfis/icomer'; break;
        /******************************************************************************/
        /* by shkoh 20200817: 우리FIS 전용 페이지 끝                                      */
        /******************************************************************************/
        
        /******************************************************************************/
        /* by shkoh 20211202: 한국전력 대전 ICT 전용 페이지 시작                             */
        /******************************************************************************/
        case 'kepco': link_url = 'http://' + $('.fms_menu.has_outsourcing.dashboard').attr('viewer-host') + ':8081'; break;
        case 'kepco_temp_1f_1': link_url = '/kepco/diagram/temperature/1f_1'; break;
        case 'kepco_temp_1f_2': link_url = '/kepco/diagram/temperature/1f_2'; break;
        case 'kepco_temp_2f_1': link_url = '/kepco/diagram/temperature/2f_1'; break;
        case 'kepco_airview': link_url = 'http://' + $('.fms_menu.has_outsourcing.3d').attr('viewer-host') + ':8081/movie.html'; break;
        case 'kepco_pue': link_url = '/kepco/pue'; break;
        case 'kepco_power': link_url = '/kepco/power'; break;
        case 'kepco_rack': link_url = '/kepco/rack'; break;
        case 'kepco_light': link_url = '/kepco/light'; break;
        case 'kepco_security_b1f': link_url = '/kepco/diagram/security/b1f'; break;
        case 'kepco_security_1f': link_url = '/kepco/diagram/security/1f'; break;
        case 'kepco_security_2f': link_url = '/kepco/diagram/security/2f'; break;
        case 'kepco_security_3f': link_url = '/kepco/diagram/security/3f'; break;
        case 'kepco_security_4f': link_url = '/kepco/diagram/security/4f'; break;
        case 'kepco_light_b1f': link_url = '/kepco/diagram/light/b1f'; break;
        case 'kepco_light_1f': link_url = '/kepco/diagram/light/1f'; break;
        case 'kepco_light_2f': link_url = '/kepco/diagram/light/2f'; break;
        case 'kepco_light_3f': link_url = '/kepco/diagram/light/3f'; break;
        case 'kepco_light_4f': link_url = '/kepco/diagram/light/4f'; break;
        case 'kepco_asset_info': link_url = '/kepco/asset/info'; break;
        case 'kepco_asset_history': link_url = '/kepco/asset/history'; break;
        case 'kepco_camera': link_url = '/kepco/camera'; break;
        case 'kepco_setting_icomer': link_url = '/kepco/icomer'; break;
        /******************************************************************************/
        /* by shkoh 20211202: 한국전력 대전 ICT 전용 페이지 끝                               */
        /******************************************************************************/

        /******************************************************************************/
        /* by shkoh 20230504: DIDC 전용 페이지 시작                                       */
        /******************************************************************************/
        case 'didc_dashboard': link_url = '/didc/dashboard'; break;
        case 'didc_diagramhvac': link_url = '/didc/diagram/hvac'; break;
        case 'didc_diagramahu': link_url = '/didc/diagram/ahu'; break;
        case 'didc_diagrampower': link_url = '/didc/diagram/power'; break;
        case 'didc_diagramcontainment': link_url = '/didc/diagram/containment'; break;
        case 'didc_pue': link_url = '/didc/pue'; break;
        case 'didc_setting_icomer': link_url = '/didc/icomer'; break;
        case 'didc_containment': link_url = '/didc/diagram/containment?name=' + name; break;
        /******************************************************************************/
        /* by shkoh 20230504: DIDC 전용 페이지 끝                                        */
        /******************************************************************************/
        
        // by shkoh 20190313: 국민연금 센터구성
        case 'center_datacenter': link_url = '/nps/center/datacenter'; break;
        case 'dashboard_detail': link_url = '/nps/dashboard/detail'; break;

        // kdh 20200525 우리FIS 자산관리
        case 'inventory_info': link_url = '/inventory/info'; break;
        case 'inventory_asset': link_url = '/inventory/asset'; break;
        case 'inventory_history': link_url = '/inventory/history'; break;
        case 'inventory_report_asset': link_url = '/reports/wrfis/asset'; break;
        case 'inventory_report_repair': link_url = '/reports/wrfis/assetrepair'; break;
        case 'inventory_report_change': link_url = '/reports/wrfis/assetchange'; break;

        // by shkoh 20190313: 설정
        case 'setting_user': link_url = '/user'; break;
        case 'setting_sensor': link_url = '/sensor'; break;

        // by shkoh 20190313: FMS 사전정의 설정
        case 'predefine_code': link_url = '/predefine/code'; break;
        case 'predefine_equipment': link_url = '/predefine/equipment'; break;
        case 'predefine_inventory': link_url = '/predefine/inventory'; break;

        /******************************************************************************/
        /* by shkoh 20211101: UbiGuard FMS 5.6 Tester Page Start                      */
        /******************************************************************************/
        case 'icon_tester': link_url = '/test/icon'; break;
        /******************************************************************************/
        /* by shkoh 20211101: UbiGuard FMS 5.6 Tester Page End                        */
        /******************************************************************************/

        /******************************************************************************/
        /* by shkoh 20220720: 대통령경호처 전용 페이지 시작                                  */
        /******************************************************************************/
        case 'pss_dashboard': link_url = '/pss/dashboard'; break;
        case 'pss_setting_icomer': link_url = '/pss/icomer'; break;
        /******************************************************************************/
        /* by shkoh 20220720: 대통령경호처 전용 페이지 끝                                    */
        /******************************************************************************/
    }

    $('#navbar_middle').text('| ' + middle_text + (end_text == '' ? '' : ' |'));
    $('#navbar_end').text(end_text);
    $('#navbar_end').on('click', function() {
        reloadIframe(link_url);
    });

    reloadIframe(link_url);
}

/**
 * iframe src 새로고침
 * 
 * @param {String} url iframe내에서 새로고침할 URL
 */
function reloadIframe(url) {
    const old_url = $('.iframe-viewer-container').find('iframe').attr('src');

    $('.iframe-viewer-container').find('iframe').remove();
    window.CollectGarbage && window.CollectGarbage();

    $('.iframe-viewer-container').triggerHandler('change', { url: url, previous: old_url });
}

function exceptionSensorSetting() {
    // by shkoh 20210223: 우리FIS에서 센서 세팅 페이지로 이동할 때, 선택한 메뉴를 표시하는 부분을 강제로 없앨 수 밖에 없다
    // by shkoh 20210223: 이상하지만 어쩔 수 없이 활용함
    // by shkoh 20211201: 한국전력 대전 ICT 센터 추가
    $('.dropdown.wrfis, .dropdown.kepco').find('span').removeClass('selected-menu-wrfis');
    $('#dropdown-settings').find('span').addClass('selected-menu-wrfis');
}

function exceptionMonitoring() {
    // by shkoh 20210223: 우리FIS에서 모니터링 페이지로 이동할 때, 선택한 메뉴를 표시하는 부분을 강제로 없앨 수 밖에 없다
    // by shkoh 20210223: 이상하지만 어쩔 수 없이 활용함
    // by shkoh 20211201: 한국전력 대전 ICT 센터 추가
    $('#dropdown-monitoring').find('span').addClass('selected-menu-wrfis');
}

/**
 * #server_time에 time을 적용
 * 
 * @param {Date} time Top Menu Viewer에 적용하기 위한 시간
 */
function setServerTime(time) {
    const t = new Date(time);
    const MM = ('0' + (t.getMonth() + 1)).slice(-2);
    const dd = ('0' + t.getDate()).slice(-2);
    const HH = ('0' + t.getHours()).slice(-2);
    const mm = ('0' + t.getMinutes()).slice(-2);

    const column = t.getSeconds() % 2 == 0 ? ':' : ' ';
    
    // const time_str = t.getFullYear().toString() + '.' + MM + '.' + dd + ' | ' + HH + column + mm;
    const time_str = t.getFullYear().toString() + '/' + MM + '/' + dd + ' ' + HH + column + mm;
    $('#server_time').text(time_str);
}

/**
 * by shkoh 20210315
 * 특정 페이지의 Top Header와 Footer에 fade out 효과를 적용하여 사라지도록 함
 * Top Header에 마우스 오버가 되면 fade out 효과를 제거하여 다시 보이도록 하며, 마우스 포인터가 떠나면 다시 fade out 효과를 적용하여 사라지도록 함
 */
function onUnvisibleHeaderAndFooter() {
    $('.navbar').addClass('fadeOut animated');
    $('footer').addClass('fadeOut animated');
    $('body').addClass('paddingOut animated');

    $('.navbar').on('mouseover', function(evt) {
        $('.navbar').removeClass('fadeOut animated');
        $('footer').removeClass('fadeOut animated');
    });

    $('.navbar').on('mouseleave', function() {
        $('.navbar').addClass('fadeOut animated');
        $('footer').addClass('fadeOut animated');
    });
}

function offUnvisibleHeaderAndFooter() {
    $('.navbar').removeClass('fadeOut animated');
    $('footer').removeClass('fadeOut animated');
    $('body').removeClass('paddingOut animated');

    $('.navbar').off('mouseover');
    $('.navbar').off('mouseleave');
}

function isCustomDashboard(target_url) {
    let is_custom_url = false;

    // by shkoh 20211202: 전체화면으로 제공할 페이지의 URL을 정의
    const custom_urls = [
        '/wrfis',
        '/kepco',
        '/kepco/airview',
        'http://' + $('.fms_menu.has_outsourcing.dashboard').attr('viewer-host') + ':8081',
        'http://' + $('.fms_menu.has_outsourcing.3d').attr('viewer-host') + ':8082/dcim',
        '/pss/dashboard',
        '/didc/dashboard',
        '/didc/dashboard?id=2',
    ]

    for(let url of custom_urls) {
        if(url === target_url) {
            is_custom_url = true;
            break;
        }
    }    

    return is_custom_url;
}
/***************************************************************************************************************/
/* by shkoh 20181105: Top Menu Basic Functions End                                                             */
/***************************************************************************************************************/

/***************************************************************************************************************/
/* by shkoh 20181105: WebSocket Start                                                                          */
/***************************************************************************************************************/
/**
 * WebSocket 초기화 및 이벤트 설정
 */
function initWebSocket() {
    $('#i-server-connection-panel').hide();
    g_ws = new WebSocket('ws://' + location.host);

    g_ws.onopen = function(evt) {
        console.info('[Connect to WebSocket Server]');
        
        // by shkoh 20181024: websocket이 새로 연결이 될 경우에 접속한 클라이언트의 계정 정보를 websocket에게 알려줌
        g_ws.send(JSON.stringify({
            command: 'login',
            user_id: $.session.get('user-id'),
            type: 'client'
        }));
    }

    g_ws.onclose = function(evt) {
        $('#i-server-connection-panel').css('display', 'flex');
        console.info('[Close to WebSocket Server]');
    }

    g_ws.onerror = function(evt) {
        console.error('[error] ' + evt.data);
    }

    g_ws.onmessage = function(evt) {
        const server_msg = JSON.parse(evt.data);
        
        if(server_msg.command == 'servertime') {
            setServerTime(server_msg.date);

            // by shkoh 20220726: 대통령경호처 예외처리
            // by shkoh 20230725: 국방부 예외처리
            onCustomEventAlarm(server_msg);
        } else if(server_msg.command == 'event') {
            // by shkoh 20220727: 알람이벤트가 상당량 동시다발적으로 전송될 수 있음으로 이를 따로 콜백처리함
            setTimeout(function() {
                onEventAlarm(server_msg);
                // by shkoh 20220726: 대통령경호처 예외처리
                // by shkoh 20230725: 국방부 예외처리
                onCustomEventAlarm(server_msg);
            }, 0);
        } else {
            let child_document = undefined;

            try {
                child_document = $('#mainViewer').get(0).contentWindow || $('#mainViewer').get(0).contentDocument;
            } catch(error) {
                console.error(error);
                return;
            }

            const current_url = $('#mainViewer').attr('src');
            switch(current_url) {
                case '/monitoring':
                case '/nps/dashboard/fault':        // by shkoh 20190213: 국민연금관리공단 장애현황 페이지는 알람상황을 실시간 반영함
                case '/kepco/asset/info':
                case '/didc/dashboard':
                    child_document.redrawViewer(server_msg);
                break;
            }

            // by shkoh 2021r0503: 임계치 설정도 함께 viewer 화면을 갱신함
            if(server_msg.command === 'notify' && current_url.includes('/sensor')) {
                child_document.redrawViewer(server_msg);
            }
        }
    }
}

/**
 * 알람발생 시 알람정보를 토대로 알람처리를 진행
 * 
 * @param {JSON} alarm_info 알람발생 시 알람 정보
 */
function onEventAlarm(alarm_info) {
    // by shkoh 20181105: 모니터링 페이지에서 이벤트 발생 기능을 끄면, 알람을 표출하지 않는다.
    if($('#alarm-icon').hasClass('alarm-status-off')) return;

    addNotifiaction(alarm_info);
    addSound(alarm_info);

    if(g_alarm_timer === undefined) {
        g_alarm_timer = setTimeout(showAlarmNoti, 10);
    }
}

function onCustomEventAlarm(msg) {
    let child_document = undefined;
    try {
        child_document = $('#mainViewer').get(0).contentWindow || $('#mainViewer').get(0).contentDocument;
    } catch(error) {
        console.error(error);
        return;
    }

    const current_url = $('#mainViewer').attr('src');
    switch(current_url) {
        case '/pss/dashboard': {
            if(msg.command === 'servertime') {
                if(child_document.setServerTime) {
                    child_document.setServerTime(msg.date);
                }
            } else if(msg.command === 'event') {
                if(msg.alarm_history_id === 0 || msg.level > 0 && msg.level < 4) {
                    // child_document.loadAlarmList();
                }
            }
            break;
        }
        case '/didc/dashboard': {
            if(msg.command === 'servertime') {
                if(child_document.setServerTime) {
                    child_document.setServerTime(msg.date);
                }
            }
            break;
        }
    }
}
/***************************************************************************************************************/
/* by shkoh 20181105: WebSocket End                                                                            */
/***************************************************************************************************************/

/***************************************************************************************************************/
/* by shkoh 20181105: Notification Start                                                                       */
/***************************************************************************************************************/
/**
 * 알람팝업 초기화 및 기본 설정
 */
function initAlarmNotification() {
    g_alarm_notification = $('#alarmPopupContainer').kendoNotification({
        appendTo: '#alarmPopupContainer',
        autoHideAfter: 0,
        stacking: 'up',
        button: true,
        hideOnClick: false,
        show: onAlarmNotification,
        templates: [{
            type: 'alarm-occur',
            template:
            '<div id="alarm_history_id_#: alarm_history_id #" class="alarm-popup" title="더블 클릭하여 #: name # 설비로 이동" ondblclick="onVerifyAlarmEquipment(#: equip_id #)">' +
                '<table>' +
                    '<tr class="alarm-level alarm-level-#: level #">' +
                        '<td class="popup-icon" style="background-image: url(/img/alert/#: icon #_#: level #.png);">' +
                        '</td>' +
                        '<td class="popup-message">' +
                            '<div class="alarm-heading">#: alarm_level_message #</div>' +
                            '<div class="name-heading">#: name #</div>' +
                        '</td>' +
                        '<td class="popup-close" title="장애알람 닫기" onclick="onCloseAlarmPopup()">' +
                        '</td>' +
                    '</tr>' +
                    '<tr class="alarm-content">' +
                        '<td colspan="3">' +
                            '<div class="alarm-message">#: alarm_detail_message #</div>' +
                            '<div class="alarm-date">#: occur_type #시간: #: date #</div>' +
                        '</td>' +
                    '</tr>' +
                '</table>' +
            '</div>'
        }]
    })
    .data('kendoNotification');
}

/**
 * 알람 Notification이 나타나거나 숨겨진 후 발생되는 이벤트
 * 
 * @param {Object} event 알람 Notification 나타나거나 숨겨진 후 발생되는 이벤트 Object
 */
function onAlarmNotification(event) {
    const alarm_count = g_alarm_notification.getNotifications().length;

    recountAlarm(alarm_count);
}

/**
 * 알람 Notification 개별 닫기 버튼 클릭 시 이벤트 발생
 */
function onCloseAlarmPopup() {
    let event = window.event;
    event.stopImmediatePropagation();

    const close_element = event.target;
    $(close_element).parent().parent().parent().parent().parent().remove();

    onAlarmNotification();
}

function onCloseAllAlarmPopup() {
    g_alarm_notification.hide();

    recountAlarm(0);
}

/**
 * 미확인 알람 Notification을 더블클릭 했을 때 수행할 항목
 * 
 * @param {Number} equip_id equipment id
 */
function onVerifyAlarmEquipment(equip_id) {
    const current_url = $('#mainViewer').attr('src');
    if(current_url.includes('/monitoring')) {
        child_document = $('#mainViewer').get(0).contentWindow || $('#mainViewer').get(0).contentDocument;
        child_document.searchingEquipment(equip_id);
    } else {
        exceptionMonitoring();

        $("#navbar_middle").text("| 모니터링 |");
        $("#navbar_end").text("FMS");
        $("#navbar_end").on("click", function() {
            reloadIframe('/monitring');
        });

        reloadIframe('/monitoring?equipId=' + equip_id);
    }
}

/**
 * 이벤트 상황에 따라서 알람이벤트를 생성함
 * 
 * @param {JSON} info 이벤트 정보
 */
function addNotifiaction(info) {
    let msg = info.alarm_message.split(']');
    
    info.alarm_level_message = msg[0] + ']';
    info.alarm_detail_message = '';

    msg.forEach(function(message, index) {
        if(index > 0) {
            info.alarm_detail_message += message;
        }
    });

    info.alarm_detail_message = info.alarm_detail_message.substr(1);
    info.name = info.type == 'sensor' ? info.pname : info.name;
    info.equip_id = (info.type === 'sensor') ? info.pid : info.id;

    info.occur_type = info.alarm_history_id == 0 ? '장애 해제' : '장애 발생';
    
    // g_alarm_notification.show(info, 'alarm-occur');
    g_alarm_list.push(info);
}

function showAlarmNoti() {
    if(g_alarm_list.length !== 0) {
        const info = g_alarm_list.shift();
        g_alarm_notification.show(info, 'alarm-occur');

        g_alarm_timer = setTimeout(showAlarmNoti, 10);
    } else {
        clearTimeout(g_alarm_timer);
        g_alarm_timer = undefined;
    }
}

/**
 * 이벤트 상황에 따라서 알람 사운드를 생성
 * 
 * @param {JSON} info 이벤트 정보
 */
function addSound(info) {
    // by shkoh 20190927: alarm_history_id가 0이라는 의미는 장애가 해제됐음을 의미함으로 해제 시에는 사운드를 발생시키지 않는다.
    if(info.alarm_history_id == 0) return;

    if(g_is_sound) return;
    g_is_sound = true;

    setTimeout(function() {
        const sound_id = 'alarmSound' + ((info.level === undefined || info.level === null) ? '' : info.level);
        const sound = document.getElementById(sound_id);
        sound.play();
    }, 0);
}
/***************************************************************************************************************/
/* by shkoh 20181105: Notification End                                                                         */
/***************************************************************************************************************/

/**
 * 그룹 혹은 설비 설정 창을 close함
 * by shkoh 20180829: 로그아웃 혹은 페이지 이동 시 자동으로 팝업 페이지를 닫기 위해서 사용할 수 있음 
 */
function closeSettingWindow() {
    // by shkoh 20181005: g_setting_window_opener는 모니터링 페이지에서 window.open()할 때 지정함
    if(window.g_setting_window_opener != undefined && window.g_setting_window_opener.closed == false) {
        window.g_setting_window_opener.close();
        window.g_setting_window_opener = undefined;
    }
}