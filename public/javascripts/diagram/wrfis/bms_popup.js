let g_date_controller = undefined;

let g_chart_info = {
    'voltage1': { start_idx: 0, end_idx: 95, unit: 'V', color: '#8ebc00' },
    'voltage2': { start_idx: 96, end_idx: 191, unit: 'V', color: '#bc8e00' },
    'temperature1': { start_idx: 192, end_idx: 287, unit: '℃', color: '#8ebc00' },
    'temperature2': { start_idx: 288, end_idx: 383, unit: '℃', color: '#bc8e00' },
    'impedance1': { start_idx: 384, end_idx: 479, unit: '', color: '#8ebc00' },
    'impedance2': { start_idx: 480, end_idx: 575, unit: '', color: '#bc8e00' }
}

$(window).on('resize', function() {
    resizeWindow();
});

$(function() {
    window.resizeTo(1400, 760);

    initDateTimePicker();
    initButton();

    initChart();

    loadBMSInfo();
    loadData();
});

/********************************************************************************************/
/* by shkoh 20210302: resizing start                                                        */
/********************************************************************************************/
function resizeWindow() {
    $('.custom-chart').width(calculateChartWidth());

    Object.keys(g_chart_info).forEach(function(key) {
        resizingChart(key);
    });
}

function resizingChart(id) {
    const chart = $('#' + id + '-chart').data('kendoSparkline');
    if(chart) {
        chart.resize();
    }
}

function calculateChartWidth() {
    const window_w = parseFloat($(window).width());
    const window_padding_w = 32;
    const custom_table_title_w = parseFloat($('.custom-table-title').width());
    const custom_table_title_padding = 15;
    const custom_chart_padding_w = 10;

    return window_w - window_padding_w - custom_table_title_w - custom_table_title_padding - custom_chart_padding_w;
}
/********************************************************************************************/
/* by shkoh 20210302: resizing end                                                          */
/********************************************************************************************/

/********************************************************************************************/
/* by shkoh 20210225: initilize & define ui element start                                   */
/********************************************************************************************/
function initDateTimePicker() {
    g_date_controller = new DatePicker('#searching-date', {
        period: 'day',
        startDate: new Date()
    });
    g_date_controller.CreateDatePicker();
}

function initButton() {
    $('#btn-today').kendoButton({
        icon: 'clock',
        click: function() {
            g_date_controller.ResetDate(new Date());
        }
    });
    
    $('#btn-search').kendoButton({
        icon: 'search',
        click: function() {
            loadData();
        }
    });
}

function initChart() {
    Object.keys(g_chart_info).forEach(function(key) {
        createChart(key, g_chart_info[key].color, g_chart_info[key].unit);
    });
}

function createChart(id, color, unit) {
    $('#' + id + '-chart').kendoSparkline({
        type: 'column',
        theme: 'metro',
        chartArea: {
            margin: { top: 20 }
        },
        seriesColors: [ color ],
        seriesDefaults: {
            field: 'val',
            gap: 0.2,
            labels: {
                align: 'column',
                visible: true,
                template: function(o) {
                    if(o.dataItem.node_id % 3 === 0) return o.value;
                    else return '';
                }
            },
            tooltip: {
                visible: true,
                template: function(o) {
                    return o.dataItem.sensor_name + ': ' + o.value + unit;
                }
            }
        },
        valueAxis: {
            name: 'value'
        },
        categoryAxis: {
            field: 'sensor_name'
        }
    });
}
/********************************************************************************************/
/* by shkoh 20210225: initilize & define ui element end                                     */
/********************************************************************************************/

/********************************************************************************************/
/* by shkoh 20210225: data exchange function start                                          */
/********************************************************************************************/
function loadBMSInfo() {
    $.ajax({
        async: true,
        type: 'GET',
        url: '/api/diagram/wrfis/bms/info?id=' + $('#bms').attr('bms-id')
    }).done(function(item) {
        $('#panel-bms-title').text(item.title);
    }).fail(function(err) {
        console.error(err);
    });
}

function loadData() {
    $.ajax({
        async: true,
        type: 'GET',
        url: '/api/diagram/wrfis/bms/data?id=' + $('#bms').attr('bms-id') + '&day=' + $('#searching-date').val()
    }).done(function(item) {
        Object.keys(g_chart_info).forEach(function(key) {
            // by shkoh 20210302: BTECH_CQ2 BMS 설비는 하나의 설비에서 많은 센서들의 값을 순서대로 가져옴으로 각각의 항목내용(전압, 온도, 임피던스)의 시작 index와 끝 index를 미리 지정하여 해당 부분을 가져옴
            const s_i = g_chart_info[key].start_idx;
            const e_i = g_chart_info[key].end_idx;

            setData(key, item.slice(s_i, e_i));
            setValue(key, item.slice(s_i, e_i));
        });
    }).fail(function(err) {
        console.error(err);
    });
}
/********************************************************************************************/
/* by shkoh 20210225: data exchange function end                                            */
/********************************************************************************************/

/********************************************************************************************/
/* by shkoh 20210226: inline function start                                                 */
/********************************************************************************************/
function setData(id, data) {
    const chart = $('#' + id + '-chart').data('kendoSparkline');
    if(chart) {
        chart.findSeriesByIndex(0).data(data);
    }
}

function setValue(id, data) {
    let val_text = ' - '

    if(Array.isArray(data) && data.length > 0) {
        let sum = 0;
        sum = data.reduce(function(previus, current, current_idx, arr) {
            return previus + current.val;
        }, sum);

        val_text = Number(sum / data.length).toFixed(2);
    }

    $('#' + id + '-val').text(val_text);
}
/********************************************************************************************/
/* by shkoh 20210226: inline function end                                                   */
/********************************************************************************************/