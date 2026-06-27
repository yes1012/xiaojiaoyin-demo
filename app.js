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
  routeState: RouteModel.createInitialState(),
  dragPointId: null,
  pointSheetTrigger: null,
  suppressPointClick: false,
};

const routeIconLabels = {
  相机: "拍",
  步行: "走",
  人文: "访",
  日落: "落",
  晚餐: "食",
};

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

function getVisibleRoute() {
  return state.routeState.preview?.route || state.routeState.route;
}

function renderTimeline(items = getVisibleRoute()) {
  const list = qs("#timelineList");
  if (!list) return;

  const isPreview = Boolean(state.routeState.preview);
  const entries = items.map((item) => {
    const article = document.createElement("article");
    article.classList.toggle("preview-route-item", isPreview);

    const icon = document.createElement("div");
    icon.className = "timeline-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = routeIconLabels[item.icon] || "点";

    const content = document.createElement("div");
    const time = document.createElement("span");
    const title = document.createElement("h3");
    const body = document.createElement("p");
    time.textContent = `Day 1 · ${item.time}`;
    title.textContent = item.title;
    body.textContent = item.body;
    content.append(time, title, body);
    article.append(icon, content);
    return article;
  });

  list.replaceChildren(...entries);
}

function renderRouteMap(route = getVisibleRoute()) {
  const polyline = qs("#routePolyline");
  const points = qs("#routePoints");
  if (!polyline || !points) return;

  polyline.setAttribute(
    "points",
    route.map((point) => `${point.x},${point.y}`).join(" "),
  );

  const markers = route.map((point, index) => {
    const locked = state.routeState.lockedPointIds.includes(point.id);
    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = "route-marker";
    marker.classList.toggle("locked", locked);
    marker.dataset.pointId = point.id;
    marker.style.setProperty("--point-x", `${point.x}%`);
    marker.style.setProperty("--point-y", `${point.y}%`);
    marker.setAttribute(
      "aria-label",
      `第 ${index + 1} 站，${point.title}，${point.time}${locked ? "，已锁定" : ""}`,
    );

    const number = document.createElement("span");
    number.className = "marker-number";
    number.textContent = String(index + 1);

    const label = document.createElement("span");
    label.className = "marker-label";
    label.textContent = point.title;
    marker.append(number, label);

    if (locked) {
      const lock = document.createElement("span");
      lock.className = "marker-lock";
      lock.setAttribute("aria-hidden", "true");
      lock.textContent = "锁";
      marker.append(lock);
    }
    return marker;
  });

  points.replaceChildren(...markers);
}

function renderRoutePreview() {
  const previewPanel = qs("#routePreview");
  if (!previewPanel) return;

  const preview = state.routeState.preview;
  previewPanel.classList.toggle("hidden", !preview);
  if (!preview) return;

  qs("#previewReason").textContent = preview.reason;
  qs("#previewSummary").textContent = preview.summary;
  qs("#previewTradeoff").textContent = `取舍：${preview.tradeoff}`;
  const changes = preview.changes.map((change) => {
    const item = document.createElement("li");
    item.className = change.type;
    item.textContent = change.label;
    return item;
  });
  qs("#previewChanges").replaceChildren(...changes);
}

function renderRouteWorkspace() {
  if (!qs("#routeWorkspace")) return;

  const route = getVisibleRoute();
  const statusCopy = {
    preview: "预览中 · 尚未应用",
    applied: "当前路线 · 已应用",
    unchanged: "当前路线 · 无需调整",
    locked: "当前路线 · 点位已锁定",
  };
  qs("#routeStatus").textContent = statusCopy[state.routeState.status] || "当前路线";
  qs("#routeMapHint").textContent = state.routeState.preview
    ? "地图和时间线正在展示预览，应用前不会改动当前路线"
    : "点按查看详情，按住一个点并拖到另一点可调整顺序";

  renderRouteMap(route);
  renderTimeline(route);
  renderRoutePreview();
  qs("#routeUndo").classList.toggle("hidden", !state.routeState.previousRoute);

  if (!qs("#pointSheet").classList.contains("hidden")) {
    renderPointSheet();
  }
}

function setRouteFeedback(message, tone = "") {
  const feedback = qs("#routeFeedback");
  feedback.textContent = message;
  feedback.className = `route-feedback${tone ? ` ${tone}` : ""}`;
}

function previewRouteIntent(text) {
  const nextRouteState = RouteModel.previewIntent(state.routeState, text);
  state.routeState = nextRouteState;

  if (nextRouteState.status === "invalid") {
    setRouteFeedback("先写下你希望路线怎么调整。", "error");
  } else if (nextRouteState.status === "unchanged") {
    setRouteFeedback(
      nextRouteState.message || "当前路线已经符合这项偏好，无需调整。",
    );
  } else if (nextRouteState.preview) {
    setRouteFeedback("已生成路线预览，确认后才会应用。", "success");
  }

  renderRouteWorkspace();
}

function discardRoutePreview() {
  state.routeState = {
    ...state.routeState,
    preview: null,
    status: state.routeState.previousRoute ? "applied" : "idle",
    message: null,
  };
  setRouteFeedback("已撤销预览，当前路线未改变。");
  renderRouteWorkspace();
}

function applyRoutePreview() {
  if (!state.routeState.preview) return;
  state.routeState = RouteModel.applyPreview(state.routeState);
  setRouteFeedback("路线已应用，可在下方撤销。", "success");
  renderRouteWorkspace();
}

function undoAppliedRoute() {
  const previousState = state.routeState;
  state.routeState = RouteModel.undo(previousState);
  if (state.routeState === previousState) return;
  setRouteFeedback("已恢复上一版路线。");
  renderRouteWorkspace();
}

function renderPointSheet() {
  const pointId = state.routeState.selectedPointId;
  const route = getVisibleRoute();
  const pointIndex = route.findIndex((point) => point.id === pointId);
  if (pointIndex < 0) return;

  const point = route[pointIndex];
  const insight = RouteModel.getCommunityInsight(pointId);
  const locked = state.routeState.lockedPointIds.includes(pointId);
  qs("#pointOrder").textContent = `第 ${pointIndex + 1} 站`;
  qs("#pointSheetTitle").textContent = point.title;
  qs("#pointTime").textContent = `Day 1 · ${point.time}`;
  qs("#communityPercent").textContent = `${insight.percent}%`;
  qs("#communitySample").textContent = `${insight.sampleSize} 条记录`;
  qs("#pointRecommendation").textContent = insight.recommendation;
  qs("#communitySimilarity").textContent = insight.similarity;
  qs("#communitySetting").textContent =
    pointId === "gushan" ? "当天最后一站 · 17:00 后抵达" : "保留点位 · 减少 15 分钟停留";
  qs("#communityUncertainty").textContent = insight.uncertainty;

  const lockButton = qs('[data-point-action="lock"]');
  lockButton.textContent = locked ? "取消锁定" : "锁定点位";
  lockButton.setAttribute("aria-pressed", String(locked));
}

function openPointSheet(pointId, trigger) {
  if (!getVisibleRoute().some((point) => point.id === pointId)) return;
  state.routeState = { ...state.routeState, selectedPointId: pointId };
  state.pointSheetTrigger = trigger;
  qs("#sheetFeedback").textContent = "";
  qs("#sheetFeedback").className = "sheet-feedback";
  qs("#sourceMessage").classList.add("hidden");
  renderPointSheet();
  qs("#pointSheetBackdrop").classList.remove("hidden");
  qs("#pointSheet").classList.remove("hidden");
  qs("#pointSheet").focus();
}

function closePointSheet() {
  const pointId = state.routeState.selectedPointId;
  qs("#pointSheetBackdrop").classList.add("hidden");
  qs("#pointSheet").classList.add("hidden");
  state.routeState = { ...state.routeState, selectedPointId: null };

  const fallbackTrigger = pointId
    ? qs(`.route-marker[data-point-id="${pointId}"]`)
    : null;
  const trigger = state.pointSheetTrigger?.isConnected
    ? state.pointSheetTrigger
    : fallbackTrigger;
  state.pointSheetTrigger = null;
  trigger?.focus();
}

function showSheetFeedback(message, tone = "") {
  const feedback = qs("#sheetFeedback");
  feedback.textContent = message;
  feedback.className = `sheet-feedback${tone ? ` ${tone}` : ""}`;
}

function previewPointAction(action) {
  const pointId = state.routeState.selectedPointId;
  if (!pointId) return;

  const currentState = state.routeState;
  let nextState = currentState;
  if (action === "replace") {
    nextState = RouteModel.previewReplacePoint(currentState, pointId);
  } else if (action === "remove") {
    nextState = RouteModel.previewRemovePoint(currentState, pointId);
  } else if (action === "adopt") {
    nextState = RouteModel.previewCommunityChoice(currentState, pointId);
  }

  state.routeState = nextState;
  if (nextState.status === "locked") {
    renderRouteWorkspace();
    showSheetFeedback("这个点位已锁定，先取消锁定再调整。", "error");
    return;
  }
  if (nextState === currentState || !nextState.preview) {
    showSheetFeedback(
      action === "adopt"
        ? "这个点暂无可采用的社区路线调整。"
        : "当前路线无需执行这项调整。",
    );
    return;
  }

  closePointSheet();
  setRouteFeedback("已生成路线预览，确认后才会应用。", "success");
  renderRouteWorkspace();
}

function toggleSelectedPointLock() {
  const pointId = state.routeState.selectedPointId;
  if (!pointId) return;
  const wasLocked = state.routeState.lockedPointIds.includes(pointId);
  state.routeState = RouteModel.togglePointLock(state.routeState, pointId);
  renderRouteWorkspace();
  showSheetFeedback(wasLocked ? "已取消锁定。" : "已锁定，后续调整会保留这个点位。");
}

function previewMarkerReorder(sourceId, targetId) {
  const currentState = state.routeState;
  const nextState = RouteModel.previewReorder(currentState, sourceId, targetId);
  if (nextState === currentState) return;
  state.routeState = nextState;
  setRouteFeedback("已预览新的点位顺序，应用前当前路线不会改变。", "success");
  renderRouteWorkspace();
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
  closePointSheet();
  loader.classList.remove("hidden");
  qs("#routeWorkspace").classList.add("hidden");
  qs("#generatePlan").disabled = true;

  window.setTimeout(() => {
    state.routeState = RouteModel.createInitialState();
    setRouteFeedback("");
    renderRouteWorkspace();
    loader.classList.add("hidden");
    qs("#routeWorkspace").classList.remove("hidden");
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
  qs("#pitfallCard p").textContent = `今天的小坑：${source} 小脚印已经记住，下次优先帮你避开高排队风险点。`;
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

function handlePointSheetKeydown(event) {
  const sheet = qs("#pointSheet");
  if (sheet.classList.contains("hidden")) return;

  if (event.key === "Escape") {
    event.preventDefault();
    closePointSheet();
    return;
  }
  if (event.key !== "Tab") return;

  const focusable = qsa(
    "#pointSheet button:not([disabled]), #pointSheet textarea:not([disabled]), #pointSheet [tabindex]:not([tabindex='-1'])",
  );
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function clearMarkerDrag() {
  state.dragPointId = null;
  qsa("#routePoints .route-marker.is-dragging").forEach((marker) => {
    marker.classList.remove("is-dragging");
  });
}

function handleMarkerPointerDown(event) {
  const marker = event.target.closest(".route-marker");
  if (!marker || (event.button !== undefined && event.button !== 0)) return;
  state.dragPointId = marker.dataset.pointId;
  marker.classList.add("is-dragging");
}

function handleMarkerPointerUp(event) {
  if (!state.dragPointId) return;
  const sourceId = state.dragPointId;
  const targetAtPointer = document.elementFromPoint(event.clientX, event.clientY);
  const targetMarker = targetAtPointer?.closest(".route-marker");
  const targetId = targetMarker?.dataset.pointId;
  clearMarkerDrag();

  if (!targetId || sourceId === targetId) return;
  state.suppressPointClick = true;
  previewMarkerReorder(sourceId, targetId);
  window.setTimeout(() => {
    state.suppressPointClick = false;
  }, 0);
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
  qs("#adjustRoute").addEventListener("click", () => {
    previewRouteIntent(qs("#routeIntent").value);
  });
  qs(".intent-chips").addEventListener("click", (event) => {
    const chip = event.target.closest("[data-intent]");
    if (!chip) return;
    qs("#routeIntent").value = chip.dataset.intent;
    previewRouteIntent(chip.dataset.intent);
  });
  qs("#discardPreview").addEventListener("click", discardRoutePreview);
  qs("#refinePreview").addEventListener("click", () => {
    setRouteFeedback("继续补充你的偏好，现有预览会保留到下一次调整。");
    qs("#routeIntent").focus();
  });
  qs("#applyRoute").addEventListener("click", applyRoutePreview);
  qs("#undoRoute").addEventListener("click", undoAppliedRoute);

  const routePoints = qs("#routePoints");
  routePoints.addEventListener("click", (event) => {
    const marker = event.target.closest(".route-marker");
    if (!marker || state.suppressPointClick) return;
    openPointSheet(marker.dataset.pointId, marker);
  });
  routePoints.addEventListener("pointerdown", handleMarkerPointerDown);
  routePoints.addEventListener("pointerup", handleMarkerPointerUp);
  routePoints.addEventListener("pointercancel", clearMarkerDrag);

  qs("#closePointSheet").addEventListener("click", closePointSheet);
  qs("#pointSheetBackdrop").addEventListener("click", closePointSheet);
  qs("#showSources").addEventListener("click", () => {
    qs("#sourceMessage").classList.remove("hidden");
  });
  qs("#pointSheetActions").addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-point-action]");
    if (!actionButton) return;
    if (actionButton.dataset.pointAction === "lock") {
      toggleSelectedPointLock();
      return;
    }
    previewPointAction(actionButton.dataset.pointAction);
  });
  document.addEventListener("keydown", handlePointSheetKeydown);
  document.addEventListener("pointerup", (event) => {
    if (state.dragPointId && !event.target.closest("#routePoints")) {
      clearMarkerDrag();
    }
  });

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

renderRouteWorkspace();
renderNearby("500");
updateMemory();
bindEvents();
