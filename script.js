// --- 데이터 정의 ---
const remitData = [
  { label: "10만원", value: 100000 },
  { label: "5만원", value: 50000 },
  { label: "1만원", value: 10000 },
  { label: "5천원", value: 5000 },
  { label: "1천원", value: 1000 },
  { label: "500원", value: 500 },
  { label: "100원", value: 100 },
  { label: "50원", value: 50 },
  { label: "10원", value: 10 }
];

const exchangeData = [
  { id: "m10000", label: "1만원", unitVal: 10000, step: 1, unit: "장" },
  { id: "m5000", label: "5천원", unitVal: 5000, step: 1, unit: "장" },
  { id: "m1000", label: "1천원", unitVal: 1000, step: 10, unit: "장" },
  { id: "m500", label: "500원", unitVal: 20000, step: 1, unit: "묶음" },
  { id: "m100", label: "100원", unitVal: 5000, step: 1, unit: "묶음" },
  { id: "m50", label: "50원", unitVal: 2500, step: 1, unit: "묶음" },
  { id: "m10", label: "10원", unitVal: 500, step: 1, unit: "묶음" }
];

let activeTab = 'remit';

// --- DOM 요소 렌더링 및 초기화 ---
function initDOM() {
  // 송금 계산기 리스트 생성
  const remitListEl = document.getElementById("remitList");
  let remitHtml = "";
  remitData.forEach((item, idx) => {
    remitHtml += `
      <div class="grid-row remit-grid">
        <div class="denom">${item.label}</div>
        <button class="ctrl-btn minus" onclick="chgRemit(${idx}, -1)">-</button>
        <input type="number" id="remit-qty-${idx}" placeholder="0" min="0" oninput="calcRemit()">
        <button class="ctrl-btn" onclick="chgRemit(${idx}, 1)">+</button>
        <div class="amount" id="remit-amt-${idx}">0원</div>
      </div>
    `;
  });
  remitListEl.innerHTML = remitHtml;

  // 환전 계산기 리스트 생성
  const exListEl = document.getElementById("exchangeList");
  let exHtml = "";
  exchangeData.forEach((item) => {
    exHtml += `
      <div class="grid-row ex-grid">
        <div class="denom">${item.label}</div>
        <div class="amount" id="ex-amt-${item.id}">0원</div>
        <div class="qty-ctrl-box">
          <button class="ctrl-btn minus" onclick="chgEx('${item.id}', -${item.step})">-</button>
          <input type="number" id="ex-input-${item.id}" placeholder="0" min="0" oninput="calcEx()">
          <button class="ctrl-btn" onclick="chgEx('${item.id}', ${item.step})">+</button>
          <span class="unit-label">${item.unit}</span>
        </div>
      </div>
    `;
  });
  exListEl.innerHTML = exHtml;

  // 대상 금액 입력 이벤트
  document.getElementById("remitTarget").addEventListener("input", calcRemit);

  // 로컬 스토리지 데이터 복원
  loadSavedData();
}

// --- 탭 전환 ---
function switchTab(tabName) {
  activeTab = tabName;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

  if (tabName === 'remit') {
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.getElementById('tab-remit').classList.add('active');
  } else {
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
    document.getElementById('tab-exchange').classList.add('active');
  }
}

// --- 송금 계산기 연산 ---
function chgRemit(idx, delta) {
  const input = document.getElementById(`remit-qty-${idx}`);
  let val = parseInt(input.value) || 0;
  val = Math.max(0, val + delta);
  input.value = val === 0 ? "" : val;
  calcRemit();
}

function calcRemit() {
  let total = 0;
  remitData.forEach((item, idx) => {
    const input = document.getElementById(`remit-qty-${idx}`);
    if (+input.value < 0) input.value = "";
    
    const qty = Number(input.value) || 0;
    const amt = qty * item.value;
    total += amt;
    document.getElementById(`remit-amt-${idx}`).textContent = amt.toLocaleString() + "원";
  });

  document.getElementById("remitTotal").textContent = total.toLocaleString() + "원";

  const targetInput = document.getElementById("remitTarget");
  if (+targetInput.value < 0) targetInput.value = "";
  const target = Number(targetInput.value) || 0;
  const diff = target - total;

  const diffEl = document.getElementById("remitDiff");
  const statusEl = document.getElementById("remitStatus");

  diffEl.textContent = "차이 : " + diff.toLocaleString() + "원";
  statusEl.className = "status-badge";

  if (diff === 0) {
    statusEl.classList.add("match");
    statusEl.textContent = "🟢 정확히 일치";
  } else if (diff > 0) {
    statusEl.classList.add("short");
    statusEl.textContent = `🔴 ${diff.toLocaleString()}원 부족`;
  } else {
    statusEl.classList.add("over");
    statusEl.textContent = `🔵 ${Math.abs(diff).toLocaleString()}원 초과`;
  }

  saveData();
}

// --- 환전 계산기 연산 ---
function chgEx(id, delta) {
  const input = document.getElementById(`ex-input-${id}`);
  let val = parseInt(input.value) || 0;
  val = Math.max(0, val + delta);
  input.value = val === 0 ? "" : val;
  calcEx();
}

function calcEx() {
  let total = 0;
  exchangeData.forEach((item) => {
    const input = document.getElementById(`ex-input-${item.id}`);
    if (+input.value < 0) input.value = "";

    const qty = Number(input.value) || 0;
    const amt = qty * item.unitVal;
    total += amt;
    document.getElementById(`ex-amt-${item.id}`).textContent = amt.toLocaleString() + "원";
  });

  document.getElementById("exchangeTotal").textContent = total.toLocaleString() + "원";
  saveData();
}

// --- 로컬 스토리지 저장 및 불러오기 ---
function saveData() {
  const remitQtys = remitData.map((_, idx) => document.getElementById(`remit-qty-${idx}`).value);
  const remitTarget = document.getElementById("remitTarget").value;
  const exQtys = exchangeData.map(item => document.getElementById(`ex-input-${item.id}`).value);

  const data = { remitQtys, remitTarget, exQtys };
  localStorage.setItem("mergedCalcData", JSON.stringify(data));
}

function loadSavedData() {
  const saved = localStorage.getItem("mergedCalcData");
  if (!saved) return;

  try {
    const data = JSON.parse(saved);
    if (data.remitTarget) document.getElementById("remitTarget").value = data.remitTarget;
    if (data.remitQtys) {
      data.remitQtys.forEach((val, idx) => {
        const el = document.getElementById(`remit-qty-${idx}`);
        if (el) el.value = val;
      });
    }
    if (data.exQtys) {
      exchangeData.forEach((item, idx) => {
        const el = document.getElementById(`ex-input-${item.id}`);
        if (el && data.exQtys[idx]) el.value = data.exQtys[idx];
      });
    }
  } catch (e) {
    console.error("데이터 복원 실패", e);
  }

  calcRemit();
  calcEx();
}

// --- 초기화 ---
function resetCurrentTab() {
  if (activeTab === 'remit') {
    document.getElementById("remitTarget").value = "";
    remitData.forEach((_, idx) => {
      document.getElementById(`remit-qty-${idx}`).value = "";
    });
    calcRemit();
  } else {
    exchangeData.forEach((item) => {
      document.getElementById(`ex-input-${item.id}`).value = "";
    });
    calcEx();
  }
  showToast('초기화되었습니다');
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.innerText = msg;
  toast.style.display = 'block';
  if (window.toastTimeout) clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => toast.style.display = 'none', 2000);
}

// 시작
document.addEventListener("DOMContentLoaded", initDOM);
