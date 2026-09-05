const logContent = document.querySelector("#log-view .timeline-content");

const planContent = document.querySelector("#plan-view .timeline-content");

const newsContent = document.querySelector("#news-view .timeline-content");

const slider = document.getElementById("view-slider");

// -------------------------------------
// 基本設定
// -------------------------------------

let startYear = 1980;

const now = new Date();

const targetDate = new Date();
targetDate.setMonth(now.getMonth() + 12);

// 現在表示している画面
let currentView = "log";

// スワイプ判定用
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

// -------------------------------------
// 画面切り替え
// -------------------------------------

function switchView(view) {
  const tabLog = document.getElementById("tab-log");
  const tabPlan = document.getElementById("tab-plan");
  const tabNews = document.getElementById("tab-news");

  // 一度すべてのactiveを外す
  tabLog.classList.remove("active");
  tabPlan.classList.remove("active");
  tabNews.classList.remove("active");

  if (view === "log") {
    slider.className = "show-log";
    tabLog.classList.add("active");
    currentView = "log";
  }

  if (view === "plan") {
    slider.className = "show-plan";
    tabPlan.classList.add("active");
    currentView = "plan";
  }

  if (view === "news") {
    slider.className = "show-news";
    tabNews.classList.add("active");
    currentView = "news";
  }
}

// -------------------------------------
// スワイプ判定
// -------------------------------------

function handleGesture() {
  const swipeThreshold = 50;

  const diffX = touchEndX - touchStartX;
  const diffY = touchEndY - touchStartY;

  // 縦スクロールを横スワイプと誤認しないようにする
  if (Math.abs(diffX) <= Math.abs(diffY)) {
    return;
  }

  // 左へスワイプ
  if (diffX < -swipeThreshold) {
    if (currentView === "log") {
      switchView("plan");
    } else if (currentView === "plan") {
      switchView("news");
    }
  }

  // 右へスワイプ
  if (diffX > swipeThreshold) {
    if (currentView === "news") {
      switchView("plan");
    } else if (currentView === "plan") {
      switchView("log");
    }
  }
}

// -------------------------------------
// タッチイベント
// -------------------------------------

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

// -------------------------------------
// タイムライン生成
// -------------------------------------

function createTimeline(container, type) {
  let year = startYear;
  let month = 1;

  let currentYearVal = null;

  while (
    year < targetDate.getFullYear() ||
    (year === targetDate.getFullYear() && month <= targetDate.getMonth() + 1)
  ) {
    // 年が変わったら年見出しを作る
    if (year !== currentYearVal) {
      const yearHeader = document.createElement("div");

      yearHeader.className = "year-header";
      yearHeader.innerText = `${year}年`;

      container.appendChild(yearHeader);

      currentYearVal = year;
    }

    const id = `${type}-${year}-${month}`;

    const savedText = localStorage.getItem(id) || "";

    // 月の行
    const row = document.createElement("div");

    row.className = "month-row";

    if (savedText.trim() !== "") {
      row.classList.add("has-content");
    }

    // 月表示
    const monthLabel = document.createElement("div");

    monthLabel.className = "month-label";
    monthLabel.innerText = `${month}月`;

    // タイムライン線
    const divider = document.createElement("div");

    divider.className = "divider";

    // 入力エリア
    const memoArea = document.createElement("div");

    memoArea.className = "memo-area";

    // テキストエリア
    const textarea = document.createElement("textarea");

    textarea.id = id;
    textarea.placeholder = "---";
    textarea.value = savedText;

    // 入力されたら自動保存
    textarea.addEventListener("input", () => {
      localStorage.setItem(id, textarea.value);

      row.classList.toggle("has-content", textarea.value.trim() !== "");
    });

    memoArea.appendChild(textarea);

    row.appendChild(monthLabel);
    row.appendChild(divider);
    row.appendChild(memoArea);

    container.appendChild(row);

    // 次の月へ
    month++;

    if (month > 12) {
      month = 1;
      year++;
    }
  }
}

// -------------------------------------
// 設定メニュー
// -------------------------------------

function toggleSettings() {
  const menu = document.getElementById("settings-menu");

  menu.classList.toggle("hidden");
}

// -------------------------------------
// JSONバックアップ
// -------------------------------------

function exportData() {
  const data = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    if (
      key.startsWith("log-") ||
      key.startsWith("plan-") ||
      key.startsWith("news-")
    ) {
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

// -------------------------------------
// JSON復元
// -------------------------------------

function importData(event) {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      const confirmRestore = confirm(
        "現在のタイムラインデータを削除して、バックアップの内容に置き換えます。よろしいですか？",
      );

      if (!confirmRestore) {
        return;
      }

      // 現在のタイムラインデータだけ削除
      const keysToDelete = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (
          key.startsWith("log-") ||
          key.startsWith("plan-") ||
          key.startsWith("news-")
        ) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach((key) => {
        localStorage.removeItem(key);
      });

      // バックアップを保存
      Object.keys(data).forEach((key) => {
        if (
          key.startsWith("log-") ||
          key.startsWith("plan-") ||
          key.startsWith("news-")
        ) {
          localStorage.setItem(key, data[key]);
        }
      });

      alert("復元が完了しました。ページを再読み込みします。");

      location.reload();
    } catch (error) {
      alert("ファイルの形式が正しくありません。");
    }
  };

  reader.readAsText(file);
}

// -------------------------------------
// 初期化
// -------------------------------------

createTimeline(logContent, "log");

createTimeline(planContent, "plan");

createTimeline(newsContent, "news");

// -------------------------------------
// 現在の年月までスクロール
// -------------------------------------

window.onload = () => {
  const currentId = `log-${now.getFullYear()}-${now.getMonth() + 1}`;

  const target = document.getElementById(currentId);

  if (target) {
    target.scrollIntoView({
      block: "center",
    });
  }
};
