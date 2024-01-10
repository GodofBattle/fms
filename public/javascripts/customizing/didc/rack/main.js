let g_items = undefined;
let g_uploader_inst = undefined;
let g_type = undefined;
let g_popup_inst = undefined;
let g_rack_checker = undefined;

let g_navigation_data = {
    min: 10,
    normal: 18,
    max: 26,
    unit: '℃'
}

$(function() {
    //by MJ 2023.08.16 : 상호작용한거 맨처음에 적용
    initCytoscape();

    //by MJ 2023.08.16 : rack map 속성이 is-navigation면..initNavigation 메소드 실행되어 rack 도면 보여줌
    if($('#map').attr('is-navigation') === 'true') {
        initNavigation();
        initCheckBox();
    }

    if($.session.get('user-grade') === 'USR00') {
        initFloatingActionButton();
        initFileUpload();
    }

    loadItems();

    g_type = $('#map').attr('data');
});

/*************************************************************************************************************/
/* by shkoh 20230508: Cytoscape Start                                                                        */
/*************************************************************************************************************/

// by MJ 2023.08.16 : Cytoscape 기반의 시각화 및 상호작용을 초기화
function initCytoscape() {
    // by MJ 2023.08.16 : 아래 함수들을 설정으로 정의함
    g_items = new Items('cytoscape', {
        isIcomer: $.session.get('user-grade') === 'USR00',
        // by MJ 2023.08.16 : 아이템이 설정되었을 때 호출되는 setItem라는 콜백 함수
        onSet: setItem,
        onDuplicate: duplicateItem,
        onDelete: deleteItem,
        onTouchEnd: repositionItem,
        onPlayCamera: popupCamera,
        onEquipmentSetting: popupEquipmentSetting,
        onMoveMonitoring: moveMonitoring,
        navigator: g_navigation_data, 
        onDblClickRack: popupRack
    });
    // by MJ 2023.08.16 : 마지막으로 g_items.Create()가 호출되어 시각화 및 상호작용 구성 요소들을 생성
    g_items.Create();
}

// by MJ 2023.08.16 : 정렬 제한 기능 함수
function itemAlign(direction) {
    const selected_items = g_items.GetSelectedItem();
    const min_item_count = direction === 'vertical' || direction === 'horizontal' ? 3 : 2;

    if(selected_items.length < min_item_count) {
        alert('아이템 정렬를 위해서는 ' + min_item_count + '개 이상 항목을 선택하세요');
        return;
    }
    
    g_items.Align(direction);
}
/*************************************************************************************************************/
/* by shkoh 20230508: Cytoscape End                                                                          */
/*************************************************************************************************************/

/*************************************************************************************************************/
/* by shkoh 20230522: Navigation Start                                                                       */
/*************************************************************************************************************/
function initNavigation() {
    $('.cfd-min').text(g_navigation_data.min);
    $('.cfd-normal').text(g_navigation_data.normal);
    $('.cfd-max').text(g_navigation_data.max);
}
/*************************************************************************************************************/
/* by shkoh 20230522: Navigation End                                                                         */
/*************************************************************************************************************/

/*************************************************************************************************************/
/* by shkoh 20231026: Checkbox Button Start                                                                  */
/*************************************************************************************************************/
function initCheckBox() {
    g_rack_checker = $('#i-rack-checkbox').kendoCheckBoxGroup({
        inputName: 'rack-checker',
        layout: 'horizontal',
        items: [
            { label: '랙온도 상', value: 'rack-TT' },
            { label: '랙온도 중', value: 'rack-TM' },
            { label: '랙온도 하', value: 'rack-TB' },
        ],
        value: [ 'rack-TT', 'rack-TM', 'rack-TB' ],
        change: function(e) {
            [ 'rack-TT', 'rack-TM', 'rack-TB' ].forEach(function(key) {
                if(e.sender.value().find(function(type) { return type === key })) {
                    g_items.ShowItems(key);
                } else {
                    g_items.HiddenItems(key);
                }
            });
        }
    }).data('kendoCheckBoxGroup');
}
/*************************************************************************************************************/
/* by shkoh 20231026: Checkbox Button End                                                                    */
/*************************************************************************************************************/

/*************************************************************************************************************/
/* by shkoh 20230508: Floating Action Button Start                                                           */
/*************************************************************************************************************/
function initFloatingActionButton() {
    /* by MJ 2023.08.16 : 메뉴 버튼 클릭시(kendo ui) */
    $('#fab').kendoFloatingActionButton({
        icon: 'gear',
        positionMode: 'fixed',
        align: 'top end',
        alignOffset: {
            x: 15.0,
            y: 15.0
        },
        themeColor: 'secondary',
        size: 'small',
        enabled: true,
        items: [{
            icon: 'image-insert',
            cssClass: 'i-fab-image i-image-insert'
        }, {
            icon: 'comment-remove',
            cssClass: 'i-fab-image  i-image-remove'
        }, {
            icon: 'plus',
            label: '아이템 추가',
            cssClass: 'i-equip-insert'
        }, {
            icon: 'set-column-position',
            label: '위치저장',
            cssClass: 'i-equip-reposition'
        }, {
            icon: 'align-top-element',
            cssClass: 'i-fab-align i-align-top'
        }, {
            icon: 'align-bottom-element',
            cssClass: 'i-fab-align i-align-bottom'
        }, {
            icon: 'align-left-element',
            cssClass: 'i-fab-align i-align-left'
        }, {
            icon: 'align-right-element',
            cssClass: 'i-fab-align i-align-right'
        }, {
            icon: 'justify-between-vertical',
            label: '세로 간격',
            cssClass: 'i-fab-align i-align-vertical'
        }, {
            icon: 'justify-between-horizontal',
            label: '가로 간격',
            cssClass: 'i-fab-align i-align-horizontal'
        }, {
            icon: 'copy',
            label: '대량복사',
            cssClass: 'i-equip-copy'
        }, {
            icon: 'delete',
            label: '대량삭제',
            cssClass: 'i-equip-delete'
        }]
    });

    // by shkoh 20211229: 라이브러리 내에서 이벤트를 직접 수행할 경우, floating action button이 자동으로 닫힘으로 이를 방지하기 위해서 따로 구현
    $('.k-fab-item.i-image-insert').on('click', function(e) {
        addBackgroundImage();
    });

    $('.k-fab-item.i-image-remove').on('click', function(e) {
        if($('#img').length === 0) {
            alert('등록된 배경이미지가 존재하지 않습니다');
            return;
        }
        
        removeBackgroundImage();
    });

    $('.k-fab-item.i-equip-insert').on('click', function(e) {
        addItem();
    });

    $('.k-fab-item.i-equip-reposition').on('click', function(e) {
        itemPositionSave();
    });

    $('.k-fab-item.i-align-top').on('click', function(e) {
        itemAlign('top');
    });

    $('.k-fab-item.i-align-bottom').on('click', function(e) {
        itemAlign('bottom');
    });

    $('.k-fab-item.i-align-left').on('click', function(e) {
        itemAlign('left');
    });

    $('.k-fab-item.i-align-right').on('click', function(e) {
        itemAlign('right');
    });
    //by mj 2023.08.04 여기에 버튼 이벤트 작성
    $('.k-fab-item.i-align-vertical').on('click',function(e) {
        itemAlign('vertical');
    });

    $('.k-fab-item.i-align-horizontal').on('click',function(e) {
        itemAlign('horizontal');
    });
    
    $('.k-fab-item.i-equip-copy').on('click', function(e) {
        bulkCopy();
    });

    $('.k-fab-item.i-equip-delete').on('click', function(e) {
        bulkDelete();
    });
}
/*************************************************************************************************************/
/* by shkoh 20230508: Floating Action Button End                                                             */
/*************************************************************************************************************/

/*************************************************************************************************************/
/* by shkoh 20211229: File Upload Start                                                                      */
/*************************************************************************************************************/
function initFileUpload() {
    g_uploader_inst = $('#file-upload').kendoUpload({
        multiple: false,
        showFileList: false,
        localization: {
            select: '배경이미지 업로드'
        },
        validation: {
            maxFileSize: 4294967296
        },
        async: {
            saveUrl: '/api/rackDiagram/didc/upload?type=' + $('#map').attr('data'),
            saveField: 'didc'
        },
        autoUpload: true,
        select: function(e) {
            displayLoading();

            const upload_file = e.files[0];
            if(!upload_file.rawFile.type.includes('image')) {
                alert(upload_file.naem + ' 파일은 이미지 파일이 아닙니다\n이미지 파일만 업로드 가능합니다');
                undisplayLoading();
                e.preventDefault();
            }

            if(upload_file.size > 4294967296) {
                alert('업로드 가능한 파일의 크기는 최대 4GB입니다');
                undisplayLoading();
                e.preventDefault();
            }
        },
        progress: function(e) {
            $('.k-loading-text').text(e.percentComplete + '%');
        },
        success: function(e) {
            if(e.operation === 'upload') {
                alert(e.response.msg);
            }
        },
        error: function(e) {
            console.error(e);

            if(e.operation === 'upload') {
                alert('배경이미지 ' + e.files[0].name + ' 파일 업로드 중에 에러가 발생했습니다: ' + e.XMLHttpRequest.statusText);
            }
        },
        complete: function(e) {
            location.reload();
        }
    }).data('kendoUpload');
}
/*************************************************************************************************************/
/* by shkoh 20211229: File Upload End                                                                        */
/*************************************************************************************************************/

/*************************************************************************************************************/
/* by shkoh 20230508: inline function Start                                                                  */
/*************************************************************************************************************/
function displayLoading() {
    kendo.ui.progress($(document.body), true);
}

function undisplayLoading() {
    kendo.ui.progress($(document.body), false);
}

function loadItems() {
    $.ajax({
        async: true,
        type: 'GET',
        cache: false,
        url: '/api/rackDiagram/didc/items?page=' + $('#map').attr('data')
    }).done(function(items) {
        if(g_type === 'containment_m_a' || g_type === 'containment_m_b' || g_type === 'containment_m_c') {
            items.forEach(function(item) {
                const t = (Math.random() * (340 - 100)) + 100;
                item.t_val = (t / 10).toFixed(1) + '℃';
                item.t_lvl = t > 300 ? 3 : t > 250 ? 2 : t > 200 ? 1 : 0;

                const a = (Math.random() * (200 - 150)) + 150;
                item.a_val = (a / 10).toFixed(1) + 'A';
                item.b_val = ((200 - a) / 10).toFixed(1) + 'A';
            });
        }

        // by shkoh 20220323: 각 아이템의 상세한 정보는 WEB Server 내에서 처리하도록 함        
        if(g_items) g_items.Redraw(items, g_rack_checker ? g_rack_checker.value() : undefined);
    }).fail(function(err) {
        console.error(err);
    });
}

function addBackgroundImage() {
    $('#file-upload').trigger('click');
}

function removeBackgroundImage() {
    $.ajax({
        async: true,
        type: 'DELETE',
        url: '/api/rackDiagram/didc/bkimage?type=' + $('#map').attr('data')
    }).done(function(xhr) {
        alert('배경이미지가 정상적으로 삭제됐습니다');
        location.reload();
    }).fail(function(err) {
        console.error(err);
        alert('배경이미지 삭제에 실패했습니다');
    });
}

function addItem() {
    $.ajax({
        async: true,
        type: 'POST',
        url: '/api/rackdiagram/item',
        dataType: 'json',
        data: {
            page: $('#map').attr('data').toUpperCase(),
        }
    }).done(function() {
        alert('새로운 아이템 추가 됐습니다');
        loadItems();
    }).fail(function(err) {
        console.error(err);
        alert('아이템 추가 실패');
    });
}

function itemPositionSave() {
    const items = g_items.GetAllItems();
    let saved_nodes = [];
    
    items.forEach(function(node) {
        const render_position = node.renderedPosition();
        const x = parseFloat(render_position.x / $('#cytoscape').width());
        const y = parseFloat(render_position.y / $('#cytoscape').height());

        // by shkoh 20200925: node들 중 위치가 변경된 node들만 저장
        if(node.data('pos_x') !== x.toFixed(3) || node.data('pos_y') !== y.toFixed(3)) {
            saved_nodes.push({
                //by MJ 2023.10.16 : id로 수정
                index: node.data('id'),
                pos_x: x.toFixed(3),
                pos_y: y.toFixed(3)
            });
        }
    });

    if(saved_nodes.length === 0) {
        alert('위치가 변경된 항목이 존재하지 않습니다.\n위치를 저장할 항목이 없습니다');
    } else {
        $.ajax({
            async: true,
            type: 'PATCH',
            url: '/api/rackDiagram/itempositions',
            data: {
                new_pos: JSON.stringify(saved_nodes)
            }
        }).done(function(results) {
            alert(results.msg);
            g_items.RepositionNodes(saved_nodes);
        }).fail(function(err) {
            console.error(err);
            alert('항목들의 위치 저장에 실패했습니다');
        });
    }
}

function resaveItemPosition(repositioning_items) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            async: true,
            type: 'PATCH',
            url: '/api/rackDiagram/itempositions',
            data: {
                new_pos: JSON.stringify(repositioning_items)
            }
        }).done(function(results) {
            g_items.RepositionNodes(repositioning_items);

            resolve();
        }).fail(function(err) {
            console.error(err);
            alert('아이템 위치 저장 실패');

            reject();
        });
    });
}

//by MJ 2023.08.16 : 위치가 변경된 노드를 찾아서 반환하는 함수
function getRepositioningItems() {
    const items = g_items.GetAllItems();
    let saved_nodes = [];
    
    items.forEach(function(node) {
        const render_position = node.renderedPosition();
        const x = parseFloat(render_position.x / $('#cytoscape').width());
        const y = parseFloat(render_position.y / $('#cytoscape').height());

        // by shkoh 20200925: node들 중 위치가 변경된 node들만 저장
        if(node.data('pos_x') !== x.toFixed(3) || node.data('pos_y') !== y.toFixed(3)) {
            saved_nodes.push({
                index: node.data('id'),
                pos_x: x.toFixed(3),
                pos_y: y.toFixed(3)
            });
        }
    });

    return saved_nodes;
}

function setItem(item) {
    const size = {
        w: 1200,
        h: 650
    };

    const pos = {
        left: (window.screenLeft + (window.innerWidth / 2)) - (size.w / 2),
        top: (window.screenTop + (window.innerHeight / 2)) - (size.h / 2)
    };

    window.open('/didc/rackDiagram/popup?id=' + item.data('id'), 'RackDiagramItem_' + item.data('id'), 'scrollbars=1, menubar=no, resizable=yes, location=no, titlebar=no, toolbar=no, status=no, top=' + pos.top + ', left=' + pos.left + ', width=' + size.w + ', height=' + size.h);
}

function addCopyItem(item) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            async: true,
            type: 'POST',
            url: '/api/rackdiagram/item',
            dataType: 'json',
            data: {
                page: $('#map').attr('data').toUpperCase(),
                name: item.data('name'),
                p_name: item.data('p_name'),
                pos_x: parseFloat(item.data('pos_x')) + 0.05,
                pos_y: parseFloat(item.data('pos_y')),
                z_index: item.data('z_index'),
                width: item.data('width'),
                height: item.data('height'),
                type: item.data('type'),
                equip_id: item.data('equip_id')
            }
        }).done(function() {
            resolve();
        }).fail(function(err) {
            console.error(err, item);
            reject(err);
        });
    });
}

function addDeleteItem(item) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            async: true,
            type: 'DELETE',
            url: '/api/rackDiagram/item',
            data: {
                delete_id: item.id()
            }
        }).done(function() {
            resolve();
        }).fail(function(err) {
            console.error(err, item);
            reject(err);
        });
    });
}

function duplicateItem(item) {
    const is_confirm = confirm('선택한 아이템을 복제 하시겠습니까?');
    if(is_confirm) {
        addCopyItem(item)
        .then(function() {
            loadItems();
        })
        .catch(function(err) {
            console.error(err);
            alert('아이템 복제 실패');
        });
    }
}

function bulkCopy() {
    const is_confirm = confirm('선택한 아이템을 대량복제 하시겠습니까?');
    if(is_confirm) {
        displayLoading();

        const selected_items = g_items.GetSelectedItem().toArray();
        if(selected_items.length === 0) {
            alert('복제할 아이템을 선택하세요');
            undisplayLoading();
            return;
        }

        if(selected_items.length > 41) {
            alert('대량복제는 동시에 40개까지만 선택 가능합니다');
            undisplayLoading();
            return;
        }

        let idx = 0;
        for(const item of selected_items) {
            addCopyItem(item)
            .then(function() {
                idx++;
            })
            .finally(function() {
                if(idx === selected_items.length) {
                    loadItems();
                }
            });
        }

        undisplayLoading();
    }
}

function bulkDelete() {
    const is_confirm = confirm('선택한 아이템을 대량삭제 하시겠습니까?');
    if(is_confirm) {
        displayLoading();

        const selected_items = g_items.GetSelectedItem().toArray();
        if(selected_items.length === 0) {
            alert('삭제할 아이템을 선택하세요');
            undisplayLoading();
            return;
        }

        if(selected_items.length > 101) {
            alert('대량삭제는 동시에 100개까지만 선택 가능합니다');
            undisplayLoading();
            return;
        }

        let idx = 0;
        for(const item of selected_items) {
            addDeleteItem(item)
                .then(function() {
                    idx++;
                })
                .finally(function() {
                    if(idx === selected_items.length) {
                        loadItems();
                    }
                });
        }

        undisplayLoading();
    }
}

function deleteItem(item) {
    const is_corfirm = confirm('아이템을 삭제하시겠습니까?');
    if(is_corfirm) {
        $.ajax({
            async: true,
            type: 'DELETE',
            url: '/api/rackDiagram/item',
            data: {
                delete_id: item.id()
            }
        }).done(function() {
            alert('아이템이 삭제되었습니다');
        }).fail(function(err) {
            console.error(err);
            alert('아이템 삭제에 실패했습니다\n재확인 바랍니다');
        }).always(function() {
            loadItems();
        });
    }
}

function repositionItem(item) {
    if($.session.get('user-grade') === 'USR00') {
        // by shkoh 20220105: cytoscape의 element가 이동 이벤트 발생
        // by shkoh 20220105: 해당 기능은 관리자권한에서만 적용됨
        const repositioning_items = getRepositioningItems();
        if(repositioning_items.length > 0) {
            resaveItemPosition(repositioning_items).then(function() {
                loadItems();
            });
        }
    }
}

function popupCamera(item) {
    if(item.target.data('obj_id').substring(0, 1) !== 'E') {
        alert('카메라를 실행시키기 위해서는 해당 아이콘이 CCTV 설비로 연계하여 설정하셔야 합니다');
        return;
    }
    
    const id = item.target.data('obj_id').substring(2);
    window.open('/popup/camera/' + id, 'CAMERA VIEWER - ' + id, 'scrollbars=1, menubar=no, resizable=no, location=no, titlebar=no, toolbar=no, status=no, width=800, height=600');
}

function popupEquipmentSetting(item) {
    const id = item.data('obj_id');
    window.top.g_setting_window_opener = window.open('/popup/set/' + id, 'fmsSettingWindow', 'scrollbars=1, menubar=no, resizable=no, location=no, titlebar=no, toolbar=no, status=no, width=800, height=600');
}

function moveMonitoring(item) {
    const obj_id = item.target.data('obj_id');
    if(obj_id.substring(0, 1) !== 'E') {
        alert('연계설비 상세정보를 보기 위해서는 설비로 선택하셔야 합니다');
        return;
    }

    if(parent.onVerifyAlarmEquipment) {
        parent.onVerifyAlarmEquipment(obj_id.substring(2));
    }
}

// by MJ 2023.09.01 : rack 팝업창
function popupRack(item) {
    //by MJ 2023.09.11 : 연계설비명
    const equip_id = item.target.data('equip_id');
    //by MJ 2023.09.11 : 해당 설비명(name 변수에 조건에 따라 data.equip_name 또는 data.name 값을 할당)
    const data_name = item.target.data('name') === '' ? item.target.data('equip_name') === null ? '' : item.target.data('equip_name') : item.target.data('name');

    //by MJ 2023.09.11 : 배열로 담아서 전달
    let clicked_node = [ equip_id, data_name ];
    
    const size = {
        w: 600,
        h: 600
    };

    const pos = {
        left: (window.screenLeft + (window.innerWidth / 2)) - (size.w / 2),
        top: (window.screenTop + (window.innerHeight / 2)) - (size.h / 2)
    };
    // by MJ 2023.09.01 : window.open(주소, 이름, 설정)
    g_popup_inst = window.open('/didc/popup/rack?id=' + clicked_node, '설비 세부정보', 'scrollbars=1, menubar=no, resizable=yes, location=no, titlebar=no, toolbar=no, status=no, top=' + pos.top + ', left=' + pos.left + ', width=' + size.w + ', height=' + size.h);
}
/*************************************************************************************************************/
/* by shkoh 20230508: inline function End                                                                    */
/*************************************************************************************************************/