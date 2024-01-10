const FMSServerViewContent = function(_id) {
    const m_view_id = _id;
    let m_fms_server_info_interval_id = undefined;

    /***************************************************************************************************************/
    /* by shkoh 20190828: FMS Server View - Common Code Start                                                      */
    /***************************************************************************************************************/
    function createFMSServerView() {
        const inner_html =
        '<div id="grid-server-item-title-bar" class="grid-server item-title grid-item-draggable">' +
            '<h3 style="display:flex;">' +
                '<span id="grid-server-item-title" style="flex: 1;">서버 상태</span>' +
                '<span class="panel_close_icon"></span>' +
            '</h3>' +
        '</div>' +
        '<div id="grid-server-content" class="item-content">' +
            '<div style="display:flex; padding-bottom:1em;">' +
                '<div style="flex:1;">' +
                '</div>' +
                '<div class="server-usage">' +
                    '<div class="server-usage-title">cpu</div>' +
                    '<div class="server-usage-value"><span id="server-cpu"> - </span><span class="server-usage-unit">%</span></div>' +
                '</div>' +
                '<div style="flex:1;">' +
                '</div>' +
                '<div class="server-usage">' +
                    '<div class="server-usage-title">memory</div>' +
                    '<div class="server-usage-value"><span id="server-memory"> - </span><span class="server-usage-unit">%</span></div>' +
                '</div>' +
                '<div style="flex:1;">' +
                '</div>' +
            '</div>' +
            '<div id="server-disk">' +
            '</div>' +
        '</div>';

        $(m_view_id).html(inner_html);

        $('#grid-server-content').mCustomScrollbar({
            theme: 'minimal-dark',
            axis: 'y',
            scrollbarPosition: 'outside',
            mouseWheel: {
                preventDefault: true
            }
        });

        createDiskGrid();

        resizingFMSServerView();
    }

    function resizingFMSServerView() {
        const server_view_h = parseFloat($('#grid-server').height());
        const title_h = parseFloat($('#grid-server-item-title-bar').height());

        $('#grid-server-content').height(server_view_h - title_h - 20);
    }

    function createDiskGrid() {
        $('#server-disk').kendoGrid({
            dataSource: {
                schema: {
                    model: {
                        fields: {
                            path: { type: 'string' },
                            total_size: { type: 'nubmer' },
                            use_size: { type: 'number' },
                            item_usage: { type: 'number' }
                        }
                    }
                }
            },
            columns: [
                { field: 'path', title: 'Disk' },
                { field: 'total_size', title: 'Total', template: '#: total_size #<span class="server-disk-unit">GB</span>' },
                { field: 'use_size', title: 'Use', template: '#: use_size #<span class="server-disk-unit">GB</span>' },
                { field: 'item_usage', title: 'Usage', template: '#: item_usage #<span class="server-disk-unit">%</span>' }
            ]
        });
    }

    function pollingFMSServerInfo() {
        m_fms_server_info_interval_id = setInterval(function() {
            if($('#grid-server-content').length == 0) {
                clearInterval(m_fms_server_info_interval_id);
                return;
            }

            getFMSServerInfo();
        }, 5000);
    }

    function getFMSServerInfo() {
        $.ajax({
            async: true,
            cache: false,
            type: 'GET',
            dataType: 'json',
            url: '/api/monitoring/server'
        }).done(function(items) {
            const disk_array = [];

            items.forEach(function(item) {
                switch(item.item) {
                    case 'cpu': setCPU(item); break;
                    case 'MEM': setMemeory(item); break;
                    case 'disk': disk_array.push(item); break;
                }
            });

            setDisk(disk_array);
        }).fail(function(err_msg) {
            console.error(err_msg.responseText);
        });
    }

    function setCPU(item) {
        $('#server-cpu').text(item.item_usage.toFixed(1));
    }

    function setMemeory(item) {
        $('#server-memory').text(item.item_usage.toFixed(1));
    }

    function setDisk(disks) {
        $('#server-disk').data('kendoGrid').dataSource.data(disks);
    }
    /***************************************************************************************************************/
    /* by shkoh 20190828: FMS Server View - Common Code End                                                        */
    /***************************************************************************************************************/

    return {
        CreateFMSServerView: function() {
            createFMSServerView();
            pollingFMSServerInfo();
        },

        ResizingFMSServerView: function() { resizingFMSServerView(); }
    }
}