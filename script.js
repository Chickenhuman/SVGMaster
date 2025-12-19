// ==========================================
// 1. 전역 변수 및 설정
// ==========================================
const svg = document.getElementById('mainSvg');

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
	undo: document.getElementById('btnUndo'),
        redo: document.getElementById('btnRedo'), // [추가]
        grid: document.getElementById('btnGrid'), // [추가]
        snap: document.getElementById('btnSnap'), // [추가]
        finish: document.getElementById('btnFinish'),
        noFill: document.getElementById('btnNoFill'),
        download: document.getElementById('btnDownload'),
        toggle: document.getElementById('btnToggleView'),
	help: document.getElementById('btnHelp'), // [추가]
        toFront: document.getElementById('btnToFront'),
	eraser: document.getElementById('toolEraser'), // [추가]
        toBack: document.getElementById('btnToBack'),
	copy: document.getElementById('btnCopyCode'), // [추가]
	toggleSidebar: document.getElementById('btnToggleSidebar'), // [추가]
        del: document.getElementById('btnDelete'),
	group: document.getElementById('btnGroup'),     // [추가]
        ungroup: document.getElementById('btnUngroup'), // [추가]
	alignLeft: document.getElementById('btnAlignLeft'),
        alignCenter: document.getElementById('btnAlignCenter'),
        alignRight: document.getElementById('btnAlignRight'),
        alignTop: document.getElementById('btnAlignTop'),
        alignMiddle: document.getElementById('btnAlignMiddle'),
        alignBottom: document.getElementById('btnAlignBottom'),
    },
    inputs: {
        autoClose: document.getElementById('chkAutoClose'),
        color: document.getElementById('inpColor'),
        hex: document.getElementById('inpHex'),
        width: document.getElementById('inpWidth'),
        tension: document.getElementById('inpTension'),
        rotateSlider: document.getElementById('inpRotate'),
	gridRect: document.getElementById('gridRect'), // [추가]
        fill: document.getElementById('inpFill'),
        cap: document.getElementById('inpCap'),
        bg: document.getElementById('inpBgColor'),
        viewer: document.getElementById('codeViewer'), 
        text: document.getElementById('codeText'),
        
        // UI 요소들
        marquee: document.getElementById('marqueeRect'),
        layer: document.getElementById('uiLayer'),
        box: document.getElementById('selectionBox'),
        resize: document.getElementById('handleResize'),
        rotate: document.getElementById('handleRotate'),
        rotateLine: document.getElementById('rotateLine')
    },
    labels: {
        width: document.getElementById('valWidth'),
        tension: document.getElementById('valTension'),
        rotate: document.getElementById('valRotate')
    }
};

// ==========================================
// 3. 상태(State) 관리
// ==========================================
let state = {
    mode: 'draw', 
    isDrawing: false,
    
// [추가/수정] 기능 옵션
    snap: true,      // 스냅 기본 ON
    snapSize: 20,    // 그리드 사이즈와 일치
    showGrid: false, // 그리드 보임 여부
    
    selectedEls: [],
    clipboard: [],
    
    action: null,     
    startPos: [0, 0],

    // 선택 및 클립보드
    selectedEls: [],
    clipboard: [], // [추가] 복사된 도형 저장소
    
    // 드래그/변형 관련
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
    currentPath: null, 
    
    // [수정] 히스토리 관리
    history: [],
    redoStack: [] // [추가] Redo를 위한 스택
};

// 초기화
saveHistory();
updateCode();

// ==========================================
// 4. 이벤트 리스너
// ==========================================
['draw', 'select', 'paint', 'shape', 'eraser'].forEach(mode => {
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

ui.btns.noFill.addEventListener('click', applyNoFill);
ui.btns.undo.addEventListener('click', undo);
ui.btns.finish.addEventListener('click', () => finishDraw(true));
ui.btns.download.addEventListener('click', downloadImage);
ui.btns.del.addEventListener('click', deleteSelected);
ui.btns.toFront.addEventListener('click', () => moveLayer('front'));
ui.btns.toBack.addEventListener('click', () => moveLayer('back'));
ui.btns.toggle.addEventListener('click', () => {
    const isTextMode = ui.inputs.text.style.display !== 'none';
    ui.inputs.text.style.display = isTextMode ? 'none' : 'block';
    ui.inputs.viewer.style.display = isTextMode ? 'block' : 'none';
    ui.btns.toggle.textContent = isTextMode ? "TEXT로 보기" : "Viewer로 보기";
});


// ==========================================
// 5. 마우스 이벤트
// ==========================================
svg.addEventListener('mousedown', (e) => {
    const pt = getPoint(e);

    // [추가] 지우개 모드: 클릭 시 동작 (채우기 삭제 vs 객체 삭제)
    if (state.mode === 'eraser') {
        state.isErasing = true; // 드래그 삭제 시작
        handleEraserClick(e);   // 클릭 지우기 실행
        return;
    }

    // 변형 핸들/박스 클릭
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

    // 선택 모드
  // 선택 모드
    if (state.mode === 'select') {
        // 이미 선택된 요소를 클릭했으면 드래그 준비
        // (그룹이 선택된 상태에서 그룹 내부를 클릭해도 이동 가능해야 함)
        let clickedEl = e.target;
        
        // [수정] 클릭된 요소의 최상위 그룹 찾기 로직
        // UI 레이어나 SVG 루트가 나올 때까지 부모를 타고 올라감
        while (clickedEl.parentNode && 
               clickedEl.parentNode.tagName !== 'svg' && 
               clickedEl.parentNode.id !== 'uiLayer') {
            clickedEl = clickedEl.parentNode;
        }

        // 1. 이미 선택된 그룹/요소를 클릭한 경우 -> 이동 모드
        if (state.selectedEls.includes(clickedEl)) {
            state.action = 'moving';
            state.startPos = pt;
            prepareTransform();
        }
        // 2. 새로운 요소를 클릭한 경우 (빈공간 아님, UI 아님, 그리드 아님)
        else if (['path', 'rect', 'circle', 'polygon', 'g'].includes(clickedEl.tagName) && 
                 clickedEl.id !== 'uiLayer' && 
                 clickedEl.id !== 'gridRect' && 
                 clickedEl !== svg) { // svg 자체 클릭 제외
            
            selectElements([clickedEl]);
            state.action = 'moving';
            state.startPos = pt;
            prepareTransform();
        }
        // 3. 빈 공간 클릭 -> 드래그 선택(Marquee) 시작
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
    // 그리기 모드
    else if (state.mode === 'shape') {
        handleShapeDrawStart(pt);
    }
});

svg.addEventListener('mousemove', (e) => {
    const pt = getPoint(e);

    // [추가] 지우개 드래그 (닿는건 전부 삭제)
    if (state.mode === 'eraser' && state.isErasing) {
        // 마우스 위치에 있는 요소 찾기
        const target = document.elementFromPoint(e.clientX, e.clientY);
        handleEraserDrag(target);
        return;
    }

    if (state.action) {
        if (state.action === 'selecting') {
            handleMarqueeMove(pt);
        } else if (state.action !== 'rotating-slider') {
            handleTransformAction(pt);
        }
        return;
    }

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

window.addEventListener('mouseup', () => {
    // [추가] 지우개 드래그 종료
    if (state.mode === 'eraser') {
        state.isErasing = false;
        saveHistory(); // 지우기 동작이 끝나면 히스토리 저장
        updateCode();
    }
    if (state.action === 'selecting') {
        finishMarqueeSelection();
    }
    else if (state.action) {
        saveHistory();
        updateCode();
        updateUIBox(); 
    }
    
    state.action = null;
    ui.inputs.marquee.style.display = 'none';

    if (state.mode === 'shape' && state.isDrawing) {
        state.isDrawing = false;
        state.currentPath = null;
        saveHistory();
        updateCode();
    }
});

svg.addEventListener('click', (e) => {
    const pt = getPoint(e);
    if (state.mode === 'draw') handleDrawClick(pt);
    else if (state.mode === 'paint') handlePaintClick(e);
});

// [수정] 키보드 이벤트 (복사/붙여넣기 추가)
// ==========================================
// [수정됨] 키보드 단축키 이벤트 핸들러 (통합)
// ==========================================
// ==========================================
// [수정됨] 키보드 단축키 이벤트 핸들러 (왼손 최적화)
// ==========================================
document.addEventListener('keydown', (e) => {
    // 1. 텍스트 입력 중일 때는 단축키 무시
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

    const key = e.key.toLowerCase();
    const isCtrl = e.metaKey || e.ctrlKey;
    const isShift = e.shiftKey;

    // --- [편집 단축키] ---
    if (isCtrl && key === 'z') { e.preventDefault(); isShift ? redo() : undo(); }
    if (isCtrl && key === 'y') { e.preventDefault(); redo(); }
    if (isCtrl && key === 'c') { e.preventDefault(); copy(); } 
    if (isCtrl && key === 'v') { e.preventDefault(); paste(); }
    if (isCtrl && key === 's') { e.preventDefault(); downloadImage(); }
    
    // 전체 선택 (Ctrl + A)
    if (isCtrl && key === 'a') {
        e.preventDefault();
        const allEls = [];
        Array.from(svg.children).forEach(child => {
            if (['path', 'rect', 'circle', 'polygon', 'g'].includes(child.tagName) && 
                child.id !== 'uiLayer' && child.id !== 'gridRect' && child.id !== 'marqueeRect' &&
                !child.classList.contains('preview-line')) {
                allEls.push(child);
            }
        });
        selectElements(allEls);
    }

    // 그룹화 (Ctrl + G) / 해제 (Ctrl + Shift + G)
    if (isCtrl && key === 'g') {
        e.preventDefault();
        isShift ? ungroupSelected() : groupSelected();
    }

    // --- [도구 단축키 (왼손 최적화)] ---
    if (!isCtrl) {
        switch (key) {
            case 'v': document.getElementById('toolSelect').click(); break; // 선택
            case 'd': document.getElementById('toolDraw').click(); break;   // [변경] Draw (P -> D)
            case 'b': document.getElementById('toolPaint').click(); break;  // 페인트 (B)
            case 'e': document.getElementById('toolEraser').click(); break; // [변경] Eraser (E)
            case 'r': triggerShape('rect'); break;     // 사각형 (R)
            case 'c': triggerShape('circle'); break;   // [변경] Circle (O -> C)
            case 't': triggerShape('triangle'); break; // [변경] Triangle (T -> E)
            
            case '[': moveLayer('back'); break;
            case ']': moveLayer('front'); break;
            case 'delete': case 'backspace': deleteSelected(); break;
            
            case 'escape': 
                finishDraw(false); deselect();
                closeAllDropdowns();
                break;
            case ' ': e.preventDefault(); finishDraw(true); break;
        }

        // 옵션 토글
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
    ui.btns.snap.textContent = state.snap ? "🧲 스냅 On" : "🧲 스냅 Off";
}

// [핵심 수정] 좌표 가져올 때 스냅 적용
function getPoint(evt) {
    const rect = svg.getBoundingClientRect();
    let x = evt.clientX - rect.left;
    let y = evt.clientY - rect.top;

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
    ui.inputs.color.value = el.getAttribute('stroke') || '#000000';
    ui.inputs.width.value = el.getAttribute('stroke-width') || 2;
    ui.labels.width.textContent = ui.inputs.width.value;
    const fill = el.getAttribute('fill');
    ui.inputs.fill.value = (fill && fill !== 'none') ? fill : '#ffffff';
    
    if (elements.length === 1 && el.tagName === 'path') {
        ui.inputs.tension.value = 0; 
        ui.labels.tension.textContent = "0";
    }

    updateUIBox(); 
}

function deselect() {
    state.selectedEls = [];
    ui.inputs.layer.style.display = 'none';
}

function updateUIBox() {
    if (state.selectedEls.length === 0) return;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    state.selectedEls.forEach(el => {
	if (el.parentNode === ui.inputs.layer || 
            el === ui.inputs.marquee || 
            el.classList.contains('preview-line') || 
            el.id === 'gridRect') return;
        const rect = el.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();
        const x = rect.left - svgRect.left;
        const y = rect.top - svgRect.top;
        const w = rect.width;
        const h = rect.height;

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + w);
        maxY = Math.max(maxY, y + h);
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
    
    state.initialState.groupCenter = { x: cx, y: boxY + boxH / 2 };
    
    if (state.selectedEls.length === 1) {
        const tf = parseTransform(state.selectedEls[0]);
        const angle = (tf.angle % 360 + 360) % 360;
        ui.inputs.rotateSlider.value = Math.round(angle);
        ui.labels.rotate.textContent = Math.round(angle);
        state.transform = { ...tf, cx: cx, cy: state.initialState.groupCenter.y, w: boxW, h: boxH };
    } else {
        ui.inputs.rotateSlider.value = 0;
        ui.labels.rotate.textContent = "0";
    }
}


// --- [변형(Transform) 로직] ---

function prepareTransform() {
    state.initialState.transforms = state.selectedEls.map(el => el.getAttribute('transform') || '');
    state.initialState.uiTransform = ui.inputs.layer.getAttribute('transform') || '';
}

function handleTransformAction(pt) {
    const center = state.initialState.groupCenter;
    let transformStr = ''; 

    if (state.action === 'moving') {
        const dx = pt[0] - state.startPos[0];
        const dy = pt[1] - state.startPos[1];
        transformStr = `translate(${dx}, ${dy})`;
    }
    else if (state.action === 'rotating') {
        const startRad = Math.atan2(state.startPos[1] - center.y, state.startPos[0] - center.x);
        const currRad = Math.atan2(pt[1] - center.y, pt[0] - center.x);
        const deltaDeg = (currRad - startRad) * (180 / Math.PI);
        transformStr = `rotate(${deltaDeg}, ${center.x}, ${center.y})`;
        
        let newAngle = (state.initialState.startAngle + deltaDeg) % 360;
        if (newAngle < 0) newAngle += 360;
        ui.inputs.rotateSlider.value = Math.round(newAngle);
        ui.labels.rotate.textContent = Math.round(newAngle);
    }
    else if (state.action === 'rotating-slider') {
        const currentSliderVal = parseFloat(ui.inputs.rotateSlider.value);
        const deltaDeg = currentSliderVal - state.initialState.startAngle;
        transformStr = `rotate(${deltaDeg}, ${center.x}, ${center.y})`;
    }
    else if (state.action === 'resizing') {
        const startDist = Math.hypot(state.startPos[0] - center.x, state.startPos[1] - center.y);
        const currDist = Math.hypot(pt[0] - center.x, pt[1] - center.y);
        const scale = Math.max(0.1, currDist / (startDist || 1));
        transformStr = `translate(${center.x}, ${center.y}) scale(${scale}) translate(-${center.x}, -${center.y})`;
    }

state.selectedEls.forEach((el, idx) => {
        // [추가] 그리드에는 transform을 적용하지 않습니다.
        if (el.id === 'gridRect') return;

        const original = state.initialState.transforms[idx];
        el.setAttribute('transform', `${transformStr} ${original}`);
    });

    ui.inputs.layer.setAttribute('transform', `${transformStr} ${state.initialState.uiTransform}`);
    updateCode();
}

// [수정됨] 모든 translate를 누적하여 파싱하도록 개선 (안정성 강화)
function parseTransform(el) {
    const tf = el.getAttribute('transform') || '';
    const res = { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1 };
    
    // translate 누적 계산
    const translateRegex = /translate\(([^,]+),([^)]+)\)/g;
    let match;
    while ((match = translateRegex.exec(tf)) !== null) {
        res.x += parseFloat(match[1]);
        res.y += parseFloat(match[2]);
    }
    
    // 회전 (첫 번째 값 기준)
    const matchR = tf.match(/rotate\(([^)]+)\)/);
    if (matchR) { res.angle = parseFloat(matchR[1].split(',')[0]); }

    // 스케일
    const matchS = tf.match(/scale\(([^,]+),([^)]+)\)/);
    if (matchS) { res.scaleX = parseFloat(matchS[1]); res.scaleY = parseFloat(matchS[2]); }
    
    // 중심점은 BBox 기준 (스케일/회전의 기준점 복구용)
    const bbox = el.getBBox();
    res.cx = bbox.x + bbox.width/2;
    res.cy = bbox.y + bbox.height/2;

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
    const allEls = svg.querySelectorAll('path, rect, circle, polygon');
    
    allEls.forEach(el => {
        if (el.parentNode === ui.inputs.layer || el === ui.inputs.marquee || el.classList.contains('preview-line')) return;
        
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
        state.isDrawing = true; state.points = [pt];
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("stroke", ui.inputs.color.value); path.setAttribute("stroke-width", ui.inputs.width.value);
        path.setAttribute("fill", "none"); path.setAttribute("stroke-linecap", ui.inputs.cap.value);
        path.setAttribute("stroke-linejoin", "round");
        path.setAttribute("d", `M ${pt[0]} ${pt[1]}`);
        path.dataset.points = JSON.stringify(state.points);
        svg.insertBefore(path, ui.inputs.marquee);
        state.currentPath = path; ui.btns.finish.disabled = false;
    } else {
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
    if (['path', 'rect', 'circle', 'polygon'].includes(target.tagName)) {
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

function convertToPath(el) {
    let points = [];
    
    // 1. 사각형 변환
    if (el.tagName === 'rect') {
        const x = parseFloat(el.getAttribute('x'));
        const y = parseFloat(el.getAttribute('y'));
        const w = parseFloat(el.getAttribute('width'));
        const h = parseFloat(el.getAttribute('height'));
        // 시계 방향 4개 좌표
        points = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    } 
    // 2. 다각형(삼각형 등) 변환
    else if (el.tagName === 'polygon') {
        const ptsAttr = el.getAttribute('points').trim();
        // 공백 또는 콤마로 분리
        const coords = ptsAttr.split(/[\s,]+/); 
        for (let i = 0; i < coords.length; i += 2) {
            points.push([parseFloat(coords[i]), parseFloat(coords[i+1])]);
        }
    }

    // 3. 새로운 Path 생성 및 속성 복사
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    
    // 기존 속성 복사
    ['stroke', 'stroke-width', 'fill', 'stroke-linecap', 'transform', 'opacity'].forEach(attr => {
        if (el.hasAttribute(attr)) path.setAttribute(attr, el.getAttribute(attr));
    });

    // 포인트 데이터 저장 (곡률 계산용 핵심 데이터)
    path.dataset.points = JSON.stringify(points);

    // 초기 d 속성 생성 (직선)
    let d = "M " + points.map(p => p.join(" ")).join(" L ") + " Z";
    path.setAttribute("d", d);

    // DOM 교체
    el.replaceWith(path);
    return path;
}

function undo() {
    // 그리기 중 취소
    if (state.isDrawing) {
        if (state.points.length > 1) {
            state.points.pop();
            const d = solveCurve(state.points, 0, false);
            state.currentPath.setAttribute("d", d);
            state.currentPath.dataset.points = JSON.stringify(state.points);
            updateCode();
        } else {
            state.currentPath.remove(); finishDraw(false); 
            // 그리기 시작 전 상태로 되돌리기 위해 히스토리 복구
            state.history.pop(); 
            restoreHistory(state.history[state.history.length - 1]);
        }
        return;
    }

    if (state.history.length > 1) {
        const current = state.history.pop(); // 현재 상태를 꺼냄
        state.redoStack.push(current);       // Redo 스택에 저장
        
        const prev = state.history[state.history.length - 1]; // 이전 상태 확인
        restoreHistory(prev);
    }
}

// [신규] Redo 함수
function redo() {
    if (state.redoStack.length === 0) return;

    const nextState = state.redoStack.pop();
    state.history.push(nextState); // 다시 히스토리에 넣음
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
    const viewer = ui.inputs.viewer;
    const style = svg.getAttribute("style");
    viewer.innerHTML = ""; 
    const headerDiv = document.createElement("div");
    headerDiv.className = "code-line";
    headerDiv.textContent = `<svg width="800" height="600" style="${style}" xmlns="http://www.w3.org/2000/svg">`;
    viewer.appendChild(headerDiv);

    let rawHtml = `<svg width="800" height="600" style="${style}" xmlns="http://www.w3.org/2000/svg">\n`;
    Array.from(svg.children).forEach((child) => 
{// ▼▼▼ [수정] 여기서도 'gridRect'와 'defs'(패턴정의)를 제외합니다 ▼▼▼
        if (child.classList.contains("preview-line") || 
            child.id === 'uiLayer' || 
            child.id === 'marqueeRect' || 
            child.id === 'gridRect' || 
            child.tagName === 'defs') return;
        const clone = child.cloneNode();
        const lineDiv = document.createElement("div");
        lineDiv.className = "code-line code-element"; 
        lineDiv.textContent = "  " + clone.outerHTML; 
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
function copyCodeToClipboard() {
    const code = ui.inputs.text.style.display === 'none' 
        ? ui.inputs.viewer.innerText  // 뷰어 모드일 때
        : ui.inputs.text.value;       // 텍스트 모드일 때

    navigator.clipboard.writeText(code).then(() => {
        const originalText = ui.btns.copy.innerText;
        ui.btns.copy.innerText = "✅ 완료!";
        setTimeout(() => ui.btns.copy.innerText = originalText, 1500);
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
        // 보호된 ID도 아니고, defs 태그도 아니면 삭제 대상 (사용자가 그린 도형)
        if (!protectedIds.includes(child.id) && child.tagName !== 'defs') {
            child.remove();
        }
    });

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

function alignSelected(type) {
    // 2개 이상 선택되어야 정렬 의미가 있음
    if (state.selectedEls.length < 2) return;

    // 1. 전체 선택 영역의 경계(Bounding Box) 계산
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    // 각 요소의 현재 위치와 크기 파악
    const bounds = state.selectedEls.map(el => {
        const rect = el.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();
        // SVG 기준 상대 좌표
        const x = rect.left - svgRect.left;
        const y = rect.top - svgRect.top;
        const w = rect.width;
        const h = rect.height;

        // 전체 그룹의 Min/Max 갱신
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x + w > maxX) maxX = x + w;
        if (y + h > maxY) maxY = y + h;

        return { el, x, y, w, h };
    });

    const centerX = minX + (maxX - minX) / 2;
    const centerY = minY + (maxY - minY) / 2;

    // 2. 각 요소를 목표 위치로 이동
    bounds.forEach(item => {
        let dx = 0;
        let dy = 0;

        switch (type) {
            case 'left':   dx = minX - item.x; break;
            case 'center': dx = centerX - (item.x + item.w / 2); break;
            case 'right':  dx = maxX - (item.x + item.w); break;
            case 'top':    dy = minY - item.y; break;
            case 'middle': dy = centerY - (item.y + item.h / 2); break;
            case 'bottom': dy = maxY - (item.y + item.h); break;
        }

        // 3. Transform에 이동값 누적 적용
        if (dx !== 0 || dy !== 0) {
            const tf = parseTransform(item.el);
            // 기존 위치에서 차이(dx, dy)만큼 더 이동
            const newX = tf.x + dx;
            const newY = tf.y + dy;
            
            // 회전/스케일은 유지하고 위치만 변경
            // (주의: 회전 중심점(cx,cy)도 같이 움직여야 제자리 회전이 유지됨)
            const newCx = tf.cx + dx;
            const newCy = tf.cy + dy;

            const str = `translate(${newX}, ${newY}) rotate(${tf.angle}, ${newCx}, ${newCy}) scale(${tf.scaleX}, ${tf.scaleY})`;
            item.el.setAttribute('transform', str);
        }
    });

    saveHistory();
    updateCode();
    updateUIBox(); // 선택 박스 갱신
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
    if (['path', 'rect', 'circle', 'polygon', 'g'].includes(el.tagName)) {
        el.remove();
        deselect();
        // 드래그 중에는 성능을 위해 updateCode()를 매번 호출하지 않고 mouseup에서 처리해도 되지만, 
        // 즉각적인 반응을 위해 여기서 호출 (느려지면 mouseup으로 이동)
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
