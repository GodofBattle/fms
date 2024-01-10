function deleteCheck(title, id) {
	var deleteCheck = document.getElementById('delete-popup');
	deleteCheck.innerHTML = "";	
		
	var text = "";
			 
	text += "	<div class='modal fade in' id='deleteCheck' tabindex='-1' role='dialog' aria-labelledby='popupTitle' style='display: block;'>";
	text += "		<div id='popup' class='modal-dialog' role='document'>";
	text += "			<div class='modal-content'>";
	text += "				<div class='modal-header custom-modal-header'>";
	text += "					<h4 id='popupTitle' class='modal-title custom-modal-title'>";
	text += "						<img src='/img/inventory/button/repair_done.png' id='popup-img' class='img-thumbnail'/>" + title;
	text += "					</h4>";
	text += "				    <div id='deleteCheckPopupContent' class='modal-body custom-modal-body'>삭제하시겠습니까?</div>";    
	text += "				</div>";
	text += "				<div id='popupFooter' class='modal-footer custom-modal-footer'>";
    text += "					<div class='custom-btn-control'>";
	text += "					    <button id='popupDeleteButton' type='button' class='btn custom-btn-delete' data-dismiss='modal' onclick='deleteData' data-content=" + id + ">삭제</button>";
	text += "					    <button id='popupCancelButton' type='button' class='btn custom-btn-cancel' data-dismiss='modal' onclick=$('#deleteCheck').hide()>취소</button>";
    text += "				    </div>";	    			
	text += "				</div>";
	text += "			</div>";
	text += "		</div>";
	text += "	</div>";

    deleteCheck.innerHTML += text;
};