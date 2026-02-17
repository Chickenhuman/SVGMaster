// [i18n.js] 다국어 지원 스크립트

const translations = {
    ko: {
        // 1. 사이드바 & 공통 UI
        properties: "속성",
        strokeColor: "색상 (선)",
        fillColor: "채우기 색상",
        noFill: "🚫 없음",
        strokeWidth: "선 두께",
        tension: "곡률 (Tension)",
        rotate: "회전 (Rotate)",
        lineCap: "선 끝 모양 (Cap)",
        autoClose: "도형 자동 닫기",
        canvasBg: "캔버스 배경색",
        btnFinish: "✔️ 완료 (Space)",
        btnDownload: "💾 이미지 저장",
        codeTitle: "SVG Code",
        btnCopy: "📋 복사",
btnPaste: "📥 붙여넣기",
        pasteDone: "✅ 붙여넣기 완료!",
        pasteError: "❌ 클립보드 접근 권한이 필요합니다.",
        invalidSVG: "⚠️ 유효한 SVG 코드가 아닙니다.",
        btnViewText: "TEXT로 보기",
        btnViewViewer: "Viewer로 보기",
        copyDone: "✅ 완료!",
textContent: "텍스트 내용",
    fontSize: "글자 크기",
    fontFamily: "글꼴",
    fontWeight: "굵기",
    t_text: "텍스트 (T)",
    k_text: "텍스트 추가", d_text: "클릭하여 글자 입력", // 도움말용
s_solid: "_______ 실선 (1)",  // [추가]
    s_dashed: "------- 점선 (2)",  // [추가]
strokeOpacity: "선 투명도", // [추가]
fillOpacity: "채우기 투명도", // [추가]
    t_stroke: "선 스타일",         // [추가]

        
        // 2. 툴팁 (상단 바)
        t_sidebar: "사이드바 토글",
        t_draw: "그리기 (D)",
        t_select: "선택 (V)",
        t_paint: "페인트 (B)",
        t_eraser: "지우개 (E)",
        t_shape: "도형",
        t_align: "정렬 메뉴 열기",
        t_grid: "그리드 (Shift+G)",
        t_snap: "스냅 (Shift+S)",
        t_undo: "취소 (Ctrl+Z)",
        t_redo: "재실행 (Ctrl+Y)",
        t_group: "그룹화 (Ctrl+G)",
        t_ungroup: "그룹해제 (Shift+Ctrl+G)",
        t_front: "맨 앞으로 ( ] )",
        t_back: "맨 뒤로 ( [ )",
        t_delete: "삭제 (Delete)",
        t_help: "도움말 / 단축키 (F1)",

        // 3. 드롭다운 메뉴
        s_rect: "⬜ 사각형 (R)",
        s_circle: "⭕ 원 (C)",
        s_triangle: "🔺 삼각형 (A)",
 
        a_left: "│← 왼쪽 맞춤",
        a_center: "→│← 가로 중앙",
        a_right: "→│ 오른쪽 맞춤",
        a_top: "↑ 위쪽 맞춤",
        a_middle: "─ 세로 중앙",
        a_bottom: "↓ 아래쪽 맞춤",

        // 4. 동적 상태 텍스트
        snapOn: "🧲 켜짐",
        snapOff: "🧲 꺼짐",

        // 5. 도움말 모달
        h_title: "📖 SVG Master 사용 설명서",
        h_intro: "웹에서 바로 벡터 그래픽을 디자인하고 코드를 생성하세요.",
        h_shortcuts: "⌨️ 단축키 (Keyboard Shortcuts)",
        h_tips: "💡 유용한 팁 (Tips)",
        h_col_func: "기능",
        h_col_key: "단축키",
        h_col_desc: "설명",
// ▼▼▼ [추가된 부분] 표 내용 번역 ▼▼▼
        k_select: "선택",       d_select: "객체 선택 및 이동",
        k_draw: "그리기",       d_draw: "자유 곡선 그리기 (Pen)",
        k_eraser: "지우개",     d_eraser: "클릭: 삭제 / 드래그: 문질러 삭제",
        k_paint: "페인트",      d_paint: "클릭하여 색 채우기",
        k_rect: "사각형",       d_rect: "드래그하여 사각형 생성",
        k_circle: "원",         d_circle: "드래그하여 원 생성",
        k_triangle: "삼각형",   d_triangle: "클릭하여 삼각형 생성",
        k_group: "그룹화/해제", d_group: "여러 객체를 묶기/풀기",
// ▼▼▼ [수정/추가] ▼▼▼
        k_save: "프로젝트 저장", d_save: "작업 원본 저장 (.json)",  // Ctrl+S
        k_open: "프로젝트 열기", d_open: "작업 불러오기",          // Ctrl+O
        k_export: "이미지 내보내기", d_export: "PNG 이미지 저장",   // Ctrl+Shift+S
        // ▲▲▲ [여기까지] ▲▲▲
        k_copy: "복사/붙여넣기",d_copy: "선택 객체 복제",
        k_undo: "실행 취소",    d_undo: "되돌리기 / 재실행",
        k_del: "삭제",          d_del: "선택된 객체 삭제",
        k_all: "전체 선택",     d_all: "모든 도형 선택",
        k_order: "순서 변경",   d_order: "맨 뒤로 / 맨 앞으로",
k_zoom: "확대/축소",    d_zoom: "마우스 휠 스크롤",
    k_pan: "화면 이동",     d_pan: "Space (누른채) + 드래그",
        // ▲▲▲ [추가 끝] ▲▲▲
        // (도움말 상세 내용은 분량상 핵심만 번역 처리 예시)
        h_tip_1: "미세 조정: 방향키로 1px 이동 (Shift: 10px)",
        h_tip_2: "역방향 편집: 코드창을 수정하면 캔버스에 즉시 반영됩니다.",
t_code: "코드창 토글 (Script)",
        
        // ▼▼▼ [추가] 후원 및 피드백 ▼▼▼
        btn_coffee: "☕ 커피 한 잔 후원하기",
        btn_feedback: "📧 피드백 / 버그 제보",
        
        msg_copyright: "© 2025 ChickenHuman. All rights reserved."
    },

    en: {
        properties: "Properties",
        strokeColor: "Stroke Color",
        fillColor: "Fill Color",
        noFill: "🚫 None",
        strokeWidth: "Stroke Width",
        tension: "Tension",
        rotate: "Rotate",
        lineCap: "Line Cap",
        autoClose: "Auto Close",
        canvasBg: "Canvas Background",
        btnFinish: "✔️ Finish (Space)",
        btnDownload: "💾 Save Image",
        codeTitle: "SVG Code",
        btnCopy: "📋 Copy",
        btnPaste: "📥 Paste",
pasteDone: "✅ Pasted!",
        pasteError: "❌ Clipboard permission denied.",
        invalidSVG: "⚠️ Invalid SVG code.",
        btnViewText: "View as TEXT",
        btnViewViewer: "View as Viewer",
        copyDone: "✅ Done!",
textContent: "Text Content",
    fontSize: "Font Size",
    fontFamily: "Font Family",
    fontWeight: "Font Weight",
    t_text: "Text (T)",
    k_text: "Add Text", d_text: "Click to add text",
s_solid: "_______ Solid (1)",
    s_dashed: "------- Dashed (2)",
strokeOpacity: "Stroke Opacity",
fillOpacity: "Fill Opacity",
    t_stroke: "Line Style",

        t_sidebar: "Toggle Sidebar",
        t_draw: "Draw (D)",
        t_select: "Select (V)",
        t_paint: "Paint (B)",
        t_eraser: "Eraser (E)",
        t_shape: "Shapes",
        t_align: "Align Menu",
        t_grid: "Grid (Shift+G)",
        t_snap: "Snap (Shift+S)",
        t_undo: "Undo (Ctrl+Z)",
        t_redo: "Redo (Ctrl+Y)",
        t_group: "Group (Ctrl+G)",
        t_ungroup: "Ungroup (Shift+Ctrl+G)",
        t_front: "Bring to Front ( ] )",
        t_back: "Send to Back ( [ )",
        t_delete: "Delete (Delete)",
        t_help: "Help (F1)",

        s_rect: "⬜ Rectangle (R)",
        s_circle: "⭕ Circle (C)",
        s_triangle: "🔺 Triangle (A)",
        
        a_left: "│← Align Left",
        a_center: "→│← Align Center X",
        a_right: "→│ Align Right",
        a_top: "↑ Align Top",
        a_middle: "─ Align Center Y",
        a_bottom: "↓ Align Bottom",

        snapOn: "🧲 On",
        snapOff: "🧲 Off",

        h_title: "📖 SVG Master User Manual",
        h_intro: "Design vector graphics and generate code directly on the web.",
        h_shortcuts: "⌨️ Keyboard Shortcuts",
        h_tips: "💡 Useful Tips",
        h_col_func: "Function",
        h_col_key: "Shortcut",
        h_col_desc: "Description",
// ▼▼▼ [Table Translations] ▼▼▼
        k_select: "Select",     d_select: "Select and move objects",
        k_draw: "Draw",         d_draw: "Freehand drawing (Pen)",
        k_eraser: "Eraser",     d_eraser: "Click to delete / Drag to erase",
        k_paint: "Paint",       d_paint: "Click to fill color",
        k_rect: "Rectangle",    d_rect: "Drag to create rectangle",
        k_circle: "Circle",     d_circle: "Drag to create circle",
        k_triangle: "Triangle", d_triangle: "Click to create triangle",
        k_group: "Group/Ungroup", d_group: "Bind/Unbind objects",
// ▼▼▼ [Edit/Add] ▼▼▼
        k_save: "Save Project",   d_save: "Save work (.json)",
        k_open: "Open Project",   d_open: "Load work (.json)",
        k_export: "Export Image", d_export: "Save as PNG",
        // ▲▲▲ [End] ▲▲▲
        k_copy: "Copy/Paste",   d_copy: "Duplicate selected objects",
        k_undo: "Undo/Redo",    d_undo: "Revert / Reapply actions",
        k_del: "Delete",        d_del: "Delete selected objects",
        k_all: "Select All",    d_all: "Select all shapes",
        k_order: "Order",       d_order: "Send to Back / Bring to Front",
        h_tip_1: "Nudge: Use Arrow keys to move 1px (Shift: 10px)",
        h_tip_2: "Reverse Sync: Edit code below to update canvas instantly.",
k_zoom: "Zoom In/Out",  d_zoom: "Mouse Wheel Scroll",
    k_pan: "Pan View",      d_pan: "Hold Space + Drag",
t_code: "Toggle Code View",   // [추가]   
// [추가]
// ▼▼▼ [Add] Support & Feedback ▼▼▼
        btn_coffee: "☕ Buy me a coffee",
        btn_feedback: "📧 Feedback / Bug Report",

        msg_copyright: "© 2025 ChickenHuman. All rights reserved."
    },

    ja: {
        properties: "属性",
        strokeColor: "線の色",
        fillColor: "塗りつぶし",
        noFill: "🚫 なし",
        strokeWidth: "線の太さ",
        tension: "曲率 (Tension)",
        rotate: "回転 (Rotate)",
        lineCap: "線の端 (Cap)",
        autoClose: "自動で閉じる",
        canvasBg: "背景色",
        btnFinish: "✔️ 完了 (Space)",
        btnDownload: "💾 画像保存",
        codeTitle: "SVG コード",
        btnCopy: "📋 コピー",
// ▼▼▼ [Add] ▼▼▼
        btnPaste: "📥 貼り付け",
        pasteDone: "✅ 完了!",
        pasteError: "❌ クリップボードの権限が必要です。",
        invalidSVG: "⚠️ 無効なSVGコードです。",
        // ▲▲▲ [End] ▲▲▲
        btnViewText: "TEXTで表示",
        btnViewViewer: "Viewerで表示",
        copyDone: "✅ 完了!",
textContent: "テキスト内容",
    fontSize: "フォントサイズ",
    fontFamily: "フォント",
    fontWeight: "太さ",
    t_text: "テキスト (T)",
    k_text: "テキスト追加", d_text: "クリックして文字入力",
s_solid: "_______ 実線 (1)",
    s_dashed: "------- 点線 (2)",
strokeOpacity: "線の不透明度",
fillOpacity: "塗りつぶし不透明度",
    t_stroke: "線のスタイル",

        t_sidebar: "サイドバー切替",
        t_draw: "描画 (D)",
        t_select: "選択 (V)",
        t_paint: "塗り (B)",
        t_eraser: "消しゴム (E)",
        t_shape: "図形",
        t_align: "整列メニュー",
        t_grid: "グリッド (Shift+G)",
        t_snap: "スナップ (Shift+S)",
        t_undo: "元に戻す (Ctrl+Z)",
        t_redo: "やり直し (Ctrl+Y)",
        t_group: "グループ化 (Ctrl+G)",
        t_ungroup: "グループ解除 (Shift+Ctrl+G)",
        t_front: "最前面へ ( ] )",
        t_back: "最背面へ ( [ )",
        t_delete: "削除 (Delete)",
        t_help: "ヘルプ (F1)",

        s_rect: "⬜ 四角形 (R)",
        s_circle: "⭕ 円 (C)",
        s_triangle: "🔺 三角形 (A)",
        
        a_left: "│← 左揃え",
        a_center: "→│← 左右中央",
        a_right: "→│ 右揃え",
        a_top: "↑ 上揃え",
        a_middle: "─ 上下中央",
        a_bottom: "↓ 下揃え",

        snapOn: "🧲 ON",
        snapOff: "🧲 OFF",

        h_title: "📖 SVG Master ユーザーガイド",
        h_intro: "ウェブ上でベクターグラフィックをデザインし、コードを生成します。",
        h_shortcuts: "⌨️ ショートカットキー",
        h_tips: "💡 便利なヒント",
        h_col_func: "機能",
        h_col_key: "キー",
        h_col_desc: "説明",
// ▼▼▼ [テーブル翻訳] ▼▼▼
        k_select: "選択",       d_select: "オブジェクトの選択と移動",
        k_draw: "描画",         d_draw: "自由曲線を描く (Pen)",
        k_eraser: "消しゴム",   d_eraser: "クリックで削除 / ドラッグで一括削除",
        k_paint: "塗りつぶし",  d_paint: "クリックして色を塗る",
        k_rect: "四角形",       d_rect: "ドラッグして四角形を作成",
        k_circle: "円",         d_circle: "ドラッグして円を作成",
        k_triangle: "三角形",   d_triangle: "クリックして三角形を作成",
        k_group: "グループ化",  d_group: "複数のオブジェクトをまとめる/解除",
// ▼▼▼ [Edit/Add] ▼▼▼
        k_save: "保存",         d_save: "プロジェクト保存 (.json)",
        k_open: "開く",         d_open: "プロジェクトを開く",
        k_export: "書き出し",    d_export: "PNG画像保存",
        // ▲▲▲ [End] ▲▲▲
        k_copy: "コピー/貼付",  d_copy: "選択オブジェクトを複製",
        k_undo: "元に戻す",     d_undo: "操作を取り消す / やり直す",
        k_del: "削除",          d_del: "選択したオブジェクトを削除",
        k_all: "全選択",        d_all: "すべての図形を選択",
        k_order: "順序変更",    d_order: "最背面へ / 最前面へ",
        h_tip_1: "微調整: 矢印キーで1px移動 (Shift: 10px)",
        h_tip_2: "逆同期: 下のコードを編集するとキャンバスに即座に反映されます。",
k_zoom: "拡大/縮小",    d_zoom: "マウスホイール",
    k_pan: "画面移動",      d_pan: "Space (長押し) + ドラッグ",
t_code: "コード表示切替",      // [추가]
btn_coffee: "☕ コーヒーで応援する",
        btn_feedback: "📧 フィードバック / バグ報告",

        msg_copyright: "© 2025 ChickenHuman. All rights reserved."
    }
};;

let currentLang = 'en';

// 현재 언어의 텍스트 가져오는 헬퍼 함수
function t(key) {
    return translations[currentLang][key] || key;
}

function changeLanguage(lang) {
    currentLang = lang;
    document.documentElement.setAttribute('lang', lang);
    
    // 1. 텍스트 내용 교체 (data-i18n)
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    // 2. 툴팁 교체 (data-i18n-title)
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (translations[lang][key]) {
            el.setAttribute('title', translations[lang][key]);
        }
    });

    // 3. 동적 텍스트 업데이트 (스냅 버튼 등)
    updateDynamicTexts();
}

function updateDynamicTexts() {
    // 스냅 버튼 상태에 따라 텍스트 갱신
    const btnSnap = document.getElementById('btnSnap');
    if (btnSnap) {
        const isSnapOn = btnSnap.classList.contains('active');
        btnSnap.textContent = isSnapOn ? t('snapOn') : t('snapOff');
    }
    
    // 토글 뷰 버튼
    const btnToggle = document.getElementById('btnToggleView');
    const textArea = document.getElementById('codeText');
    if (btnToggle && textArea) {
        const isTextMode = textArea.style.display !== 'none';
        btnToggle.textContent = isTextMode ? t('btnViewViewer') : t('btnViewText');
    }
}
