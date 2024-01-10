function eventResult(title, eventMessage) {
	var eventResult = document.getElementById('event-popup');
	eventResult.innerHTML = "";
	
	var text = "";	
	
	text += "	<div class='modal fade in' id='eventPopup' tabindex='-1' role='dialog' aria-labelledby='popupTitle' style='display: block;'>";
    text += "		<div id='popup' class='modal-dialog' role='document'>";
	text += "			<div class='modal-content'>";
	text += "				<div class='modal-header custom-modal-header'>";
	text += "					<h4 id='popupTitle' class='modal-title custom-modal-title'>";
	text += "						<img src='/img/inventory/button/repair_done.png' id='popup-img' class='img-thumbnail'/>" + title;
	text += "					</h4>";
	text += "				    <div id='eventResultPopupContent' class='modal-body custom-modal-body'>" + eventMessage + "</div>";
	text += "				</div>";
	text += "				<div id='popupFooter' class='modal-footer custom-modal-footer'>";
    text += "					<div class='custom-btn-control'>";
	text += "					    <button id='popupCancelButton' type='button' class='btn custom-btn-close' data-dismiss='modal' onclick=$('#eventResult').hide()>닫기</button>";
	text += "				    </div>";
	text += "				</div>";
	text += "			</div>";
	text += "		</div>";
	text += "	</div>";

    eventResult.innerHTML += text;
};