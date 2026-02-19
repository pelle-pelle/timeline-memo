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
  const swipeThreshold = 50; // 50px以上動いたらスワイプとみなす
  const diffX = touchEndX - touchStartX;
  const diffY = touchEndY - touchStartY;

  // 縦スクロール（上下の動き）の邪魔をしないよう、横の動きの方が大きい時だけ判定
  if (Math.abs(diffX) > Math.abs(diffY)) {
    if (diffX < -swipeThreshold) {
      // 左へスワイプ -> 予定を表示
      switchView("plan");
    } else if (diffX > swipeThreshold) {
      // 右へスワイプ -> 実績を表示
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
 * タイムライン生成ロジック（前回と同じ）
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

// 初期化
createTimeline(logContent, "log");
createTimeline(planContent, "plan");

window.onload = () => {
  const currentId = `log-${now.getFullYear()}-${now.getMonth() + 1}`;
  const target = document.getElementById(currentId);
  if (target) target.scrollIntoView({ block: "center" });
};
