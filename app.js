const questions = [

  {
    n: 1,
    type: 'Read a text aloud',
    prep: 45,
    answer: 45,
    body:
      'Please read the following text aloud.\n\n' +
      'The community center offers a variety of classes for local residents. ' +
      'Registration is available online or at the front desk.'
  },

  {
    n: 2,
    type: 'Read a text aloud',
    prep: 45,
    answer: 45,
    body:
      'Please read the following text aloud.\n\n' +
      'Our store will be closed this Saturday for maintenance. ' +
      'We apologize for any inconvenience and will reopen on Sunday morning.'
  },

  {
    n: 3,
    type: 'Describe a picture',
    prep: 45,
    answer: 30,
    body:
      '[Practice image placeholder]\n\n' +
      'Describe what you see in this picture in as much detail as possible.\n\n' +
      'Imagine a busy coffee shop with several customers sitting at tables ' +
      'while a barista prepares drinks behind the counter.'
  },

  {
    n: 4,
    type: 'Describe a picture',
    prep: 45,
    answer: 30,
    body:
      '[Practice image placeholder]\n\n' +
      'Describe what you see in this picture in as much detail as possible.\n\n' +
      'Imagine a city park on a sunny afternoon. A family is having a picnic, ' +
      'two people are walking a dog, and children are playing near a fountain.'
  },

  {
    n: 5,
    type: 'Respond to questions',
    prep: 3,
    answer: 15,
    body:
      'How often do you use public transportation?'
  },

  {
    n: 6,
    type: 'Respond to questions',
    prep: 3,
    answer: 15,
    body:
      'What do you usually do while you are riding a bus or subway?'
  },

  {
    n: 7,
    type: 'Respond to questions',
    prep: 3,
    answer: 30,
    body:
      'Tell me about a recent experience you had while using public transportation.'
  },

  {
    n: 8,
    type: 'Respond using information provided',
    prep: 3,
    answer: 15,
    body:
      '[Information]\n\n' +
      'Community Fitness Center\n' +
      'Monday–Friday: 6:00 a.m.–10:00 p.m.\n' +
      'Saturday: 8:00 a.m.–6:00 p.m.\n' +
      'Sunday: 10:00 a.m.–4:00 p.m.\n\n' +
      'Q: What time does the fitness center open on Saturday?'
  },

  {
    n: 9,
    type: 'Respond using information provided',
    prep: 3,
    answer: 15,
    body:
      '[Information]\n\n' +
      'Community Fitness Center\n' +
      'Monday–Friday: 6:00 a.m.–10:00 p.m.\n' +
      'Saturday: 8:00 a.m.–6:00 p.m.\n' +
      'Sunday: 10:00 a.m.–4:00 p.m.\n\n' +
      'Q: What time does it close on Sunday?'
  },

  {
    n: 10,
    type: 'Respond using information provided',
    prep: 3,
    answer: 30,
    body:
      '[Information]\n\n' +
      'Community Fitness Center\n' +
      'Monday–Friday: 6:00 a.m.–10:00 p.m.\n' +
      'Saturday: 8:00 a.m.–6:00 p.m.\n' +
      'Sunday: 10:00 a.m.–4:00 p.m.\n\n' +
      'Q: A friend wants to exercise at 7:00 p.m. on Saturday. ' +
      'Can they use the fitness center then? Explain.'
  },

  {
    n: 11,
    type: 'Express an opinion',
    prep: 45,
    answer: 60,
    body:
      'Do you agree or disagree with the following statement?\n\n' +
      'People should spend more time exercising than watching TV.\n\n' +
      'Give reasons and examples to support your opinion.'
  }

];


/* =========================================================
   SUPABASE
   ========================================================= */

const SUPABASE_URL =
  'https://ziyepabpyemgbdlbikvi.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_HNQmlNHLFEx7ocxPmGbzFg_HlKSpH94';

const RECORDINGS_BUCKET =
  'recordings';

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


/* =========================================================
   TEST STATE
   ========================================================= */

let studentName = '';
let testId = '';
let index = 0;

let timerId = null;

let recorder = null;
let chunks = [];

let micStream = null;
let micReady = false;


/* =========================================================
   HELPERS
   ========================================================= */

const $ = id =>
  document.getElementById(id);


function show(id) {

  [
    'introScreen',
    'loginScreen',
    'nextScreen',
    'testScreen',
    'doneScreen'
  ].forEach(x => {
    const screen = $(x);
    if (screen) screen.classList.add('hidden');
  });

  const target = $(id);
  if (target) target.classList.remove('hidden');
}


function fmt(seconds) {

  return `${String(
    Math.floor(seconds / 60)
  ).padStart(2, '0')}:${String(
    seconds % 60
  ).padStart(2, '0')}`;

}


/*
  Supabase 파일명에는 최대한 안전하게
  ASCII 문자만 사용한다.
*/

function safeFileName(name) {

  return name
    .normalize('NFKD')
    .replace(/[^\w.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50) || 'student';

}


function createTestId() {

  const now = new Date();

  const date =
    now.getFullYear() +
    String(
      now.getMonth() + 1
    ).padStart(2, '0') +
    String(
      now.getDate()
    ).padStart(2, '0');

  const time =
    String(
      now.getHours()
    ).padStart(2, '0') +
    String(
      now.getMinutes()
    ).padStart(2, '0') +
    String(
      now.getSeconds()
    ).padStart(2, '0');

  return `${date}_${time}`;

}


/* =========================================================
   MICROPHONE
   ========================================================= */

async function testMicrophone() {

  if (!navigator.mediaDevices?.getUserMedia) {

    $('micStatus').textContent =
      '이 브라우저에서는 마이크 기능을 사용할 수 없습니다. ' +
      'Chrome/Edge/Safari 최신 버전을 사용하세요.';

    return;

  }


  try {

    /*
      기존 스트림이 있다면 먼저 정리
    */

    if (micStream) {

      micStream
        .getTracks()
        .forEach(track => track.stop());

    }


    micStream =
      await navigator.mediaDevices.getUserMedia({
        audio: true
      });


    micReady = true;


    $('micStatus').innerHTML =
      '마이크가 정상적으로 허용되었습니다.<br>음량이 올라가는지 확인해보세요.';

    $('beginTestBtn')
      .classList
      .remove('hidden');


    /*
      음량 미터
    */

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContext) {
      return;
    }


    const ctx =
      new AudioContext();

    const source =
      ctx.createMediaStreamSource(
        micStream
      );

    const analyser =
      ctx.createAnalyser();

    analyser.fftSize = 256;

    source.connect(analyser);


    const data =
      new Uint8Array(
        analyser.frequencyBinCount
      );


    const meter = () => {

      if (!micStream) {
        return;
      }


      analyser.getByteTimeDomainData(
        data
      );


      let sum = 0;


      for (const v of data) {

        const x =
          (v - 128) / 128;

        sum += x * x;

      }


      $('micMeter').style.width =
        Math.min(
          100,
          Math.sqrt(
            sum / data.length
          ) * 180
        ) + '%';


      requestAnimationFrame(meter);

    };


    meter();


  } catch (error) {

    micReady = false;

    $('micStatus').innerHTML =
      '마이크 권한을 얻지 못했습니다.<br>브라우저에서 마이크 권한을 허용한 뒤 다시 눌러주세요.';

    console.error(
      'Microphone error:',
      error
    );

  }

}


/* =========================================================
   QUESTION
   ========================================================= */

function renderQuestion() {

  const q =
    questions[index];

  $('progress').textContent =
    `Q${q.n} / 11`;

  $('questionType').textContent =
    q.type;

  $('questionTitle').textContent =
    `Question ${q.n}`;

  $('questionBody').textContent =
    q.body;

  startPhase(
    'prep',
    q.prep
  );

}


/* =========================================================
   TIMER
   ========================================================= */

function startPhase(
  phase,
  duration
) {

  clearInterval(timerId);


  const q =
    questions[index];


  $('phaseLabel').textContent =
    phase === 'prep'
      ? '준비 시간'
      : '답변 시간';


  $('timer').textContent =
    fmt(duration);


  $('meterBar').style.width =
    '0%';


  $('recordingStatus').textContent =
    phase === 'prep'
      ? '녹음 대기'
      : '● 녹음 중';


  /*
    답변 시작과 동시에 녹음
  */

  if (phase === 'answer') {

    startRecording()
      .then(() => {

        $('recordingStatus').textContent =
          '● 녹음 중';

      })
      .catch(error => {

        console.error(
          'Recording start error:',
          error
        );

        $('recordingStatus').textContent =
          '⚠ 녹음 시작 실패';

      });

  }


  let remaining =
    duration;


  timerId =
    setInterval(async () => {

      remaining--;


      $('timer').textContent =
        fmt(
          Math.max(
            0,
            remaining
          )
        );


      $('meterBar').style.width =
        `${Math.min(
          100,
          (
            (duration - remaining) /
            duration
          ) * 100
        )}%`;


      if (remaining <= 0) {

        clearInterval(timerId);


        if (phase === 'prep') {

          startPhase(
            'answer',
            q.answer
          );

        } else {

          await finishRecording();

          goNext();

        }

      }

    }, 1000);

}


/* =========================================================
   RECORDING START
   ========================================================= */

async function startRecording() {

  if (
    !micReady ||
    !micStream
  ) {

    throw new Error(
      'Microphone is not ready.'
    );

  }


  if (
    !MediaRecorder
  ) {

    throw new Error(
      'MediaRecorder is not supported.'
    );

  }


  /*
    이전 recorder가 남아 있으면 정리
  */

  if (
    recorder &&
    recorder.state !== 'inactive'
  ) {

    recorder.stop();

  }


  chunks = [];


  let options = {};


  if (
    MediaRecorder.isTypeSupported(
      'audio/webm;codecs=opus'
    )
  ) {

    options = {
      mimeType:
        'audio/webm;codecs=opus'
    };

  } else if (
    MediaRecorder.isTypeSupported(
      'audio/webm'
    )
  ) {

    options = {
      mimeType:
        'audio/webm'
    };

  }


  recorder =
    new MediaRecorder(
      micStream,
      options
    );


  recorder.ondataavailable =
    event => {

      if (
        event.data &&
        event.data.size > 0
      ) {

        chunks.push(
          event.data
        );

      }

    };


  recorder.start(1000);

}


/* =========================================================
   RECORDING FINISH
   ========================================================= */

function finishRecording() {

  return new Promise(
    resolve => {

      if (!recorder) {

        resolve();

        return;

      }


      const currentRecorder =
        recorder;

      recorder = null;


      currentRecorder.onstop =
        async () => {

          try {

            const blob =
              new Blob(
                chunks,
                {
                  type:
                    currentRecorder.mimeType ||
                    'audio/webm'
                }
              );


            if (blob.size === 0) {

              throw new Error(
                '녹음 데이터가 비어 있습니다.'
              );

            }


            $('recordingStatus').textContent =
              '녹음 완료 — 업로드 중...';


            await uploadRecording(
              blob,
              questions[index].n
            );


            $('recordingStatus').textContent =
              '✓ 녹음 업로드 완료';


          } catch (error) {

            console.error(
              'Upload error:',
              error
            );


            $('recordingStatus').textContent =
              '⚠ 녹음 업로드 실패';


            alert(
              `Q${questions[index].n} 녹음 업로드에 실패했습니다.\n\n` +
              `오류: ${error.message}`
            );


          } finally {

            /*
              여기서 절대로
              micStream.getTracks().stop()
              하지 않는다.

              시험 전체가 끝날 때까지
              마이크를 유지해야 한다.
            */

            resolve();

          }

        };


      if (
        currentRecorder.state !==
        'inactive'
      ) {

        currentRecorder.stop();

      } else {

        resolve();

      }

    }
  );

}


/* =========================================================
   SUPABASE UPLOAD
   ========================================================= */

async function uploadRecording(
  blob,
  questionNumber
) {

  if (
    !SUPABASE_PUBLISHABLE_KEY
  ) {

    throw new Error(
      'Supabase Publishable Key가 없습니다.'
    );

  }


  if (
    !blob ||
    blob.size === 0
  ) {

    throw new Error(
      '녹음 파일이 비어 있습니다.'
    );

  }


  const safeName =
    safeFileName(
      studentName
    );


  /*
    ASCII 위주 경로를 사용한다.

    예:
    tests/
      20261006_171530/
        student_Q1.webm
  */
  const questionLabel = String(questionNumber).padStart(2, '0');
  const filePath = `tests/${safeName}/${testId}_Q${questionLabel}.webm`;
  

  console.log(
    'Uploading:',
    filePath,
    'size:',
    blob.size
  );


  const {
    data,
    error
  } =
    await supabaseClient.storage
      .from(RECORDINGS_BUCKET)
      .upload(
        filePath,
        blob,
        {
          contentType:
            'audio/webm',
          cacheControl:
            '3600',
          upsert:
            false
        }
      );


  if (error) {

    console.error(
      'SUPABASE UPLOAD ERROR:',
      error
    );

    throw new Error(
      `${error.message}` +
      (
        error.statusCode
          ? ` (status ${error.statusCode})`
          : ''
      )
    );

  }


  console.log(
    'Upload success:',
    data
  );


  return data;

}


/* =========================================================
   NEXT
   ========================================================= */

function goNext() {

  if (
    index <
    questions.length - 1
  ) {

    index++;

    renderQuestion();

  } else {

    finishTest();

  }

}


/* =========================================================
   FINISH
   ========================================================= */

function finishTest() {

  clearInterval(
    timerId
  );


  /*
    Q11까지 끝났을 때만
    마이크를 종료한다.
  */

  if (micStream) {

    micStream
      .getTracks()
      .forEach(
        track => track.stop()
      );

    micStream = null;

  }


  micReady = false;


  show(
    'doneScreen'
  );


  $('doneMessage').textContent =
    `${studentName}님의 Q1~Q11 테스트가 끝났습니다. ` +
    `녹음 파일 업로드가 완료되었습니다.`;

}


/* =========================================================
   SCREEN FLOW / BUTTONS
   ========================================================= */

// FEL 로고 인트로를 3초 보여준 뒤 로그인 화면으로 이동
window.setTimeout(() => {
  show('loginScreen');
}, 3000);

// 로그인 화면에서 이름을 확인하고 실제 마이크 테스트 실행
$('micBtn').onclick = async () => {
  const enteredName = $('studentName').value.trim();

  if (!enteredName) {
    alert('먼저 수강생 이름을 입력하세요.');
    $('studentName').focus();
    return;
  }

  studentName = enteredName;
  await testMicrophone();
};

// 마이크 테스트가 완료되면 시험 목록으로 이동
$('beginTestBtn').onclick = () => {
  studentName = $('studentName').value.trim();

  if (!studentName) {
    alert('이름을 입력하세요.');
    $('studentName').focus();
    return;
  }

  if (!micReady) {
    alert('먼저 마이크 테스트를 완료하세요.');
    return;
  }

  testId = createTestId();
  $('welcomeName').textContent = studentName;
  show('nextScreen');
  requestAnimationFrame(updateScrollIndicator);
};

// 시험 목록에서 TOEIC Speaking Test를 선택한 뒤에만 시험 시작
$('toeicTestCard').onclick = () => {
  if (!micReady || !micStream) {
    alert('마이크가 연결되어 있지 않습니다. 처음 화면으로 돌아가 다시 테스트해 주세요.');
    return;
  }

  index = 0;
  show('testScreen');
  renderQuestion();
};

$('restartBtn').onclick = () => {
  location.reload();
};

function updateScrollIndicator() {
  const list = $('testList');
  const indicator = $('scrollIndicator');

  if (!list || !indicator) return;

  const canScroll =
    list.scrollHeight > list.clientHeight + 2;

  const atBottom =
    list.scrollTop + list.clientHeight >=
    list.scrollHeight - 2;

  indicator.classList.toggle(
    'hidden',
    !canScroll || atBottom
  );
}

const testListElement = $('testList');

if (testListElement) {
  testListElement.addEventListener(
    'scroll',
    updateScrollIndicator,
    { passive: true }
  );
}

window.addEventListener(
  'resize',
  updateScrollIndicator
);
