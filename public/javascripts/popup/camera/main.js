$(window).on('resize', function() {
    resizeWindow();
});

$(function() {
    resizeWindow();

    setTimeout(() => {
        getCameraViewing();
    }, 0);
});

function resizeWindow() {
    const window_h = parseFloat($(window).height());
    
    const panel_border_width = 3 + 3;
    const panel_header_h = parseFloat($('.panel-heading').height());
    const panel_header_padding_top_h = parseFloat($('.panel-heading').css('padding-top'));
    const panel_header_padding_bottom_h = parseFloat($('.panel-heading').css('padding-bottom'));
    const panel_padding_top = parseFloat($('.container-fluid').css('padding-top'));
    const panel_padding_bottom = parseFloat($('.container-fluid').css('padding-bottom'));

    $('.panel-body').height(window_h - panel_border_width - panel_header_h - panel_header_padding_top_h - panel_header_padding_bottom_h - panel_padding_top - panel_padding_bottom);
}

function getCameraViewing() {
    displayLoading();

    $.ajax({
        cache: true,
        type: 'GET',
        dataType: 'json',
        contentType: 'application/json',
        url: '/api/popup/camera/viewer/rtsp/' + $('body').attr('equipId')
    }).done(function(data) {
        setViewer(data.ws);
    }).fail(function(err) {        
        if(err.status === 401 || err.status === 408) {
            setErrorMessage(err.responseJSON.msg);
        } else if(err.status === 500) {
            setErrorMessage(err.responseJSON.msg);
        } else {
            console.error(err);
            setErrorMessage(err.responseJSON.msg);
        }
    }).always(function() {
        undisplayLoading();
    });
}

function setErrorMessage(error_msg) {
    $('#error-panel').show();
    $('#viewer').hide();
    
    $('#error-message').text(error_msg);
}

function setViewer(ws_url) {
    $('#error-panel').hide();
    $('#viewer').show();

    let player = new JSMpeg.Player(ws_url, {
        canvas: document.getElementById('imageViewer'),
        loop: false,
        onEnded: function(p) {
            console.info(p);
        }
    });

    player.onEnded = function(p) {
        console.info(p);
    }

    player.source.onClose = function() {
        setErrorMessage('카메라 스트림을 받아올 수 없습니다\n스트리밍이 설정이 변경되었거나, 연결할 수 없는 상태입니다');
    }
}

function displayLoading() {
    kendo.ui.progress($('.panel-body'), true);
}

function undisplayLoading() {
    setTimeout(function() {
        kendo.ui.progress($('.panel-body'), false);
    });
}