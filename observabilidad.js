/**
 * ==========================================================================
 * OBSERVABILIDAD LOCAL: CRISTIANO RONALDO (CR7)
 * Módulo de telemetría y controlador del Dashboard de Observabilidad.
 * 100% Local: sin servidores, sin backend, sin cookies, sin dependencias.
 * Clave de almacenamiento: 'cr7-observability-store'
 * API pública expuesta: window.CR7Observability.getSnapshot()
 * ==========================================================================
 */

"use strict";

(function (root) {
  const STORAGE_KEY = "cr7-observability-store";
  const MAX_EVENTS = 100;
  const MAX_ERRORS = 50;

  /**
   * Helper seguro para lectura/escritura en localStorage
   */
  const storage = {
    get: function () {
      try {
        if (!("localStorage" in window)) return null;
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (err) {
        console.warn("[CR7Observability] No se pudo leer localStorage:", err);
        return null;
      }
    },
    set: function (data) {
      try {
        if (!("localStorage" in window)) return false;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
      } catch (err) {
        console.warn("[CR7Observability] No se pudo escribir en localStorage:", err);
        return false;
      }
    },
    remove: function () {
      try {
        if (!("localStorage" in window)) return;
        window.localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        console.warn("[CR7Observability] No se pudo limpiar localStorage:", err);
      }
    }
  };

  /**
   * Inicializa la estructura del modelo de datos de telemetría
   */
  function createInitialState() {
    return {
      version: "1.0.0",
      session: {
        id: "cr7_sess_" + Math.random().toString(36).substring(2, 9),
        startedAt: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer || "directo",
        userAgent: navigator.userAgent
      },
      environment: detectEnvironment(),
      performance: {
        navigation: null,
        paints: null,
        capturedAt: null
      },
      events: [],
      errors: [],
      visibilityChanges: []
    };
  }

  /**
   * Obtiene o crea el estado guardado
   */
  function getState() {
    let state = storage.get();
    if (!state || !state.version) {
      state = createInitialState();
      storage.set(state);
    }
    return state;
  }

  /**
   * Detección segura de viewport, conexión y soporte de APIs del navegador
   */
  function detectEnvironment() {
    const env = {
      viewport: {
        width: window.innerWidth || 0,
        height: window.innerHeight || 0,
        devicePixelRatio: window.devicePixelRatio || 1,
        orientation: (window.screen && window.screen.orientation)
          ? window.screen.orientation.type
          : "desconocido"
      },
      connection: null,
      apiSupport: {
        performance: "performance" in window,
        performanceObserver: "PerformanceObserver" in window,
        intersectionObserver: "IntersectionObserver" in window,
        dialog: "HTMLDialogElement" in window,
        localStorage: (function () {
          try {
            return "localStorage" in window && window.localStorage !== null;
          } catch (e) {
            return false;
          }
        })(),
        serviceWorker: "serviceWorker" in navigator
      }
    };

    // Detección de Network Information API si está disponible
    if ("connection" in navigator && navigator.connection) {
      const conn = navigator.connection;
      env.connection = {
        effectiveType: conn.effectiveType || "desconocido",
        downlink: conn.downlink !== undefined ? conn.downlink : null,
        rtt: conn.rtt !== undefined ? conn.rtt : null,
        saveData: !!conn.saveData
      };
    }

    return env;
  }

  /**
   * Registra métricas de rendimiento con Performance API
   */
  function capturePerformanceMetrics() {
    const perf = window.performance;
    if (!("performance" in window) || !perf) return;

    try {
      const state = getState();
      const perfData = {
        navigation: null,
        paints: { firstPaint: null, firstContentfulPaint: null },
        capturedAt: new Date().toISOString()
      };

      // 1. Navigation Timing Nivel 2 o fallback a PerformanceTiming
      if (typeof perf.getEntriesByType === "function") {
        const navEntries = perf.getEntriesByType("navigation");
        if (navEntries && navEntries.length > 0) {
          const nav = navEntries[0];
          perfData.navigation = {
            type: nav.type || "navigate",
            dnsTimeMs: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
            tcpTimeMs: Math.round(nav.connectEnd - nav.connectStart),
            ttfbMs: Math.round(nav.responseStart - nav.requestStart),
            responseDurationMs: Math.round(nav.responseEnd - nav.responseStart),
            domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
            loadEventMs: Math.round(nav.loadEventEnd - nav.startTime),
            transferSizeKB: nav.transferSize ? Math.round(nav.transferSize / 1024) : null
          };
        }
      }

      // Fallback a performance.timing legado
      if (!perfData.navigation && perf.timing) {
        const t = perf.timing;
        if (t.navigationStart) {
          perfData.navigation = {
            type: "legacy",
            dnsTimeMs: Math.max(0, t.domainLookupEnd - t.domainLookupStart),
            tcpTimeMs: Math.max(0, t.connectEnd - t.connectStart),
            ttfbMs: Math.max(0, t.responseStart - t.requestStart),
            responseDurationMs: Math.max(0, t.responseEnd - t.responseStart),
            domContentLoadedMs: Math.max(0, t.domContentLoadedEventEnd - t.navigationStart),
            loadEventMs: Math.max(0, t.loadEventEnd - t.navigationStart),
            transferSizeKB: null
          };
        }
      }

      // 2. Métricas de Paint (FP y FCP)
      if (typeof perf.getEntriesByType === "function") {
        const paints = perf.getEntriesByType("paint");
        if (paints && paints.length > 0) {
          paints.forEach((entry) => {
            if (entry.name === "first-paint") {
              perfData.paints.firstPaint = Math.round(entry.startTime);
            } else if (entry.name === "first-contentful-paint") {
              perfData.paints.firstContentfulPaint = Math.round(entry.startTime);
            }
          });
        }
      }

      state.performance = perfData;
      state.environment = detectEnvironment();
      storage.set(state);
    } catch (err) {
      console.warn("[CR7Observability] Error al capturar Performance:", err);
    }
  }

  /**
   * Registra un evento de interacción (clic)
   */
  function recordClickEvent(event) {
    if (!event || !event.target) return;

    try {
      const target = event.target.closest
        ? event.target.closest("button, a, summary, [role='button']") || event.target
        : event.target;

      const tagName = (target.tagName || "").toUpperCase();
      // Filtrar clics no significativos
      if (tagName === "HTML" || tagName === "BODY") return;

      const rawText = target.innerText || target.textContent || "";
      const text = rawText.trim().replace(/\s+/g, " ").substring(0, 50);

      const clickData = {
        type: "click",
        tag: tagName,
        id: target.id || null,
        classes: target.className ? String(target.className).trim().substring(0, 80) : null,
        text: text || null,
        href: target.getAttribute ? target.getAttribute("href") : null,
        timestamp: new Date().toISOString(),
        url: window.location.pathname + window.location.hash
      };

      const state = getState();
      state.events.unshift(clickData);
      if (state.events.length > MAX_EVENTS) {
        state.events = state.events.slice(0, MAX_EVENTS);
      }
      storage.set(state);
    } catch (err) {
      console.warn("[CR7Observability] Error al registrar clic:", err);
    }
  }

  /**
   * Registra un error en el almacén
   */
  function recordError(errorPayload) {
    try {
      const state = getState();
      state.errors.unshift({
        ...errorPayload,
        timestamp: new Date().toISOString(),
        url: window.location.pathname + window.location.hash
      });
      if (state.errors.length > MAX_ERRORS) {
        state.errors = state.errors.slice(0, MAX_ERRORS);
      }
      storage.set(state);
    } catch (err) {
      console.warn("[CR7Observability] Error al guardar error:", err);
    }
  }

  /**
   * Registra cambios de visibilidad de la pestaña
   */
  function recordVisibilityChange() {
    try {
      const state = getState();
      const change = {
        state: document.visibilityState || "desconocido",
        timestamp: new Date().toISOString()
      };
      state.visibilityChanges.unshift(change);
      if (state.visibilityChanges.length > 20) {
        state.visibilityChanges = state.visibilityChanges.slice(0, 20);
      }
      storage.set(state);
    } catch (err) {
      console.warn("[CR7Observability] Error al registrar visibilidad:", err);
    }
  }

  /**
   * Inicializa escuchadores globales de telemetría en la página actual
   */
  function initGlobalListeners() {
    // 1. Clics en enlaces, botones y controles
    document.addEventListener("click", recordClickEvent, true);

    // 2. Errores JavaScript globales
    window.addEventListener("error", (event) => {
      // Diferenciar entre error de script y error de carga de recurso
      if (event.target && event.target !== window && event.target.tagName) {
        const tag = event.target.tagName.toUpperCase();
        const src = event.target.src || event.target.href || "recurso desconocido";
        recordError({
          type: "resource_error",
          tag: tag,
          source: src,
          message: `Fallo de carga del recurso <${tag}>: ${src}`
        });
      } else {
        recordError({
          type: "js_error",
          message: event.message || "Error JavaScript no especificado",
          filename: event.filename || "desconocido",
          lineno: event.lineno || 0,
          colno: event.colno || 0,
          stack: event.error && event.error.stack ? event.error.stack.substring(0, 300) : null
        });
      }
    }, true);

    // 3. Promesas rechazadas no controladas
    window.addEventListener("unhandledrejection", (event) => {
      let reasonMsg = "Promesa rechazada no controlada";
      if (event.reason) {
        if (typeof event.reason === "string") {
          reasonMsg = event.reason;
        } else if (event.reason.message) {
          reasonMsg = event.reason.message;
        } else {
          try {
            reasonMsg = JSON.stringify(event.reason);
          } catch (e) {
            reasonMsg = String(event.reason);
          }
        }
      }
      recordError({
        type: "promise_rejection",
        message: reasonMsg
      });
    });

    // 4. Cambios de visibilidad de la pestaña
    document.addEventListener("visibilitychange", recordVisibilityChange);

    // 5. Capturar rendimiento una vez que la página haya cargado
    if (document.readyState === "complete") {
      setTimeout(capturePerformanceMetrics, 200);
    } else {
      window.addEventListener("load", () => {
        setTimeout(capturePerformanceMetrics, 200);
      });
    }

    // 6. Actualizar dimensiones de viewport al cambiar tamaño
    window.addEventListener("resize", () => {
      try {
        const state = getState();
        state.environment = detectEnvironment();
        storage.set(state);
      } catch (e) {}
    });
  }

  // Activar listeners
  initGlobalListeners();

  /**
   * ========================================================================
   * API PÚBLICA: window.CR7Observability
   * ========================================================================
   */
  root.CR7Observability = {
    /**
     * Retorna el snapshot inmutable actual con toda la telemetría recolectada
     */
    getSnapshot: function () {
      capturePerformanceMetrics();
      const state = getState();
      state.environment = detectEnvironment();
      return JSON.parse(JSON.stringify(state));
    },

    /**
     * Registra un evento de demostración para verificar el dashboard
     */
    recordDemoEvent: function () {
      const demoData = {
        type: "demo_event",
        tag: "BUTTON",
        id: "btn-demo-action",
        classes: "btn-demo",
        text: "Evento de Demostración CR7",
        timestamp: new Date().toISOString(),
        url: window.location.pathname,
        note: "Evento sintético generado para validación del dashboard"
      };
      const state = getState();
      state.events.unshift(demoData);

      // Añadir también un error de prueba pedagógico controlado
      state.errors.unshift({
        type: "demo_warning",
        message: "Aviso de prueba: Simulación exitosa de telemetría de error",
        timestamp: new Date().toISOString(),
        url: window.location.pathname
      });

      storage.set(state);
      return demoData;
    },

    /**
     * Limpia completamente el almacenamiento local de observabilidad
     */
    clear: function () {
      storage.remove();
      const freshState = createInitialState();
      storage.set(freshState);
      return freshState;
    },

    /**
     * Genera y descarga un archivo .json con el snapshot actual
     */
    exportJson: function () {
      const snapshot = this.getSnapshot();
      const jsonStr = JSON.stringify(snapshot, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const now = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cr7-observability-snapshot-${now}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return snapshot;
    }
  };

  /**
   * ========================================================================
   * CONTROLADOR DEL DASHBOARD (Si existe el contenedor en la página)
   * ========================================================================
   */
  function initDashboardUI() {
    const dashboardApp = document.getElementById("dashboard-app");
    if (!dashboardApp) return;

    // Botones de acción del dashboard
    const btnRefresh = document.getElementById("btn-refresh");
    const btnDemo = document.getElementById("btn-demo");
    const btnDownload = document.getElementById("btn-download");
    const btnClear = document.getElementById("btn-clear");
    const lastUpdatedLabel = document.getElementById("last-updated");

    // Elementos KPI
    const kpiEvents = document.getElementById("kpi-events");
    const kpiErrors = document.getElementById("kpi-errors");
    const kpiLoadTime = document.getElementById("kpi-load-time");
    const kpiVisibility = document.getElementById("kpi-visibility");

    // Tablas y contenedores
    const perfTableBody = document.getElementById("perf-table-body");
    const envTableBody = document.getElementById("env-table-body");
    const apiBadgesContainer = document.getElementById("api-badges-container");
    const errorsList = document.getElementById("errors-list");
    const eventsList = document.getElementById("events-list");
    const rawJsonViewer = document.getElementById("raw-json-viewer");

    /**
     * Renderiza todos los paneles del dashboard con los datos del snapshot
     */
    function renderDashboard() {
      const snapshot = root.CR7Observability.getSnapshot();

      // 1. KPIs
      if (kpiEvents) kpiEvents.textContent = String(snapshot.events.length);
      if (kpiErrors) {
        kpiErrors.textContent = String(snapshot.errors.length);
        kpiErrors.style.color = snapshot.errors.length > 0 ? "var(--color-brand-red)" : "var(--color-green)";
      }

      if (kpiLoadTime) {
        const nav = snapshot.performance.navigation;
        if (nav && nav.loadEventMs !== null && nav.loadEventMs > 0) {
          kpiLoadTime.textContent = `${nav.loadEventMs} ms`;
        } else if (nav && nav.domContentLoadedMs) {
          kpiLoadTime.textContent = `${nav.domContentLoadedMs} ms (DCL)`;
        } else {
          kpiLoadTime.textContent = "Disponible";
        }
      }

      if (kpiVisibility) {
        const visState = document.visibilityState || "visible";
        kpiVisibility.innerHTML = `<span class="status-dot"></span> ${visState === "visible" ? "Pestaña Visible" : "Segundo Plano"}`;
      }

      if (lastUpdatedLabel) {
        lastUpdatedLabel.textContent = new Date().toLocaleTimeString();
      }

      // 2. Tabla de Rendimiento
      if (perfTableBody) {
        const nav = snapshot.performance.navigation || {};
        const paints = snapshot.performance.paints || {};

        perfTableBody.innerHTML = `
          <tr>
            <td><strong>Tiempo DNS (Lookup)</strong></td>
            <td>${nav.dnsTimeMs !== undefined && nav.dnsTimeMs !== null ? nav.dnsTimeMs + ' ms' : 'N/A'}</td>
          </tr>
          <tr>
            <td><strong>Conexión TCP</strong></td>
            <td>${nav.tcpTimeMs !== undefined && nav.tcpTimeMs !== null ? nav.tcpTimeMs + ' ms' : 'N/A'}</td>
          </tr>
          <tr>
            <td><strong>TTFB (Respuesta inicial servidor)</strong></td>
            <td>${nav.ttfbMs !== undefined && nav.ttfbMs !== null ? nav.ttfbMs + ' ms' : 'N/A'}</td>
          </tr>
          <tr>
            <td><strong>Descarga de Contenido (HTML)</strong></td>
            <td>${nav.responseDurationMs !== undefined && nav.responseDurationMs !== null ? nav.responseDurationMs + ' ms' : 'N/A'}</td>
          </tr>
          <tr>
            <td><strong>DOM Content Loaded (Listo para script)</strong></td>
            <td>${nav.domContentLoadedMs !== undefined && nav.domContentLoadedMs !== null ? nav.domContentLoadedMs + ' ms' : 'N/A'}</td>
          </tr>
          <tr>
            <td><strong>Carga Completa (window.load)</strong></td>
            <td>${nav.loadEventMs !== undefined && nav.loadEventMs !== null ? nav.loadEventMs + ' ms' : 'Pendiente o N/A'}</td>
          </tr>
          <tr>
            <td><strong>First Paint (FP)</strong></td>
            <td>${paints.firstPaint !== undefined && paints.firstPaint !== null ? paints.firstPaint + ' ms' : 'N/A'}</td>
          </tr>
          <tr>
            <td><strong>First Contentful Paint (FCP)</strong></td>
            <td>${paints.firstContentfulPaint !== undefined && paints.firstContentfulPaint !== null ? paints.firstContentfulPaint + ' ms' : 'N/A'}</td>
          </tr>
        `;
      }

      // 3. Entorno y Conexión
      if (envTableBody) {
        const env = snapshot.environment || {};
        const vp = env.viewport || {};
        const conn = env.connection;

        envTableBody.innerHTML = `
          <tr>
            <td><strong>Resolución del Viewport</strong></td>
            <td>${vp.width} × ${vp.height} px</td>
          </tr>
          <tr>
            <td><strong>Densidad de Píxeles (DPR)</strong></td>
            <td>${vp.devicePixelRatio}x</td>
          </tr>
          <tr>
            <td><strong>Orientación</strong></td>
            <td>${vp.orientation}</td>
          </tr>
          <tr>
            <td><strong>Tipo de Conexión de Red</strong></td>
            <td>${conn && conn.effectiveType ? conn.effectiveType.toUpperCase() : 'No reportada por navegador'}</td>
          </tr>
          <tr>
            <td><strong>Velocidad Estimada (Downlink)</strong></td>
            <td>${conn && conn.downlink ? conn.downlink + ' Mbps' : 'N/A'}</td>
          </tr>
          <tr>
            <td><strong>Latencia Estimada (RTT)</strong></td>
            <td>${conn && conn.rtt ? conn.rtt + ' ms' : 'N/A'}</td>
          </tr>
        `;
      }

      // 4. Badges de soporte de APIs
      if (apiBadgesContainer) {
        const apis = (snapshot.environment && snapshot.environment.apiSupport) || {};
        const badgesHtml = [
          { name: "Performance API", supported: apis.performance },
          { name: "PerformanceObserver", supported: apis.performanceObserver },
          { name: "IntersectionObserver", supported: apis.intersectionObserver },
          { name: "HTML5 <dialog>", supported: apis.dialog },
          { name: "Web Storage (LocalStorage)", supported: apis.localStorage },
          { name: "Service Workers", supported: apis.serviceWorker }
        ]
          .map((item) => `
            <tr>
              <td><strong>${item.name}</strong></td>
              <td>
                <span class="metric-badge ${item.supported ? 'supported' : 'unsupported'}">
                  ${item.supported ? '✓ Soportado' : '✗ No disponible'}
                </span>
              </td>
            </tr>
          `)
          .join("");

        apiBadgesContainer.innerHTML = badgesHtml;
      }

      // 5. Registro de Errores
      if (errorsList) {
        if (snapshot.errors.length === 0) {
          errorsList.innerHTML = `
            <li class="empty-state">
              <span class="empty-icon" aria-hidden="true">✓</span>
              <strong>Cero errores registrados</strong>
              <p>No se han capturado fallos JavaScript ni errores de recursos.</p>
            </li>
          `;
        } else {
          errorsList.innerHTML = snapshot.errors
            .map((err) => `
              <li class="log-item error-item">
                <div class="log-item-header">
                  <span class="log-type" style="background: rgba(225,29,72,0.2); color: #f43f5e;">
                    ${err.type || 'ERROR'}
                  </span>
                  <span class="log-time">${new Date(err.timestamp).toLocaleTimeString()}</span>
                </div>
                <div class="log-item-body">
                  <strong>${escapeHtml(err.message || '')}</strong>
                  ${err.source ? `<div>Fuente: ${escapeHtml(err.source)}</div>` : ''}
                  ${err.filename ? `<div>Archivo: ${escapeHtml(err.filename)}:${err.lineno || 0}</div>` : ''}
                </div>
              </li>
            `)
            .join("");
        }
      }

      // 6. Registro de Clics y Eventos
      if (eventsList) {
        if (snapshot.events.length === 0) {
          eventsList.innerHTML = `
            <li class="empty-state">
              <span class="empty-icon" aria-hidden="true">👆</span>
              <strong>Sin eventos de interacción aún</strong>
              <p>Haz clic en los enlaces o botones de la página para registrar actividad.</p>
            </li>
          `;
        } else {
          eventsList.innerHTML = snapshot.events
            .map((ev) => `
              <li class="log-item ${ev.type === 'demo_event' ? 'demo-item' : 'click-item'}">
                <div class="log-item-header">
                  <span class="log-type" style="${ev.type === 'demo_event' ? 'background: rgba(245,158,11,0.2); color: #fbbf24;' : 'background: rgba(56,189,248,0.2); color: #38bdf8;'}">
                    ${ev.type || 'CLICK'} [${ev.tag || 'EL'}]
                  </span>
                  <span class="log-time">${new Date(ev.timestamp).toLocaleTimeString()}</span>
                </div>
                <div class="log-item-body">
                  ${ev.text ? `<div>Texto: "<strong>${escapeHtml(ev.text)}</strong>"</div>` : ''}
                  ${ev.id ? `<div>ID: #${escapeHtml(ev.id)}</div>` : ''}
                  ${ev.href ? `<div>Destino: ${escapeHtml(ev.href)}</div>` : ''}
                  ${ev.classes ? `<div>Clases: .${escapeHtml(ev.classes)}</div>` : ''}
                  ${ev.note ? `<div style="color: var(--color-gold-light);">${escapeHtml(ev.note)}</div>` : ''}
                </div>
              </li>
            `)
            .join("");
        }
      }

      // 7. Visor de JSON sin procesar
      if (rawJsonViewer) {
        rawJsonViewer.textContent = JSON.stringify(snapshot, null, 2);
      }
    }

    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    // Acciones del Dashboard
    if (btnRefresh) {
      btnRefresh.addEventListener("click", () => {
        renderDashboard();
        btnRefresh.classList.add("pulse");
        setTimeout(() => btnRefresh.classList.remove("pulse"), 400);
      });
    }

    if (btnDemo) {
      btnDemo.addEventListener("click", () => {
        root.CR7Observability.recordDemoEvent();
        renderDashboard();
      });
    }

    if (btnDownload) {
      btnDownload.addEventListener("click", () => {
        root.CR7Observability.exportJson();
      });
    }

    if (btnClear) {
      btnClear.addEventListener("click", () => {
        if (window.confirm("¿Seguro que deseas reiniciar y vaciar el almacenamiento de observabilidad?")) {
          root.CR7Observability.clear();
          renderDashboard();
        }
      });
    }

    // Renderizado inicial
    renderDashboard();
  }

  // Inicializar UI cuando el DOM esté listo
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDashboardUI);
  } else {
    initDashboardUI();
  }

})(typeof window !== "undefined" ? window : globalThis);
