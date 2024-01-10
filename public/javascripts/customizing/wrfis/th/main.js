let g_interval = undefined;

const g_object_ids_arr = [
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
})

$(function() {
    resizeWindow();

    setFloorData();

    loadTHData();
    loadAvgData();

    reloadData();

    $('.th-row').on('dblclick', function() {
        const url = '/popup/chart?sensor_id=' + $(this).attr('popup-id');
        const target = 'SensorChart_S' + $(this).attr('popup-id');
        window.open(url, target, 'scrollbars=1, menubar=no, resizable=no, location=no, titlebar=no, toolbar=no, status=no, width=1000, height=400');
    });
});

/***************************************************************************************************************/
/* by shkoh 20210316: repeat start                                                                             */
/***************************************************************************************************************/
function reloadData() {
    g_interval = setInterval(function() {
        loadTHData();
        loadAvgData();
    }, 5000);
}
/***************************************************************************************************************/
/* by shkoh 20210316: repeat end                                                                               */
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
    const header_height = parseFloat($('.i-panel').height());
    const header_border_height = 6;
    const header_bottom_margin = 4;

    return main_viewer_height - main_padding_height - header_height - header_border_height - header_bottom_margin;
}
/***************************************************************************************************************/
/* by shkoh 20210315: resize window end                                                                        */
/***************************************************************************************************************/

/***************************************************************************************************************/
/* by shkoh 20210316: load data start                                                                          */
/***************************************************************************************************************/
function setFloorData() {
    $.ajax({
        async: true,
        type: 'GET',
        cache: false,
        url: '/api/wrfis/icomer/floor?pagename=i_th&floorname=' + g_floor_ids.toString(),
        dataType: 'json'
    }).done(function(data) {
        setFloor(data);
    }).fail(function(err) {
        console.error(err);
    });
}

function loadTHData() {
    $.ajax({
        async: true,
        type: 'GET',
        cache: false,
        url: '/api/wrfis/icomer/th?pagename=i_th',
        dataType: 'json'
    }).done(function(data) {
        setTH(data);
    }).fail(function(err) {
        console.error(err);
    });
}

function loadAvgData() {
    g_object_ids_arr.forEach(function(ids) {
        $.ajax({
            async: true,
            type: 'GET',
            cache: false,
            url: '/api/wrfis/icomer/th?pagename=i_th&objectname=' + ids.toString(),
            dataType: 'json'
        }).done(function(data) {
            setAvgTH(ids, data);
        }).fail(function(err) {
            console.error(err);
        });
    });
}
/***************************************************************************************************************/
/* by shkoh 20210316: load data end                                                                            */
/***************************************************************************************************************/

/***************************************************************************************************************/
/* by shkoh 20210316: set th infomation start                                                                  */
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

function setTH(data) {
    $('.th-panel[style="display: table-cell;"]').css('display', 'none');
    $('.i-inner-header').css('display', 'none');
    $('.i-inner-th').css('display', 'none');

    data.forEach(function(datum) {
        const ele = $('#' + datum.object_name);

        if(ele.length === 1) {
            // by shkoh 20210318: 1F과 B5F의 경우에는 따로 그림을 표시해야함
            $('.i-inner-header[obj-id="' + datum.object_name + '"]').css('display', 'table-cell');
            $('.i-inner-th[obj-id="' + datum.object_name + '"]').css('display', 'table-cell');

            if(ele.css('display') === 'none') ele.css('display', 'table-cell');
            ele.find('.th-col').removeClass('lvl-1 lvl0 lvl1 lvl2 lvl3 lvl4 lvl5 lvl6');
            
            const { equip_level } = datum;

            for(let idx = 1; idx < 5; idx++) {
                if(datum['val_' + idx] === null) {
                    // by shkoh 20210317: 온습도계는 설비 당 최대 4개의 센서를 허용하나, 사용하지 않는 경우에는 해당 부분을 숨김
                    ele.find('.th-row[row-index="' + idx + '"]').addClass('hidden');
                } else {
                    ele.find('.th-row[row-index="' + idx + '"]').removeClass('hidden');
                    ele.find('.th-row[row-index="' + idx + '"]').attr('popup-id', datum['id_' + idx]);
                    
                    let _val = equip_level > 3 ? ' - ' : datum['val_' + idx].toFixed(1);
                    let _lvl = 'lvl' + (equip_level > 3 ? equip_level : datum['lvl_' + idx]);
 
                    ele.find('.th-col.th_' + idx).addClass(_lvl);
                    ele.find('.th-value.val_' + idx).text(_val);
                    ele.find('.th-unit.unit_' + idx).text(datum['unit_' + idx]);
                }
            }
        }
    });
}

function setAvgTH(ids, data) {    
    ids.forEach(function(id) {
        const ele = $('#' + id);
        const datum = data.filter(function(d) { return d.object_name === id; })[0];

        if(datum) {
            const { lvl, val } = datum;
            ele.text(lvl > 3 ? ' - ' : val.toFixed(1));
        } else {
            ele.text(' - ');
        }
    });
}
/***************************************************************************************************************/
/* by shkoh 20210316: set th infomation end                                                                    */
/***************************************************************************************************************/