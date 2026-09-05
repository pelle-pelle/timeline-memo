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
// 現在見ている年月を取得
// -------------------------------------

function getVisibleDatePosition(view) {
  const section = document.getElementById(`${view}-view`);

  if (!section) {
    return null;
  }

  const rows = section.querySelectorAll(".month-row");

  if (rows.length === 0) {
    return null;
  }

  /*
    画面の中央より少し上あたりを
    「現在見ている年月」として判定します。
  */
  const referenceY = window.innerHeight * 0.4;

  let closestRow = null;
  let closestDistance = Infinity;

  rows.forEach((row) => {
    const rect = row.getBoundingClientRect();

    /*
      referenceY がその月の行の中にある場合は
      その月を優先
    */
    if (rect.top <= referenceY && rect.bottom >= referenceY) {
      closestRow = row;
      closestDistance = 0;
      return;
    }

    /*
      それ以外の場合は
      referenceY に一番近い月を探す
    */
    const rowCenter = rect.top + rect.height / 2;

    const distance = Math.abs(rowCenter - referenceY);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestRow = row;
    }
  });

  if (!closestRow) {
    return null;
  }

  const rect = closestRow.getBoundingClientRect();

  return {
    year: closestRow.dataset.year,
    month: closestRow.dataset.month,

    /*
      切り替え前にその月が
      画面のどの高さにあったかも保存
    */
    top: rect.top,
  };
}

// -------------------------------------
// 切り替え先を同じ年月に合わせる
// -------------------------------------

function alignViewToDate(view, position) {
  if (!position) {
    return;
  }

  const section = document.getElementById(`${view}-view`);

  if (!section) {
    return;
  }

  const targetRow = section.querySelector(
    `.month-row[data-year="${position.year}"][data-month="${position.month}"]`,
  );

  if (!targetRow) {
    return;
  }

  const rect = targetRow.getBoundingClientRect();

  /*
    切り替え前と同じ縦位置になるように
    スクロール量を補正
  */
  const difference = rect.top - position.top;

  window.scrollBy({
    top: difference,
    left: 0,
    behavior: "auto",
  });
}

// -------------------------------------
// 画面切り替え
// -------------------------------------

function switchView(view) {
  if (view !== "log" && view !== "plan" && view !== "news") {
    return;
  }

  // 同じタブなら何もしない
  if (view === currentView) {
    return;
  }

  /*
    切り替える前に
    現在見ている年月と位置を保存
  */
  const currentPosition = getVisibleDatePosition(currentView);

  const tabLog = document.getElementById("tab-log");

  const tabPlan = document.getElementById("tab-plan");

  const tabNews = document.getElementById("tab-news");

  // activeをすべて解除
  tabLog.classList.remove("active");
  tabPlan.classList.remove("active");
  tabNews.classList.remove("active");

  // -----------------------------------
  // 実績
  // -----------------------------------

  if (view === "log") {
    slider.className = "show-log";

    tabLog.classList.add("active");
  }

  // -----------------------------------
  // 予定
  // -----------------------------------

  if (view === "plan") {
    slider.className = "show-plan";

    tabPlan.classList.add("active");
  }

  // -----------------------------------
  // 社会
  // -----------------------------------

  if (view === "news") {
    slider.className = "show-news";

    tabNews.classList.add("active");
  }

  currentView = view;

  /*
    ブラウザが画面切り替えを認識してから
    同じ年月へ位置を合わせる
  */
  requestAnimationFrame(() => {
    alignViewToDate(view, currentPosition);
  });
}

// -------------------------------------
// スワイプ判定
// -------------------------------------

function handleGesture() {
  const swipeThreshold = 50;

  const diffX = touchEndX - touchStartX;

  const diffY = touchEndY - touchStartY;

  // 縦スクロールの場合は何もしない
  if (Math.abs(diffX) <= Math.abs(diffY)) {
    return;
  }

  // -----------------------------------
  // 左スワイプ
  // -----------------------------------

  if (diffX < -swipeThreshold) {
    if (currentView === "log") {
      switchView("plan");
    } else if (currentView === "plan") {
      switchView("news");
    }
  }

  // -----------------------------------
  // 右スワイプ
  // -----------------------------------

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
    // ---------------------------------
    // 年見出し
    // ---------------------------------

    if (year !== currentYearVal) {
      const yearHeader = document.createElement("div");

      yearHeader.className = "year-header";

      yearHeader.innerText = `${year}年`;

      container.appendChild(yearHeader);

      currentYearVal = year;
    }

    // ---------------------------------
    // 保存ID
    // ---------------------------------

    const id = `${type}-${year}-${month}`;

    const savedText = localStorage.getItem(id) || "";

    // ---------------------------------
    // 月の行
    // ---------------------------------

    const row = document.createElement("div");

    row.className = "month-row";

    /*
      ★年月同期のために追加
    */
    row.dataset.year = year;

    row.dataset.month = month;

    if (savedText.trim() !== "") {
      row.classList.add("has-content");
    }

    // ---------------------------------
    // 月表示
    // ---------------------------------

    const monthLabel = document.createElement("div");

    monthLabel.className = "month-label";

    monthLabel.innerText = `${month}月`;

    // ---------------------------------
    // タイムライン線
    // ---------------------------------

    const divider = document.createElement("div");

    divider.className = "divider";

    // ---------------------------------
    // メモエリア
    // ---------------------------------

    const memoArea = document.createElement("div");

    memoArea.className = "memo-area";

    // ---------------------------------
    // テキストエリア
    // ---------------------------------

    const textarea = document.createElement("textarea");

    textarea.id = id;

    textarea.placeholder = "---";

    textarea.value = savedText;

    // ---------------------------------
    // 自動保存
    // ---------------------------------

    textarea.addEventListener("input", () => {
      localStorage.setItem(id, textarea.value);

      row.classList.toggle("has-content", textarea.value.trim() !== "");
    });

    memoArea.appendChild(textarea);

    row.appendChild(monthLabel);

    row.appendChild(divider);

    row.appendChild(memoArea);

    container.appendChild(row);

    // ---------------------------------
    // 次の月
    // ---------------------------------

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

      // ---------------------------------
      // 現在のデータを削除
      // ---------------------------------

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

      // ---------------------------------
      // バックアップを復元
      // ---------------------------------

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
// 最初に現在年月を表示
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
