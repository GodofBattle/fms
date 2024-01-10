// const g_series_color = [ '#227bc3', '#44c953', '#f96102' ];
const g_series_color = [ '#2f6c9e', '#398139', '#b01908', '#a3944e' ];

let g_loop = undefined;
let g_interval_bar_cnt = 0;

$(window).on('resize', function() {
    resizeWindow();
});

$(function() {
    resizeWindow();

    createPieChart($('body').hasClass('extra'));
    createBarChart($('body').hasClass('extra'));

    loadPUEData($('body').hasClass('extra'));

    loopInit();
});

/***************************************************************************************************************/
/* by shkoh 20210324: resize window start                                                                      */
/***************************************************************************************************************/
function resizeWindow() {
    $('.chart-panel').height(calculateChartPanelHeight());

    const dounut_chart = $('.pie-chart').data('kendoChart');
    const bar_chart = $('.bar-chart').data('kendoChart');
    
    if(dounut_chart) dounut_chart.resize();
    if(bar_chart) bar_chart.resize();
}

function calculateChartPanelHeight() {
    const main_viewer_height = parseFloat(parent['mainViewer'].innerHeight || parent['mainViewer'].clientHeight);
    const container_padding = 40;
    const pue_height = parseFloat($('.pue-panel').height());
    const pue_margin_height = 20;

    return main_viewer_height - container_padding - pue_height - pue_margin_height;
}
/***************************************************************************************************************/
/* by shkoh 20210324: resize window end                                                                        */
/***************************************************************************************************************/

/***************************************************************************************************************/
/* by shkoh 20210325: loop function start                                                                      */
/***************************************************************************************************************/
function loopInit() {
    g_loop = setTimeout(loop, 10000);
}

function loop() {
    loadPUEData($('body').hasClass('extra'));

    if(g_interval_bar_cnt < 60) g_interval_bar_cnt++;
    else {
        g_interval_bar_cnt = 0;
        const bar_chart = $('.bar-chart').data('kendoChart');
        if(bar_chart) {
            bar_chart.dataSource.read();
        }
    }

    clearTimeout(g_loop);
    g_loop = undefined;
    loopInit();
}
/***************************************************************************************************************/
/* by shkoh 20210325: loop function end                                                                        */
/***************************************************************************************************************/

/***************************************************************************************************************/
/* by shkoh 20210324: load data start                                                                          */
/***************************************************************************************************************/
function loadPUEData(is_extra) {
    $.ajax({
        async: true,
        type: 'GET',
        url: '/api/wrfis/icomer/pue?pagename=' + (is_extra ? 'i_pue_extra' : 'i_pue'),
        dataType: 'json'
    }).done(function(data) {
        setPUEData(data);
        setPreviousPUE(data);
    }).fail(function(err) {
        console.error(err);
    });
}
/***************************************************************************************************************/
/* by shkoh 20210324: load data end                                                                            */
/***************************************************************************************************************/

/***************************************************************************************************************/
/* by shkoh 20210324: set pue data start                                                                       */
/***************************************************************************************************************/
function setPUEData(data) {
    const dount_data = $('.pie-chart').data('kendoChart').dataSource.data();

    data.forEach(function(datum) {
        const ele = $('#' + datum.object_name);

        if(ele.length === 1) {
            let val = datum.val.toFixed(datum.object_name === 'pue' ? 2 : 1);
            ele.text(val);

            // by shkoh 20210325: dount chart에 데이터 적용
            const _data = dount_data.filter(function(item) { return item.name === datum.object_name; })[0];
            if(_data) {
                _data.set('value', val);
            }
        }
    });
}

function setPreviousPUE(data) {
    const pue_data = data.filter(function(datum) { return datum.object_name === 'pue'; })[0];
    const old_pue_data = data.filter(function(datum) { return datum.object_name === 'old_pue'; })[0];

    if(pue_data === undefined) return;

    const diff = pue_data.val - old_pue_data.val;
    // const diff = pue_data.val - old_pue_data.val + 1;
    $('#previous_pue').text(Math.abs(diff).toFixed(2));

    $('.pue > .values > .icon').removeClass('up, down');
    if(diff > 0) $('.pue > .values > .icon').addClass('up');
    else if(diff < 0) $('.pue > .values > .icon').addClass('down');
}
/***************************************************************************************************************/
/* by shkoh 20210324: set pue data end                                                                         */
/***************************************************************************************************************/

/***************************************************************************************************************/
/* by shkoh 20210324: pie-chart start                                                                          */
/***************************************************************************************************************/
function createPieChart(isExtra) {
    const pie_data = [{
        name: 'it_kw',
        category: 'IT 전력',
        value: 0
    }, {
        name: 'hvac_kw',
        category: 'IT 동력',
        value: 0
    }, {
        name: 'loss_kw',
        category: 'IT 전력손실',
        value: 0
    }];

    if(isExtra) {
        pie_data.push({ name: 'water_kw', category: '냉수 전력', value: 0 });
    }

    $('.pie-chart').kendoChart({
        dataSource: {
            data: pie_data
        },
        chartArea: {
            background: '',
            margin: {
                left: 25,
                right: 20,
                top: 15,
                bottom: 5
            }
        },
        seriesDefaults: {
            type: 'donut',
            startAngle: 150
        },
        seriesColors: g_series_color,
        series: [{
            field: 'value',
            categoryField: 'category',
            labels: {
                font: isExtra ? '13px KoPub Dotum' : '14px KoPub Dotum',
                visible: true,
                background: 'transparent',
                position: 'outsideEnd',
                color: '#333333',
                template: '#= category #: \n #= value #kW'
            }
        }],
        legend: {
            labels: {
                font: '14px KoPub Dotum',
                template: function(legend) {
                    let _circle = '';
                    switch(legend.dataItem.name) {
                        case 'it_kw': _circle = '① '; break;
                        case 'hvac_kw': _circle = '② '; break;
                        case 'loss_kw': _circle = '③ '; break;
                        case 'water_kw': _circle = '④ '; break;
                    }
                    return _circle + legend.text;
                }
            },
            offsetX: 10
        },
        theme: 'uniform'
    });
}
/***************************************************************************************************************/
/* by shkoh 20210324: pie-chart end                                                                            */
/***************************************************************************************************************/

/***************************************************************************************************************/
/* by shkoh 20210324: bar-chart start                                                                          */
/***************************************************************************************************************/
function createBarChart(is_extra) {
    $('.bar-chart').kendoChart({
        dataSource: {
            transport: {
                read: {
                    url: '/api/wrfis/icomer/puechart?pagename=' + (is_extra ? 'i_pue_extra' : 'i_pue'),
                    dataType: 'json'
                }
            }
        },
        title: {
            text: '월간 전력사용량(MWh)',
            font: '18px KoPub Dotum',
            color: '#333333'
        },
        chartArea: {
            background: '',
            margin: {
                left: 40,
                right: 20,
                top: 10,
                bottom: 10
            }
        },
        legend: {
            visible: true,
            position: 'top',
            offsetX: 600,
            offsetY: -30,
            labels: {
                font: '14px KoPub Dotum'
            }
        },
        seriesDefaults: {
            type: 'column',
            stack: true,
            labels: {
                visible: true,
                font: '10px KoPub Dotum',
                position: 'center',
                color: '#ffffff',
                template: function(data) {
                    if(data.value < 10) return '';
                    else return kendo.toString(data.value, '#,##.0');
                }
            }
        },
        series: [{
            name: 'IT 전력',
            field: 'it_mwh',
            categoryField: 'month'
        }, {
            name: 'IT 동력',
            field: 'hvac_mwh',
            categoryField: 'month'
        }, {
            name: 'IT 전력손실',
            field: 'loss_mwh',
            categoryField: 'month'
        }],
        seriesColors: g_series_color,
        valueAxis: {
            crosshair: {
                dashType: 'dot',
                tooltip: {
                    visible: true,
                    format: '{0:#,##.0}MWh'
                },
                visible: true
            },
            line: {
                visible: true
            },
            majorTicks: {
                visible: false
            },
            majorGridLines: {
                visible: false,
                step: 2
            },
            minorGridLines: {
                visible: false
            }
        },
        categoryAxis: {
            majorTicks: {
                visible: false
            },
            majorGridLines: {
                visible: false
            },
            minorGridLines: {
                visible: true,
                step: 2,
                skip: 1
            }
        },
        theme: 'uniform'
    });
}
/***************************************************************************************************************/
/* by shkoh 20210324: bar-chart end                                                                            */
/***************************************************************************************************************/