let g_lvl = Number(new URLSearchParams(location.search).get('lvl'));
let g_grid = undefined;
let g_datasource = undefined;

$(window).on('resize', function() {
    resizeWindow();
});

$(function() {
    initGrid();
    initDataSource();
});

function resizeWindow() {
    if(g_grid) g_grid.resize();
}

function initGrid() {
    g_grid = $('#i-alert-list').kendoGrid({
        toolbar: function(e) {
            const toolbar_element = $('<div id="i-toolbar"></div>').kendoToolBar({
                resizable: false,
                items: [
                    {
                        type: 'buttonGroup',
                        buttons: [
                            { id: 'lvl1', text: '주의', togglable: true, selectable: true, selected: g_lvl === 1, attributes: { class: 'i-lvl-view i-lvl-1' }, toggle: onToggleGrade },
                            { id: 'lvl2', text: '경고', togglable: true, selectable: true, selected: g_lvl === 2, attributes: { class: 'i-lvl-view i-lvl-2' }, toggle: onToggleGrade },
                            { id: 'lvl3', text: '위험', togglable: true, selectable: true, selected: g_lvl === 3, attributes: { class: 'i-lvl-view i-lvl-3' }, toggle: onToggleGrade },
                            { id: 'lvl4', text: '통신이상', togglable: true, selectable: true, selected: g_lvl === 4, attributes: { class: 'i-lvl-view i-lvl-5' }, toggle: onToggleGrade }
                        ]
                    }
                ]
            });
            
            return toolbar_element;
        },
        pageable: {
            alwaysVisible: true,
            numeric: true,
            previousNext: true,
            messages: {
                empty: '조회한 장애현황이 없습니다',
                display: '{0} - {1}: 전체 장애현황: {2}건'
            }
        },
        resizable: true,
        scrollable: true,
        selectable: 'row',
        columns: [
            {
                width: '40px',
                template: '<div class="i-lvl-img i-lvl-img-#:data.alarm_level#"></div>',
                attributes: { class: 'i-background-white' }
            },
            {
                width: '12%',
                field: 'equip_kind',
                attributes: { class: 'i-alert-row' },
                title: '설비종류',
            },
            {
                width: '12%',
                field: 'equip_name',
                attributes: { class: 'i-alert-row' },
                title: '설비명'
            },
            {
                width: '10%',
                field: 'sensor_kind',
                attributes: { class: 'i-alert-row' },
                title: '센서종류'
            },
            {
                width: '15%',
                field: 'sensor_name',
                attributes: { class: 'i-alert-row' },
                title: '센서명'
            },
            {
                width: '12%',
                field: 'occur_date',
                attributes: { class: 'i-alert-row' },
                title: '발생시간'
            },
            {
                field: 'alarm_msg',
                attributes: { class: 'i-alert-row' },
                title: '장애내용'
            }
        ]
    }).data('kendoGrid');
}

function initDataSource() {
    g_datasource = new kendo.data.DataSource({
        transport: {
            read: {
                type: 'GET',
                dataType: 'json',
                url: '/api/monitoring/alarm'
            }
        },
        autoSync: false,
        batch: true,
        pageSize: 100
    });

    g_grid.setDataSource(g_datasource);

    setTimeout(function() {
        onToggleGrade();
    }, 0);
}

function onToggleGrade() {
    let filters = [];
    
    for(let idx = 1; idx < 5; idx++) {
        const has = $('#lvl' + idx).hasClass('k-state-active');
        
        if(has) {
            filters.push({ field: 'alarm_level', operator: 'eq', value: idx });

            if(idx === 4) {
                filters.push({ field: 'alarm_level', operator: 'eq', value: 5 });
            }
        }
    }

    if(filters.length > 0) {
        g_datasource.filter({
            logic: 'or',
            filters
        });
    } else {
        g_datasource.filter({ field: 'alarm_level', operator: 'eq', value: -1 });
    }

    g_datasource.read();
}