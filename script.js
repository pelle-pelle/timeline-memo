const logContent = document.querySelector("#log-view .timeline-content");

const planContent = document.querySelector("#plan-view .timeline-content");

const newsContent = document.querySelector("#news-view .timeline-content");

const slider = document.getElementById("view-slider");

// =====================================
// 基本設定
// =====================================

let startYear = 1980;

const now = new Date();

const targetDate = new Date();
targetDate.setMonth(now.getMonth() + 12);

// 現在表示している画面
let currentView = "log";

// スワイプ判定
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

// =====================================
// 指定した画面を取得
// =====================================

function getViewElement(view) {
  return document.getElementById(`${view}-view`);
}

// =====================================
// 現在見ている年月を取得
// =====================================

function getScrollAnchor(viewName) {
  const view = getViewElement(viewName);

  if (!view) {
    return null;
  }

  const rows = view.querySelectorAll(".month-row");

  if (rows.length === 0) {
    return null;
  }

  const viewRect = view.getBoundingClientRect();

  /*
    画面の上から40%の位置を
    「現在見ている場所」とします。
  */
  const referenceY = viewRect.top + view.clientHeight * 0.4;

  let selectedRow = null;
  let closestDistance = Infinity;

  rows.forEach((row) => {
    const rect = row.getBoundingClientRect();

    // 基準位置がその月の中にある
    if (rect.top <= referenceY && rect.bottom >= referenceY) {
      selectedRow = row;
      closestDistance = 0;

      return;
    }

    // 一番近い月を探す
    const center = rect.top + rect.height / 2;

    const distance = Math.abs(center - referenceY);

    if (distance < closestDistance) {
      closestDistance = distance;
      selectedRow = row;
    }
  });

  if (!selectedRow) {
    return null;
  }

  const rect = selectedRow.getBoundingClientRect();

  /*
    その月の中で
    どのくらいの位置を見ているか

    0 = 月の先頭
    0.5 = 月の中央
    1 = 月の最後
  */
  let progress = (referenceY - rect.top) / rect.height;

  progress = Math.max(0, Math.min(1, progress));

  return {
    year: selectedRow.dataset.year,

    month: selectedRow.dataset.month,

    progress: progress,
  };
}

// =====================================
// 切り替え先を同じ年月に合わせる
// =====================================

function syncViewToAnchor(targetViewName, anchor) {
  if (!anchor) {
    return;
  }

  const view = getViewElement(targetViewName);

  if (!view) {
    return;
  }

  const targetRow = view.querySelector(
    `.month-row[data-year="${anchor.year}"][data-month="${anchor.month}"]`,
  );

  if (!targetRow) {
    return;
  }

  const viewRect = view.getBoundingClientRect();

  const referenceY = viewRect.top + view.clientHeight * 0.4;

  const rowRect = targetRow.getBoundingClientRect();

  /*
    元画面で見ていた
    「月の中での位置」を再現
  */
  const targetPointY = rowRect.top + rowRect.height * anchor.progress;

  const difference = targetPointY - referenceY;

  /*
    destination側だけを
    独立してスクロール
  */
  view.scrollTop += difference;
}

// =====================================
// 画面切り替え
// =====================================

function switchView(view) {
  if (view !== "log" && view !== "plan" && view !== "news") {
    return;
  }

  if (view === currentView) {
    return;
  }

  /*
    現在見ている年月を取得
  */
  const anchor = getScrollAnchor(currentView);

  /*
    画面が見える前に
    切り替え先を同じ年月へ移動
  */
  syncViewToAnchor(view, anchor);

  // タブ
  const tabLog = document.getElementById("tab-log");

  const tabPlan = document.getElementById("tab-plan");

  const tabNews = document.getElementById("tab-news");

  tabLog.classList.remove("active");
  tabPlan.classList.remove("active");
  tabNews.classList.remove("active");

  // 実績
  if (view === "log") {
    slider.className = "show-log";

    tabLog.classList.add("active");
  }

  // 予定
  if (view === "plan") {
    slider.className = "show-plan";

    tabPlan.classList.add("active");
  }

  // 社会
  if (view === "news") {
    slider.className = "show-news";

    tabNews.classList.add("active");
  }

  currentView = view;
}

// =====================================
// スワイプ判定
// =====================================

function handleGesture() {
  const swipeThreshold = 50;

  const diffX = touchEndX - touchStartX;

  const diffY = touchEndY - touchStartY;

  /*
    縦方向の動きの方が大きい場合は
    通常の縦スクロール
  */
  if (Math.abs(diffX) <= Math.abs(diffY)) {
    return;
  }

  // 左スワイプ
  if (diffX < -swipeThreshold) {
    if (currentView === "log") {
      switchView("plan");
    } else if (currentView === "plan") {
      switchView("news");
    }
  }

  // 右スワイプ
  if (diffX > swipeThreshold) {
    if (currentView === "news") {
      switchView("plan");
    } else if (currentView === "plan") {
      switchView("log");
    }
  }
}

// =====================================
// タッチイベント
// =====================================

slider.addEventListener(
  "touchstart",
  (e) => {
    touchStartX = e.changedTouches[0].screenX;

    touchStartY = e.changedTouches[0].screenY;
  },
  {
    passive: true,
  },
);

slider.addEventListener(
  "touchend",
  (e) => {
    touchEndX = e.changedTouches[0].screenX;

    touchEndY = e.changedTouches[0].screenY;

    handleGesture();
  },
  {
    passive: true,
  },
);

// =====================================
// タイムライン生成
// =====================================

function createTimeline(container, type) {
  let year = startYear;
  let month = 1;

  let currentYearVal = null;

  while (
    year < targetDate.getFullYear() ||
    (year === targetDate.getFullYear() && month <= targetDate.getMonth() + 1)
  ) {
    // 年見出し
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

    /*
      年月同期に使用
    */
    row.dataset.year = year;
    row.dataset.month = month;

    if (savedText.trim() !== "") {
      row.classList.add("has-content");
    }

    // 月
    const monthLabel = document.createElement("div");

    monthLabel.className = "month-label";

    monthLabel.innerText = `${month}月`;

    // 縦線
    const divider = document.createElement("div");

    divider.className = "divider";

    // メモ
    const memoArea = document.createElement("div");

    memoArea.className = "memo-area";

    const textarea = document.createElement("textarea");

    textarea.id = id;

    textarea.placeholder = "---";

    textarea.value = savedText;

    // 自動保存
    textarea.addEventListener("input", () => {
      localStorage.setItem(id, textarea.value);

      row.classList.toggle("has-content", textarea.value.trim() !== "");
    });

    memoArea.appendChild(textarea);

    row.appendChild(monthLabel);

    row.appendChild(divider);

    row.appendChild(memoArea);

    container.appendChild(row);

    // 次の月
    month++;

    if (month > 12) {
      month = 1;
      year++;
    }
  }
}

// =====================================
// 設定メニュー
// =====================================

function toggleSettings() {
  const menu = document.getElementById("settings-menu");

  menu.classList.toggle("hidden");
}

// =====================================
// JSON書き出し
// =====================================

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

  const blob = new Blob(
    [JSON.stringify(data, null, 2)],

    {
      type: "application/json",
    },
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;

  a.download = `timeline_backup_${new Date().toISOString().split("T")[0]}.json`;

  a.click();

  URL.revokeObjectURL(url);
}

// =====================================
// JSON読み込み
// =====================================

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

// =====================================
// 指定年月を画面中央付近へ
// =====================================

function scrollToMonth(viewName, year, month) {
  const view = getViewElement(viewName);

  if (!view) {
    return;
  }

  const target = view.querySelector(
    `.month-row[data-year="${year}"][data-month="${month}"]`,
  );

  if (!target) {
    return;
  }

  const targetTop =
    target.offsetTop - view.clientHeight * 0.4 + target.offsetHeight / 2;

  view.scrollTop = Math.max(0, targetTop);
}

// =====================================
// 初期化
// =====================================

createTimeline(logContent, "log");

createTimeline(planContent, "plan");

createTimeline(newsContent, "news");

// =====================================
// 最初は3画面すべて現在年月へ
// =====================================

window.addEventListener("load", () => {
  const year = now.getFullYear();

  const month = now.getMonth() + 1;

  scrollToMonth("log", year, month);

  scrollToMonth("plan", year, month);

  scrollToMonth("news", year, month);
});
