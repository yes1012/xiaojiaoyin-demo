const state = {
  view: "companion",
  companion: "松弛感城市漫游搭子",
  badges: 0,
  eggs: 0,
  bgm: 0,
  pitfall: 1,
  checkedIn: false,
  friends: 2,
  groupCreated: true,
};

const itinerary = [
  {
    time: "Day 1 · 15:40",
    title: "西湖黄昏漫步",
    body: "从曲院风荷慢慢走到北山街，预留拍照和坐下发呆的时间。",
    icon: "🌅",
  },
  {
    time: "Day 1 · 18:30",
    title: "湖滨轻食晚餐",
    body: "避开长队网红店，优先选步行 12 分钟内、评分稳定的小馆。",
    icon: "🍜",
  },
  {
    time: "Day 2 · 10:20",
    title: "桥西历史街区",
    body: "安排低强度城市漫游，顺手解锁一枚小众街区主题徽章。",
    icon: "🚶",
  },
];

const nearbyData = {
  500: [
    {
      type: "拍照点",
      title: "北山街湖边转角",
      body: "黄昏光线柔和，人流比断桥少，适合拍半身和湖面留白。",
      tag: "步行 6 分钟",
      scene: "beishan",
    },
    {
      type: "休息点",
      title: "临湖长椅",
      body: "适合坐 15 分钟恢复脚力，小脚印建议先别急着赶下一站。",
      tag: "低强度",
      scene: "bench",
    },
    {
      type: "餐厅",
      title: "湖边小馆",
      body: "不追网红队伍，优先热菜、步行近、预算稳定。",
      tag: "约 68 元",
      scene: "restaurant",
    },
  ],
  1000: [
    {
      type: "宝藏点",
      title: "白堤背面小路",
      body: "游客密度更低，适合慢慢走完一段自己的西湖路线。",
      tag: "步行 14 分钟",
      scene: "path",
    },
    {
      type: "热门点",
      title: "断桥远眺位",
      body: "经典但容易拥挤，建议只远眺，不把它当作核心拍照点。",
      tag: "避开高峰",
      scene: "bridge",
    },
    {
      type: "咖啡",
      title: "街角蓝窗咖啡",
      body: "适合写彩蛋或整理照片，靠窗位更有旅行册氛围。",
      tag: "可休息",
      scene: "cafe",
    },
  ],
};

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return [...document.querySelectorAll(selector)];
}

function setView(viewName) {
  state.view = viewName;
  qsa(".view-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === viewName);
  });
  qsa(".tab-button, .nav-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });
}

function renderNearby(radius = "500") {
  const grid = qs("#nearbyGrid");
  grid.innerHTML = nearbyData[radius]
    .map(
      (item) => `
        <article class="nearby-card">
          <div class="place-visual ${item.scene}" role="img" aria-label="${item.title}场景图">
            <span class="sky"></span>
            <span class="sun"></span>
            <span class="water"></span>
            <span class="shore"></span>
            <span class="willow"></span>
            <span class="bench-shape"></span>
            <span class="house"></span>
            <span class="bridge-shape"></span>
            <span class="window"></span>
          </div>
          <div class="nearby-body">
            <span>${item.type}</span>
            <h3>${item.title}</h3>
            <p>${item.body}</p>
            <strong>${item.tag}</strong>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderTimeline(items = itinerary) {
  qs("#timelineList").innerHTML = items
    .map(
      (item) => `
        <article>
          <div class="timeline-icon" aria-hidden="true">${item.icon}</div>
          <div>
            <span>${item.time}</span>
            <h3>${item.title}</h3>
            <p>${item.body}</p>
          </div>
        </article>
      `,
    )
    .join("");
}

function updateMemory() {
  qs("#badgeCount").textContent = state.badges;
  qs("#eggCount").textContent = state.eggs;
  qs("#bgmCount").textContent = state.bgm;
  qs("#memoryText").textContent = `已收集 ${state.badges} 枚徽章、${state.eggs} 条彩蛋、${state.pitfall} 条小水坑、${state.bgm} 首足迹 BGM。下次我会少安排高峰景点，多留一点随机探索时间。`;
}

function generateCompanion() {
  const activePersonality = qs('[data-group="personality"] .choice-chip.active').textContent;
  const pace = Number(qs("#paceRange").value);
  const preference = qs("#preferenceInput").value.trim();
  const titleMap = {
    温柔: "安静陪你看风景的路线规划师",
    幽默: "嘴甜但靠谱的美食侦探",
    理性: "不绕路的城市策略搭子",
    活泼: "能量刚刚好的打卡搭子",
  };
  const paceText = pace <= 2 ? "低强度路线" : pace === 3 ? "均衡路线" : "充实路线";
  const title = titleMap[activePersonality] || "松弛感城市漫游搭子";

  state.companion = title;
  qs("#companionTitle").textContent = title;
  qs("#companionName")?.replaceChildren(document.createTextNode(title));
  qs("#paceLabel").textContent = paceText;
  qs("#companionDesc").textContent = preference
    ? `我记住了：${preference} 我会按这个偏好安排路线和现场提醒。`
    : "我会根据你的节奏、预算和兴趣安排一段更轻松的旅程。";
}

function generatePlan() {
  const loader = qs("#planLoading");
  loader.classList.remove("hidden");
  qs("#generatePlan").disabled = true;

  window.setTimeout(() => {
    renderTimeline(itinerary);
    loader.classList.add("hidden");
    qs("#generatePlan").disabled = false;
    qs("#modePill").textContent = "模拟 AI";
  }, 650);
}

function checkIn() {
  if (!state.checkedIn) {
    state.checkedIn = true;
    state.badges += 1;
    state.bgm += 1;
  }
  qs("#musicCard").classList.remove("hidden");
  qs("#checkIn").textContent = "已打卡";
  qs("#checkIn").disabled = true;
  updateMemory();
}

function saveEgg() {
  state.eggs += 1;
  updateMemory();
  qs("#saveEgg").textContent = "已留下";
  window.setTimeout(() => {
    qs("#saveEgg").textContent = "留彩蛋";
  }, 900);
}

function savePitfall() {
  const text = qs("#pitfallInput").value.trim();
  const fallback = "网红机位排队太久，照片里游客比湖还多。";
  const source = text || fallback;
  state.pitfall += 1;
  qs("#pitfallCard").innerHTML = `
    <span class="mini-badge">小水坑</span>
    <h3>排队耐心修炼者</h3>
    <p>今天的小坑：${source} 小脚印已经记住，下次优先帮你避开高排队风险点。</p>
  `;
  updateMemory();
}

function addFriend() {
  state.friends += 1;
  const card = qs("#chatCard");
  card.innerHTML = `
    <span class="mini-badge">团内动态</span>
    <div class="chat-line">
      <strong>小脚印</strong>
      <p>已添加 1 位新好友。现在杭州松弛漫游团有 ${state.friends + 1} 位旅行者。</p>
    </div>
  `;
}

function createGroup() {
  state.groupCreated = true;
  const card = qs("#chatCard");
  card.innerHTML = `
    <span class="mini-badge">团内动态</span>
    <div class="chat-line">
      <strong>小脚印</strong>
      <p>旅游团已创建。你们可以共享行程、位置附近推荐、徽章、BGM 和小水坑。</p>
    </div>
  `;
}

function shareToGroup(type) {
  const copy = {
    行程: "已把“西湖黄昏漫步”分享到杭州松弛漫游团，同行的人可以一键加入路线。",
    徽章: "已分享“西湖日落观察员”足迹徽章，团员可以看到你的打卡故事。",
    BGM: "已分享“晚风慢慢听”到团内，今晚的路线有自己的背景音乐了。",
    小水坑: "已分享一个小水坑：网红机位排队偏久。小脚印会提醒大家错峰。",
  };
  const card = qs("#chatCard");
  card.innerHTML = `
    <span class="mini-badge">团内动态</span>
    <div class="chat-line">
      <strong>你分享了${type}</strong>
      <p>${copy[type]}</p>
    </div>
  `;
}

function bindEvents() {
  qsa(".tab-button, .nav-button").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  qsa(".choice-grid").forEach((group) => {
    group.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      if (group.dataset.group === "interest") {
        button.classList.toggle("active");
      } else {
        group.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
      }
    });
  });

  qs("#createCompanion").addEventListener("click", generateCompanion);
  qs("#generatePlan").addEventListener("click", generatePlan);
  qs("#radiusSelect").addEventListener("change", (event) => renderNearby(event.target.value));
  qs("#checkIn").addEventListener("click", checkIn);
  qs("#saveEgg").addEventListener("click", saveEgg);
  qs("#savePitfall").addEventListener("click", savePitfall);
  qs("#addFriend").addEventListener("click", addFriend);
  qs("#createGroup").addEventListener("click", createGroup);
  qsa(".share-chip").forEach((button) => {
    button.addEventListener("click", () => shareToGroup(button.dataset.share));
  });
}

renderTimeline();
renderNearby("500");
updateMemory();
bindEvents();
