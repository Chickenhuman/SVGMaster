// ==========================================
// 1. 전역 변수 및 설정
// ==========================================
const svg = document.getElementById('mainSvg');
let isThrottled = false; // <--- 여기에 추가하세요! (전역 변수로 선언)
let startTransformValue = ""; // [추가]
let savedToolState = null; // 선택 전 도구 설정 저장용
// 그리기 미리보기 선
const previewLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
previewLine.setAttribute("class", "preview-line");
previewLine.style.display = "none";
svg.appendChild(previewLine);

// ==========================================
// 2. UI 요소 캐싱
// ==========================================
const ui = {
    btns: {
        draw: document.getElementById('toolDraw'),
        select: document.getElementById('toolSelect'),
        paint: document.getElementById('toolPaint'),
        shape: document.getElementById('toolShape'),
        shapeMenu: document.getElementById('shapeSubMenu'),
        text: document.getElementById('toolText'), // [추가]
        // [중요] 선 스타일 메뉴
        toolStroke: document.getElementById('toolStroke'),
        strokeMenu: document.getElementById('strokeSubMenu'),
        
        undo: document.getElementById('btnUndo'),
        redo: document.getElementById('btnRedo'),
        
        grid: document.getElementById('btnGrid'),
        snap: document.getElementById('btnSnap'),
        
        finish: document.getElementById('btnFinish'),
        noFill: document.getElementById('btnNoFill'),
        
        downloadMenu: document.getElementById('btnDownloadMenu'),
        downloadPNG: document.getElementById('btnDownloadPNG'),
        downloadSVG: document.getElementById('btnDownloadSVG'),
        
        toggle: document.getElementById('btnToggleView'),
        toggleCode: document.getElementById('btnToggleCode'),
        toggleSidebar: document.getElementById('btnToggleSidebar'),
        
        help: document.getElementById('btnHelp'),
        
        toFront: document.getElementById('btnToFront'),
        toBack: document.getElementById('btnToBack'),
        
saveProject: document.getElementById('btnSaveProject'), // [추가]
        loadProject: document.getElementById('btnLoadProject'), // [추가]

        copy: document.getElementById('btnCopyCode'),
// ▼▼▼ [추가] ▼▼▼
        paste: document.getElementById('btnPasteCode'),
        // ▲▲▲ [추가 끝] ▲▲▲
        del: document.getElementById('btnDelete'),
        
        group: document.getElementById('btnGroup'),
        ungroup: document.getElementById('btnUngroup'),
        
        alignLeft: document.getElementById('btnAlignLeft'),
        alignCenter: document.getElementById('btnAlignCenter'),
        alignRight: document.getElementById('btnAlignRight'),
        alignTop: document.getElementById('btnAlignTop'),
        alignMiddle: document.getElementById('btnAlignMiddle'),
        alignBottom: document.getElementById('btnAlignBottom'),
        
        closeCode: document.getElementById('btnCloseCode')
    },
    inputs: {
        autoClose: document.getElementById('chkAutoClose'),
        color: document.getElementById('inpColor'),
        hex: document.getElementById('inpHex'),
        width: document.getElementById('inpWidth'),
        tension: document.getElementById('inpTension'),
        rotateSlider: document.getElementById('inpRotate'),
fileInput: document.getElementById('fileInput'), // [추가]
        fill: document.getElementById('inpFill'),
        cap: document.getElementById('inpCap'),
        bg: document.getElementById('inpBgColor'),
        
        // [중요] 투명도 슬라이더 (이게 없으면 오류 발생)
// opacity: document.getElementById('inpOpacity'), // [삭제]
        strokeOpacity: document.getElementById('inpStrokeOpacity'), // [신규]
        fillOpacity: document.getElementById('inpFillOpacity'),     // [신규]
        
        viewer: document.getElementById('codeViewer'), 
        text: document.getElementById('codeText'),
        
        gridRect: document.getElementById('gridRect'),
        marquee: document.getElementById('marqueeRect'),
        layer: document.getElementById('uiLayer'),
        box: document.getElementById('selectionBox'),
        resize: document.getElementById('handleResize'),
        rotate: document.getElementById('handleRotate'),
        rotateLine: document.getElementById('rotateLine'),
// [추가] 텍스트 관련 인풋
        panelText: document.getElementById('panelText'),
        textContent: document.getElementById('inpTextContent'),
        fontSize: document.getElementById('inpFontSize'),
        fontWeight: document.getElementById('inpFontWeight'),
        fontFamily: document.getElementById('inpFontFamily'),
    },
    labels: {
        width: document.getElementById('valWidth'),
        tension: document.getElementById('valTension'),
        rotate: document.getElementById('valRotate'),
        
        // [중요] 투명도 라벨
strokeOpacity: document.getElementById('valStrokeOpacity'), // [신규]
        fillOpacity: document.getElementById('valFillOpacity'),     // [신규]
    }
};
// ==========================================
// 3. 상태(State) 관리
// ==========================================
let state = {
    mode: 'draw', 
    isDrawing: false,
    isErasing: false, // 지우개 상태 추가
    snap: true,      
    snapSize: 20,    
    showGrid: false, 
    selectedEls: [],
    clipboard: [],
    action: null,     
    startPos: [0, 0],
    initialState: {
        transforms: [], 
        uiTransform: '', 
        groupCenter: { x: 0, y: 0 },
        boxDims: { w: 0, h: 0 },
        startAngle: 0 
    },
    transform: { x:0, y:0, w:0, h:0, scaleX:1, scaleY:1, angle:0, cx:0, cy:0 },
    currentShapeType: 'rect',
    points: [],       
viewBox: { x: 0, y: 0, w: 800, h: 600, zoom: 1 },
    isPanning: false,
    currentPath: null, 
    history: [],
    redoStack: []
};

// 초기화
saveHistory();
updateCode();

// ==========================================
// 4. 이벤트 리스너
// ==========================================
['draw', 'select', 'paint', 'shape', 'eraser', 'text'].forEach(mode => {
    const btn = document.querySelector(`.btn-tool[data-mode="${mode}"]`);
    if(btn) {
        btn.addEventListener('click', (e) => {


            // 도형 버튼 클릭 시 드롭다운 토글
            if (mode === 'shape') {
                const menu = document.getElementById('shapeSubMenu');
                document.getElementById('alignSubMenu').classList.remove('show'); // 정렬 메뉴 끄기
                
                if (state.mode === 'shape') {
                    menu.classList.toggle('show');
                    return; 
                } else {
                    changeMode('shape');
                    menu.classList.add('show');
                    return;
                }
            }
            
            closeAllDropdowns();
            changeMode(mode);
        });
    }
});

// (2) [신규] 정렬 메뉴 토글 로직
const btnAlignTool = document.getElementById('toolAlign');
if (btnAlignTool) {
    btnAlignTool.addEventListener('click', (e) => {
        e.stopPropagation();
        const alignMenu = document.getElementById('alignSubMenu');
        // 도형 메뉴가 열려있다면 닫기
        document.getElementById('shapeSubMenu').classList.remove('show');
        alignMenu.classList.toggle('show');
    });
}

// (3) [수정] 도형 서브 메뉴 클릭 처리 (선택자를 명확하게 변경)
document.querySelectorAll('#shapeSubMenu .btn-sub').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        state.currentShapeType = e.target.dataset.shape;
        
        document.querySelectorAll('#shapeSubMenu .btn-sub').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        changeMode('shape');
        closeAllDropdowns();
    });
});
// (4) [신규] 정렬 메뉴 버튼 클릭 시 메뉴 닫기
document.querySelectorAll('.btn-align').forEach(btn => {
    btn.addEventListener('click', () => {
        closeAllDropdowns();
        // 실제 정렬 로직은 아래 ui.btns.alignLeft... 리스너에서 처리됨
    });
});

// (5) [수정] 화면 아무데나 클릭 시 드롭다운 닫기
document.addEventListener('click', (e) => {
    // 버튼이나 메뉴 내부를 클릭한 게 아니라면 모두 닫기
    if (!e.target.closest('.dropdown-container')) {
        closeAllDropdowns();
    }
});

function closeAllDropdowns() {
    document.getElementById('shapeSubMenu').classList.remove('show');
    document.getElementById('alignSubMenu').classList.remove('show');
    document.getElementById('downloadSubMenu')?.classList.remove('show');
    document.getElementById('strokeSubMenu')?.classList.remove('show'); // [추가]
}


// [script.js] changeMode 함수 수정
function changeMode(newMode) {
    finishDraw(false);
    deselect();
    state.mode = newMode;

    document.querySelectorAll('.btn-tool').forEach(b => b.classList.remove('active'));
    
    const activeBtn = document.querySelector(`.btn-tool[data-mode="${newMode}"]`);
    if(activeBtn) activeBtn.classList.add('active');
    
    // 커서 설정
    if(newMode === 'draw' || newMode === 'shape') svg.style.cursor = 'crosshair';
    else if(newMode === 'paint') svg.style.cursor = 'cell';
else if(newMode === 'text') svg.style.cursor = 'text';
else if(newMode === 'eraser') {
        // [수정] 20px 크기의 네모난 지우개 커서 (SVG Data URI 사용)
        // fill="white": 흰색 채우기, stroke="%23333": 진한 회색 테두리
        // 10 10: 마우스 포인트의 중심점을 사각형의 정중앙(10, 10)으로 설정
        const eraserCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><rect x="1" y="1" width="18" height="18" fill="white" stroke="%23333" stroke-width="2"/></svg>') 10 10, auto`;
        svg.style.cursor = eraserCursor;
    }
    else svg.style.cursor = 'default';
}

// [추가] 그리드 / 스냅 / 리두 버튼 리스너
// [script.js 수정] 4. 이벤트 리스너 섹션 - 속성 변경 부분 교체
// ==========================================
// 4. 이벤트 리스너 - 속성 및 변형 제어
// ==========================================
if (ui.btns.group) ui.btns.group.addEventListener('click', groupSelected);
if (ui.btns.ungroup) ui.btns.ungroup.addEventListener('click', ungroupSelected);
if (ui.btns.grid) ui.btns.grid.addEventListener('click', toggleGrid);
if (ui.btns.snap) ui.btns.snap.addEventListener('click', toggleSnap);
if (ui.btns.redo) ui.btns.redo.addEventListener('click', redo);
if (ui.btns.copy) ui.btns.copy.addEventListener('click', copyCodeToClipboard);
if (ui.inputs.text) ui.inputs.text.addEventListener('input', applyCodeFromTextarea); // [핵심] 역방향 동기화
if (ui.btns.alignLeft) ui.btns.alignLeft.addEventListener('click', () => alignSelected('left'));
if (ui.btns.alignCenter) ui.btns.alignCenter.addEventListener('click', () => alignSelected('center'));
if (ui.btns.alignRight) ui.btns.alignRight.addEventListener('click', () => alignSelected('right'));
if (ui.btns.alignTop) ui.btns.alignTop.addEventListener('click', () => alignSelected('top'));
if (ui.btns.alignMiddle) ui.btns.alignMiddle.addEventListener('click', () => alignSelected('middle'));
if (ui.btns.alignBottom) ui.btns.alignBottom.addEventListener('click', () => alignSelected('bottom'));

if (ui.btns.toolStroke) {
    ui.btns.toolStroke.addEventListener('click', (e) => {
        e.stopPropagation();
        const menu = ui.btns.strokeMenu;
        closeAllDropdowns(); // 다른 메뉴 닫기
        menu.classList.toggle('show');
    });
}

// 서브 메뉴 클릭 시 스타일 적용
document.querySelectorAll('#strokeSubMenu .btn-sub').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = e.target.dataset.dash;
        state.strokeDash = (type === 'dashed') ? '5,5' : 'none';

        // UI 활성화 표시 업데이트
        document.querySelectorAll('#strokeSubMenu .btn-sub').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        // 선택된 도형에 즉시 적용
        if (state.selectedEls.length > 0) {
            state.selectedEls.forEach(el => {
                if (el.id !== 'gridRect') el.setAttribute('stroke-dasharray', state.strokeDash);
            });
            saveHistory();
            updateCode();
        }
        closeAllDropdowns();
    });
});

// --- [추가 2] 투명도 슬라이더 제어 ---
/* [script.js] 이벤트 리스너 섹션 */

// 1. 선 투명도 (Stroke Opacity)
if (ui.inputs.strokeOpacity) {
    ui.inputs.strokeOpacity.addEventListener('input', (e) => {
        const val = e.target.value;
        ui.labels.strokeOpacity.textContent = val;
        const opacityVal = val / 100;

        if (state.selectedEls.length > 0) {
            state.selectedEls.forEach(el => {
                if (el.id !== 'gridRect') el.setAttribute('stroke-opacity', opacityVal);
            });
            updateCode();
        }
    });
    ui.inputs.strokeOpacity.addEventListener('change', () => { if(state.selectedEls.length > 0) saveHistory(); });
}

// 2. 채우기 투명도 (Fill Opacity)
if (ui.inputs.fillOpacity) {
    ui.inputs.fillOpacity.addEventListener('input', (e) => {
        const val = e.target.value;
        ui.labels.fillOpacity.textContent = val;
        const opacityVal = val / 100;

        if (state.selectedEls.length > 0) {
            state.selectedEls.forEach(el => {
                if (el.id !== 'gridRect') el.setAttribute('fill-opacity', opacityVal);
            });
            updateCode();
        }
    });
    ui.inputs.fillOpacity.addEventListener('change', () => { if(state.selectedEls.length > 0) saveHistory(); });
}

// 1. 선 색상 (Color) 변경
ui.inputs.color.addEventListener('input', (e) => { 
    ui.inputs.hex.value = e.target.value; 
    state.selectedEls.forEach(el => {
        if (el.id !== 'gridRect') el.setAttribute('stroke', e.target.value);
    });
    updateCode();
});

// 2. 헥스 코드 직접 입력
ui.inputs.hex.addEventListener('input', (e) => { 
    if(e.target.value.startsWith('#')) {
        ui.inputs.color.value = e.target.value; 
        state.selectedEls.forEach(el => {
            if (el.id !== 'gridRect') el.setAttribute('stroke', e.target.value);
        });
        updateCode();
    }
});

// 3. 선 두께 (Width) 변경
ui.inputs.width.addEventListener('input', (e) => { 
    ui.labels.width.textContent = e.target.value; 
    state.selectedEls.forEach(el => {
        if (el.id !== 'gridRect') el.setAttribute('stroke-width', e.target.value);
    });
    updateCode();
});

// 4. 채우기 색상 (Fill) 변경
ui.inputs.fill.addEventListener('input', (e) => {
    state.selectedEls.forEach(el => {
        if (el.id !== 'gridRect') el.setAttribute('fill', e.target.value);
    });
    updateCode();
});

// 5. 선 끝 모양 (Cap) 변경
ui.inputs.cap.addEventListener('change', (e) => { 
    state.selectedEls.forEach(el => {
        if (el.id !== 'gridRect') el.setAttribute('stroke-linecap', e.target.value);
    });
    saveHistory(); 
    updateCode();
});

// 6. 곡률 (Tension) 변경
ui.inputs.tension.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    ui.labels.tension.textContent = val;

    if (state.selectedEls.length > 0) {
        state.selectedEls.forEach((el, index) => {
            if (el.id === 'gridRect') return;

            // 도형을 Path로 변환하여 곡선 적용
            if (['rect', 'polygon'].includes(el.tagName)) {
                el = convertToPath(el); 
                state.selectedEls[index] = el;
            }

            if (el.tagName === 'path') {
                let rawPoints = el.dataset.points ? JSON.parse(el.dataset.points) : null;
                if (!rawPoints) return; 

                const isClosed = el.getAttribute("d").toUpperCase().includes("Z");
                if (rawPoints.length > 1) {
                    const d = solveCurve(rawPoints, val, isClosed);
                    el.setAttribute('d', d);
                }
            }
        });
        updateCode();
        updateUIBox(); 
    }
});

// 7. 회전 슬라이더 제어
ui.inputs.rotateSlider.addEventListener('mousedown', () => {
    if (state.selectedEls.length === 0) return;
    state.action = 'rotating-slider';
    prepareTransform();
    state.initialState.startAngle = parseFloat(ui.inputs.rotateSlider.value);
});

ui.inputs.rotateSlider.addEventListener('input', (e) => {
    if (state.action === 'rotating-slider') {
        ui.labels.rotate.textContent = e.target.value;
        handleTransformAction(null); 
    }
});

ui.inputs.fill.addEventListener('input', updateSelectedStyle);
ui.inputs.cap.addEventListener('change', () => { updateSelectedStyle(); saveHistory(); });
ui.inputs.bg.addEventListener('input', (e) => { svg.style.backgroundColor = e.target.value; updateCode(); });
ui.inputs.bg.addEventListener('change', saveHistory);

['tension', 'width', 'color', 'fill', 'rotateSlider'].forEach(key => {
    if (ui.inputs[key]) {
        ui.inputs[key].addEventListener('change', () => { if(state.selectedEls.length > 0) saveHistory(); });
    }
});

// [script.js] ui.btns 객체에 추가
// [script.js] ui.btns 객체에 추가
ui.btns.closeCode = document.getElementById('btnCloseCode');

// 2. 코드창 요소 가져오기
const codeArea = document.querySelector('.code-area');

// 3. [중요] 토글 버튼 기능 (중복 방지를 위해 여기서 한 번만 정의)
if (ui.btns.toggleCode) {
    // 초기 실행 시: 모바일이면 자동으로 닫아두기
    if (window.innerWidth <= 1000) {
        codeArea.classList.add('collapsed');
        ui.btns.toggleCode.classList.remove('active');
    }

    // 기존 리스너가 있다면 제거하고 새로 추가 (안전 장치)
    const newBtn = ui.btns.toggleCode.cloneNode(true);
    ui.btns.toggleCode.parentNode.replaceChild(newBtn, ui.btns.toggleCode);
    ui.btns.toggleCode = newBtn;

    // 클릭 이벤트 연결
ui.btns.toggleCode.addEventListener('click', () => {
    codeArea.classList.toggle('collapsed'); // CSS에서 width: 0으로 줄어듦
    
    // 버튼 활성화 상태 토글 (아이콘 색상 변경 등)
    const isVisible = !codeArea.classList.contains('collapsed');
    ui.btns.toggleCode.classList.toggle('active', isVisible);
});
}

// 4. 모바일 전용 닫기(X) 버튼 기능
if (ui.btns.closeCode) {
    ui.btns.closeCode.addEventListener('click', () => {
        codeArea.classList.add('collapsed'); // 무조건 닫기
        if (ui.btns.toggleCode) {
            ui.btns.toggleCode.classList.remove('active'); // 버튼 불 끄기
        }
    });
}


ui.btns.noFill.addEventListener('click', applyNoFill);
ui.btns.undo.addEventListener('click', undo);
/* [script.js] 285행 근처: 기존 ui.btns.download.addEventListener... 삭제하고 아래 코드 추가 */
ui.btns.finish.addEventListener('click', () => finishDraw(true));

// [수정] 저장 메뉴 토글
ui.btns.downloadMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    const menu = document.getElementById('downloadSubMenu');
    // 다른 메뉴 닫기
    closeAllDropdowns();
    menu.classList.toggle('show');
});
// [추가] PNG / SVG 다운로드 클릭
ui.btns.downloadPNG.addEventListener('click', () => { downloadImage(); closeAllDropdowns(); });
ui.btns.downloadSVG.addEventListener('click', () => { downloadSVGFile(); closeAllDropdowns(); });

ui.btns.del.addEventListener('click', deleteSelected);
ui.btns.toFront.addEventListener('click', () => moveLayer('front'));
ui.btns.toBack.addEventListener('click', () => moveLayer('back'));
ui.btns.toggle.addEventListener('click', () => {
    const isTextMode = ui.inputs.text.style.display !== 'none';
    ui.inputs.text.style.display = isTextMode ? 'none' : 'block';
    ui.inputs.viewer.style.display = isTextMode ? 'block' : 'none';
    
    // [수정] 다국어 함수 사용
    ui.btns.toggle.textContent = isTextMode ? t('btnViewText') : t('btnViewViewer');
});


/* [script.js] 350행 근처 (마우스 이벤트 섹션 바로 위) */

// [수정] 휠로 줌 인/아웃 (최소/최대 제한 적용)
svg.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
    }
    e.preventDefault();

    // 1. 현재 줌 배율 계산 (기준 너비 800px)
    // 뷰박스가 작을수록(w가 작을수록) 화면은 확대된 상태임
    const currentZoom = 800 / state.viewBox.w;

    const scaleFactor = 1.05;
    const direction = e.deltaY > 0 ? 1 : -1;
    const factor = direction > 0 ? scaleFactor : (1 / scaleFactor);

    // 2. 예상되는 다음 줌 배율 계산
    const nextZoom = currentZoom / factor;

    // 3. 줌 제한 설정 (최소 10% ~ 최대 1000% 등)
    const minZoom = 0.1;  // 10% (축소 한계)
    const maxZoom = 10;   // 1000% (확대 한계)

    // 제한 범위를 벗어나면 줌 실행 안 함
    if (nextZoom < minZoom || nextZoom > maxZoom) return;

    // --- 기존 줌 로직 실행 ---
    state.viewBox.w *= factor;
    state.viewBox.h *= factor;
    
    // 중앙 줌 보정
    state.viewBox.x -= (state.viewBox.w - (state.viewBox.w / factor)) / 2;
    state.viewBox.y -= (state.viewBox.h - (state.viewBox.h / factor)) / 2;

    svg.setAttribute('viewBox', `${state.viewBox.x} ${state.viewBox.y} ${state.viewBox.w} ${state.viewBox.h}`);
}, { passive: false });



// [추가] 스페이스바 누르면 손바닥(Pan) 모드
window.addEventListener('keydown', (e) => {
    // ▼▼▼ [추가] 입력 중이면 무시 (이 코드가 없어서 발생한 문제) ▼▼▼
    const tag = document.activeElement.tagName;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || document.activeElement.isContentEditable) return;
    // ▲▲▲ [추가 끝] ▲▲▲

    if (e.code === 'Space' && !state.isPanning) {
        state.isPanning = true;
        svg.style.cursor = 'grab';
    }
});
window.addEventListener('keyup', (e) => {
    // ▼▼▼ [수정] 텍스트 입력 중이면 이벤트 무시 (keyup에서도 필수!) ▼▼▼
    const tag = document.activeElement.tagName;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || document.activeElement.isContentEditable) return;
    // ▲▲▲ [수정 끝] ▲▲▲

    if (e.code === 'Space') {
        state.isPanning = false;
        // 원래 커서로 복구
        changeMode(state.mode); 
    }
});

// ==========================================
// 5. 마우스 이벤트
// ==========================================
// ==========================================
// [수정] 마우스 다운 (mousedown) - 전체 교체
// ==========================================
svg.addEventListener('mousedown', (e) => {
    // 1. [중요] 스페이스바(Pan 모드) 중이면 그리기/선택 차단하고 즉시 종료
    if (state.isPanning) {
        return; 
    }

    const pt = getPoint(e);

    // 2. 지우개 모드: 클릭 시 동작 (채우기 삭제 vs 객체 삭제)
    if (state.mode === 'eraser') {
        state.isErasing = true; // 드래그 삭제 시작
        handleEraserClick(e);   // 클릭 지우기 실행
        return;
    }

    // 3. 변형 핸들/박스 클릭 (리사이즈, 회전, 이동)
    if (e.target === ui.inputs.resize) {
        state.action = 'resizing';
        state.startPos = pt;
        prepareTransform(); 
        return;
    }
    if (e.target === ui.inputs.rotate) {
        state.action = 'rotating';
        state.startPos = pt;
        prepareTransform();
        state.initialState.startAngle = parseFloat(ui.inputs.rotateSlider.value);
        return;
    }
    if (e.target === ui.inputs.box) {
        state.action = 'moving';
        state.startPos = pt;
        prepareTransform();
        return;
    }

    // 4. 선택 모드
    if (state.mode === 'select') {
        let clickedEl = e.target;
        
        // 클릭된 요소의 최상위 그룹 찾기
        while (clickedEl.parentNode && 
               clickedEl.parentNode.tagName !== 'svg' && 
               clickedEl.parentNode.id !== 'uiLayer') {
            clickedEl = clickedEl.parentNode;
        }

        // (1) 이미 선택된 그룹/요소를 클릭 -> 이동 준비
        if (state.selectedEls.includes(clickedEl)) {
            state.action = 'moving';
            state.startPos = pt;
            prepareTransform();
        }
        // (2) 새로운 요소를 클릭 -> 신규 선택
else if (['path', 'rect', 'circle', 'polygon', 'g', 'text'].includes(clickedEl.tagName) && 
                 clickedEl.id !== 'uiLayer' && 
                 clickedEl.id !== 'gridRect' && 
                 clickedEl !== svg) { 
            
            selectElements([clickedEl]);
            state.action = 'moving';
            state.startPos = pt;
            prepareTransform();
        }
        // (3) 빈 공간 클릭 -> 드래그 선택(Marquee) 시작
        else {
            deselect();
            state.action = 'selecting'; 
            state.startPos = pt;
            ui.inputs.marquee.setAttribute('x', pt[0]);
            ui.inputs.marquee.setAttribute('y', pt[1]);
            ui.inputs.marquee.setAttribute('width', 0);
            ui.inputs.marquee.setAttribute('height', 0);
            ui.inputs.marquee.style.display = 'block';
        }
    }
    // 5. 그리기 모드
    else if (state.mode === 'shape') {
        handleShapeDrawStart(pt);
    }
});


// [script.js] mouseup 이벤트 리스너 (수정됨)

window.addEventListener('mouseup', () => {
    // 1. 지우개 드래그 종료
    if (state.mode === 'eraser') {
        state.isErasing = false;
        saveHistory(); 
        updateCode();
    }

    // 2. [추가됨] 드래그 선택(Marquee) 완료 처리 (이게 빠져 있었음!)
    if (state.action === 'selecting') {
        finishMarqueeSelection();
    }

    // 3. 변형 액션(이동/크기/회전)이 끝났을 때 커맨드 기록
    if (state.action && ['moving', 'rotating', 'resizing', 'rotating-slider'].includes(state.action)) {
        if (state.selectedEls.length > 0) {
            const el = state.selectedEls[0];
            const endTransformValue = el.getAttribute('transform') || '';

            // 값이 실제로 변했을 때만 기록
            if (startTransformValue !== endTransformValue) {
                // CommandManager가 없다면(script.js 하단 삭제 후) 전역 객체 사용
                if (typeof TransformCommand !== 'undefined' && typeof commandManager !== 'undefined') {
                    const cmd = new TransformCommand(el.id, startTransformValue, endTransformValue);
                    commandManager.undoStack.push(cmd);
                    commandManager.redoStack = []; 
                }
            }
        }
    }
    
    // 4. 액션 및 UI 초기화
    state.action = null;
    if (ui.inputs.marquee) ui.inputs.marquee.style.display = 'none';

    // 5. 그리기 모드 종료 처리
    if (state.mode === 'shape' && state.isDrawing) {
        state.isDrawing = false;
        state.currentPath = null;
        saveHistory();
        updateCode();
    }
});


svg.addEventListener('dblclick', (e) => {
    // 텍스트 요소를 더블클릭 했는지 확인
    if (e.target.tagName === 'text') {
        // 1. 해당 텍스트 선택 처리 (기존 로직 활용)
        selectElements([e.target]);
        
        // 2. 텍스트 모드로 변경 (선택적)
        // changeMode('text'); 

        // 3. 사이드바 입력창으로 포커스 이동 및 전체 선택
        if (ui.inputs.textContent) {
            ui.inputs.textContent.focus();
            ui.inputs.textContent.select();
        }
    }
});

svg.addEventListener('click', (e) => {
    if (state.isPanning) return;
    const pt = getPoint(e);
    if (state.mode === 'draw') handleDrawClick(pt);
    else if (state.mode === 'paint') handlePaintClick(e);
    else if (state.mode === 'text') handleTextClick(pt); // [추가]
});

/* [script.js] keydown 이벤트 리스너 전체 교체 (단축키 업데이트) */
document.addEventListener('keydown', (e) => {
    // F1 키 감지 (도움말)
    if (e.key === 'F1') {
        e.preventDefault(); 
        e.stopPropagation();
        openHelp(); 
        return false;
    }

    // 텍스트 입력 중일 때 단축키 차단
    const tag = document.activeElement.tagName;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || document.activeElement.isContentEditable) return;

    const key = e.key.toLowerCase();
    const isCtrl = e.metaKey || e.ctrlKey;
    const isShift = e.shiftKey;

    // --- [시스템/파일 단축키] ---
    if (isCtrl) {
        // [변경] Ctrl + S: 프로젝트 저장 (.json)
        if (key === 's' && !isShift) { 
            e.preventDefault(); 
            ui.btns.saveProject.click(); // 프로젝트 저장 버튼 클릭 트리거
            return;
        }

        // [신규] Ctrl + O: 프로젝트 열기
        if (key === 'o') { 
            e.preventDefault(); 
            ui.btns.loadProject.click(); // 프로젝트 열기 버튼 클릭 트리거
            return;
        }

        // [변경] Ctrl + Shift + S: 이미지 저장 (PNG)
        if (key === 's' && isShift) { 
            e.preventDefault(); 
            downloadImage(); 
            return;
        }

        // 편집 단축키
        if (key === 'z') { e.preventDefault(); isShift ? redo() : undo(); }
        if (key === 'y') { e.preventDefault(); redo(); }
        if (key === 'c') { e.preventDefault(); copy(); } 
if (key === 'v') { 
    // [수정] 충돌 방지 로직 적용
    
    // 1. 내부적으로 복사한 도형이 있다면? -> 내부 붙여넣기 실행
    if (state.clipboard && state.clipboard.length > 0) {
        e.preventDefault(); // 브라우저 붙여넣기 차단
        paste();            // 내부 도형 붙여넣기 함수 실행
    } 
    // 2. 내부 클립보드가 비어있다면? 
    else {
        // e.preventDefault()를 호출하지 않음!
        // -> 브라우저가 'paste' 이벤트를 발생시킴
        // -> 우리가 아까 추가한 window.addEventListener('paste', ...)가 실행됨
    }
    return;
}


if (key === 'a') {
            e.preventDefault();
            const allEls = [];
            Array.from(svg.children).forEach(child => {
                // [수정] 배열 안에 'text' 추가
                if (['path', 'rect', 'circle', 'polygon', 'g', 'text'].includes(child.tagName) && 
                    child.id !== 'uiLayer' && child.id !== 'gridRect' && child.id !== 'marqueeRect' &&
                    !child.classList.contains('preview-line')) {
                    allEls.push(child);
                }
            });
            selectElements(allEls);
        }
        if (key === 'g') {
            e.preventDefault();
            isShift ? ungroupSelected() : groupSelected();
        }
    }

    // --- [도구 단축키 (왼손 최적화)] ---
    if (!isCtrl) {
        switch (key) {
            case 'v': document.getElementById('toolSelect').click(); break;
            case 'd': document.getElementById('toolDraw').click(); break;
            case 'b': document.getElementById('toolPaint').click(); break;
            case 'e': document.getElementById('toolEraser').click(); break;
            case 'r': triggerShape('rect'); break;
            case 'c': triggerShape('circle'); break;
            case 'a': triggerShape('triangle'); break;
            /* [script.js] keydown switch문 내부 */
case 't': document.getElementById('toolText').click(); break; // [변경] 삼각형을 E 등으로 옮기고 T를 텍스트로 쓰는게 일반적이지만, 겹치면 삼각형 단축키를 바꾸세요.
            case '1': document.querySelector('[data-dash="solid"]').click(); break;
            case '2': document.querySelector('[data-dash="dashed"]').click(); break;
            
            case '[': moveLayer('back'); break;
            case ']': moveLayer('front'); break;
            case 'delete': case 'backspace': deleteSelected(); break;
            
            case 'escape': 
                finishDraw(false); deselect();
                closeAllDropdowns();
                break;
            case ' ': e.preventDefault(); finishDraw(true); break;
        }

        if (isShift && key === 'g') toggleGrid(); 
        if (isShift && key === 's') toggleSnap(); 
    }

    // --- [방향키 미세 이동] ---
    if (state.selectedEls.length > 0 && !state.isDrawing && !isCtrl) {
        const step = isShift ? 10 : 1;
        let dx = 0, dy = 0;
        if (key === 'arrowleft') dx = -step;
        if (key === 'arrowright') dx = step;
        if (key === 'arrowup') dy = -step;
        if (key === 'arrowdown') dy = step;

        if (dx !== 0 || dy !== 0) {
            e.preventDefault();
            state.selectedEls.forEach(el => {
                if (el.id === 'gridRect') return;
                const tf = parseTransform(el);
                tf.x += dx; tf.y += dy;
                tf.cx += dx; tf.cy += dy;
                const str = `translate(${tf.x}, ${tf.y}) rotate(${tf.angle}, ${tf.cx}, ${tf.cy}) scale(${tf.scaleX}, ${tf.scaleY})`;
                el.setAttribute('transform', str);
            });
            updateUIBox();
        }
    }
});

// [추가] 점 편집 핸들 생성 (Vertex Handles)
function createPointHandles(el, points) {
    // 현재 도형의 변환 행렬(Transform)을 가져옴 (점도 같이 따라 움직여야 하므로)
    const matrix = el.getCTM();

    points.forEach((pt, index) => {
        // SVG 좌표를 화면(Screen) 좌표로 변환
        // (도형이 회전/이동되어 있어도 핸들은 정확한 위치에 찍혀야 함)
        let svgPt = svg.createSVGPoint();
        svgPt.x = pt[0];
        svgPt.y = pt[1];
        
        // 중요: 도형의 Transform을 적용
        const transPt = svgPt.matrixTransform(matrix);

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", pt[0]); // 주의: SVG 내부는 원래 좌표계 사용 (그룹 transform에 영향받게 하기 위함)
        circle.setAttribute("cy", pt[1]);
        circle.setAttribute("r", 5);
        circle.setAttribute("fill", "white");
        circle.setAttribute("stroke", "#4a90e2");
        circle.setAttribute("stroke-width", "2");
        circle.classList.add("point-handle");
        circle.style.cursor = "pointer";
        
        // 어떤 점인지 식별하기 위한 데이터
        circle.dataset.index = index;
        
        // UI 레이어가 아닌, 도형이 속한 그룹이나 SVG 바로 위에 그려야 함
        // 하지만 편의상 UI 레이어(핸들)처럼 보이게 하려면 선택된 객체와 같은 좌표계를 쓰는 게 좋음
        // 여기서는 간단하게 구현하기 위해 로직을 단순화:
        // 핸들은 시각적 표시일 뿐이고, 드래그 로직에서 좌표를 계산함.
        
        // [트릭] 핸들을 객체 자체의 transform 영향을 받도록 객체 바로 다음에 삽입하거나
        // 별도 UI 레이어에 그리는 방법이 있음. 
        // 가장 쉬운 방법: 핸들에도 객체와 똑같은 transform을 줌.
        const tf = el.getAttribute('transform');
        if(tf) circle.setAttribute('transform', tf);

        // 이벤트 리스너: 점 드래그 시작
        circle.addEventListener('mousedown', (e) => {
            e.stopPropagation(); // 객체 선택 방지
            state.action = 'editing-point';
            state.editPointIndex = index; // 몇 번째 점인지 저장
            state.editTargetEl = el;
        });

        // UI 레이어(selectionBox가 있는 곳)에 추가
        ui.inputs.layer.appendChild(circle);
    });
}

// [단축키 헬퍼 함수]
function triggerShape(type) {
    state.currentShapeType = type;
    document.querySelectorAll('#shapeSubMenu .btn-sub').forEach(b => {
        if(b.dataset.shape === type) b.classList.add('active');
        else b.classList.remove('active');
    });
    changeMode('shape');
}

// ==========================================
// 6. 기능별 함수 구현
// ==========================================

// --- [그리드 & 스냅 기능 (신규)] ---

function toggleGrid() {
    state.showGrid = !state.showGrid;
    ui.inputs.gridRect.style.display = state.showGrid ? 'block' : 'none';
    ui.btns.grid.classList.toggle('active', state.showGrid);
}

function toggleSnap() {
    state.snap = !state.snap;
    ui.btns.snap.classList.toggle('active', state.snap);
    
    // [수정] 직접 텍스트를 쓰지 않고 다국어 함수 호출
    ui.btns.snap.textContent = state.snap ? t('snapOn') : t('snapOff');
}

// [핵심 수정] 좌표 가져올 때 스냅 적용
// [수정] SVG 좌표계 변환을 이용한 정확한 좌표 계산 (줌/팬 완벽 지원)
function getPoint(evt) {
    let point = svg.createSVGPoint();
    point.x = evt.clientX;
    point.y = evt.clientY;
    
    // 현재 화면의 변환 행렬(CTM)을 역산하여 마우스 좌표를 SVG 내부 좌표로 변환
    const ctm = svg.getScreenCTM().inverse();
    point = point.matrixTransform(ctm);

    let x = point.x;
    let y = point.y;

    if (state.snap) {
        x = Math.round(x / state.snapSize) * state.snapSize;
        y = Math.round(y / state.snapSize) * state.snapSize;
    }
    return [x, y];
}
// --- [복사 / 붙여넣기 로직 (신규)] ---

function copy() {
    if (state.selectedEls.length === 0) return;
    // 선택된 요소들을 깊은 복사하여 저장
    state.clipboard = state.selectedEls.map(el => el.cloneNode(true));
}

function paste() {
    if (!state.clipboard || state.clipboard.length === 0) return;

    deselect(); // 기존 선택 해제
    const newEls = [];
    const offset = 20; // 붙여넣기 시 이동 거리

    state.clipboard.forEach(node => {
        const newEl = node.cloneNode(true);
        // 상태 표시 클래스 제거
        newEl.classList.remove('selection-highlight');
        newEl.classList.remove('cursor-move');

        // SVG에 추가 (UI 레이어보다 앞에)
        svg.insertBefore(newEl, ui.inputs.marquee);
        
        // 위치 이동 (현재 위치 + 20px)
        const tf = parseTransform(newEl);
        
        tf.x += offset;
        tf.y += offset;
        
        // [추가] 객체가 이동했으므로 회전/스케일의 기준점(중심)도 같이 이동해야 함
        tf.cx += offset;
        tf.cy += offset;
        
        // [수정] Transform 문자열 재구성
        // 기존 코드의 맨 뒤에 있던 `translate(-${tf.cx}, -${tf.cy})` 삭제
        const str = `translate(${tf.x}, ${tf.y}) rotate(${tf.angle}, ${tf.cx}, ${tf.cy}) scale(${tf.scaleX}, ${tf.scaleY})`;
        
        newEl.setAttribute('transform', str);

        newEls.push(newEl);
    });

    // 붙여넣은 요소들 자동 선택
    selectElements(newEls);
    saveHistory();
    updateCode();
}// --- [선택 로직] ---

function selectElements(elements) {
    // ▼▼▼ [추가] 선택 시작 전, 현재 도구 설정을 백업 ▼▼▼
    // 이미 선택된 게 있어서 편집 중이라면 백업하지 않음 (최초 선택 시에만 백업)
    if (state.selectedEls.length === 0 && savedToolState === null) {
        savedToolState = {
            stroke: ui.inputs.color.value,
            fill: ui.inputs.fill.value,
            width: ui.inputs.width.value,
            opacity: ui.inputs.strokeOpacity ? ui.inputs.strokeOpacity.value : 100,
            fillOpacity: ui.inputs.fillOpacity ? ui.inputs.fillOpacity.value : 100,
            dash: state.strokeDash // 점선 상태도 저장
        };
    }
    state.selectedEls = elements;
    
    if (elements.length === 0) {
        deselect();
        return;
    }

    ui.inputs.layer.style.display = 'block';
    ui.inputs.resize.style.display = 'block';
    ui.inputs.rotate.style.display = 'block';
    ui.inputs.rotateLine.style.display = 'block';
        
    const el = elements[0];

    // ▼▼▼ [텍스트 패널 제어] ▼▼▼
    if (el.tagName === 'text') {
        if(ui.inputs.panelText) {
            ui.inputs.panelText.style.display = 'block'; 
            ui.inputs.textContent.value = el.textContent;
            ui.inputs.fontSize.value = parseFloat(el.getAttribute('font-size')) || 24;
            ui.inputs.fontWeight.value = el.getAttribute('font-weight') || 'normal';
            ui.inputs.fontFamily.value = el.getAttribute('font-family') || 'sans-serif';
        }
    } else {
        if(ui.inputs.panelText) ui.inputs.panelText.style.display = 'none';
    }
    // ▲▲▲ [텍스트 패널 끝] ▲▲▲

    // ▼▼▼ [핵심 수정] 선 색상 (Stroke) 안전하게 가져오기 ▼▼▼
    const stroke = el.getAttribute('stroke');
    // 값이 있고, 'none'이 아니며, '#'으로 시작하는 유효한 색상일 때만 적용
    if (stroke && stroke !== 'none' && stroke.startsWith('#')) {
        ui.inputs.color.value = stroke;
    } else {
        ui.inputs.color.value = '#000000'; // 선이 없으면 검정색(기본) 표시
    }
    ui.inputs.width.value = el.getAttribute('stroke-width') || 2;
    ui.labels.width.textContent = ui.inputs.width.value;

    // ▼▼▼ [핵심 수정] 채우기 색상 (Fill) 안전하게 가져오기 ▼▼▼
    const fill = el.getAttribute('fill');
    if (fill && fill !== 'none' && fill.startsWith('#')) {
        ui.inputs.fill.value = fill;
    } else {
        ui.inputs.fill.value = '#ffffff'; // 채우기 없으면 흰색(기본) 표시
    }
    
    if (elements.length === 1 && el.tagName === 'path') {
        ui.inputs.tension.value = 0; 
        ui.labels.tension.textContent = "0";
    }

    // 1. 선 투명도
    const sOp = el.getAttribute('stroke-opacity') || '1';
    if(ui.inputs.strokeOpacity) {
        ui.inputs.strokeOpacity.value = Math.round(parseFloat(sOp) * 100);
        if(ui.labels.strokeOpacity) ui.labels.strokeOpacity.textContent = ui.inputs.strokeOpacity.value;
    }

    // 2. 채우기 투명도
    const fOp = el.getAttribute('fill-opacity') || '1';
    if(ui.inputs.fillOpacity) {
        ui.inputs.fillOpacity.value = Math.round(parseFloat(fOp) * 100);
        if(ui.labels.fillOpacity) ui.labels.fillOpacity.textContent = ui.inputs.fillOpacity.value;
    }

    // 3. 선 스타일 (점선 여부 확인)
    const dash = el.getAttribute('stroke-dasharray');
    const isDashed = (dash && dash !== 'none');
    state.strokeDash = isDashed ? '5,5' : 'none';
    
    // 드롭다운 UI 갱신
    document.querySelectorAll('#strokeSubMenu .btn-sub').forEach(b => b.classList.remove('active'));
    const dashedBtn = document.querySelector('[data-dash="dashed"]');
    const solidBtn = document.querySelector('[data-dash="solid"]');
    
    if (isDashed && dashedBtn) dashedBtn.classList.add('active');
    else if (solidBtn) solidBtn.classList.add('active');

    updateUIBox(); 
    highlightCode();
}

// [script.js] deselect 함수 내부

function deselect() {
    state.selectedEls = [];
    ui.inputs.layer.style.display = 'none';
    if(ui.inputs.panelText) ui.inputs.panelText.style.display = 'none';
    highlightCode();

    // ▼▼▼ [추가] 선택 해제 시 원래 도구 설정으로 복구 ▼▼▼
    if (savedToolState) {
        // 1. 값 복구
        ui.inputs.color.value = savedToolState.stroke;
        ui.inputs.hex.value = savedToolState.stroke; // 헥스 코드도 동기화
        ui.inputs.fill.value = savedToolState.fill;
        ui.inputs.width.value = savedToolState.width;
        ui.labels.width.textContent = savedToolState.width;
        
        if (ui.inputs.strokeOpacity) {
            ui.inputs.strokeOpacity.value = savedToolState.opacity;
            if(ui.labels.strokeOpacity) ui.labels.strokeOpacity.textContent = savedToolState.opacity;
        }
        if (ui.inputs.fillOpacity) {
            ui.inputs.fillOpacity.value = savedToolState.fillOpacity;
            if(ui.labels.fillOpacity) ui.labels.fillOpacity.textContent = savedToolState.fillOpacity;
        }

        // 2. 점선/실선 상태 복구
        state.strokeDash = savedToolState.dash;
        document.querySelectorAll('#strokeSubMenu .btn-sub').forEach(b => b.classList.remove('active'));
        if (state.strokeDash !== 'none') {
            const dashedBtn = document.querySelector('[data-dash="dashed"]');
            if(dashedBtn) dashedBtn.classList.add('active');
        } else {
            const solidBtn = document.querySelector('[data-dash="solid"]');
            if(solidBtn) solidBtn.classList.add('active');
        }

        // 3. 저장된 상태 초기화
        savedToolState = null;
    }
    // ▲▲▲ [추가 끝] ▲▲▲
}


// [수정] updateUIBox 함수 (줌/팬 상태에서도 정확한 좌표 계산)
function updateUIBox() {
    // 1. 기존 핸들 제거
    document.querySelectorAll('.point-handle').forEach(el => el.remove());

    if (state.selectedEls.length === 0) return;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    // [핵심] 화면 좌표(Pixel)를 SVG 내부 좌표로 변환하는 행렬 가져오기
    const ctmInverse = svg.getScreenCTM().inverse();

    state.selectedEls.forEach(el => {
        if (['uiLayer', 'marqueeRect', 'gridRect'].includes(el.id) || 
            el.classList.contains('preview-line') || el.parentNode === ui.inputs.layer) return;
            
        const rect = el.getBoundingClientRect();
        
        // 화면상의 박스 모서리(Left-Top, Right-Bottom)를 SVG 좌표로 변환
        let pt1 = svg.createSVGPoint();
        pt1.x = rect.left; pt1.y = rect.top;
        pt1 = pt1.matrixTransform(ctmInverse);

        let pt2 = svg.createSVGPoint();
        pt2.x = rect.right; pt2.y = rect.bottom;
        pt2 = pt2.matrixTransform(ctmInverse);

        // 변환된 좌표로 Min/Max 갱신
        minX = Math.min(minX, pt1.x);
        minY = Math.min(minY, pt1.y);
        maxX = Math.max(maxX, pt2.x);
        maxY = Math.max(maxY, pt2.y);
    });

    ui.inputs.layer.setAttribute('transform', ''); 
    
    const pad = 5;
    const boxX = minX - pad;
    const boxY = minY - pad;
    const boxW = maxX - minX + pad*2;
    const boxH = maxY - minY + pad*2;

    ui.inputs.box.setAttribute('x', boxX);
    ui.inputs.box.setAttribute('y', boxY);
    ui.inputs.box.setAttribute('width', boxW);
    ui.inputs.box.setAttribute('height', boxH);

    ui.inputs.resize.setAttribute('x', boxX + boxW - 5);
    ui.inputs.resize.setAttribute('y', boxY + boxH - 5);

    const cx = boxX + boxW / 2;
    ui.inputs.rotate.setAttribute('cx', cx);
    ui.inputs.rotate.setAttribute('cy', boxY - 20);
    ui.inputs.rotateLine.setAttribute('x1', cx);
    ui.inputs.rotateLine.setAttribute('y1', boxY);
    ui.inputs.rotateLine.setAttribute('x2', cx);
    ui.inputs.rotateLine.setAttribute('y2', boxY - 20);
    
    // 중심점 저장 (변형의 기준점)
    state.initialState.groupCenter = { x: cx, y: boxY + boxH / 2 };
    
    if (state.selectedEls.length === 1) {
        const tf = parseTransform(state.selectedEls[0]);
        const angle = (tf.angle % 360 + 360) % 360;
        ui.inputs.rotateSlider.value = Math.round(angle);
        ui.labels.rotate.textContent = Math.round(angle);
        state.transform = { ...tf, cx: cx, cy: state.initialState.groupCenter.y, w: boxW, h: boxH };

        const el = state.selectedEls[0];
        if (el.dataset.points) {
            const points = JSON.parse(el.dataset.points);
            createPointHandles(el, points);
        }
    } else {
        ui.inputs.rotateSlider.value = 0;
        ui.labels.rotate.textContent = "0";
    }
}

// --- [변형(Transform) 로직] ---

// [수정] Transform 준비 (이동 최적화를 위해 좌표 분리 저장)
function prepareTransform() {
    state.initialState.transforms = state.selectedEls.map(el => {
ensureId(el);
        const tf = el.getAttribute('transform') || '';
        
        // 1. 이동(Translate) 파싱 (모든 translate 합산)
        let tx = 0, ty = 0;
        const translateRegex = /translate\(([^,]+),([^)]+)\)/g;
        let tMatch;
        while ((tMatch = translateRegex.exec(tf)) !== null) {
            tx += parseFloat(tMatch[1]);
            ty += parseFloat(tMatch[2]);
        }

        // 2. 스케일(Scale) 파싱 (없으면 1)
        let sx = 1, sy = 1;
        const scaleMatch = tf.match(/scale\(([^,]+)(?:,\s*([^)]+))?\)/);
        if (scaleMatch) {
            sx = parseFloat(scaleMatch[1]);
            sy = scaleMatch[2] ? parseFloat(scaleMatch[2]) : sx;
        }

        // 3. 회전(Rotate) 파싱 (없으면 0)
        let angle = 0;
        const rotateMatch = tf.match(/rotate\(([^,]+)/);
        if (rotateMatch) {
            angle = parseFloat(rotateMatch[1]);
        }
        
        // *중요* 기존의 복잡한 문자열을 버리고, 파싱된 "값"만 저장합니다.
        return { tx, ty, sx, sy, angle };
    });

if (state.selectedEls.length > 0) {
        startTransformValue = state.selectedEls[0].getAttribute('transform') || '';
    }
}

// [최종 수정] Transform 실행 (점 편집 Matrix + 리사이즈/회전 중심점 좌표 보정)
function handleTransformAction(pt) {
    
    // ▼▼▼ [1. 점 편집 모드 (Vertex Editing)] ▼▼▼
    if (state.action === 'editing-point') {
        const el = state.editTargetEl;
        const idx = state.editPointIndex;
        let points = JSON.parse(el.dataset.points);

        let svgPt = svg.createSVGPoint();
        svgPt.x = pt[0];
        svgPt.y = pt[1];
        
        // 화면 좌표 -> 로컬 좌표 변환 (Matrix 역산)
        const localPt = svgPt.matrixTransform(el.getCTM().inverse());
        
        let lx = localPt.x;
        let ly = localPt.y;

        points[idx] = [lx, ly];
        el.dataset.points = JSON.stringify(points);

        const tension = parseFloat(ui.inputs.tension.value);
        let d = "";
        if (el.tagName === 'path') {
             const isClosed = el.getAttribute("d").toUpperCase().includes("Z");
             d = solveCurve(points, tension, isClosed);
        } else if (el.tagName === 'polygon') {
             d = points.map(p => p.join(",")).join(" ");
             el.setAttribute("points", d);
        } 
        
        if(d && el.tagName === 'path') el.setAttribute("d", d);
        
        const handle = document.querySelector(`.point-handle[data-index="${idx}"]`);
        if(handle) {
             handle.setAttribute("cx", lx);
             handle.setAttribute("cy", ly);
        }
        
        updateCode();
        return; 
    }
    // ▲▲▲ [점 편집 끝] ▲▲▲


    // ▼▼▼ [2. 일반 변형 모드 (이동/회전/크기)] ▼▼▼
    const center = state.initialState.groupCenter;
    let dTx = 0, dTy = 0;       
    let newAngle = 0;           
    let newScale = 1;           

    if (state.action === 'moving') {
        dTx = pt[0] - state.startPos[0];
        dTy = pt[1] - state.startPos[1];
    }
    else if (state.action === 'rotating') {
        const startRad = Math.atan2(state.startPos[1] - center.y, state.startPos[0] - center.x);
        const currRad = Math.atan2(pt[1] - center.y, pt[0] - center.x);
        const deltaDeg = (currRad - startRad) * (180 / Math.PI);
        newAngle = (state.initialState.startAngle + deltaDeg) % 360;
        if (newAngle < 0) newAngle += 360;
        ui.inputs.rotateSlider.value = Math.round(newAngle);
        ui.labels.rotate.textContent = Math.round(newAngle);
    }
    else if (state.action === 'rotating-slider') {
        newAngle = parseFloat(ui.inputs.rotateSlider.value);
    }
    else if (state.action === 'resizing') {
        const startDist = Math.hypot(state.startPos[0] - center.x, state.startPos[1] - center.y);
        const currDist = Math.hypot(pt[0] - center.x, pt[1] - center.y);
        newScale = Math.max(0.1, currDist / (startDist || 1));
    }

    state.selectedEls.forEach((el, idx) => {
        if (el.id === 'gridRect') return;
        const init = state.initialState.transforms[idx];
        
        let finalTx = init.tx + dTx;
        let finalTy = init.ty + dTy;
        let finalAngle = init.angle;
        let finalSx = init.sx;
        let finalSy = init.sy;

        if (state.action.includes('rotating')) {
            if (state.action === 'rotating') {
                const startRad = Math.atan2(state.startPos[1] - center.y, state.startPos[0] - center.x);
                const currRad = Math.atan2(pt[1] - center.y, pt[0] - center.x);
                const delta = (currRad - startRad) * (180 / Math.PI);
                finalAngle = init.angle + delta;
            } else {
                const delta = newAngle - state.initialState.startAngle;
                finalAngle = init.angle + delta;
            }

            // ▼▼▼ [회전 좌표 보정 공식] ▼▼▼
            // 도형을 회전시키면 '원점(Top-Left)'도 중심점을 기준으로 궤도를 그리며 이동해야 합니다.
            // 아래 공식은 원점(init.tx, init.ty)을 중심점(center) 기준으로 회전시킨 새 위치를 구합니다.
            const rad = (finalAngle - init.angle) * (Math.PI / 180);
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);

            finalTx = center.x + (init.tx - center.x) * cos - (init.ty - center.y) * sin;
            finalTy = center.y + (init.tx - center.x) * sin + (init.ty - center.y) * cos;
        } 
        else if (state.action === 'resizing') {
            finalSx = init.sx * newScale;
            finalSy = init.sy * newScale;

// ▼▼▼ [추가] 1. 좌표 제한 (Safe Zone) 설정 ▼▼▼
        // 캔버스 중심에서 ±3000px 이상 밖으로 나가지 못하게 막음
        const LIMIT = 3000;
        finalTx = Math.max(-LIMIT, Math.min(LIMIT, finalTx));
        finalTy = Math.max(-LIMIT, Math.min(LIMIT, finalTy));
        // ▲▲▲ [추가 끝] ▲▲▲

            // ▼▼▼ [스케일 좌표 보정 공식] ▼▼▼
            // 크기가 변할 때 중심점을 유지하기 위해 위치를 반대 방향으로 이동 보정
            finalTx = init.tx * newScale + center.x * (1 - newScale);
            finalTy = init.ty * newScale + center.y * (1 - newScale);
        }

        const fx = parseFloat(finalTx.toFixed(2));
        const fy = parseFloat(finalTy.toFixed(2));
        const fa = parseFloat(finalAngle.toFixed(2));
        const fsx = parseFloat(finalSx.toFixed(2));
        const fsy = parseFloat(finalSy.toFixed(2));
        const cx = parseFloat(center.x.toFixed(2));
        const cy = parseFloat(center.y.toFixed(2));

        // [핵심 변경] rotate() 안에 cx, cy를 제거합니다.
        // 이미 위에서 translate(fx, fy)를 통해 원점을 회전된 위치로 옮겼기 때문에,
        // 로컬 원점(0,0)을 기준으로 회전하면 시각적으로는 중심점 기준으로 회전한 것과 같아집니다.
        const str = `translate(${fx}, ${fy}) rotate(${fa}) scale(${fsx}, ${fsy})`;
        
        const cleanStr = str
            .replace(`scale(1, 1)`, '')
            .replace(`rotate(0)`, '') // cx, cy가 없으므로 rotate(0)만 제거
            .replace(`translate(0, 0)`, '')
            .trim();
            
        el.setAttribute('transform', cleanStr);
    });

    // UI 선택 박스 업데이트
    const cx = parseFloat(center.x.toFixed(2));
    const cy = parseFloat(center.y.toFixed(2));

    if (state.action === 'moving') {
        const mx = parseFloat(dTx.toFixed(2));
        const my = parseFloat(dTy.toFixed(2));
        ui.inputs.layer.setAttribute('transform', `translate(${mx}, ${my}) ${state.initialState.uiTransform}`);
    } 
    else if (state.action.includes('rotating')) {
        const delta = (state.action === 'rotating') 
            ? ((Math.atan2(pt[1]-center.y, pt[0]-center.x) - Math.atan2(state.startPos[1]-center.y, state.startPos[0]-center.x)) * 180 / Math.PI)
            : (newAngle - state.initialState.startAngle);
        const rDelta = parseFloat(delta.toFixed(2));
        ui.inputs.layer.setAttribute('transform', `rotate(${rDelta}, ${cx}, ${cy}) ${state.initialState.uiTransform}`);
    } 
    else if (state.action === 'resizing') {
        const rScale = parseFloat(newScale.toFixed(2));
        ui.inputs.layer.setAttribute('transform', `translate(${cx}, ${cy}) scale(${rScale}) translate(-${cx}, -${cy}) ${state.initialState.uiTransform}`);
    }
    
    updateCode();
}

// [수정됨] Transform 파싱 (문자열에서 정확한 회전 중심점 추출)
function parseTransform(el) {
    const tf = el.getAttribute('transform') || '';
    const res = { x: 0, y: 0, angle: 0, cx: 0, cy: 0, scaleX: 1, scaleY: 1 };
    
    // 1. Translate 파싱
    const translateRegex = /translate\(([^,]+),([^)]+)\)/g;
    let match;
    while ((match = translateRegex.exec(tf)) !== null) {
        res.x += parseFloat(match[1]);
        res.y += parseFloat(match[2]);
    }
    
    // 2. Rotate 파싱 (각도 및 중심점 cx, cy 추출)
    // 예: rotate(45, 100, 200) -> angle:45, cx:100, cy:200
    const matchR = tf.match(/rotate\(([^)]+)\)/);
    if (matchR) { 
        // 콤마나 공백으로 분리
        const parts = matchR[1].split(/[\s,]+/).map(parseFloat);
        res.angle = parts[0] || 0;
        if (parts.length >= 3) {
            res.cx = parts[1];
            res.cy = parts[2];
        } else {
            // 회전 중심이 명시되지 않았다면 BBox 기준 (초기 상태)
            const bbox = el.getBBox();
            res.cx = bbox.x + bbox.width/2;
            res.cy = bbox.y + bbox.height/2;
        }
    } else {
        // 회전이 없어도 중심점은 계산해둠 (스케일 등을 위해)
        const bbox = el.getBBox();
        res.cx = bbox.x + bbox.width/2;
        res.cy = bbox.y + bbox.height/2;
    }

    // 3. Scale 파싱
    const matchS = tf.match(/scale\(([^,]+)(?:,\s*([^)]+))?\)/);
    if (matchS) { 
        res.scaleX = parseFloat(matchS[1]); 
        res.scaleY = matchS[2] ? parseFloat(matchS[2]) : res.scaleX; 
    }

    return res;
}


// --- [마퀴, 그리기, 유틸리티] ---

function handleMarqueeMove(pt) {
    const start = state.startPos;
    const x = Math.min(start[0], pt[0]);
    const y = Math.min(start[1], pt[1]);
    const w = Math.abs(start[0] - pt[0]);
    const h = Math.abs(start[1] - pt[1]);

    ui.inputs.marquee.setAttribute('x', x);
    ui.inputs.marquee.setAttribute('y', y);
    ui.inputs.marquee.setAttribute('width', w);
    ui.inputs.marquee.setAttribute('height', h);
}

// [수정] 드래그 선택 (그리드 선택 방지 적용)
function finishMarqueeSelection() {
    const mq = ui.inputs.marquee;
    const mx = parseFloat(mq.getAttribute('x'));
    const my = parseFloat(mq.getAttribute('y'));
    const mw = parseFloat(mq.getAttribute('width'));
    const mh = parseFloat(mq.getAttribute('height'));

    if (mw < 2 && mh < 2) {
        deselect();
        return;
    }

    const found = [];
const allEls = svg.querySelectorAll('path, rect, circle, polygon, text');
    
    allEls.forEach(el => {
        // ▼▼▼ [수정] 그리드(gridRect)는 선택 대상에서 제외 ▼▼▼
        if (el.parentNode === ui.inputs.layer || 
            el === ui.inputs.marquee || 
            el.classList.contains('preview-line') || 
            el.id === 'gridRect') return; 
        // ▲▲▲ [수정 끝] ▲▲▲
        
        const r = el.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();
        const ex = r.left - svgRect.left;
        const ey = r.top - svgRect.top;
        const ew = r.width;
        const eh = r.height;

        if (ex < mx + mw && ex + ew > mx && ey < my + mh && ey + eh > my) {
            found.push(el);
        }
    });

    selectElements(found);
}

function updateSelectedStyle() {
    state.selectedEls.forEach(el => {
        if (el.id === 'gridRect') return;
        
        // 현재 인풋값들을 강제로 적용하지 않고, 필요한 경우에만 호출하도록 변경됨.
        // 하지만 호환성을 위해 남겨둔다면, 최소한 'none'인 채우기는 보호하도록 수정:
        
        el.setAttribute('stroke', ui.inputs.color.value);
        el.setAttribute('stroke-width', ui.inputs.width.value);
        el.setAttribute('stroke-linecap', ui.inputs.cap.value);
        
        // 기존 채우기가 'none'이면 덮어쓰지 않음
        const currentFill = el.getAttribute('fill');
        if (currentFill && currentFill !== 'none') {
            el.setAttribute('fill', ui.inputs.fill.value);
        }
    });
    updateCode();
}

function applyNoFill() {
    state.selectedEls.forEach(el => {
        el.setAttribute('fill', 'none');
    });
    updateCode(); saveHistory();
}

function deleteSelected() {
    if (state.selectedEls.length > 0) {
        state.selectedEls.forEach(el => {
            if (el.id !== 'gridRect') el.remove(); // 그리드 제외하고 삭제
        });
        deselect(); saveHistory(); updateCode();
    }
}
function moveLayer(direction) {
    state.selectedEls.forEach(el => {
        if (el.id === 'gridRect') return; // 그리드 순서 변경 방지
        
        if (direction === 'front') svg.insertBefore(el, ui.inputs.marquee); 
        else svg.insertBefore(el, svg.firstChild);
    });
    saveHistory(); updateCode();
}

function handleShapeDrawStart(pt) {
    state.isDrawing = true; state.dragStartPoint = pt; deselect();
    let newEl; const type = state.currentShapeType;
    if (type === 'rect') {
        newEl = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        newEl.setAttribute("x", pt[0]); newEl.setAttribute("y", pt[1]); newEl.setAttribute("width", 0); newEl.setAttribute("height", 0);
    } else if (type === 'circle') {
        newEl = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        newEl.setAttribute("cx", pt[0]); newEl.setAttribute("cy", pt[1]); newEl.setAttribute("r", 0);
    } else if (type === 'triangle') {
        newEl = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        newEl.setAttribute("points", `${pt[0]},${pt[1]} ${pt[0]},${pt[1]} ${pt[0]},${pt[1]}`);
    }
    newEl.setAttribute("stroke", ui.inputs.color.value);
    newEl.setAttribute("stroke-width", ui.inputs.width.value);
    newEl.setAttribute("fill", ui.inputs.fill.value);
    newEl.setAttribute("stroke-linecap", ui.inputs.cap.value);
// ... 기존 setAttribute 들 ...
    newEl.setAttribute("stroke-dasharray", state.strokeDash); // [추가]
newEl.setAttribute("stroke-opacity", ui.inputs.strokeOpacity.value / 100);
    newEl.setAttribute("fill-opacity", ui.inputs.fillOpacity.value / 100);
    
    svg.insertBefore(newEl, ui.inputs.marquee); 
    state.currentPath = newEl;
}

function handleShapeDrawMove(pt) {
    if (!state.currentPath) return;
    const start = state.dragStartPoint; const type = state.currentShapeType;
    const x = Math.min(start[0], pt[0]); const y = Math.min(start[1], pt[1]);
    const w = Math.abs(start[0] - pt[0]); const h = Math.abs(start[1] - pt[1]);
    if (type === 'rect') {
        state.currentPath.setAttribute("x", x); state.currentPath.setAttribute("y", y);
        state.currentPath.setAttribute("width", w); state.currentPath.setAttribute("height", h);
    } else if (type === 'circle') {
        const r = Math.sqrt(Math.pow(pt[0]-start[0], 2) + Math.pow(pt[1]-start[1], 2));
        state.currentPath.setAttribute("r", r);
    } else if (type === 'triangle') {
        const p1 = `${x + w / 2},${y}`; const p2 = `${x},${y + h}`; const p3 = `${x + w},${y + h}`;
        state.currentPath.setAttribute("points", `${p1} ${p2} ${p3}`);
    }
}

function handleDrawClick(pt) {
    if (!state.isDrawing) {
        // [그리기 시작]
        state.isDrawing = true; 
        state.points = [pt];
        
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        
        // 속성 적용
        path.setAttribute("stroke", ui.inputs.color.value); 
        path.setAttribute("stroke-width", ui.inputs.width.value);
        path.setAttribute("fill", "none"); 
        path.setAttribute("stroke-linecap", ui.inputs.cap.value);
        path.setAttribute("stroke-linejoin", "round");
        path.setAttribute("d", `M ${pt[0]} ${pt[1]}`);
        
        // [수정] 투명도 및 점선 적용 로직 개선
        path.setAttribute("stroke-dasharray", state.strokeDash);
        
        // 펜(선)은 strokeOpacity만 적용하면 됩니다.
        path.setAttribute("stroke-opacity", ui.inputs.strokeOpacity.value / 100);
        
        path.dataset.points = JSON.stringify(state.points);
        svg.insertBefore(path, ui.inputs.marquee);
        state.currentPath = path; 
        ui.btns.finish.disabled = false;
    } else {
        // [그리기 계속]
        state.points.push(pt);
        const d = state.currentPath.getAttribute("d");
        state.currentPath.setAttribute("d", `${d} L ${pt[0]} ${pt[1]}`);
        state.currentPath.dataset.points = JSON.stringify(state.points);
    }
    updateCode();
}

function finishDraw(triggerClose) {
    if (!state.isDrawing) return;
    const shouldClose = ui.inputs.autoClose.checked;
    if (state.mode === 'draw' && triggerClose && shouldClose && state.currentPath && state.points.length > 2) {
        let d = state.currentPath.getAttribute("d");
        if (!d.toUpperCase().endsWith("Z")) {
            d += " Z"; state.currentPath.setAttribute("d", d);
        }
    }
    state.isDrawing = false; state.currentPath = null; state.points = [];
    previewLine.style.display = 'none';
    ui.btns.finish.disabled = true;
    saveHistory(); updateCode();
}

function handlePaintClick(e) {
    const target = e.target;
    if (['path', 'rect', 'circle', 'polygon', 'text'].includes(target.tagName)) {
        if (e.shiftKey) target.setAttribute('stroke', ui.inputs.color.value);
        else target.setAttribute('fill', ui.inputs.fill.value);
        saveHistory(); updateCode();
    }
}


// [script.js] solveCurve 함수 전체 교체

function solveCurve(points, tension, isClosed) {
    const size = points.length;
    if (size < 2) return "";

    let pts = [...points];
    // 닫힌 도형 처리 (시작점=끝점 강제 연결)
    if (isClosed && (pts[0][0] !== pts[size-1][0] || pts[0][1] !== pts[size-1][1])) {
        pts.push(pts[0]);
    }

    const totalPoints = pts.length;

    // 텐션이 0이면 그냥 직선으로 연결
    if (tension === 0) {
        let path = "M " + pts.map(p => p.join(" ")).join(" L ");
        if (isClosed) path += " Z";
        return path;
    }

    // [수정됨] 점이 2개일 때 (직선) -> 텐션에 따라 곡선(Q)으로 휘게 만들기
    if (size === 2 && !isClosed) {
        const [x1, y1] = pts[0];
        const [x2, y2] = pts[1];

        // 1. 중점 계산
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;

        // 2. 거리 및 방향 계산
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist === 0) return `M ${x1} ${y1} L ${x2} ${y2}`;

        // 3. 수직 벡터(Normal) 계산 후 텐션만큼 밀어내기
        // (dy, -dx)는 선분에 수직인 방향입니다.
        const offset = dist * tension * 0.5; // 텐션 1일 때 길이의 50%만큼 휨

        const cx = mx - (dy / dist) * offset;
        const cy = my + (dx / dist) * offset;

        return `M ${x1} ${y1} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${x2} ${y2}`;
    }

    // [기존 유지] 점이 3개 이상일 때 (Catmull-Rom Spline 알고리즘)
    const flatPts = pts.flat();
    let path = `M ${flatPts[0]} ${flatPts[1]}`;

    for (let i = 0; i < totalPoints - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i+1];

        const p0 = i > 0 ? pts[i-1] : pts[0];
        const p3 = i < totalPoints - 2 ? pts[i+2] : p2;

        const cp1x = p1[0] + (p2[0] - p0[0]) / 6 * tension;
        const cp1y = p1[1] + (p2[1] - p0[1]) / 6 * tension;

        const cp2x = p2[0] - (p3[0] - p1[0]) / 6 * tension;
        const cp2y = p2[1] - (p3[1] - p1[1]) / 6 * tension;

        path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${p2[0]} ${p2[1]}`;
    }

    if (isClosed) path += " Z";
    return path;
}
// --- [히스토리 관리 (Undo / Redo 수정)] ---

function saveHistory() {
    const clone = svg.cloneNode(true);
    // UI 요소들 제거하고 순수 SVG만 저장
    const preview = clone.querySelector('.preview-line'); if(preview) preview.remove();
    const uiL = clone.querySelector('#uiLayer'); if(uiL) uiL.remove();
    const mq = clone.querySelector('#marqueeRect'); if(mq) mq.remove(); 
    const grid = clone.querySelector('#gridRect'); if(grid) grid.remove(); // [추가] 그리드는 저장 안 함

    const snap = { html: clone.innerHTML, bg: svg.style.backgroundColor };
    
    // 중복 저장 방지
    if (state.history.length > 0) {
        const last = state.history[state.history.length - 1];
        if (last.html === snap.html && last.bg === snap.bg) return;
    }

    state.history.push(snap);
    if (state.history.length > 30) state.history.shift();

    // [중요] 새로운 액션이 생기면 Redo 스택 초기화
    state.redoStack = []; 
}

// [script.js 추가] 도형을 Path로 변환하는 함수

// [수정] script.js - convertToPath 함수
function convertToPath(el) {
    let points = [];
    
    // 1. 사각형 변환
    if (el.tagName === 'rect') {
        const x = parseFloat(el.getAttribute('x'));
        const y = parseFloat(el.getAttribute('y'));
        const w = parseFloat(el.getAttribute('width'));
        const h = parseFloat(el.getAttribute('height'));
        points = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    } 
    // 2. 다각형(삼각형 등) 변환
    else if (el.tagName === 'polygon') {
        const ptsAttr = el.getAttribute('points').trim();
        const coords = ptsAttr.split(/[\s,]+/); 
        for (let i = 0; i < coords.length; i += 2) {
            points.push([parseFloat(coords[i]), parseFloat(coords[i+1])]);
        }
    }

    // 3. 새로운 Path 생성
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    
    // 기존 속성 복사
    ['stroke', 'stroke-width', 'fill', 'stroke-linecap', 'transform', 'opacity', 'stroke-dasharray'].forEach(attr => {
        if (el.hasAttribute(attr)) path.setAttribute(attr, el.getAttribute(attr));
    });

    // [수정 완료] 여기서 newEl 이라고 되어있던 것을 path 로 고쳤습니다.
    path.setAttribute("stroke-dasharray", state.strokeDash); 
    path.setAttribute("stroke-opacity", ui.inputs.strokeOpacity.value / 100);
    path.setAttribute("fill-opacity", ui.inputs.fillOpacity.value / 100);

    // 포인트 데이터 저장
    path.dataset.points = JSON.stringify(points);

    // 초기 d 속성 생성
    let d = "M " + points.map(p => p.join(" ")).join(" L ") + " Z";
    path.setAttribute("d", d);

    // DOM 교체
    el.replaceWith(path);
    return path;
}

// [script.js] undo 함수 교체

function undo() {
    // 1순위: 커맨드 매니저에게 처리를 요청 (이동/변형 등)
    // commandManager.undo()가 성공(true)하면 여기서 종료
    if (commandManager.undo()) {
        updateUIBox();
        updateCode();
        return;
    }

    // 2순위: 그리기 중 취소 (ESC와 유사)
    if (state.isDrawing) {
        if (state.points.length > 1) {
            state.points.pop();
            const d = solveCurve(state.points, 0, false);
            state.currentPath.setAttribute("d", d);
            state.currentPath.dataset.points = JSON.stringify(state.points);
            updateCode();
        } else {
            if(state.currentPath) state.currentPath.remove(); 
            finishDraw(false); 
            // 그리기 시작 전 상태로 되돌리기 위해 히스토리 복구
            state.history.pop(); 
            if(state.history.length > 0) restoreHistory(state.history[state.history.length - 1]);
        }
        return;
    }

    // 3순위: 기존 스냅샷 방식 Undo (생성, 삭제, 색상변경 등)
    if (state.history.length > 1) {
        const current = state.history.pop(); // 현재 상태 제거
        state.redoStack.push(current);       // Redo 스택으로 이동
        
        const prev = state.history[state.history.length - 1]; // 이전 상태 확인
        restoreHistory(prev);
    }
}

// [신규] Redo 함수
function redo() {
    // 1순위: 커맨드 매니저 (이동/변형 복구)
    if (commandManager.redo()) {
        updateUIBox();
        updateCode();
        return;
    }

    // 2순위: 기존 스냅샷 방식 Redo
    if (state.redoStack.length === 0) return;

    const nextState = state.redoStack.pop();
    state.history.push(nextState);
    restoreHistory(nextState);
}

// [리팩토링] 히스토리 복구 로직 분리
function restoreHistory(snapShot) {
    if (!snapShot) return;

    // 현재 UI 요소들 잠시 대피 (복구 시 날아가지 않게)
    const uiClone = ui.inputs.layer; 
    const mqClone = ui.inputs.marquee;
    const gridClone = ui.inputs.gridRect; // [추가]
    const previewClone = document.querySelector('.preview-line'); // [추가]

    svg.innerHTML = snapShot.html;
    svg.style.backgroundColor = snapShot.bg;
    
    // 필수 UI 요소들 다시 붙이기
    // 순서 중요: Grid -> Drawings -> Preview -> Marquee -> UI Layer
    if (gridClone) svg.prepend(gridClone); // 그리드는 맨 뒤
    if (previewClone) svg.appendChild(previewClone);
    if (mqClone) svg.appendChild(mqClone);
    if (uiClone) svg.appendChild(uiClone);
    
    // DOM 레퍼런스 재연결
    ui.inputs.layer = document.getElementById('uiLayer');
    ui.inputs.box = document.getElementById('selectionBox');
    ui.inputs.resize = document.getElementById('handleResize');
    ui.inputs.rotate = document.getElementById('handleRotate');
    ui.inputs.rotateLine = document.getElementById('rotateLine');
    ui.inputs.marquee = document.getElementById('marqueeRect');
    ui.inputs.gridRect = document.getElementById('gridRect'); // [추가]

    // 그리드 상태에 따라 표시 여부 재설정
    ui.inputs.gridRect.style.display = state.showGrid ? 'block' : 'none';

    deselect();
    updateCode();
}

function restoreLastHistory() {
    const last = state.history[state.history.length - 1];
    if (!last) return;
    
    const uiClone = ui.inputs.layer.cloneNode(true);
    const mqClone = ui.inputs.marquee.cloneNode(true);
    
    svg.innerHTML = last.html;
    svg.style.backgroundColor = last.bg;
    
    svg.appendChild(previewLine); 
    svg.appendChild(mqClone);
    svg.appendChild(uiClone);
    
    deselect();
    ui.inputs.layer = document.getElementById('uiLayer');
    ui.inputs.box = document.getElementById('selectionBox');
    ui.inputs.resize = document.getElementById('handleResize');
    ui.inputs.rotate = document.getElementById('handleRotate');
    ui.inputs.rotateLine = document.getElementById('rotateLine');
    ui.inputs.marquee = document.getElementById('marqueeRect');
    
    updateCode();
}

function updateCode() {
    // 1. 코드창이 닫혀있으면 연산하지 않음 (성능 최적화)
    if (ui.btns.toggleCode && !ui.btns.toggleCode.classList.contains('active')) return;
    
    // 2. 쓰로틀링: 0.1초 내에 재호출되면 무시
    if (isThrottled) return;
    isThrottled = true;
    setTimeout(() => { isThrottled = false; }, 100);

    const viewer = ui.inputs.viewer;
    const style = svg.getAttribute("style");
    viewer.innerHTML = ""; 
    
    const headerDiv = document.createElement("div");
    headerDiv.className = "code-line";
    headerDiv.textContent = `<svg width="800" height="600" style="${style}" xmlns="http://www.w3.org/2000/svg">`;
    viewer.appendChild(headerDiv);

    let rawHtml = `<svg width="800" height="600" style="${style}" xmlns="http://www.w3.org/2000/svg">\n`;
    
    Array.from(svg.children).forEach((child) => {
        if (child.classList.contains("preview-line") || 
            child.id === 'uiLayer' || 
            child.id === 'marqueeRect' || 
            child.id === 'gridRect' || 
            child.tagName === 'defs') return;
            
        const clone = child.cloneNode();
        const lineDiv = document.createElement("div");
        lineDiv.className = "code-line code-element"; 
        lineDiv.textContent = "  " + clone.outerHTML;
        
        // [중요] 코드 줄과 실제 도형을 연결!
        lineDiv.targetEl = child; 
        
        // [보너스 기능] 코드 줄을 클릭하면 캔버스에서 해당 도형이 선택됨
        lineDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            selectElements([child]);
        });

        viewer.appendChild(lineDiv);
        rawHtml += `  ${clone.outerHTML}\n`;
    });
    
    const footerDiv = document.createElement("div");
    footerDiv.className = "code-line";
    footerDiv.textContent = `</svg>`;
    viewer.appendChild(footerDiv);
    
    rawHtml += `</svg>`;
    
    if (document.activeElement !== ui.inputs.text) {
        ui.inputs.text.value = rawHtml;
    }

    // 코드가 갱신되면 현재 선택된 것에 맞춰 하이라이트 다시 적용
    highlightCode();
}


function downloadImage() {
    let rawHtml = `<svg width="800" height="600" style="${svg.getAttribute("style")}" xmlns="http://www.w3.org/2000/svg">\n`;
    
    // SVG 내부 요소들을 순회하며 복제 (그리드, UI 레이어 등 제외)
    Array.from(svg.children).forEach(child => {
        if (child.classList.contains("preview-line") || 
            child.id === 'uiLayer' || 
            child.id === 'marqueeRect' || 
            child.id === 'gridRect' || 
            child.tagName === 'defs') return;
           
        let c = child.cloneNode();
        c.classList.remove("selection-highlight");
        c.classList.remove("cursor-move");
        rawHtml += `  ${c.outerHTML}\n`;
    });
    
    rawHtml += `</svg>`;
    
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    canvas.width = 800; 
    canvas.height = 600;
    
    const svgBlob = new Blob([rawHtml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = function () {
        ctx.fillStyle = svg.style.backgroundColor || "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const a = document.createElement("a");
        a.href = canvas.toDataURL("image/png");
        a.download = "svg_master.png";
        a.click();
        URL.revokeObjectURL(url);
    };
    img.src = url;
}
// [추가] 진짜 SVG 파일로 다운로드하기
function downloadSVGFile() {
    // 현재 에디터 내용을 깔끔한 SVG 코드로 정리
    let rawHtml = `<svg width="800" height="600" style="${svg.getAttribute("style")}" xmlns="http://www.w3.org/2000/svg">\n`;
    
    // 불필요한 UI 요소 제외하고 순수 도형만 추출
    Array.from(svg.children).forEach(child => {
        if (child.classList.contains("preview-line") || 
            ['uiLayer', 'marqueeRect', 'gridRect', 'gridPattern'].includes(child.id) || 
            child.tagName === 'defs') return;
        
        let c = child.cloneNode();
        c.classList.remove("selection-highlight", "cursor-move");
        rawHtml += `  ${c.outerHTML}\n`;
    });
    rawHtml += `</svg>`;

    const blob = new Blob([rawHtml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "design.svg";
    a.click();
    URL.revokeObjectURL(url);
}
// [script.js] 기능 구현 섹션 - 그룹화 관련 함수 추가

function groupSelected() {
    // 1. 선택된 요소가 1개 이상이어야 함 (그리드 제외)
    const targets = state.selectedEls.filter(el => el.id !== 'gridRect');
    if (targets.length < 1) return;

    // 2. 그룹(g) 태그 생성
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    
    // 3. 삽입 위치 결정 (선택된 것 중 가장 뒤에 있는 요소의 바로 앞)
    // (화면상 가장 위에 보이는 요소 근처에 그룹을 만듭니다)
    const lastEl = targets[targets.length - 1];
    lastEl.parentNode.insertBefore(g, lastEl);

    // 4. 요소들을 그룹으로 이동
    targets.forEach(el => {
        g.appendChild(el);
        // 선택 하이라이트 클래스 제거 (그룹 자체가 선택될 것이므로)
        el.classList.remove('selection-highlight');
    });

    // 5. 그룹을 선택 상태로 변경
    selectElements([g]);
    saveHistory();
    updateCode();
}

function ungroupSelected() {
    // 선택된 요소 중 'g' 태그인 것만 골라냄
    const groups = state.selectedEls.filter(el => el.tagName === 'g' && el.id !== 'uiLayer');
    if (groups.length === 0) return;

    let newSelection = [];

    groups.forEach(g => {
        // 그룹의 변형 속성(이동, 회전 등)을 가져옴
        const groupTransform = g.getAttribute('transform') || '';
        
        // 자식 요소들을 순회하며 밖으로 꺼냄
        // (childNodes는 실시간으로 변하므로 Array로 변환 후 순회)
        const children = Array.from(g.children);
        
        children.forEach(child => {
            // [중요] 그룹의 변형을 자식에게 상속시킴
            // 예: 그룹이 45도 회전해 있었다면, 자식도 그만큼 회전된 상태로 나와야 함
            const childTransform = child.getAttribute('transform') || '';
            const newTransform = `${groupTransform} ${childTransform}`.trim();
            
            if (newTransform) {
                child.setAttribute('transform', newTransform);
            }
            
            // 그룹의 바로 앞 형제 위치로 자식을 이동 (그룹 밖으로 탈출)
            g.parentNode.insertBefore(child, g);
            newSelection.push(child);
        });
        
        // 빈 껍데기가 된 그룹 삭제
        g.remove();
    });

    // 풀려난 녀석들을 다시 선택
    selectElements(newSelection);
    saveHistory();
    updateCode();
}

// --- [SVG 코드 유틸리티 (복사 및 역방향 동기화)] ---

// 1. 코드 복사 기능
// [script.js] copyCodeToClipboard 함수 수정

// [script.js] 붙여넣기 기능 구현 (추가)

if (ui.btns.paste) {
    ui.btns.paste.addEventListener('click', async () => {
        try {
            // 1. 클립보드에서 텍스트 읽기
            const text = await navigator.clipboard.readText();
            
            if (!text.trim()) return; // 빈 내용이면 무시

            // 2. 간단한 유효성 검사 (SVG 태그가 있는지)
            if (!text.includes('<svg') && !text.includes('</svg>')) {
                // SVG 태그가 없으면 임시로 감싸서 시도해볼 수도 있지만, 일단 경고
                alert(t('invalidSVG'));
                return;
            }

            // 3. 텍스트 모드가 아니어도 강제로 textarea에 값을 넣음
            ui.inputs.text.value = text;

            // 4. [핵심] 기존에 만들어둔 '코드 적용 함수'를 강제 실행
            // (input 이벤트를 인위적으로 발생시켜 applyCodeFromTextarea가 실행되게 함)
            ui.inputs.text.dispatchEvent(new Event('input'));

            // 5. 성공 피드백 (버튼 텍스트 잠시 변경)
            const originalText = ui.btns.paste.innerText;
            ui.btns.paste.innerText = t('pasteDone');
            
            setTimeout(() => {
                // 언어 설정에 맞는 원래 텍스트로 복구
                ui.btns.paste.innerText = t('btnPaste'); 
            }, 1500);

        } catch (err) {
            console.error('Paste failed:', err);
            alert(t('pasteError') + "\n(HTTPS 환경이나 로컬호스트에서만 동작합니다)");
        }
    });
}

function copyCodeToClipboard() {
    const code = ui.inputs.text.style.display === 'none' 
        ? ui.inputs.viewer.innerText 
        : ui.inputs.text.value; 

    navigator.clipboard.writeText(code).then(() => {
        // [수정] 현재 버튼 텍스트 저장 (이건 그대로 둠)
        const originalText = ui.btns.copy.innerText;
        
        // [수정] "완료!" 메시지를 다국어로 표시
        ui.btns.copy.innerText = t('copyDone');
        
        // 1.5초 후 원래 텍스트(번역된 "복사")로 복구
        setTimeout(() => {
             // 단순히 originalText로 돌리는 게 아니라, 현재 언어에 맞는 "복사" 텍스트로 리셋
             ui.btns.copy.innerText = t('btnCopy'); 
        }, 1500);
    });
}

// 2. [핵심] 텍스트 수정 -> 캔버스 반영 (역방향 동기화)
function applyCodeFromTextarea(e) {
    const val = e.target.value;
    
    // 1. 텍스트를 XML(SVG) DOM으로 파싱
    const parser = new DOMParser();
    const doc = parser.parseFromString(val, "image/svg+xml");
    
    // 2. 문법 오류가 있으면 중단 (타이핑 중일 때 에러 방지)
    if (doc.querySelector("parsererror")) return;

    // 3. 기존 도형들만 삭제 (UI 레이어, 그리드, 패턴 보호)
    // 삭제하면 안 되는 ID 목록
    const protectedIds = ['uiLayer', 'marqueeRect', 'gridRect', 'gridPattern'];
    
    // children은 실시간으로 변하므로 Array.from으로 고정 후 순회
    Array.from(svg.children).forEach(child => {
 // [수정] id가 없어도 class가 'preview-line'이면 삭제하지 않도록 보호 조건 추가
        if (!protectedIds.includes(child.id) && 
            child.tagName !== 'defs' && 
            !child.classList.contains('preview-line')) { // <--- 이 부분 추가!
            
            child.remove();
        }
    })

    // 4. 파싱된 새 도형들을 캔버스에 추가
    // doc.documentElement는 <svg> 태그 자체이므로 그 자식들을 가져옴
    Array.from(doc.documentElement.children).forEach(node => {
        // 복붙한 코드 안에 그리드나 UI 요소가 포함되어 있을 수 있으므로 필터링
        if (protectedIds.includes(node.id) || node.tagName === 'defs') return;

        // UI 레이어(marquee) 바로 앞에 삽입하여 UI가 항상 위에 오도록 함
        const newNode = node.cloneNode(true);
        svg.insertBefore(newNode, ui.inputs.marquee);
    });

    // 5. 상태 초기화 (선택 해제 등)
    deselect();
    // 주의: 여기서 updateCode()를 호출하면 입력 커서가 튀어버리므로 호출하지 않음
    // 대신 히스토리에는 저장
    saveHistory(); 
}
// [script.js] 파일 맨 마지막에 추가

// 사이드바 토글 기능
if (ui.btns.toggleSidebar) {
    ui.btns.toggleSidebar.addEventListener('click', () => {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('collapsed');
        
        // 아이콘 방향 바꾸기 (◀ -> ▶)
        const isClosed = sidebar.classList.contains('collapsed');
        ui.btns.toggleSidebar.textContent = isClosed ? "▶" : "◀";
    });
}

// --- [정렬 기능 (Alignment)] ---

// [script.js] 정렬 기능 함수 (전체 교체)

function alignSelected(type) {
    // 0. 선택된 요소가 없으면 종료
    if (state.selectedEls.length === 0) return;

    let minX, minY, maxX, maxY;

    // 1. 기준 영역 계산 로직 분기
    // (A) 개체가 1개일 때: 캔버스(800x600) 전체를 기준으로 정렬
    if (state.selectedEls.length === 1) {
        minX = 0;
        minY = 0;
        // state.viewBox가 있으면 그 크기를 쓰고, 없으면 기본값 800/600 사용
        maxX = state.viewBox ? state.viewBox.w : 800;
        maxY = state.viewBox ? state.viewBox.h : 600;
    } 
    // (B) 개체가 2개 이상일 때: 선택된 개체들의 전체 경계 박스(Bounding Box)를 기준으로 정렬
    else {
        minX = Infinity; minY = Infinity;
        maxX = -Infinity; maxY = -Infinity;

        // 선택된 모든 요소의 범위를 구함
        state.selectedEls.forEach(el => {
            const rect = el.getBoundingClientRect();
            const svgRect = svg.getBoundingClientRect();
            
            // SVG 기준 상대 좌표 계산
            const x = rect.left - svgRect.left;
            const y = rect.top - svgRect.top;
            const w = rect.width;
            const h = rect.height;

            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x + w > maxX) maxX = x + w;
            if (y + h > maxY) maxY = y + h;
        });
    }

    const centerX = minX + (maxX - minX) / 2;
    const centerY = minY + (maxY - minY) / 2;

    // 2. 각 요소를 목표 위치로 이동
    state.selectedEls.forEach(el => {
        const rect = el.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();

        // 현재 요소의 위치 및 크기 파악
        const x = rect.left - svgRect.left;
        const y = rect.top - svgRect.top;
        const w = rect.width;
        const h = rect.height;

        let dx = 0;
        let dy = 0;

        // 정렬 타입에 따른 이동량(delta) 계산
        switch (type) {
            case 'left':   dx = minX - x; break;
            case 'center': dx = centerX - (x + w / 2); break;
            case 'right':  dx = maxX - (x + w); break;
            case 'top':    dy = minY - y; break;
            case 'middle': dy = centerY - (y + h / 2); break;
            case 'bottom': dy = maxY - (y + h); break;
        }

        // 실제로 이동해야 할 거리가 있다면 Transform 업데이트
        if (dx !== 0 || dy !== 0) {
            const tf = parseTransform(el);
            
            // 기존 위치값에 이동량(dx, dy) 더하기
            const newX = tf.x + dx;
            const newY = tf.y + dy;
            
            // [중요] 회전 중심점(cx, cy)도 같이 이동해야 제자리 회전이 유지됨
            const newCx = tf.cx + dx;
            const newCy = tf.cy + dy;

            // 새로운 Transform 속성 적용
            const str = `translate(${newX}, ${newY}) rotate(${tf.angle}, ${newCx}, ${newCy}) scale(${tf.scaleX}, ${tf.scaleY})`;
            el.setAttribute('transform', str);
        }
    });

    // 3. 마무리 (히스토리 저장, 코드 갱신, 선택박스 위치 재조정)
    saveHistory();
    updateCode();
    updateUIBox(); 
}

// [script.js] 맨 아래 기능 구현 섹션에 추가

// --- [지우개 기능] ---

function handleEraserClick(e) {
    const el = e.target;
    
    // 보호해야 할 요소들 (그리드, UI 레이어 등)은 무시
    if (['uiLayer', 'gridRect', 'marqueeRect', 'selectionBox', 'handleResize', 'handleRotate', 'rotateLine'].includes(el.id) || 
        el.tagName === 'svg' || 
        el.parentNode.id === 'uiLayer') return;

    // 1. 채우기가 있는 경우 -> 채우기만 제거
    const fill = el.getAttribute('fill');
    if (fill && fill !== 'none' && fill !== 'transparent') {
        el.setAttribute('fill', 'none');
        updateCode();
        return; // 선은 남겨둠
    }

    // 2. 채우기가 없는 경우 (선만 있거나 이미 지워짐) -> 객체 삭제
    el.remove();
    deselect(); // 혹시 선택되어 있던거라면 선택 해제
    updateCode();
}

function handleEraserDrag(el) {
    if (!el) return;

    // 보호해야 할 요소 체크
    if (['uiLayer', 'gridRect', 'marqueeRect', 'selectionBox', 'handleResize', 'handleRotate', 'rotateLine'].includes(el.id) || 
        el.tagName === 'svg' || 
        el.parentNode.id === 'uiLayer' ||
        el.classList.contains('preview-line')) return;

    // 드래그 중에는 묻지도 따지지도 않고 삭제
if (['path', 'rect', 'circle', 'polygon', 'g', 'text'].includes(el.tagName)) {
        el.remove();
        deselect();
        updateCode(); 
    }
}

// [script.js] 파일 맨 마지막에 추가

// --- [도움말 모달 제어] ---
const modal = document.getElementById('helpModal');
const btnClose = document.getElementById('btnCloseHelp');
const btnOk = document.getElementById('btnOkHelp');

function openHelp() {
    modal.classList.add('show');
}

function closeHelp() {
    modal.classList.remove('show');
}

// 1. 버튼 클릭 이벤트
if (ui.btns.help) ui.btns.help.addEventListener('click', openHelp);
if (btnClose) btnClose.addEventListener('click', closeHelp);
if (btnOk) btnOk.addEventListener('click', closeHelp);

// 2. 배경 클릭 시 닫기
window.addEventListener('click', (e) => {
    if (e.target === modal) closeHelp();
});

// 3. F1 키로 도움말 열기 (keydown 리스너에 추가해도 되고, 별도로 해도 됨)
document.addEventListener('keydown', (e) => {
    if (e.key === 'F1') {
        e.preventDefault();
        openHelp();
    }
    // ESC로 닫기
    if (e.key === 'Escape' && modal.classList.contains('show')) {
        closeHelp();
    }
});

// [script.js] 맨 마지막에 붙여넣기 (언어 설정 & 초기화)

// --- [언어 변경 (지구본 + 텍스트 메뉴)] ---
const btnLang = document.getElementById('btnLang');
const langLabel = document.getElementById('currentLangLabel');
const langMenu = document.getElementById('langSubMenu');

// 1. 지구본 버튼 클릭 시 메뉴 토글
if (btnLang) {
    btnLang.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDropdowns(); // 다른 메뉴들은 닫기
        langMenu.classList.toggle('show');
    });
}

// 2. 언어 메뉴 항목 클릭 이벤트
document.querySelectorAll('#langSubMenu .btn-sub').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const lang = e.target.dataset.lang;
        
        // 언어 변경 실행
        changeLanguage(lang);
        
        // 상단 버튼 텍스트 업데이트 (EN, KO, JA)
        if (langLabel) langLabel.textContent = lang.toUpperCase();

        // 메뉴 UI 업데이트 (활성화 표시)
        document.querySelectorAll('#langSubMenu .btn-sub').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        // 메뉴 닫기
        langMenu.classList.remove('show');
    });
});

// 3. 페이지 로드 시 초기 설정 (기본: 영어)
window.addEventListener('DOMContentLoaded', () => {
    // 1) 기본 언어 'en'으로 설정
    changeLanguage('en'); 
    if (langLabel) langLabel.textContent = 'EN';
    
    // 2) 언어 메뉴 UI도 'English' 활성화
    document.querySelectorAll('#langSubMenu .btn-sub').forEach(b => {
        if(b.dataset.lang === 'en') b.classList.add('active');
        else b.classList.remove('active');
    });

    // 3) 최초 방문 팝업 체크
    const welcomeModal = document.getElementById('welcomeModal');
    if (!localStorage.getItem('svgMasterVisited')) {
        if (welcomeModal) welcomeModal.classList.add('show');
    }
});

// [script.js] 맨 아래에 추가

// --- [코드 하이라이트 기능] ---

// 1. 하이라이트 실행 함수
function highlightCode(hoveredEl = null) {
    const viewer = document.getElementById('codeViewer');
    const lines = Array.from(viewer.children);
    
    lines.forEach(line => {
        // 연결된 도형이 없으면 패스 (헤더/푸터 등)
        if (!line.targetEl) return;
        
        // 현재 라인의 도형이 '선택되었거나' OR '마우스가 올라갔거나'
        const isSelected = state.selectedEls.includes(line.targetEl);
        const isHovered = (hoveredEl && line.targetEl === hoveredEl);
        
        if (isSelected || isHovered) {
            line.classList.add('highlight');
            
            // 선택된 경우라면 스크롤도 그쪽으로 이동 (편의성)
            if (isSelected && !isHovered) {
                // 너무 자주 깜빡이지 않게 약간의 조건 필요하면 추가 가능
                line.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        } else {
            line.classList.remove('highlight');
        }
    });
}

svg.addEventListener('mousemove', (e) => {
    // 1. [중요] 화면 이동(Pan) 로직 (최우선 처리)
    if (state.isPanning && e.buttons === 1) { // 버튼이 눌린 상태에서만 이동
        state.viewBox.x -= e.movementX * (state.viewBox.w / svg.clientWidth);
        state.viewBox.y -= e.movementY * (state.viewBox.h / svg.clientHeight);
        svg.setAttribute('viewBox', `${state.viewBox.x} ${state.viewBox.y} ${state.viewBox.w} ${state.viewBox.h}`);
svg.style.cursor = 'grabbing'; // 드래그 중엔 꽉 쥔 손
} else if (state.isPanning) {
    svg.style.cursor = 'grab';     // 드래그 안 할 땐 펼친 손
        return; // 이동 중에는 다른 동작(그리기 등) 차단
    }

    const pt = getPoint(e);

    // 2. 지우개 드래그 (닿는건 전부 삭제)
    if (state.mode === 'eraser' && state.isErasing) {
        const target = document.elementFromPoint(e.clientX, e.clientY);
        handleEraserDrag(target);
        return;
    }

    // 3. 변형/이동/선택박스 드래그 액션
    if (state.action) {
        if (state.action === 'selecting') {
            handleMarqueeMove(pt);
        } else if (state.action !== 'rotating-slider') {
            handleTransformAction(pt);
        }
        return;
    }

    // 4. 그리기 미리보기 및 도형 그리기
    if (state.mode === 'draw' && state.isDrawing) {
        const lastPt = state.points[state.points.length - 1];
        previewLine.style.display = 'block';
        previewLine.setAttribute('x1', lastPt[0]);
        previewLine.setAttribute('y1', lastPt[1]);
        previewLine.setAttribute('x2', pt[0]);
        previewLine.setAttribute('y2', pt[1]);
    }
    else if (state.mode === 'shape' && state.isDrawing) {
        handleShapeDrawMove(pt);
    }
});

// 3. 마우스가 캔버스를 벗어나면 하이라이트 끄기
svg.addEventListener('mouseleave', () => {
    highlightCode(null);
});

// 터치 이벤트를 마우스 이벤트로 변환하여 핸들러 호출
function handleTouch(e, handler) {
    if (e.touches.length > 1) return; // 멀티터치 방지 (줌 등)
    e.preventDefault(); // 스크롤 방지
    
    // 터치 좌표를 마우스 이벤트 형식으로 모킹
    const touch = e.changedTouches[0];
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                      e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        bubbles: true
    });
    
    // 기존 핸들러에 전달하거나, 해당 타겟에 강제로 디스패치
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if(target) target.dispatchEvent(mouseEvent);
}

// SVG 영역에 터치 리스너 등록
svg.addEventListener('touchstart', (e) => handleTouch(e, null), {passive: false});
svg.addEventListener('touchmove', (e) => handleTouch(e, null), {passive: false});
svg.addEventListener('touchend', (e) => handleTouch(e, null), {passive: false});

// [script.js] 맨 마지막에 추가

// --- [색상 팔레트 시스템] ---
const pastelColors = [
    "#ffadad", "#ffd6a5", "#fdffb6", "#caffbf", "#9bf6ff", "#a0c4ff", "#bdb2ff", "#ffc6ff", // 파스텔
    "#4a90e2", "#ff4757", "#2ecc71", "#f1c40f", "#e67e22", "#9b59b6", "#34495e", "#ffffff", // 기본
    "#000000" // 검정
];

function initPalette() {
    const pStroke = document.getElementById('paletteStroke');
    const pFill = document.getElementById('paletteFill');
    
    pastelColors.forEach(color => {
        // 1. 선(Stroke) 팔레트 생성
        const btnS = document.createElement('div');
        btnS.className = 'color-swatch';
        btnS.style.backgroundColor = color;
        btnS.title = color;
        btnS.onclick = () => {
            ui.inputs.color.value = color;
            ui.inputs.hex.value = color;
            // 기존의 input 이벤트 리스너를 강제로 실행시켜야 도형에 반영됨
            ui.inputs.color.dispatchEvent(new Event('input'));
        };
        pStroke.appendChild(btnS);

        // 2. 채우기(Fill) 팔레트 생성
        const btnF = document.createElement('div');
        btnF.className = 'color-swatch';
        btnF.style.backgroundColor = color;
        btnF.title = color;
        btnF.onclick = () => {
            ui.inputs.fill.value = color;
            ui.inputs.fill.dispatchEvent(new Event('input'));
        };
        pFill.appendChild(btnF);
    });
}

// 초기화 실행
initPalette();

/* [script.js] 파일 맨 끝에 추가 */

// --- [프로젝트 저장/열기 시스템] ---

// 1. 프로젝트 저장 (JSON)
if (ui.btns.saveProject) {
    ui.btns.saveProject.addEventListener('click', () => {
        // 저장하면 안 되는 UI 요소들을 제외하고 순수 도형 데이터만 추출
        const elementsData = [];
        Array.from(svg.children).forEach(child => {
            if (['uiLayer', 'marqueeRect', 'gridRect', 'gridPattern'].includes(child.id) || 
                child.tagName === 'defs' || 
                child.classList.contains('preview-line')) return;
            
            elementsData.push(child.outerHTML);
        });

        const projectData = {
            version: "1.0",
            date: new Date().toISOString(),
            viewBox: state.viewBox,
            elements: elementsData,
            bgColor: svg.style.backgroundColor
        };

        const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `project_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        closeAllDropdowns();
    });
}

// 2. 프로젝트 열기 (버튼 클릭 -> input 클릭 트리거)
if (ui.btns.loadProject) {
    ui.btns.loadProject.addEventListener('click', () => {
        ui.inputs.fileInput.click();
        closeAllDropdowns();
    });
}

// 3. 파일 선택 시 로드 실행
if (ui.inputs.fileInput) {
    ui.inputs.fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                loadProject(data);
            } catch (err) {
                alert("프로젝트 파일을 읽는 중 오류가 발생했습니다.\n" + err);
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // 같은 파일 다시 열기 위해 초기화
    });
}

// [수정됨] 프로젝트 불러오기 함수 (Namespace 문제 해결)
function loadProject(data) {
    // 1. 캔버스 초기화 (UI 요소 제외하고 삭제)
    const protectedIds = ['uiLayer', 'marqueeRect', 'gridRect', 'gridPattern'];
    Array.from(svg.children).forEach(child => {
        if (!protectedIds.includes(child.id) && child.tagName !== 'defs' && !child.classList.contains('preview-line')) {
            child.remove();
        }
    });

    // 2. 뷰박스 및 배경 복원
    if (data.viewBox) {
        state.viewBox = data.viewBox;
        svg.setAttribute('viewBox', `${state.viewBox.x} ${state.viewBox.y} ${state.viewBox.w} ${state.viewBox.h}`);
    }
    if (data.bgColor) {
        svg.style.backgroundColor = data.bgColor;
        ui.inputs.bg.value = rgbToHex(data.bgColor);
    }

    // 3. 도형 데이터 복원 [핵심 수정]
    if (data.elements) {
        // [수정] div.innerHTML을 쓰면 HTML 태그로 인식되어 화면에 안 나옵니다.
        // DOMParser를 사용해 'SVG 네임스페이스'를 가진 진짜 SVG 요소로 파싱해야 합니다.
        const parser = new DOMParser();
        const svgContent = data.elements.join('');
        // SVG 네임스페이스를 명시하여 파싱
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`;
        const doc = parser.parseFromString(svgString, "image/svg+xml");
        
        Array.from(doc.documentElement.children).forEach(node => {
            // 파싱된 노드를 현재 문서로 가져와서 삽입
            const newNode = document.importNode(node, true);
            svg.insertBefore(newNode, ui.inputs.marquee);
        });
    }

    // 4. 상태 초기화
    deselect();
    saveHistory();
    updateCode();
    alert("프로젝트를 불러왔습니다!");
}

// 헬퍼: RGB 문자열을 Hex로 변환 (배경색 복원용)
function rgbToHex(rgb) {
    if (!rgb || rgb.startsWith('#')) return rgb;
    const sep = rgb.indexOf(",") > -1 ? "," : " ";
    const rgbArr = rgb.substr(4).split(")")[0].split(sep);
    
    let r = (+rgbArr[0]).toString(16),
        g = (+rgbArr[1]).toString(16),
        b = (+rgbArr[2]).toString(16);
  
    if (r.length == 1) r = "0" + r;
    if (g.length == 1) g = "0" + g;
    if (b.length == 1) b = "0" + b;
  
    return "#" + r + g + b;
}
/* [script.js] 하단에 추가 */

// [수정] 텍스트 생성 함수 (포커스 유지 및 즉시 편집 모드 진입)
function handleTextClick(pt) {
    // 텍스트 모드이고, 드래그 중이 아닐 때만
    if (state.mode !== 'text') return;

    // 1. 텍스트 객체 생성
    const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textEl.setAttribute("x", pt[0]);
    textEl.setAttribute("y", pt[1]);
    textEl.setAttribute("fill", "#000000"); // 기본 검정색
    textEl.setAttribute("stroke", "none");
    textEl.setAttribute("font-size", ui.inputs.fontSize.value);
    textEl.setAttribute("font-family", ui.inputs.fontFamily.value);
    textEl.setAttribute("font-weight", ui.inputs.fontWeight.value);
    textEl.textContent = "Text"; 

    svg.insertBefore(textEl, ui.inputs.marquee);
    
    // 2. 히스토리 저장 및 코드 갱신
    saveHistory();
    updateCode();

    // 3. [핵심 수정] 버튼 클릭(.click()) 대신 함수로 모드만 변경
    // 버튼을 클릭하면 포커스를 뺏기므로, 내부적으로 상태만 바꿉니다.
    changeMode('select'); 

    // 4. changeMode()가 선택을 해제해버리므로, 다시 텍스트를 선택
    selectElements([textEl]);
    
    // 5. [핵심 수정] 입력창에 확실하게 포커스를 줌
    // 이제 포커스가 입력창(INPUT)에 있으므로, 스페이스바를 눌러도 '완료'가 되지 않고 띄어쓰기가 됩니다.
    if(ui.inputs.textContent) {
        ui.inputs.textContent.value = "Text";
        ui.inputs.textContent.select(); // 텍스트 전체 선택 (바로 덮어쓰기 가능)
        ui.inputs.textContent.focus();  // 입력창 활성화
    }
}
// 2. 텍스트 속성 변경 리스너 연결
['textContent', 'fontSize', 'fontWeight', 'fontFamily'].forEach(key => {
    if (ui.inputs[key]) {
        ui.inputs[key].addEventListener('input', (e) => {
            if (state.selectedEls.length === 0) return;
            
            state.selectedEls.forEach(el => {
                if (el.tagName !== 'text') return;
                
                if (key === 'textContent') el.textContent = e.target.value;
                else if (key === 'fontSize') el.setAttribute('font-size', e.target.value);
                else if (key === 'fontWeight') el.setAttribute('font-weight', e.target.value);
                else if (key === 'fontFamily') el.setAttribute('font-family', e.target.value);
            });
            updateCode();
            updateUIBox(); // 크기가 변하므로 박스 갱신
        });
    }
});

// [script.js] 맨 마지막 부분에 추가

const ctxMenu = document.getElementById('contextMenu');

// 1. 우클릭 시 메뉴 보이기
svg.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // 브라우저 기본 메뉴 차단

    // 클릭한 대상 선택 (이미 선택된 게 아니면)
    if (e.target.tagName !== 'svg' && !state.selectedEls.includes(e.target)) {
         // 그룹 내부 클릭 처리 등은 기존 mousedown 로직 참조
         // 여기선 간단히 클릭 대상 선택
         // (필요 시 selectElements 호출)
    }

    // 메뉴 위치 설정
    ctxMenu.style.left = `${e.clientX}px`;
    ctxMenu.style.top = `${e.clientY}px`;
    ctxMenu.style.display = 'flex';
});

// 2. 다른 곳 클릭 시 닫기
window.addEventListener('click', () => {
    ctxMenu.style.display = 'none';
});

// 3. 메뉴 버튼 연결
document.getElementById('ctxCopy').addEventListener('click', copy);
document.getElementById('ctxPaste').addEventListener('click', paste);
document.getElementById('ctxGroup').addEventListener('click', groupSelected);
document.getElementById('ctxUngroup').addEventListener('click', ungroupSelected);
document.getElementById('ctxFront').addEventListener('click', () => moveLayer('front'));
document.getElementById('ctxBack').addEventListener('click', () => moveLayer('back'));
document.getElementById('ctxDelete').addEventListener('click', deleteSelected);

// [script.js] 맨 마지막에 추가

// 시스템 붙여넣기(Ctrl+V) 감지
window.addEventListener('paste', (e) => {
    // 1. 입력창(input, textarea)에서 붙여넣기 하는 중이라면 무시 (기본 동작 수행)
    const tag = document.activeElement.tagName;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || document.activeElement.isContentEditable) {
        return;
    }

    // 2. 클립보드 데이터 가져오기
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');

    // 3. SVG 코드인지 확인 후 적용
    if (pastedText && (pastedText.includes('<svg') || pastedText.includes('</svg>'))) {
        e.preventDefault(); // 기본 붙여넣기 방지
        
        // 기존에 만들어둔 로직 재활용
        ui.inputs.text.value = pastedText;
        ui.inputs.text.dispatchEvent(new Event('input')); // 캔버스에 그리기 트리거

        // 알림 표시 (선택 사항)
        // alert("외부 SVG 코드를 붙여넣었습니다!"); 
    }
});

// [script.js] 파일 맨 끝부분

// --- [최초 방문 팝업 제어] ---
const welcomeModal = document.getElementById('welcomeModal');
const btnCloseWelcome = document.getElementById('btnCloseWelcome');

// 1. 페이지 로드 시 확인
window.addEventListener('DOMContentLoaded', () => {
    // 로컬 스토리지에 'visited' 기록이 없으면 팝업 띄움
    if (!localStorage.getItem('svgMasterVisited')) {
        if (welcomeModal) welcomeModal.classList.add('show');
    }
});

// 2. 닫기 버튼 클릭 시 (다시 보지 않음 처리)
if (btnCloseWelcome) {
    btnCloseWelcome.addEventListener('click', () => {
        welcomeModal.classList.remove('show');
        // 'visited' 키를 저장하여 다음 방문부터는 안 뜨게 함
        localStorage.setItem('svgMasterVisited', 'true');
    });
}
