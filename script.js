const logContent = document.querySelector("#log-view .timeline-content");
const planContent = document.querySelector("#plan-view .timeline-content");
const slider = document.getElementById("view-slider");

// 設定
let startYear = 1980;
const now = new Date();
const targetDate = new Date();
targetDate.setMonth(now.getMonth() + 12);

// スワイプ判定用の変数
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

/**
 * 画面切り替え関数
 */
function switchView(view) {
  const tabLog = document.getElementById("tab-log");
  const tabPlan = document.getElementById("tab-plan");

  if (view === "log") {
    slider.className = "show-log";
    tabLog.classList.add("active");
    tabPlan.classList.remove("active");
  } else {
    slider.className = "show-plan";
    tabLog.classList.remove("active");
    tabPlan.classList.add("active");
  }
}

/**
 * スワイプ判定ロジック
 */
function handleGesture() {
  const swipeThreshold = 50;
  const diffX = touchEndX - touchStartX;
  const diffY = touchEndY - touchStartY;

  if (Math.abs(diffX) > Math.abs(diffY)) {
    if (diffX < -swipeThreshold) {
      switchView("plan");
    } else if (diffX > swipeThreshold) {
      switchView("log");
    }
  }
}

// タッチイベントの登録
slider.addEventListener(
  "touchstart",
  (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  },
  { passive: true },
);

slider.addEventListener(
  "touchend",
  (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleGesture();
  },
  { passive: true },
);

/**
 * タイムライン生成ロジック
 */
function createTimeline(container, type) {
  let year = startYear;
  let month = 1;
  let currentYearVal = null;

  while (
    year < targetDate.getFullYear() ||
    (year === targetDate.getFullYear() && month <= targetDate.getMonth() + 1)
  ) {
    if (year !== currentYearVal) {
      const yh = document.createElement("div");
      yh.className = "year-header";
      yh.innerText = `${year}年`;
      container.appendChild(yh);
      currentYearVal = year;
    }

    const id = `${type}-${year}-${month}`;
    const text = localStorage.getItem(id) || "";
    const row = document.createElement("div");
    row.className = `month-row ${text ? "has-content" : ""}`;
    row.innerHTML = `
            <div class="month-label">${month}月</div>
            <div class="divider"></div>
            <div class="memo-area">
                <textarea id="${id}" placeholder="---">${text}</textarea>
            </div>
        `;
    container.appendChild(row);

    const textarea = row.querySelector("textarea");
    textarea.addEventListener("input", () => {
      localStorage.setItem(id, textarea.value);
      row.classList.toggle("has-content", textarea.value.trim() !== "");
    });

    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
}

// --- データ管理機能（関数の外に定義することでHTMLから呼べるようにする） ---

function toggleSettings() {
  document.getElementById("settings-menu").classList.toggle("hidden");
}

function exportData() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith("log-") || key.startsWith("plan-")) {
      data[key] = localStorage.getItem(key);
    }
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `timeline_backup_${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (confirm("現在のデータが上書きされます。よろしいですか？")) {
        Object.keys(data).forEach((key) => {
          localStorage.setItem(key, data[key]);
        });
        alert("復元が完了しました。再読み込みします。");
        location.reload();
      }
    } catch (err) {
      alert("ファイルの形式が正しくありません。");
    }
  };
  reader.readAsText(file);
}

// 初期化（最後に実行）
createTimeline(logContent, "log");
createTimeline(planContent, "plan");

window.onload = () => {
  const currentId = `log-${now.getFullYear()}-${now.getMonth() + 1}`;
  const target = document.getElementById(currentId);
  if (target) target.scrollIntoView({ block: "center" });
};
