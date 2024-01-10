let g_interval = undefined;

const g_object_ids_arr = [
    [ 'outer_temp', 'outer_humi' ],
    [ 'b5f_temp', 'b5f_humi' ],
    [ '1f_temp', '1f_humi' ],
    [ 'a_2f_temp', 'a_2f_humi', 'b_2f_temp', 'b_2f_humi' ],
    [ 'a_3f_temp', 'a_3f_humi', 'b_3f_temp', 'b_3f_humi' ],
    [ 'a_4f_temp', 'a_4f_humi', 'b_4f_temp', 'b_4f_humi' ],
    [ 'a_6f_temp', 'a_6f_humi', 'b_6f_temp', 'b_6f_humi' ],
    [ 'a_7f_temp', 'a_7f_humi', 'b_7f_temp', 'b_7f_humi' ],
    [ 'a_8f_temp', 'a_8f_humi', 'b_8f_temp', 'b_8f_humi' ],
    [ 'avg_temp', 'avg_humi' ]
];

const g_floor_ids = [
    '"floor_b5"', '"floor_1"', '"floor_2"', '"floor_3"', '"floor_4"', '"floor_6"', '"floor_7"', '"floor_8"'
];

$(window).on('resize', function() {
    resizeWindow();
});

$(function() {
    resizeWindow();

    setFloorData();

    loadHVACData();
    loadOuterData();

    reloadData();

    $('.hvac-icon').on('click', function() {
        const run_mode = $(this).attr('class').includes('run');

        const equip_id = parseInt($(this).attr('equip-id'));
        if(isNaN(equip_id)) {
            alert('항온항습기 설비가 명시되지 않았습니다\n설비 설정 관련 내역을 확인하세요')
            return;
        }

        const ctrl_id = parseInt($(this).attr('ctrl-id'));
        if(isNaN(ctrl_id)) {
            alert('항온항습기 설비제어 ID가 존재하지 않거나, 설정 되지 않았습니다\n설비 등록 및 임계치 설정 관련 내역을 확인하세요');
            return;
        }

        const lvl = parseInt($(this).attr('equip-level'));
        if(isNaN(lvl) || lvl > 3) {
            alert('설비와 통신이 불가능한 상황입니다.\n' + (!run_mode ? '가동' : '정지') + ' 명령을 수행할 수 없습니다. 통신상태를 우선 확인하시기 바랍니다');
            return;
        }
        
        const equip_name = $(this).attr('equip-name');
        const isCtrl = confirm(equip_name + ' 설비를 ' + (!run_mode ? '가동' : '정지') + ' 하시겠습니까?');
        if(isCtrl) {
            $.ajax({
                async: true,
                type: 'POST',
                url: '/api/wrfis/icomer/hvacctrl',
                dataType: 'json',
                data: {
                    mode: !run_mode ? 'start' : 'stop',
                    equip_id: equip_id,
                    sensor_id: ctrl_id
                }
            }).done(function(result) {
                alert(result.msg);
            }).fail(function(err) {
                console.error(err);
                alert('제어명령을 전달하는 과정에서 에러가 발생했습니다');
            });
        }
    });

    $('.th-popup').on('dblclick', function() {
        const url = '/popup/chart?sensor_id=' + $(this).attr('popup-id');
        const target = 'SensorChart_S' + $(this).attr('popup-id');
        window.open(url, target, 'scrollbars=1, menubar=no, resizable=no, location=no, titlebar=no, toolbar=no, status=no, width=1000, height=400');
    });
});

/***************************************************************************************************************/
/* by shkoh 20210315: repeat start                                                                             */
/***************************************************************************************************************/
function reloadData() {
    g_interval = setInterval(function() {
        loadHVACData();
        loadOuterData();
    }, 5000);
}
/***************************************************************************************************************/
/* by shkoh 20210315: repeat end                                                                               */
/***************************************************************************************************************/

/***************************************************************************************************************/
/* by shkoh 20210315: resize window start                                                                      */
/***************************************************************************************************************/
function resizeWindow() {
    $('.i-row').height(calculateTableRowHeight());
}

function calculateTableRowHeight() {
    const main_viewer_height = parseFloat(parent['mainViewer'].innerHeight || parent['mainViewer'].clientHeight);
    const main_padding_height = 16;
    const header_height = parseFloat($('.i-panel.header1').height());
    const header2_height = parseFloat($('.i-panel.header2').height());
    const header_border_height = 6 * 2;
    const header_bottom_margin = 4 * 2;

    return main_viewer_height - main_padding_height - header_height - header2_height - header_border_height - header_bottom_margin;
}
/***************************************************************************************************************/
/* by shkoh 20210315: resize window end                                                                        */
/***************************************************************************************************************/

/***************************************************************************************************************/
/* by shkoh 20210315: load data start                                                                          */
/***************************************************************************************************************/
function setFloorData() {
    $.ajax({
        async: true,
        type: 'GET',
        cache: false,
        url: '/api/wrfis/icomer/floor?pagename=i_hvac&floorname=' + g_floor_ids.toString(),
        dataType: 'json'
    }).done(function(data) {
        setFloor(data);
    }).fail(function(err) {
        console.error(err);
    });
}

function loadHVACData() {
    $.ajax({
        async: true,
        type: 'GET',
        cache: false,
        url: '/api/wrfis/icomer/hvac?pagename=i_hvac',
        dataType: 'json'
    }).done(function(data) {
        setHeaderHVAC(data);
        setHVAC(data);
    }).fail(function(err) {
        console.error(err);
    });
}

function loadOuterData() {
    g_object_ids_arr.forEach(function(ids) {
        $.ajax({
            async: true,
            type: 'GET',
            cache: false,
            url: '/api/wrfis/icomer/hvac?pagename=i_hvac&objectname=' + ids.toString(),
            dataType: 'json'
        }).done(function(data) {
            setOuterInfo(ids, data);
        }).fail(function(err) {
            console.error(err);
        });
    });
}
/***************************************************************************************************************/
/* by shkoh 20210315: load data end                                                                            */
/***************************************************************************************************************/

/***************************************************************************************************************/
/* by shkoh 20210315: set hvac infomation start                                                                */
/***************************************************************************************************************/
function setFloor(data) {
    data.forEach(function(datum) {
        const ele = $('#' + datum.object_name);

        if(ele.length === 1) {
            const { group_id } = datum;

            ele.find('span').on('dblclick', function() {
                parent.exceptionMonitoring();

                parent.$("#navbar_middle").text("| 모니터링 |");
                parent.$("#navbar_end").text("FMS");
                parent.$("#navbar_end").on("click", function() {
                    parent.reloadIframe('/monitring');
                });

                parent.reloadIframe('/monitoring?groupId=' + group_id);
            });
        }
    });
}

function setHeaderHVAC(data) {
    const _count = data.length;
    const _run_count = data.filter(function(datum) { return datum.isRun === 'run'; }).length;
    const _stop_count = data.filter(function(datum) { return datum.isRun === 'stop'; }).length;
    const _run_ratio = _count === 0 ? 0 : (_run_count / _count) * 100;

    $('#hvac_count').text(_count);
    $('#hvac_run_count').text(_run_count);
    $('#hvac_stop_count').text(_stop_count);
    $('#hvac_ratio').text(_run_ratio.toFixed(1));
}

function setHVAC(data) {
    $('.hvac-panel[style="display: table-cell;"]').css('display', 'none');

    data.forEach(function(datum) {
        const ele = $('#' + datum.object_name);
        
        if(ele.length === 1) {
            const { isRun, equip_id, equip_level, equip_name, temp, humi, temp_level, humi_level, ctrlId, temp_id, humi_id } = datum;
            if(ele.css('display') === 'none') ele.css('display', 'table-cell');
            
            ele.find('.hvac-icon')
                .attr('equip-id', equip_id)
                .attr('ctrl-id', ctrlId)
                .attr('equip-name', equip_name)
                .attr('equip-level', equip_level)
                .removeClass('run0 run1 run2 run3 run4 run5 run6 stop0 stop1 stop2 stop3 stop4 stop5 stop6')
                .addClass(isRun + equip_level);

            let text_temp = equip_level > 3 ? ' - ' : temp.toFixed(1);
            let text_humi = equip_level > 3 ? ' - ' : humi.toFixed(1);
            let lvl_temp = 'lvl' + (equip_level > 3 ? equip_level : temp_level);
            let lvl_humi = 'lvl' + (equip_level > 3 ? equip_level : humi_level);
            
            ele.find('.th-icon-img.temp')
                .removeClass('lvl-1 lvl0 lvl1 lvl2 lvl3 lvl4 lvl5 lvl6')
                .addClass(lvl_temp);

            ele.find('.th-icon-text.temp')
                .removeClass('lvl-1 lvl0 lvl1 lvl2 lvl3 lvl4 lvl5 lvl6')
                .addClass(lvl_temp);

            ele.find('.th-icon-img.humi')
                .removeClass('lvl-1 lvl0 lvl1 lvl2 lvl3 lvl4 lvl5 lvl6')
                .addClass(lvl_humi);

            ele.find('.th-icon-text.humi')
                .removeClass('lvl-1 lvl0 lvl1 lvl2 lvl3 lvl4 lvl5 lvl6')
                .addClass(lvl_humi);
            
            ele.find('.th-icon-text.temp > .text').text(text_temp);
            ele.find('.th-icon-text.humi > .text').text(text_humi);

            ele.find('.temp.th-popup').attr('popup-id', temp_id);
            ele.find('.humi.th-popup').attr('popup-id', humi_id);
        }
    });
}

function setOuterInfo(ids, data) {
    ids.forEach(function(id) {
        const ele = $('#' + id);
        const datum = data.filter(function(d) { return d.object_name === id; })[0];

        if(datum) {
            const { lvl, val } = datum;
            ele.text(lvl > 3 ? ' - ' : val.toFixed(1));
            ele.parent().removeClass('lvl0 lvl1 lvl2 lvl3 lvl4 lvl5 lvl6').addClass('lvl' + lvl);
        } else {
            ele.text(' - ');
            ele.parent().removeClass('lvl0 lvl1 lvl2 lvl3 lvl4 lvl5 lvl6');
        }
    });
}
/***************************************************************************************************************/
/* by shkoh 20210315: set hvac infomation end                                                                  */
/***************************************************************************************************************/