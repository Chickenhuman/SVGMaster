// [js/commander.js] 커맨드 패턴 관리 모듈

// 1. 고유 ID 생성 유틸리티
function generateUUID() {
    return 'svg-' + Math.random().toString(36).substr(2, 9);
}

// 2. ID가 없으면 생성해주는 헬퍼 함수
function ensureId(el) {
    if (!el.id || el.id.startsWith('uiLayer')) {
        el.id = generateUUID();
    }
    return el.id;
}

// 3. 커맨드 관리자 (Undo/Redo 엔진)
class CommandManager {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
    }

    // 새로운 행동 실행 및 기록
    execute(command) {
        command.execute(); 
        this.undoStack.push(command);
        this.redoStack = []; // 새 행동 시 Redo 스택 초기화
        
        // 버튼 상태 업데이트 (필요 시 구현)
        if(typeof updateUIBox === 'function') updateUIBox();
    }

    undo() {
        if (this.undoStack.length === 0) return false; // 실행할 게 없으면 false 반환
        const command = this.undoStack.pop();
        if (command) {
            command.undo();
            this.redoStack.push(command);
            return true; // 실행 성공
        }
        return false;
    }

    redo() {
        if (this.redoStack.length === 0) return false;
        const command = this.redoStack.pop();
        if (command) {
            command.execute();
            this.undoStack.push(command);
            return true;
        }
        return false;
    }
}

// 4. 변형(이동, 크기, 회전) 명령서 정의
class TransformCommand {
    constructor(elementId, oldTransform, newTransform) {
        this.elementId = elementId;
        this.oldTransform = oldTransform;
        this.newTransform = newTransform;
    }

    execute() {
        const el = document.getElementById(this.elementId);
        if (el) {
            el.setAttribute('transform', this.newTransform);
            // 선택박스 갱신 (script.js에 있는 함수 호출)
            if(typeof selectElements === 'function') selectElements([el]);
        }
    }

    undo() {
        const el = document.getElementById(this.elementId);
        if (el) {
            el.setAttribute('transform', this.oldTransform);
            if(typeof selectElements === 'function') selectElements([el]);
        }
    }
}

// 전역 인스턴스 생성 (script.js에서 사용 가능하도록)
const commandManager = new CommandManager();