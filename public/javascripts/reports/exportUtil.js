const ExportUtil = function() {
    function setCellStyleForPDF(src_cell, pdf_cell, defaultFontSize) {
        if(src_cell.nodeName === 'TH') pdf_cell.styles.fontStyle = 'bold';

        // by shkoh 20200902: border가 정의되었다면 borer의 width를 설정하여 표현
        if($(src_cell).hasClass('r-border-left') ||
            $(src_cell).hasClass('r-border-left-bold') ||
            $(src_cell).hasClass('r-border-right') ||
            $(src_cell).hasClass('r-border-right-bold') ||
            $(src_cell).hasClass('r-border-top') ||
            $(src_cell).hasClass('r-border-top-bold') ||
            $(src_cell).hasClass('r-border-bottom') ||
            $(src_cell).hasClass('r-border-bottom-bold')) {
                pdf_cell.styles.lineWidth = 0.08;
        }

        // by shkoh 20200902: align 정의에 따라서 각 cell마다 align / valign 설정
        if($(src_cell).hasClass('r-align-left')) pdf_cell.styles.halign = 'left';
        if($(src_cell).hasClass('r-align-center')) pdf_cell.styles.halign = 'center';
        if($(src_cell).hasClass('r-align-right')) pdf_cell.styles.halign = 'right';
        
        if($(src_cell).hasClass('r-valign-top')) pdf_cell.styles.valign = 'top';
        if($(src_cell).hasClass('r-valign-middle')) pdf_cell.styles.valign = 'middle';
        if($(src_cell).hasClass('r-valign-bottom')) pdf_cell.styles.valign = 'bottom';
        
        // by shkoh 20200902: font의 정의에 따라서 각 cell의 font를 설정
        if($(src_cell).hasClass('r-font-title')) pdf_cell.styles.fontSize = defaultFontSize + 10;
        if($(src_cell).hasClass('r-font-large')) pdf_cell.styles.fontSize = defaultFontSize + 5;
        if($(src_cell).hasClass('r-font-head')) pdf_cell.styles.fontSize = defaultFontSize + 3;
        if($(src_cell).hasClass('r-font-info')) pdf_cell.styles.fontSize = defaultFontSize + 2;
        if($(src_cell).hasClass('r-font-small')) pdf_cell.styles.fontSize = defaultFontSize - 1;
        if($(src_cell).hasClass('r-font-footer')) pdf_cell.styles.fontSize = defaultFontSize + 3;
        
        if($(src_cell).hasClass('r-font-bold')) pdf_cell.styles.fontStyle = 'bold';

        // by shkoh 20200902: cell에 배경색 지정
        if($(src_cell).hasClass('r-bk-gray')) pdf_cell.styles.fillColor = [ 221, 221, 221 ];
    }
    
    function setCellStyle(src_cell, excel_cell) {
        if(src_cell.nodeName === 'TH') {
            excel_cell.bold = true;
        }
    
        // by shkoh 20200901: border의 정의에 따라서 각 cell에 border 설정
        if($(src_cell).hasClass('r-border-left')) excel_cell.borderLeft = { color: '#222222', size: 1 };
        if($(src_cell).hasClass('r-border-left-bold')) excel_cell.borderLeft = { color: '#222222', size: 2 };
        
        if($(src_cell).hasClass('r-border-right')) excel_cell.borderRight = { color: '#222222', size: 1 };
        if($(src_cell).hasClass('r-border-right-bold')) excel_cell.borderRight = { color: '#222222', size: 2 };
        
        if($(src_cell).hasClass('r-border-top')) excel_cell.borderTop = { color: '#222222', size: 1 };
        if($(src_cell).hasClass('r-border-top-bold')) excel_cell.borderTop = { color: '#222222', size: 2 };
        
        if($(src_cell).hasClass('r-border-bottom')) excel_cell.borderBottom = { color: '#222222', size: 1 };
        if($(src_cell).hasClass('r-border-bottom-bold')) excel_cell.borderBottom = { color: '#222222', size: 2 };

        // by shkoh 20200901: align의 정의에 따라서 각 cell마다 align / valing 설정
        if($(src_cell).hasClass('r-align-left')) excel_cell.textAlign = 'left';
        if($(src_cell).hasClass('r-align-center')) excel_cell.textAlign = 'center';
        if($(src_cell).hasClass('r-align-right')) excel_cell.textAlign = 'right';
        
        if($(src_cell).hasClass('r-valign-top')) excel_cell.verticalAlign = 'top';
        if($(src_cell).hasClass('r-valign-middle')) excel_cell.verticalAlign = 'center';
        if($(src_cell).hasClass('r-valign-bottom')) excel_cell.verticalAlign = 'bottom';

        // by shkoh 20200901: font의 정의에 따라서 각 cell의 font를 설정
        if($(src_cell).hasClass('r-font-title')) excel_cell.fontSize = 28;
        if($(src_cell).hasClass('r-font-large')) excel_cell.fontSize = 22;
        if($(src_cell).hasClass('r-font-head')) excel_cell.fontSize = 18;
        if($(src_cell).hasClass('r-font-info')) excel_cell.fontSize = 15;
        if($(src_cell).hasClass('r-font-small')) excel_cell.fontSize = 9;
        if($(src_cell).hasClass('r-font-footer')) excel_cell.fontSize = 16;

        if($(src_cell).hasClass('r-font-bold')) excel_cell.bold = true;
        if($(src_cell).hasClass('r-font-underline')) excel_cell.underline = true;
    
        // by shkoh 20200901: cell에 배경색 지정
        if($(src_cell).hasClass('r-bk-gray')) excel_cell.background = '#dddddd';
    
        // by shkoh 20200901: 기본 text를 제외한 cell의 데이터 format 지정
        if($(src_cell).hasClass('r-data-number')) {
            if(excel_cell.value !== '' && !isNaN(Number(excel_cell.value.replace(/,/g, '')))) {
                excel_cell.format = '#,###0.0';
                excel_cell.value = Number(excel_cell.value.replace(/,/g, ''));
            }
        }

        if($(src_cell).hasClass('r-data-number2')) {
            if(excel_cell.value !== '' && !isNaN(Number(excel_cell.value.replace(/,/g, '')))) {
                excel_cell.format = '#,###0.00';
                excel_cell.value = Number(excel_cell.value.replace(/,/g, ''));
            }
        }

        if($(src_cell).hasClass('r-data-index')) {
            if(excel_cell.value !== '' && !isNaN(Number(excel_cell.value.replace(/,/g, '')))) {
                excel_cell.format = '#,###0';
                excel_cell.value = Number(excel_cell.value.replace(/,/g, ''));
            }
        }
    }

    return {
        CreatePDFBody: function(tr_set, rows, defaultFontSize) {
            tr_set.map(function(index, tr) {
                let alpha = 4.01;
                
                let tr_height = parseInt($(tr).height() / alpha);
        
                const row = [];
                const cells = $(tr).find('th, td');
                cells.map(function(index, c) {
                    const hasImage = $(c).find('.has-image');

                    let isStart = false;
                    let isLast = false;
                    let hasData = true;
                    if($(c).attr('cellType') === 'start') {
                        isStart = true;
                        hasData = $(c).parents('table').attr('noData').includes('false');
                    }
                    
                    if($(c).attr('cellType') === 'last') {
                        isLast = true;
                        hasData = $(c).parents('table').attr('noData').includes('false');
                    }

                    const cell = {
                        content: hasImage.length > 0 ? '' : c.innerText,
                        rowSpan: c.rowSpan,
                        colSpan: $(c).attr('data-type') === 'stamp' ? 1 : c.colSpan,
                        styles: {
                            halign: 'center',
                            valign: 'middle',
                            fontSize: defaultFontSize,
                            lineColor: [ 34, 34, 34 ],
                            lineWidth: 0,
                            fontStyle: 'normal',
                            minCellHeight: tr_height
                        },
                        isStart: isStart,
                        isLast: isLast,
                        hasData: hasData,
                        hasImage: hasImage.length > 0 ? true : false
                    }
        
                    setCellStyleForPDF(c, cell, defaultFontSize);
        
                    row.push(cell);
                });
        
                rows.push(row);
            });
        },
        CreateExcelBody: function(tr_set, rows) {
            tr_set.map(function(index, tr) {
                let tr_height = $(tr).height() * 1.1;
        
                // by shkoh 20200825: 여백을 표시하기 위해서 첫번째 칸에 공백
                const row = {
                    cells: [{
                        background: '#ffffff'
                    }],
                    height: tr_height
                };
        
                const cells = $(tr).find('th, td');
                cells.map(function(index, c) {
                    const hasImage = $(c).find('.has-image');
                    
                    const cell = {
                        value: hasImage.length > 0 ? '' : c.innerText,
                        textAlign: 'center',
                        verticalAlign: 'center',
                        rowSpan: c.rowSpan,
                        colSpan: c.colSpan,
                        fontSize: 12,
                        background: '#ffffff',
                        wrap: true
                    }
        
                    setCellStyle(c, cell);
        
                    row.cells.push(cell);
                });
        
                // by shkoh 20200825: 여백을 표시하기 위해서 마지막 칸에 공백
                row.cells.push({
                    background: '#ffffff',
                });
        
                rows.push(row);
            });
        }
    }
}