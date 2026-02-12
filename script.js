const timeline = document.getElementById("timeline");

// 表示開始の設定
let year = 2024;
let month = 1;

// 現在の年月を取得
const now = new Date();
const endYear = now.getFullYear();
const endMonth = now.getMonth() + 1;

/**
 * タイムラインを構築するメイン関数
 */
function buildTimeline() {
  let currentYearSection = null;
  let currentYearVal = null;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    // 新しい年セクションの作成
    if (year !== currentYearVal) {
      currentYearSection = document.createElement("div");
      currentYearSection.className = "year-section";

      const yearHeader = document.createElement("div");
      yearHeader.className = "year-header";
      yearHeader.innerText = `${year}年`;

      currentYearSection.appendChild(yearHeader);
      timeline.appendChild(currentYearSection);
      currentYearVal = year;
    }

    const monthId = `${year}-${month}`;
    const savedText = localStorage.getItem(monthId) || "";

    const row = document.createElement("div");
    row.className = "month-row";
    if (savedText.trim() !== "") {
      row.classList.add("has-content");
    }

    row.innerHTML = `
            <div class="month-label">${month}月</div>
            <div class="divider"></div>
            <div class="memo-area">
                <textarea id="${monthId}" placeholder="---" rows="1">${savedText}</textarea>
            </div>
        `;

    currentYearSection.appendChild(row);

    // イベントリスナーの登録（保存と色変え）
    const textarea = row.querySelector("textarea");
    textarea.addEventListener("input", () => {
      const value = textarea.value;
      localStorage.setItem(monthId, value);

      if (value.trim() !== "") {
        row.classList.add("has-content");
      } else {
        row.classList.remove("has-content");
      }
    });

    // 月を進める
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
}

// 実行
buildTimeline();

// ページ読み込み時に最新（一番下）へスクロール
window.onload = () => {
  window.scrollTo(0, document.body.scrollHeight);
};
