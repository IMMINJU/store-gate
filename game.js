// ============================================
// 店;Gate - 편돌이즈 게이트
// ============================================

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const dialogueBox = document.getElementById('dialogue-box');
const speakerEl = document.getElementById('speaker');
const dialogueTextEl = document.getElementById('dialogue-text');
const clickPrompt = document.getElementById('click-prompt');
const container = document.getElementById('game-container');
const titleScreen = document.getElementById('title-screen');
const choiceBox = document.getElementById('choice-box');
const choiceItems = document.querySelectorAll('.choice-item');
const divergenceMeter = document.getElementById('divergence-meter');
const divergenceValue = document.querySelector('.divergence-value');
const endingTitle = document.getElementById('ending-title');
const endingName = document.querySelector('.ending-name');

// 엔딩 이름
const endingNames = {
  'go_outside': 'β世界線 END',
  'stay': 'α世界線 LOOP'
};

// 캔버스 해상도
const WIDTH = 128;
const HEIGHT = 128;
canvas.width = WIDTH;
canvas.height = HEIGHT;

// 게임 상태
let currentScene = 'title';
let dialogueIndex = 0;
let isTyping = false;
let canProgress = false;
let typewriterTimeout = null;
let time = 0;
let loopCount = 0;

// Divergence 값 (루프별)
const divergenceValues = {
  0: '0.337187',  // 루프 1
  1: '0.337199',  // 루프 2
  2: '0.409420',  // 루프 3
  3: '0.456903',  // 루프 4
  4: '0.571024',  // 루프 5
  'ending_go': '1.048596',    // 바깥으로 나감
  'ending_stay': '0.000000',  // 여기 있음 - 다시 처음으로
};
let currentDivergence = '0.337187';
let worldlineShift = false;
let worldlineShiftTime = 0;

// 선택지 상태
let showingChoices = false;
let choices = [];
let selectedChoice = 0;
let choiceCallback = null;

// 캐릭터 상태
let clerk = { x: 85, state: 'idle' };
let customer = { x: -20, targetX: 50, state: 'idle', visible: false };

// 연출 상태
let flickerIntensity = 0;
let doorOpen = false;
let showItems = false;
let endingType = null; // 'go_outside' or 'stay'

// ============================================
// 대사 데이터 (루프별)
// ============================================
const dialogues = {
  loop1: [
    { speaker: '', text: '...3시 12분.', action: 'show_clock' },
    { speaker: '', text: '(문이 열린다)', action: 'door_open' },
    { speaker: '손님', text: '안녕하세요.', action: 'customer_enter' },
    { speaker: '사장', text: '어서오세요.' },
    { speaker: '', text: '(손님이 진열대를 둘러본다)', action: 'customer_browse' },
    { speaker: '손님', text: '삼각김밥 어디있어요?' },
    { speaker: '사장', text: '저쪽 냉장고요.' },
    { speaker: '손님', text: '아, 감사합니다.' },
    { speaker: '', text: '(잠시 후. 손님이 삼각김밥과 우유를 들고 온다)', action: 'customer_return' },
    { speaker: '손님', text: '이거요.', action: 'show_items' },
    { speaker: '사장', text: '2,400원이요.' },
    { speaker: '', text: '(결제)' },
    { speaker: '손님', text: '가게 오래 하셨어요?' },
    { speaker: '사장', text: '...네?' },
    { speaker: '손님', text: '새벽에도 직접 보시는 것 같아서.' },
    { speaker: '사장', text: '아... 네. 꽤 됐죠.' },
    { speaker: '손님', text: '힘드시겠다. 새벽까지.' },
    { speaker: '사장', text: '...익숙해지면 괜찮아요.' },
    { speaker: '손님', text: '(웃으며) 그렇겠네요. 감사합니다.' },
    { speaker: '', text: '(손님이 나간다)', action: 'customer_leave' },
    { speaker: '사장', text: '...' },
    { speaker: '', text: '(화면이 어두워진다)', action: 'fade_loop' },
  ],

  loop2: [
    { speaker: '', text: '...3시 12분. ...어?', action: 'show_clock' },
    { speaker: '', text: '(데자뷰...?)' },
    { speaker: '', text: '(문이 열린다)', action: 'door_open' },
    { speaker: '손님', text: '안녕하세요.', action: 'customer_enter' },
    { speaker: '사장', text: '(잠깐 멈칫) ...어서오세요.' },
    { speaker: '손님', text: '삼각김밥 어디있어요?' },
    { speaker: '', text: '(이거... 아까도...)' },
    { speaker: '사장', text: '저쪽 냉장고요.' },
    { speaker: '손님', text: '아, 감사합니다.', action: 'customer_browse' },
    { speaker: '', text: '(손님이 삼각김밥과 우유를 들고 온다)', action: 'customer_return' },
    { speaker: '손님', text: '이거요.', action: 'show_items' },
    { speaker: '', text: '(삼각김밥이랑 우유.)' },
    { speaker: '사장', text: '2,400원이요.' },
    { speaker: '손님', text: '가게 오래 하셨어요?' },
    { speaker: '사장', text: '...이거 아까 물어보지 않았어요?' },
    { speaker: '손님', text: '네? 저 방금 왔는데요.' },
    { speaker: '사장', text: '...아, 아뇨. 죄송해요. 착각했어요.' },
    { speaker: '손님', text: '많이 피곤하신가 보다.' },
    { speaker: '사장', text: '...네.' },
    { speaker: '손님', text: '감사합니다.', action: 'customer_leave' },
    { speaker: '사장', text: '...뭐지.' },
    { speaker: '', text: '(화면이 어두워진다)', action: 'fade_loop' },
  ],

  loop3: [
    { speaker: '', text: '3시 12분. 또야.', action: 'show_clock' },
    { speaker: '', text: '(세계선이... 수렴하고 있다)' },
    { speaker: '', text: '(문이 열린다)', action: 'door_open' },
    { speaker: '손님', text: '안녕하세요.', action: 'customer_enter' },
    { speaker: '사장', text: '삼각김밥 저쪽 냉장고요.' },
    { speaker: '손님', text: '...네? 아, 네. 감사합니다.' },
    { speaker: '', text: '(손님, 의아한 표정으로 냉장고로 간다)', action: 'customer_browse' },
    { speaker: '', text: '(맞았어.)' },
    { speaker: '', text: '(손님이 돌아온다)', action: 'customer_return' },
    { speaker: '손님', text: '이거요.', action: 'show_items' },
    { speaker: '사장', text: '2,400원.' },
    { speaker: '', text: '(결제)' },
    { speaker: '손님', text: '...저 여기 자주 와요?' },
    { speaker: '사장', text: '...네?' },
    { speaker: '손님', text: '제가 뭘 살지 알고 계신 것 같아서.' },
    { speaker: '사장', text: '아... 오래 하다 보면 그래요.' },
    { speaker: '손님', text: '그렇구나. 몇 년이나 하셨어요?' },
    { type: 'choice', choices: ['...잘 모르겠어요.', '...기억이 안 나요.', '(대답하지 않는다)'] },
    { speaker: '손님', text: '사장님?' },
    { speaker: '사장', text: '몇 년인지.', dynamicText: true },
    { speaker: '손님', text: '(웃음) 그 정도로 오래 하셨구나.' },
    { speaker: '사장', text: '...그런가요.' },
    { speaker: '손님', text: '감사합니다.', action: 'customer_leave' },
    { speaker: '사장', text: '몇 년이지. 여긴.' },
    { speaker: '', text: '(화면이 어두워진다)', action: 'fade_loop' },
  ],

  loop4: [
    { speaker: '', text: '......', action: 'show_clock' },
    { speaker: '', text: '(어트랙터 필드... 이 시간에 갇혀있다)' },
    { speaker: '', text: '(문이 열린다)', action: 'door_open' },
    { speaker: '손님', text: '안녕하세요.', action: 'customer_enter' },
    { speaker: '사장', text: '...안녕하세요.' },
    { speaker: '손님', text: '삼각김밥 어디있어요?' },
    { speaker: '사장', text: '저쪽이요. 참치마요 드실 거죠?' },
    { speaker: '손님', text: '...어떻게 알았어요?', action: 'customer_browse' },
    { speaker: '사장', text: '매번 그거 사시니까.' },
    { speaker: '손님', text: '매번? 저 여기 처음인데.' },
    { speaker: '사장', text: '...그쵸.' },
    { speaker: '', text: '(손님이 돌아온다)', action: 'customer_return' },
    { speaker: '손님', text: '신기하네. 맞췄어요.', action: 'show_items' },
    { speaker: '사장', text: '...우유도요.' },
    { speaker: '손님', text: '(웃음) 뭐야, 무섭게.' },
    { speaker: '사장', text: '...저 질문 하나 해도 돼요?' },
    { speaker: '손님', text: '네.' },
    { speaker: '사장', text: '밖에 뭐가 있어요?' },
    { speaker: '손님', text: '밖이요? 그냥... 어두운 거리?' },
    { speaker: '사장', text: '저는 모르겠어요.' },
    { speaker: '손님', text: '네?' },
    { speaker: '사장', text: '마지막으로 이 문 밖을 나간 게 언제인지.' },
    { speaker: '손님', text: '...집에는 안 가세요?' },
    { type: 'choice', choices: ['집이요...', '...있긴 한가.', '(대답하지 않는다)'] },
    { speaker: '손님', text: '(어색한 웃음) 좀 무서운데요.' },
    { speaker: '사장', text: '죄송해요.' },
    { speaker: '손님', text: '아뇨... 괜찮아요. 감사합니다.', action: 'customer_leave' },
    { speaker: '', text: '(집. 있긴 한가.)' },
    { speaker: '', text: '(화면이 어두워진다)', action: 'fade_loop' },
  ],

  loop5: [
    { speaker: '', text: '3시 12분.', action: 'show_clock' },
    { speaker: '', text: '(리딩 슈타이너... 나만 기억한다)' },
    { speaker: '', text: '(문이 열린다)', action: 'door_open' },
    { speaker: '손님', text: '안녕하세요.', action: 'customer_enter' },
    { speaker: '사장', text: '...' },
    { speaker: '손님', text: '...안녕하세요?' },
    { speaker: '사장', text: '삼각김밥. 냉장고. 참치마요. 우유. 2,400원.' },
    { speaker: '사장', text: '"가게 오래 하셨어요?"' },
    { speaker: '손님', text: '...뭐예요?' },
    { speaker: '사장', text: '당신이 할 말이에요.' },
    { speaker: '손님', text: '(뒤로 한 발) ...저 그냥 갈게요.' },
    { speaker: '사장', text: '가도 다시 와요.' },
    { speaker: '손님', text: '...네?' },
    { speaker: '사장', text: '문이 닫히고, 어두워지고, 다시 3시 12분.' },
    { speaker: '사장', text: '같은 세계선. 같은 순간. 그리고 당신이 들어와요.' },
    { speaker: '손님', text: '...무슨 소리예요?' },
    { speaker: '사장', text: '나도 몰라요. 근데 맞아요.' },
    { speaker: '손님', text: '(침묵)' },
    { speaker: '사장', text: '...당신은 기억 안 나죠?' },
    { speaker: '손님', text: '뭘요?' },
    { speaker: '사장', text: '우리 대화.' },
    { speaker: '손님', text: '처음 만났잖아요.' },
    { speaker: '사장', text: '...그쵸.' },
    { speaker: '', text: '(긴 침묵)' },
    { speaker: '손님', text: '...진짜 괜찮으세요?' },
    { speaker: '사장', text: '모르겠어요.' },
    { speaker: '손님', text: '(잠깐 망설임) ...이 가게가 전부예요?' },
    { speaker: '사장', text: '...' },
    { speaker: '손님', text: '사장님한테.' },
    { speaker: '사장', text: '(희미하게 웃음) ...그런 것 같아요.' },
    { speaker: '손님', text: '...' },
    { speaker: '사장', text: '끝나면 좋겠어요. 이 밤이.' },
    { speaker: '', text: '(긴 침묵)' },
    { speaker: '손님', text: '...저도 그래요. 가끔.' },
    { speaker: '사장', text: '...네?' },
    { speaker: '손님', text: '끝나면 좋겠다고. 새벽이 너무 길어서.' },
    { speaker: '사장', text: '...' },
    { speaker: '손님', text: '감사합니다.', action: 'customer_leave' },
    { speaker: '', text: '...' },
    { speaker: '', text: '(잠깐의 정적)', action: 'pause' },
    { type: 'choice', choices: ['문 밖으로 나간다', '여기 있는다'], isFinalChoice: true },
  ],

  // 엔딩: 밖으로 나감 - Steins;Gate End
  ending_go: [
    { speaker: '', text: '(세계선을 넘는다)', action: 'open_door_ending' },
    { speaker: '', text: '(발을 내딛는다)' },
    { speaker: '', text: '...' },
    { speaker: '', text: '(형광등 불빛)', action: 'show_store_again' },
    { speaker: '', text: '(진열대. 냉장고. 카운터.)' },
    { speaker: '', text: '(다른 세계선의... 편의점)' },
    { speaker: '???', text: '어서오세요.' },
    { speaker: '', text: '(카운터 뒤에 누군가 서 있다)' },
    { speaker: '', text: '(나와 같은 앞치마를 입은)' },
    { speaker: '', text: '(다이버전스 1%의 장벽을 넘어도)' },
    { speaker: '', text: '(이곳에서 벗어날 수 없었다)' },
    { speaker: '', text: '', action: 'ending_fade' },
  ],

  // 엔딩: 여기 있음 - α세계선 Loop End
  ending_stay: [
    { speaker: '', text: '(가만히 서 있는다)' },
    { speaker: '', text: '(세계선은 수렴한다)' },
    { speaker: '', text: '(형광등이 깜빡인다)', action: 'flicker_intense' },
    { speaker: '', text: '(어트랙터 필드의 지배...)' },
    { speaker: '', text: '(문이 열리는 소리)', action: 'door_sound' },
    { speaker: '', text: '...' },
    { speaker: '', text: '...3시 12분.', action: 'show_clock_final' },
    { speaker: '', text: '', action: 'ending_fade' },
  ],
};

// ============================================
// 픽셀아트 렌더링
// ============================================

// 편의점 배경
function drawConvenienceStore() {
  // 바닥
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // 바닥 타일 패턴
  ctx.fillStyle = '#222';
  for (let x = 0; x < WIDTH; x += 16) {
    for (let y = 90; y < HEIGHT; y += 16) {
      if ((x + y) % 32 === 0) {
        ctx.fillRect(x, y, 16, 16);
      }
    }
  }

  // 천장
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, WIDTH, 15);

  // 형광등
  const flicker = Math.random() < flickerIntensity ? 0.3 : 1;
  ctx.fillStyle = `rgba(200, 220, 255, ${0.8 * flicker})`;
  ctx.fillRect(20, 8, 30, 3);
  ctx.fillRect(70, 8, 30, 3);

  // 형광등 빛 효과
  ctx.fillStyle = `rgba(200, 220, 255, ${0.05 * flicker})`;
  ctx.fillRect(10, 11, 50, 80);
  ctx.fillRect(60, 11, 50, 80);

  // 진열대 (왼쪽)
  ctx.fillStyle = '#333';
  ctx.fillRect(5, 40, 25, 50);
  ctx.fillStyle = '#444';
  ctx.fillRect(5, 40, 25, 2);
  ctx.fillRect(5, 55, 25, 2);
  ctx.fillRect(5, 70, 25, 2);

  // 진열대 상품들
  ctx.fillStyle = '#666';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(8 + i * 5, 43, 3, 10);
    ctx.fillRect(8 + i * 5, 58, 3, 10);
  }

  // 냉장고 (오른쪽 뒤)
  ctx.fillStyle = '#2a3a4a';
  ctx.fillRect(35, 25, 30, 45);
  ctx.fillStyle = '#3a4a5a';
  ctx.fillRect(36, 26, 28, 2);
  ctx.fillRect(36, 43, 28, 2);
  // 냉장고 안 상품
  ctx.fillStyle = '#fff';
  ctx.fillRect(40, 30, 4, 10);
  ctx.fillRect(48, 30, 4, 10);
  ctx.fillRect(56, 30, 4, 10);
  ctx.fillRect(40, 47, 4, 10);
  ctx.fillRect(48, 47, 4, 10);

  // 카운터
  ctx.fillStyle = '#3a3028';
  ctx.fillRect(70, 55, 55, 35);
  ctx.fillStyle = '#4a4038';
  ctx.fillRect(70, 55, 55, 3);

  // 계산대
  ctx.fillStyle = '#222';
  ctx.fillRect(85, 48, 15, 10);
  ctx.fillStyle = '#0a4';
  ctx.fillRect(87, 50, 11, 5);

  // 창문 (왼쪽 벽)
  ctx.fillStyle = '#0a1520';
  ctx.fillRect(0, 20, 5, 50);

  // 문
  if (doorOpen) {
    ctx.fillStyle = '#0a1520';
    ctx.fillRect(0, 70, 8, 50);
  } else {
    ctx.fillStyle = '#1a2530';
    ctx.fillRect(0, 70, 5, 50);
    ctx.fillStyle = '#2a3540';
    ctx.fillRect(1, 72, 3, 46);
  }
}

// 시계 (컷씬)
function drawClock() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // 시계 프레임
  ctx.fillStyle = '#333';
  ctx.fillRect(34, 34, 60, 60);
  ctx.fillStyle = '#111';
  ctx.fillRect(37, 37, 54, 54);

  // 디지털 숫자 3:12
  ctx.fillStyle = '#4a6';
  // 3
  ctx.fillRect(45, 55, 10, 2);
  ctx.fillRect(45, 62, 10, 2);
  ctx.fillRect(45, 69, 10, 2);
  ctx.fillRect(53, 55, 2, 16);
  // :
  ctx.fillRect(60, 58, 2, 2);
  ctx.fillRect(60, 66, 2, 2);
  // 1
  ctx.fillRect(70, 55, 2, 16);
  // 2
  ctx.fillRect(77, 55, 10, 2);
  ctx.fillRect(77, 62, 10, 2);
  ctx.fillRect(77, 69, 10, 2);
  ctx.fillRect(85, 55, 2, 9);
  ctx.fillRect(77, 62, 2, 9);
}

// 사장 (카운터 뒤)
function drawClerk(x, y, state = 'idle') {
  const breathe = Math.sin(time * 0.08) * 0.5;
  let bobY = breathe;

  ctx.fillStyle = '#ddd';

  // 머리
  const head = [[2,0],[3,0],[4,0],[5,0],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[2,3],[3,3],[4,3],[5,3]];
  // 목
  const neck = [[3,4],[4,4]];
  // 몸통 (앞치마)
  ctx.fillStyle = '#5a5';
  const body = [[2,5],[3,5],[4,5],[5,5],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[1,7],[2,7],[3,7],[4,7],[5,7],[6,7],[2,8],[3,8],[4,8],[5,8]];

  const bx = Math.floor(x);
  const by = Math.floor(y + bobY);

  ctx.fillStyle = '#ddd';
  for (let [px, py] of head) {
    ctx.fillRect(bx + px, by + py, 1, 1);
  }
  for (let [px, py] of neck) {
    ctx.fillRect(bx + px, by + py, 1, 1);
  }
  ctx.fillStyle = '#5a5';
  for (let [px, py] of body) {
    ctx.fillRect(bx + px, by + py, 1, 1);
  }
}

// 손님
function drawCustomer(x, y, state = 'idle') {
  if (!customer.visible) return;

  const breathe = Math.sin(time * 0.1) * 0.5;
  let bobY = breathe;
  let walkFrame = 0;

  if (state === 'walk') {
    walkFrame = Math.floor(time / 8) % 2;
    bobY = Math.sin(time * 0.3) * 1;
  }

  const bx = Math.floor(x);
  const by = Math.floor(y + bobY);

  ctx.fillStyle = '#aaa';

  // 머리
  const head = [[2,0],[3,0],[4,0],[5,0],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[2,3],[3,3],[4,3],[5,3]];
  // 목
  const neck = [[3,4],[4,4]];
  // 몸통 (후드)
  const body = [[2,5],[3,5],[4,5],[5,5],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[1,7],[2,7],[3,7],[4,7],[5,7],[6,7],[2,8],[3,8],[4,8],[5,8],[2,9],[3,9],[4,9],[5,9]];
  // 다리
  let legs;
  if (walkFrame === 0) {
    legs = [[2,10],[3,10],[4,10],[5,10],[1,11],[2,11],[5,11],[6,11],[1,12],[2,12],[5,12],[6,12]];
  } else {
    legs = [[2,10],[3,10],[4,10],[5,10],[2,11],[3,11],[4,11],[5,11],[2,12],[3,12],[4,12],[5,12]];
  }

  ctx.fillStyle = '#aaa';
  for (let [px, py] of head) {
    ctx.fillRect(bx + px, by + py, 1, 1);
  }
  for (let [px, py] of neck) {
    ctx.fillRect(bx + px, by + py, 1, 1);
  }
  ctx.fillStyle = '#556';
  for (let [px, py] of body) {
    ctx.fillRect(bx + px, by + py, 1, 1);
  }
  ctx.fillStyle = '#334';
  for (let [px, py] of legs) {
    ctx.fillRect(bx + px, by + py, 1, 1);
  }
}

// 삼각김밥 + 우유 (컷씬)
function drawItems() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // 카운터 표면
  ctx.fillStyle = '#3a3028';
  ctx.fillRect(0, 70, WIDTH, 58);
  ctx.fillStyle = '#4a4038';
  ctx.fillRect(0, 70, WIDTH, 3);

  // 삼각김밥
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(35, 50, 25, 20);
  ctx.fillStyle = '#fff';
  // 삼각형 모양
  for (let i = 0; i < 12; i++) {
    ctx.fillRect(47 - i, 52 + i, i * 2 + 1, 1);
  }
  ctx.fillStyle = '#141';
  ctx.fillRect(42, 58, 12, 8);

  // 우유
  ctx.fillStyle = '#eef';
  ctx.fillRect(70, 45, 15, 25);
  ctx.fillStyle = '#48f';
  ctx.fillRect(70, 45, 15, 8);
  ctx.fillStyle = '#fff';
  ctx.fillRect(73, 55, 9, 12);
}

// 문 열림 (컷씬)
function drawDoorOpening() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // 문틀
  ctx.fillStyle = '#333';
  ctx.fillRect(30, 20, 68, 90);

  // 열린 문
  ctx.fillStyle = '#0a1520';
  ctx.fillRect(35, 25, 58, 80);

  // 밖 (어둠)
  ctx.fillStyle = '#050a10';
  ctx.fillRect(40, 30, 48, 70);

  // 손님 실루엣
  ctx.fillStyle = '#1a2530';
  ctx.fillRect(55, 45, 15, 40);
  ctx.fillRect(58, 35, 9, 12);
}

// 밖으로 나가는 엔딩 - 문 열림
function drawDoorEndingOpen() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // 열린 문 (밖으로 나가는 시점)
  ctx.fillStyle = '#333';
  ctx.fillRect(20, 10, 88, 108);

  ctx.fillStyle = '#0a1520';
  ctx.fillRect(25, 15, 78, 98);

  // 어둠
  ctx.fillStyle = '#020508';
  ctx.fillRect(30, 20, 68, 88);
}

// 밖으로 나갔는데 편의점 - 반전 엔딩
function drawStoreAgain() {
  flickerIntensity = 0.05;
  drawConvenienceStore();

  // 카운터 뒤에 또 다른 사장
  drawClerk(85, 42, 'idle');
}

let endingStartTime = 0;
let currentCutscene = null;
let endingFadeOpacity = 0;

// ============================================
// Divergence 미터 & 세계선 이동
// ============================================
function updateDivergence(newValue, animate = true) {
  if (animate && newValue !== currentDivergence) {
    // 세계선 변동 연출
    worldlineShift = true;
    worldlineShiftTime = time;

    // 숫자 롤링 애니메이션
    let rollCount = 0;
    const rollInterval = setInterval(() => {
      const randomValue = Math.random().toFixed(6);
      divergenceValue.textContent = randomValue;
      rollCount++;
      if (rollCount > 15) {
        clearInterval(rollInterval);
        divergenceValue.textContent = newValue;
        currentDivergence = newValue;
      }
    }, 50);
  } else {
    divergenceValue.textContent = newValue;
    currentDivergence = newValue;
  }
}

function showDivergenceMeter() {
  divergenceMeter.classList.add('visible');
}

function hideDivergenceMeter() {
  divergenceMeter.classList.remove('visible');
}

function showEndingTitle(type) {
  const name = endingNames[type];
  if (name) {
    endingName.textContent = name;
    endingTitle.classList.add('visible');
  }
}

function hideEndingTitle() {
  endingTitle.classList.remove('visible');
}

// 세계선 이동 화면 효과
function drawWorldlineShift() {
  const elapsed = time - worldlineShiftTime;

  // 화면 글리치 효과
  for (let i = 0; i < 10; i++) {
    const y = Math.random() * HEIGHT;
    const h = Math.random() * 5 + 1;
    const offset = (Math.random() - 0.5) * 20;

    ctx.save();
    ctx.translate(offset, 0);
    ctx.fillStyle = `rgba(0, 255, 0, ${0.3 * Math.random()})`;
    ctx.fillRect(0, y, WIDTH, h);
    ctx.restore();
  }

  // 수직 스캔 라인
  ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
  for (let y = 0; y < HEIGHT; y += 2) {
    ctx.fillRect(0, y, WIDTH, 1);
  }

  if (elapsed > 30) {
    worldlineShift = false;
  }
}

// ============================================
// 선택지 UI (HTML 기반)
// ============================================
function showChoices(choiceList, callback, isFinal = false) {
  showingChoices = true;
  choices = choiceList;
  selectedChoice = 0;
  choiceCallback = callback;
  canProgress = false;

  // 대화창 숨기기
  dialogueBox.classList.remove('visible');
  clickPrompt.classList.remove('visible');

  // 선택지 표시
  choiceBox.classList.add('visible');

  choiceItems.forEach((item, i) => {
    if (i < choiceList.length) {
      item.textContent = choiceList[i];
      item.classList.remove('hidden');
      item.classList.toggle('selected', i === 0);
    } else {
      item.classList.add('hidden');
    }
  });
}

function updateChoiceSelection() {
  choiceItems.forEach((item, i) => {
    item.classList.toggle('selected', i === selectedChoice);
  });
}

function selectChoice(index) {
  showingChoices = false;
  const selected = choices[index];
  choices = [];

  // 선택지 숨기기
  choiceBox.classList.remove('visible');

  if (choiceCallback) {
    choiceCallback(index, selected);
  }
}

// 선택지 클릭 이벤트
choiceItems.forEach((item, i) => {
  item.addEventListener('click', (e) => {
    e.stopPropagation();
    if (showingChoices && !item.classList.contains('hidden')) {
      selectChoice(i);
    }
  });
});

// ============================================
// 액션 처리
// ============================================
function handleAction(action) {
  if (!action) return;

  switch(action) {
    case 'show_clock':
      currentCutscene = 'clock';
      setTimeout(() => { currentCutscene = null; }, 1500);
      break;
    case 'show_clock_final':
      currentCutscene = 'clock';
      setTimeout(() => { currentCutscene = null; }, 2000);
      break;
    case 'door_open':
      currentCutscene = 'door';
      doorOpen = true;
      setTimeout(() => { currentCutscene = null; }, 1000);
      break;
    case 'customer_enter':
      customer.visible = true;
      customer.x = 10;
      customer.targetX = 50;
      customer.state = 'walk';
      break;
    case 'customer_browse':
      customer.targetX = 40;
      customer.state = 'walk';
      break;
    case 'customer_return':
      customer.targetX = 65;
      customer.state = 'walk';
      break;
    case 'show_items':
      currentCutscene = 'items';
      showItems = true;
      setTimeout(() => { currentCutscene = null; }, 1500);
      break;
    case 'customer_leave':
      customer.targetX = -20;
      customer.state = 'walk';
      setTimeout(() => {
        customer.visible = false;
        doorOpen = false;
      }, 2000);
      break;
    case 'fade_loop':
      loopCount++;
      setTimeout(() => {
        startNextLoop();
      }, 1000);
      break;
    case 'pause':
      flickerIntensity = 0;
      break;
    case 'open_door_ending':
      currentCutscene = 'door_ending';
      break;
    case 'show_store_again':
      currentCutscene = 'store_again';
      break;
    case 'flicker_intense':
      flickerIntensity = 0.3;
      break;
    case 'door_sound':
      doorOpen = true;
      break;
    case 'ending_fade':
      currentScene = 'ending_fade';
      endingStartTime = time;
      // 엔딩 타이틀 표시
      setTimeout(() => {
        showEndingTitle(endingType);
      }, 1000);
      break;
  }
}

// ============================================
// 업데이트
// ============================================
function update() {
  // 손님 이동
  if (customer.visible && customer.x !== customer.targetX) {
    const diff = customer.targetX - customer.x;
    const speed = 0.5;
    customer.x += Math.sign(diff) * Math.min(Math.abs(diff), speed);
    if (Math.abs(diff) < speed) {
      customer.x = customer.targetX;
      customer.state = 'idle';
    }
  }

  // 형광등 깜빡임 (루프가 진행될수록 심해짐)
  if (currentScene !== 'ending_go' && currentScene !== 'ending_stay') {
    flickerIntensity = Math.min(0.1, loopCount * 0.02);
  }

  // 엔딩 페이드
  if (currentScene === 'ending_fade') {
    endingFadeOpacity = Math.min(1, (time - endingStartTime) / 180);
  }
}

// ============================================
// 렌더링
// ============================================
function render() {
  if (currentCutscene === 'clock') {
    drawClock();
    return;
  }
  if (currentCutscene === 'door') {
    drawDoorOpening();
    return;
  }
  if (currentCutscene === 'items') {
    drawItems();
    return;
  }
  if (currentCutscene === 'door_ending') {
    drawDoorEndingOpen();
    return;
  }
  if (currentCutscene === 'store_again') {
    drawStoreAgain();
    return;
  }
  if (currentScene === 'ending_fade') {
    if (endingType === 'go_outside') {
      drawStoreAgain();
    } else {
      drawConvenienceStore();
      drawClerk(clerk.x, 42, clerk.state);
    }
    // 페이드 아웃
    ctx.fillStyle = `rgba(0, 0, 0, ${endingFadeOpacity})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    return;
  }

  drawConvenienceStore();
  drawClerk(clerk.x, 42, clerk.state);
  drawCustomer(customer.x, 75, customer.state);

  // 세계선 이동 효과
  if (worldlineShift) {
    drawWorldlineShift();
  }
}

// ============================================
// 대사 시스템
// ============================================
function showDialogue(speakerName, text, action, callback) {
  dialogueBox.classList.add('visible');
  clickPrompt.classList.remove('visible');
  speakerEl.textContent = speakerName;
  dialogueTextEl.textContent = '';
  isTyping = true;
  canProgress = false;

  handleAction(action);

  let index = 0;
  const speed = 40;

  function type() {
    if (index < text.length) {
      dialogueTextEl.textContent += text[index];
      index++;
      typewriterTimeout = setTimeout(type, speed);
    } else {
      isTyping = false;
      canProgress = true;
      clickPrompt.classList.add('visible');
      if (callback) callback();
    }
  }
  type();
}

function skipTyping(text) {
  if (typewriterTimeout) clearTimeout(typewriterTimeout);
  dialogueTextEl.textContent = text;
  isTyping = false;
  canProgress = true;
  clickPrompt.classList.add('visible');
}

function hideDialogue() {
  dialogueBox.classList.remove('visible');
  clickPrompt.classList.remove('visible');
}

// ============================================
// 게임 진행
// ============================================
function getCurrentDialogues() {
  if (currentScene === 'ending_go') return dialogues.ending_go;
  if (currentScene === 'ending_stay') return dialogues.ending_stay;
  const loopKey = `loop${Math.min(loopCount + 1, 5)}`;
  return dialogues[loopKey] || dialogues.loop5;
}

function progressDialogue() {
  if (currentScene === 'title') {
    currentScene = 'game';
    titleScreen.classList.add('hidden');
    dialogueIndex = 0;
    loopCount = 0;
    resetState();
    // Divergence 미터 표시
    showDivergenceMeter();
    updateDivergence(divergenceValues[0], false);
  }

  if (currentScene === 'ending_fade') {
    // 엔딩 후 다시 타이틀로
    if (endingFadeOpacity >= 1) {
      currentScene = 'title';
      titleScreen.classList.remove('hidden');
      hideDialogue();
      hideDivergenceMeter();
      hideEndingTitle();
      endingType = null;
      endingFadeOpacity = 0;
      return;
    }
  }

  const sceneDialogues = getCurrentDialogues();

  if (dialogueIndex >= sceneDialogues.length) {
    return;
  }

  const d = sceneDialogues[dialogueIndex];

  // 선택지 처리
  if (d.type === 'choice') {
    showChoices(d.choices, (index, selected) => {
      if (d.isFinalChoice) {
        // 최종 선택: 엔딩 분기
        if (index === 0) {
          endingType = 'go_outside';
          currentScene = 'ending_go';
          updateDivergence(divergenceValues['ending_go'], true);
        } else {
          endingType = 'stay';
          currentScene = 'ending_stay';
          updateDivergence(divergenceValues['ending_stay'], true);
        }
        dialogueIndex = 0;
        setTimeout(progressDialogue, 500);
      } else {
        dialogueIndex++;
        setTimeout(progressDialogue, 100);
      }
    });
    return;
  }

  showDialogue(d.speaker, d.text, d.action);
  dialogueIndex++;
}

function startNextLoop() {
  dialogueIndex = 0;
  customer.visible = false;
  customer.x = -20;
  doorOpen = false;
  showItems = false;

  // 세계선 변동 (Divergence 업데이트)
  const newDivergence = divergenceValues[loopCount] || divergenceValues[4];
  updateDivergence(newDivergence, true);

  fadeIn();
  setTimeout(progressDialogue, 500);
}

function resetState() {
  clerk = { x: 85, state: 'idle' };
  customer = { x: -20, targetX: 50, state: 'idle', visible: false };
  doorOpen = false;
  showItems = false;
  flickerIntensity = 0;
  currentCutscene = null;
  endingType = null;
  endingFadeOpacity = 0;
}

// ============================================
// 씬 전환
// ============================================
function fadeOut(callback) {
  container.classList.remove('fade-in');
  container.classList.add('fade-out');
  setTimeout(callback, 500);
}

function fadeIn() {
  container.classList.remove('fade-out');
  container.classList.add('fade-in');
}

// ============================================
// 입력 처리
// ============================================
document.addEventListener('click', (e) => {
  if (showingChoices) {
    // 클릭으로 선택
    selectChoice(selectedChoice);
    return;
  }

  if (currentScene === 'title') {
    progressDialogue();
    return;
  }
  if (isTyping) {
    const d = getCurrentDialogues();
    if (d && dialogueIndex > 0 && !d[dialogueIndex - 1].type) {
      skipTyping(d[dialogueIndex - 1].text);
    }
  } else if (canProgress) {
    progressDialogue();
  }
});

document.addEventListener('keydown', (e) => {
  if (showingChoices) {
    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      selectedChoice = Math.max(0, selectedChoice - 1);
      updateChoiceSelection();
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      selectedChoice = Math.min(choices.length - 1, selectedChoice + 1);
      updateChoiceSelection();
    } else if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      selectChoice(selectedChoice);
    }
    return;
  }

  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    document.dispatchEvent(new Event('click'));
  }
});

// ============================================
// 게임 루프
// ============================================
function gameLoop() {
  time++;
  update();

  if (currentScene !== 'title') {
    render();
  } else {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // 타이틀에서 편의점 분위기
    ctx.fillStyle = `rgba(200, 220, 255, ${0.03 + Math.sin(time * 0.05) * 0.01})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  requestAnimationFrame(gameLoop);
}

// ============================================
// 초기화
// ============================================
function init() {
  container.style.setProperty('--fade-opacity', '1');
  fadeIn();
  gameLoop();
}

init();
