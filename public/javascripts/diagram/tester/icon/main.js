let g_upload_inst = undefined;
let g_items_inst = undefined;

let g_upload_icon_inst = undefined;

$(window).on('resize', function() {
    resizeWindow();
});

$(function() {
    initCytoscape();
    initFileUpload();

    initModalInput();

    loadItems();

    // by shkoh 20211101: 기본 기능 정의
    $('#btn-icon-bk-remove').on('click', removeBackgroundImageFile);
    $('#btn-icon-insert').on('click', itemInsert);
    $('#btn-icon-delete').on('click', itemDelete);
    $('#btn-icon-save').on('click', itemPositionSave);

    $('#modalDialogIcon').on('hide.bs.modal', itemReinitialize);

    // by shkoh 20211101: 아이콘 등록 Modal
    $('#btn-modal-footer-confirm').on('click', itemApply)
});

function resizeWindow() {
    if(g_items_inst) g_items_inst.Resize();
}

/******************************************************************************************************/
/* by shkoh 20211101: cytoscape start                                                                 */
/******************************************************************************************************/
function initCytoscape() {
    g_items_inst = new Items('cytoscape', {
        onDblclickWrfisPms: null,
        onDblclickWrfisBms1: null
    });
    g_items_inst.Create();
}
/******************************************************************************************************/
/* by shkoh 20211101: cytoscape end                                                                   */
/******************************************************************************************************/

/******************************************************************************************************/
/* by shkoh 20211101: controll button event start                                                     */
/******************************************************************************************************/
function removeBackgroundImageFile() {
    if($('#img').length === 0) {
        alert('등록된 배경 이미지가 존재하지 않습니다');
        return;
    }

    $.ajax({
        async: true,
        type: 'DELETE',
        url: '/api/diagram/tester/bkimage?type=' + $('#map').attr('data')
    }).done(function(xhr) {
        alert('배경이미지가 정상적으로 삭제됐습니다');
        location.reload();
    }).fail(function(err) {
        console.log(err);
        alert('배경이미지 삭제에 실패했습니다');
    });
}

function itemInsert() {
    $('#modal-dialog-icon-title').text('테스트 아이템 등록');
    $('#btn-modal-footer-confirm').text('등록');

    $('#modalDialogIcon').modal({ keyboard: false, show: true });
}

function itemDelete() {
    const item = g_items_inst.GetSelectedItem();
    if(item.length === 0) {
        alert('삭제하려는 항목을 선택하세요');
        return;
    } else if(item.length > 1) {
        alert('복수의 항목을 삭제할 수 없습니다\n한 개의 항목만 선택해주세요');
        return;
    }

    const item_name = item.data('type') === 'door' ? '출입문 아이콘' : item.data('name');
    const result = confirm(item_name + ' 항목을 삭제하시겠습니까?');
    if(result) {
        deleteItem(item).then(function(is_result) {
            if(is_result) {
                itemPositionSave().then(function(rst) {
                    loadItems();
                });
            }
        })
    }
}

function itemApply() {
    const apply_type = $('#btn-modal-footer-confirm').text();

    if(apply_type.includes('등록')) {
        addItem().then(function(is_result) {
            if(is_result) {
                itemPositionSave().then(function(rst) {
                    loadItems();
                });
            }
        });
    }

    $('#modalDialogIcon').modal('hide');
}

function itemReinitialize() {
    g_upload_icon_inst.clearAllFiles();
    $('#icon-label').val('');
}

function itemPositionSave() {
    return new Promise(function(resolve, reject) {
        const items = g_items_inst.GetAllItems();
        let saved_nodes = [];
        
        items.forEach(function(node) {
            const render_position = node.renderedPosition();
            const x = parseFloat(render_position.x / $(window).width());
            const y = parseFloat(render_position.y / $(window).height());

            // by shkoh 20211101: node들 중 위치가 변경된 node들만 저장
            if(node.data('pos_x') !== x.toFixed(3) || node.data('pos_y') !== y.toFixed(3)) {
                saved_nodes.push({
                    index: node.id(),
                    pos_x: x.toFixed(3),
                    pos_y: y.toFixed(3)
                });
            }
        });

        if(saved_nodes.length === 0) {
            alert('위치가 변경된 항목이 존재하지 않습니다.\n위치를 저장할 항목이 없습니다');
            resolve(true);
        } else {
            $.ajax({
                async: true,
                type: 'PATCH',
                url: '/api/diagram/tester/itempositions',
                data: {
                    new_pos: JSON.stringify(saved_nodes)
                }
            }).done(function(results) {
                alert(results.msg);
                g_items_inst.RepositionNodes(saved_nodes);
                resolve(true);
            }).fail(function(err) {
                console.error(err);
                alert('항목들의 위치 저장에 실패했습니다');
                resolve(false);
            });
        }
    });
}
/******************************************************************************************************/
/* by shkoh 20211101: controll button event end                                                       */
/******************************************************************************************************/

/******************************************************************************************************/
/* by shkoh 20211101: kendoui upload code start                                                       */
/******************************************************************************************************/
function initFileUpload() {
    g_upload_inst = $('#file-upload').kendoUpload({
        multiple: false,
        showFileList: false,
        localization: {
            select: '배경이미지 업로드'
        },
        validation: {
            maxFileSize: 4294967296
        },
        autoUpload: true,
        async: {
            saveUrl: '/api/diagram/tester/upload?type=' + $('#map').attr('data'),
            saveField: 'tester'
        },
        select: function(e) {
            displayLoading();

            const upload_file = e.files[0];
            if(!upload_file.rawFile.type.includes('image')) {
                alert(upload_file.name + ' 파일은 이미지 파일이 아닙니다\n이미지 파일만 등록 가능합니다');
                undisplayLoading();
                e.preventDefault();
            }

            if(upload_file.size > 4294967296) {
                alert('업로드 가능한 파일의 최대 크기는 4GB입니다');
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
/******************************************************************************************************/
/* by shkoh 20211101: kendoui upload code end                                                         */
/******************************************************************************************************/

/******************************************************************************************************/
/* by shkoh 20211101: kendoui modal input start                                                       */
/******************************************************************************************************/
function initModalInput() {
    g_upload_icon_inst = $('#file-icon-upload').kendoUpload({
        multiple: false,
        showFileList: true,
        localization: {
            select: '아이콘 업로드'
        },
        validation: {
            maxFileSize: 4294967296
        },
        async: {
            autoUpload: true,
            saveUrl: '/api/diagram/tester/upload?type=items',
            saveField: 'tester'
        },
        select: function(e) {
            displayLoading();

            const upload_file = e.files[0];
            if(!upload_file.rawFile.type.includes('image')) {
                alert(upload_file.name + ' 파일은 이미지 파일이 아닙니다\n이미지 파일만 등록 가능합니다');
                undisplayLoading();
                e.preventDefault();
            }

            if(upload_file.size > 4294967296) {
                alert('업로드 가능한 파일의 최대 크기는 4GB입니다');
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
            undisplayLoading();
        },
        upload: function(e) {
            const last_idx = getLastIdx() + 1;
            e.sender.options.async.saveUrl = '/api/diagram/tester/upload?type=items/' + last_idx.toString() + '&rename=' + last_idx.toString();
        }
    }).data('kendoUpload');
}
/******************************************************************************************************/
/* by shkoh 20211101: kendoui modal input end                                                         */
/******************************************************************************************************/

/******************************************************************************************************/
/* by shkoh 20211101: inline function start                                                           */
/******************************************************************************************************/
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
        url: '/javascripts/diagram/tester/icon/icon.json'
    }).done(function(data) {
        if(g_items_inst) g_items_inst.Redraw(data);
    });
}

function addItem() {
    return new Promise(function(resolve, reject) {
        const file = g_upload_icon_inst.getFiles()[0];
        if(!file) {
            alert('아이콘 이미지를 등록하세요');
            resolve(false);
        }

        let file_name = (getLastIdx() + 1).toString() + file.extension;

        $.ajax({
            async: true,
            type: 'POST',
            url: '/api/diagram/tester/item',
            dataType: 'json',
            data: {
                last_idx: getLastIdx(),
                name: $('#icon-label').val(),
                file_name: file_name
            }
        }).done(function() {
            resolve(true);
        }).fail(function(err) {
            console.error(err);
            resolve(false);
        });
    });
}

function deleteItem(item) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            async: true,
            type: 'DELETE',
            url: '/api/diagram/tester/item',
            data: {
                delete_id: item.id()
            }
        }).done(function() {
            resolve(true);
        }).fail(function(err) {
            console.error(err);
            const item_name = item.data('type') === 'door' ? '출입문 아이콘' : item.data('name');
            alert(item_name + ' 항목 삭제에 실패했습니다\n재확인 바랍니다');
            resolve(false);
        });
    });
}

function getLastIdx() {
    let last_idx = 0;
    g_items_inst.GetAllItems().forEach(function(item) {
        const id = Number(item.id());
        if(last_idx < id) last_idx = id;
    });

    return last_idx;
}
/******************************************************************************************************/
/* by shkoh 20211101: inline function end                                                             */
/******************************************************************************************************/