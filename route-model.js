(function initRouteModel(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.RouteModel = api;
  }
})(
  typeof globalThis !== "undefined" ? globalThis : this,
  function routeModelFactory() {
    const baseRoute = [
      {
        id: "beishan",
        time: "15:20",
        title: "北山街湖边转角",
        body: "从树影里慢慢走向西湖，先留一点拍照时间。",
        icon: "相机",
        x: 18,
        y: 31,
      },
      {
        id: "quyuan",
        time: "16:10",
        title: "曲院风荷",
        body: "沿湖低强度散步，停留 45 分钟。",
        icon: "步行",
        x: 48,
        y: 43,
      },
      {
        id: "lingyin",
        time: "17:10",
        title: "灵隐寺外街",
        body: "傍晚前抵达，但需要额外往返 45 分钟。",
        icon: "人文",
        x: 80,
        y: 28,
      },
    ];

    const dinnerPoint = {
      id: "dinner",
      time: "18:35",
      title: "湖滨杭帮菜晚餐",
      body: "步行 8 分钟，演示数据预计低排队。",
      icon: "晚餐",
      x: 63,
      y: 72,
    };

    const gushanPoint = {
      id: "gushan",
      time: "17:20",
      title: "孤山日落",
      body: "把当天最后一段留给湖边日落，停留 55 分钟。",
      icon: "日落",
      x: 78,
      y: 48,
    };

    const relaxedRoute = [
      baseRoute[0],
      { ...baseRoute[1], time: "16:20" },
      gushanPoint,
      dinnerPoint,
    ];

    const clone = (value) => JSON.parse(JSON.stringify(value));
    const visibleRoute = (state) => state.preview?.route || state.route;

    function valuesEqual(left, right) {
      if (left === right) {
        return true;
      }
      if (
        !left ||
        !right ||
        typeof left !== "object" ||
        typeof right !== "object"
      ) {
        return false;
      }

      const leftKeys = Object.keys(left);
      const rightKeys = Object.keys(right);
      return (
        leftKeys.length === rightKeys.length &&
        leftKeys.every(
          (key) =>
            Object.prototype.hasOwnProperty.call(right, key) &&
            valuesEqual(left[key], right[key]),
        )
      );
    }

    function describeRouteChanges(currentRoute, candidateRoute) {
      const currentById = new Map(
        currentRoute.map((point) => [point.id, point]),
      );
      const candidateById = new Map(
        candidateRoute.map((point) => [point.id, point]),
      );
      const currentCommonOrder = currentRoute
        .map((point) => point.id)
        .filter((id) => candidateById.has(id));
      const candidateCommonOrder = candidateRoute
        .map((point) => point.id)
        .filter((id) => currentById.has(id));
      const reorderedIds = new Set(
        currentCommonOrder.filter(
          (id, index) => candidateCommonOrder[index] !== id,
        ),
      );

      return [
        ...currentRoute
          .filter((point) => !candidateById.has(point.id))
          .map((point) => ({
            type: "remove",
            label: `移出${point.title}`,
          })),
        ...candidateRoute
          .filter((point) => !currentById.has(point.id))
          .map((point) => ({
            type: "add",
            label: `加入${point.title}`,
          })),
        ...candidateRoute
          .filter((point) => {
            const currentPoint = currentById.get(point.id);
            return (
              currentPoint &&
              (!valuesEqual(currentPoint, point) || reorderedIds.has(point.id))
            );
          })
          .map((point) => ({
            type: "replace",
            label: `调整${point.title}`,
          })),
      ];
    }

    function reconcileLockedPoints(state, candidateRoute) {
      const route = clone(candidateRoute);
      const previewRoute = state.preview?.route || [];
      const lockedPoints = state.lockedPointIds
        .map((id) => {
          const committedIndex = state.route.findIndex(
            (point) => point.id === id,
          );
          const previewIndex = previewRoute.findIndex(
            (point) => point.id === id,
          );
          const sourceRoute = committedIndex >= 0 ? state.route : previewRoute;

          return {
            id,
            index: committedIndex >= 0 ? committedIndex : previewIndex,
            point: sourceRoute.find((item) => item.id === id),
          };
        })
        .filter(({ index, point }) => index >= 0 && point)
        .sort((left, right) => left.index - right.index);

      lockedPoints.forEach(({ id, index, point }) => {
        const currentPoint = clone(point);
        const candidateIndex = route.findIndex((point) => point.id === id);

        if (candidateIndex >= 0) {
          route[candidateIndex] = currentPoint;
          return;
        }

        route.splice(Math.min(index, route.length), 0, currentPoint);
      });

      return route;
    }

    function transition(state, updates) {
      return {
        ...state,
        route: clone(state.route),
        previousRoute: state.previousRoute ? clone(state.previousRoute) : null,
        preview: state.preview ? clone(state.preview) : null,
        lockedPointIds: [...state.lockedPointIds],
        ...updates,
      };
    }

    function createInitialState() {
      return {
        route: clone(baseRoute),
        previousRoute: null,
        preview: null,
        status: "idle",
        selectedPointId: null,
        lockedPointIds: [],
      };
    }

    function previewIntent(state, text) {
      const source = String(text || "").trim();
      if (!source) {
        return transition(state, { status: "invalid" });
      }

      const wantsRelaxed = /松弛|不想太赶|少走|日落|排队/.test(source);
      const currentRoute = visibleRoute(state);
      const route = reconcileLockedPoints(
        state,
        wantsRelaxed ? relaxedRoute : baseRoute,
      );
      if (valuesEqual(currentRoute, route)) {
        if (state.preview) {
          return state;
        }

        return transition(state, {
          status: "unchanged",
          route: clone(route),
          preview: null,
          message: "当前路线已经符合这项偏好，无需调整。",
        });
      }

      const preservesLockedLingyin =
        wantsRelaxed &&
        state.lockedPointIds.includes("lingyin") &&
        currentRoute.some((point) => point.id === "lingyin");
      const intentChanges = describeRouteChanges(currentRoute, route);
      const onlyUpdatesExistingPoints = intentChanges.every(
        (change) => change.type === "replace",
      );
      const changesRoutePoints = intentChanges.some(
        (change) => change.type === "add" || change.type === "remove",
      );

      return transition(state, {
        status: "preview",
        message: null,
        preview: {
          applied: false,
          reason: `我理解你想要：${source}`,
          summary: wantsRelaxed
            ? onlyUpdatesExistingPoints
              ? "更新路线点位信息，使它符合当前偏好。"
              : preservesLockedLingyin
              ? "加入孤山日落和低排队晚餐，并保留锁定的灵隐寺外街。"
              : "移开下午拥堵点，加入孤山日落，并换成低排队晚餐。"
            : changesRoutePoints
            ? "已根据新意图重组路线，请查看加入、移出和调整的点位。"
            : "保留经典路线，只放慢点位之间的节奏。",
          tradeoff: wantsRelaxed
            ? onlyUpdatesExistingPoints
              ? "仅更新点位安排，不增加或移除路线点位。"
              : preservesLockedLingyin
              ? "锁定站点保持不变，整体路程会比完全松弛的方案更长。"
              : "预计少走 1.2 km，但今天会少看一个经典景点。"
            : changesRoutePoints
            ? "路线点位将发生增减，应用前请确认这些取舍。"
            : "路线变化较小，热门点位仍可能拥挤。",
          changes: intentChanges,
          route,
        },
      });
    }

    function previewReorder(state, sourceId, targetId) {
      const route = clone(visibleRoute(state));
      const sourceIndex = route.findIndex((point) => point.id === sourceId);
      const targetIndex = route.findIndex((point) => point.id === targetId);

      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
        return state;
      }

      const [moved] = route.splice(sourceIndex, 1);
      route.splice(targetIndex, 0, moved);

      return transition(state, {
        status: "preview",
        preview: {
          applied: false,
          reason: "你直接调整了地图顺序",
          summary: `${moved.title} 已移动到第 ${targetIndex + 1} 站。`,
          tradeoff: "顺序已重排，预计增加 8 分钟步行；应用前仍可撤销。",
          changes: [{ type: "replace", label: `移动 ${moved.title}` }],
          route,
        },
      });
    }

    function previewCommunityChoice(state, pointId) {
      if (pointId !== "gushan") {
        return state;
      }
      return previewIntent(state, "采用相似旅行者的孤山日落安排");
    }

    function togglePointLock(state, pointId) {
      const activeRoute = visibleRoute(state);
      if (!activeRoute.some((point) => point.id === pointId)) {
        return state;
      }

      const locked = state.lockedPointIds.includes(pointId);
      const lockedPointIds = locked
        ? state.lockedPointIds.filter((id) => id !== pointId)
        : [...state.lockedPointIds, pointId];

      return transition(state, { lockedPointIds });
    }

    function previewRemovePoint(state, pointId) {
      if (state.lockedPointIds.includes(pointId)) {
        return transition(state, { status: "locked" });
      }

      const route = visibleRoute(state);
      const point = route.find((item) => item.id === pointId);
      if (!point || route.length <= 2) {
        return state;
      }

      return transition(state, {
        status: "preview",
        preview: {
          applied: false,
          reason: "你选择移除一个地图点位",
          summary: `${point.title} 将从当天路线移出。`,
          tradeoff: "预计节省 35 分钟，但会减少一个体验点。",
          changes: [{ type: "remove", label: `移出${point.title}` }],
          route: clone(route.filter((item) => item.id !== pointId)),
        },
      });
    }

    function previewReplacePoint(state, pointId) {
      if (pointId === "gushan") {
        return state;
      }

      if (state.lockedPointIds.includes(pointId)) {
        return transition(state, { status: "locked" });
      }

      const activeRoute = visibleRoute(state);
      const pointIndex = activeRoute.findIndex((item) => item.id === pointId);
      if (pointIndex < 0 || activeRoute.some((item) => item.id === "gushan")) {
        return state;
      }

      const point = activeRoute[pointIndex];
      const replacement = clone(gushanPoint);
      const route = clone(activeRoute);
      route[pointIndex] = replacement;

      return transition(state, {
        status: "preview",
        preview: {
          applied: false,
          reason: "你想换一个更符合当前偏好的点位",
          summary: `${point.title} 将替换为孤山日落。`,
          tradeoff: "拍照和松弛感更强，但会少看一个经典景点。",
          changes: [
            { type: "replace", label: `将${point.title}换成孤山日落` },
          ],
          route,
        },
      });
    }

    function applyPreview(state) {
      if (!state.preview) {
        return state;
      }

      return transition(state, {
        previousRoute: clone(state.route),
        route: reconcileLockedPoints(state, state.preview.route),
        preview: null,
        status: "applied",
      });
    }

    function undo(state) {
      if (!state.previousRoute) {
        return state;
      }

      return transition(state, {
        route: clone(state.previousRoute),
        previousRoute: null,
        preview: null,
        status: "idle",
      });
    }

    function getCommunityInsight(pointId) {
      if (pointId === "gushan") {
        return {
          percent: 68,
          sampleSize: 126,
          similarity: "solo trip、松弛节奏、摄影偏好与你相似",
          recommendation: "多数人会把孤山放在当天最后一站，并在 17:00 后抵达。",
          uncertainty: "雨天样本较少，日落建议可能失效。",
        };
      }

      return {
        percent: 54,
        sampleSize: 82,
        similarity: "solo trip、松弛节奏与你相似",
        recommendation: "多数人会保留这个点位，但减少 15 分钟停留。",
        uncertainty: "节假日样本波动较大，请结合现场情况判断。",
      };
    }

    return {
      createInitialState,
      previewIntent,
      previewReorder,
      previewCommunityChoice,
      togglePointLock,
      previewRemovePoint,
      previewReplacePoint,
      applyPreview,
      undo,
      getCommunityInsight,
    };
  },
);
