/**
 * ==========================================================================
 * SCRIPT PRINCIPAL: TRIBUTO A CRISTIANO RONALDO (CR7)
 * Enfoque: JavaScript Vanilla (ES6+), Modular, Accesible y sin dependencias
 * ==========================================================================
 */

"use strict";

// Asegurar remoción de no-js para soporte progresivo (H-M8)
document.documentElement.classList.remove("no-js");

document.addEventListener("DOMContentLoaded", () => {
  // Inicialización de cada módulo funcional
  initMobileMenu();
  initActiveNavSpy();
  initTimelineFilter();
  initStatsCounter();
  initGalleryLightbox();
  initSmoothScrollFocus();
});

/**
 * --------------------------------------------------------------------------
 * 1. MENÚ DE NAVEGACIÓN MÓVIL
 * --------------------------------------------------------------------------
 * Controla la apertura, cierre, accesibilidad (ARIA) y foco en pantallas pequeñas.
 */
function initMobileMenu() {
  const toggleBtn = document.getElementById("menu-toggle");
  const navMenu = document.getElementById("menu-navegacion");
  const navLinks = document.querySelectorAll(".nav-link");

  if (!toggleBtn || !navMenu) return;

  const closeMenu = (returnFocusToToggle = false) => {
    if (navMenu.classList.contains("is-open")) {
      navMenu.classList.remove("is-open");
      toggleBtn.setAttribute("aria-expanded", "false");
      toggleBtn.setAttribute("aria-label", "Abrir menú de navegación");
      if (returnFocusToToggle && typeof toggleBtn.focus === "function") {
        toggleBtn.focus();
      }
    }
  };

  // Alternar estado al pulsar el botón hamburguesa
  toggleBtn.addEventListener("click", () => {
    const isExpanded = toggleBtn.getAttribute("aria-expanded") === "true";
    const newState = !isExpanded;

    toggleBtn.setAttribute("aria-expanded", String(newState));
    navMenu.classList.toggle("is-open", newState);
    toggleBtn.setAttribute(
      "aria-label",
      newState ? "Cerrar menú de navegación" : "Abrir menú de navegación"
    );
  });

  // Cerrar el menú al seleccionar cualquier enlace y mover foco al destino (H-M5)
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const targetHref = link.getAttribute("href");
      closeMenu(false);

      if (targetHref && targetHref.startsWith("#")) {
        const targetElement = document.querySelector(targetHref);
        if (targetElement) {
          targetElement.setAttribute("tabindex", "-1");
          targetElement.focus({ preventScroll: true });
        }
      }
    });
  });

  // Cerrar al hacer clic fuera del menú en dispositivos móviles
  document.addEventListener("click", (event) => {
    const isClickInside =
      navMenu.contains(event.target) || toggleBtn.contains(event.target);
    if (!isClickInside) {
      closeMenu(false);
    }
  });

  // Cerrar menú con tecla Escape y devolver foco al botón toggle (H-B2)
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navMenu.classList.contains("is-open")) {
      closeMenu(true);
    }
  });
}

/**
 * --------------------------------------------------------------------------
 * 2. INDICADOR DE NAVEGACIÓN ACTIVA (SCROLL SPY)
 * --------------------------------------------------------------------------
 * Resalta el enlace del menú correspondiente a la sección actualmente visible.
 */
function initActiveNavSpy() {
  const sections = document.querySelectorAll("header[id], section[id]");
  const navLinks = document.querySelectorAll(".nav-link");

  if (!("IntersectionObserver" in window) || sections.length === 0) return;

  const observerOptions = {
    root: null,
    rootMargin: "-20% 0px -70% 0px",
    threshold: 0,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute("id");
        navLinks.forEach((link) => {
          const href = link.getAttribute("href");
          if (href === `#${id}`) {
            link.classList.add("active");
            link.setAttribute("aria-current", "page");
          } else {
            link.classList.remove("active");
            link.removeAttribute("aria-current");
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach((sec) => observer.observe(sec));
}

/**
 * --------------------------------------------------------------------------
 * 3. FILTRO INTERACTIVO DE LA LÍNEA DE TIEMPO
 * --------------------------------------------------------------------------
 * Permite filtrar los hitos cronológicos por club o selección nacional.
 */
function initTimelineFilter() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const timelineItems = document.querySelectorAll(".timeline-item");
  const statusElement = document.getElementById("timeline-status");

  if (filterButtons.length === 0 || timelineItems.length === 0) return;

  const applyFilter = (btn) => {
    // Sincronizar clase activa y atributo de accesibilidad aria-pressed
    filterButtons.forEach((b) => {
      b.classList.remove("active");
      b.setAttribute("aria-pressed", "false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-pressed", "true");

    const filterValue = btn.getAttribute("data-filter");
    let visibleCount = 0;

    timelineItems.forEach((item) => {
      const category = item.getAttribute("data-category");
      if (filterValue === "all" || category === filterValue) {
        item.classList.remove("is-hidden");
        item.removeAttribute("aria-hidden");
        visibleCount++;
      } else {
        item.classList.add("is-hidden");
        item.setAttribute("aria-hidden", "true");
      }
    });

    // Anuncio para lectores de pantalla mediante la región aria-live
    if (statusElement) {
      const label = btn.textContent.trim();
      statusElement.textContent = `Mostrando ${visibleCount} hito${visibleCount === 1 ? "" : "s"} para: ${label}`;
    }
  };

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => applyFilter(btn));
  });
}

/**
 * --------------------------------------------------------------------------
 * 4. CONTADOR ANIMADO DE ESTADÍSTICAS
 * --------------------------------------------------------------------------
 * Incrementa progresivamente los números cuando la sección entra en el viewport.
 */
function initStatsCounter() {
  const statNumbers = document.querySelectorAll(".stat-number");
  const statsContainer = document.getElementById("stats-counter-container");

  if (!statsContainer || statNumbers.length === 0) return;

  let hasAnimated = false;

  // Función de interpolación fluida (easeOutQuad)
  const animateCount = (element, targetValue, duration = 1800) => {
    const startTime = performance.now();

    const updateValue = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing cuadrático para desaceleración suave
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      const currentNumber = Math.floor(easeProgress * targetValue);

      // Presentación: añadir signo '+' para valores acumulativos altos
      if (targetValue >= 100) {
        element.textContent = `+${currentNumber}`;
      } else {
        element.textContent = String(currentNumber);
      }

      if (progress < 1) {
        requestAnimationFrame(updateValue);
      } else {
        // Asegurar valor final exacto con su sufijo
        if (targetValue >= 100) {
          element.textContent = `+${targetValue}`;
        } else {
          element.textContent = String(targetValue);
        }
      }
    };

    requestAnimationFrame(updateValue);
  };

  // Verificar si el usuario prefiere movimiento reducido
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) {
    // Si prefiere movimiento reducido, mostrar directamente los valores
    statNumbers.forEach((num) => {
      const target = parseInt(num.getAttribute("data-target"), 10);
      num.textContent = target >= 100 ? `+${target}` : String(target);
    });
    return;
  }

  // Observador de intersección con threshold adaptado para móviles y monitores
  const statsObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimated) {
          hasAnimated = true;
          statNumbers.forEach((num) => {
            const target = parseInt(num.getAttribute("data-target"), 10) || 0;
            animateCount(num, target);
          });
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  statsObserver.observe(statsContainer);
}

/**
 * --------------------------------------------------------------------------
 * 5. MODAL / LIGHTBOX DE GALERÍA ACCESIBLE
 * --------------------------------------------------------------------------
 * Amplía las imágenes en un <dialog> modal nativo con control de teclado y foco.
 */
function initGalleryLightbox() {
  const modal = document.getElementById("lightbox-modal");
  const modalImg = document.getElementById("lightbox-img");
  const modalCaption = document.getElementById("lightbox-caption");
  const closeBtn = document.getElementById("lightbox-close");
  const triggers = document.querySelectorAll(".gallery-trigger");

  if (!modal || !modalImg || !modalCaption || !closeBtn || triggers.length === 0) {
    return;
  }

  let lastActiveElement = null;

  const openLightbox = (trigger) => {
    lastActiveElement = trigger;
    const fullSrc = trigger.getAttribute("data-full");
    const captionText = trigger.getAttribute("data-caption");
    const imgAlt = trigger.querySelector("img")
      ? trigger.querySelector("img").getAttribute("alt")
      : captionText;

    modalImg.setAttribute("src", fullSrc);
    modalImg.setAttribute("alt", imgAlt);
    modalCaption.textContent = captionText;

    // Uso de la API nativa de diálogo modal de HTML5
    if (typeof modal.showModal === "function") {
      modal.showModal();
    } else {
      modal.setAttribute("open", "");
    }

    // Foco directo en el botón de cerrar para accesibilidad
    closeBtn.focus();
  };

  const closeLightbox = () => {
    if (typeof modal.close === "function") {
      modal.close();
    } else {
      modal.removeAttribute("open");
      onModalClosed();
    }
  };

  const onModalClosed = () => {
    modalImg.removeAttribute("src");
    modalImg.removeAttribute("alt");
    // Devolver el foco al elemento que activó el modal
    if (lastActiveElement && typeof lastActiveElement.focus === "function") {
      lastActiveElement.focus();
    }
  };

  // Asignar evento clic a cada botón disparador
  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => openLightbox(trigger));
  });

  // Botón de cierre
  closeBtn.addEventListener("click", closeLightbox);

  // Cerrar al hacer clic en el backdrop (fondo oscuro exterior)
  modal.addEventListener("click", (event) => {
    const rect = modal.getBoundingClientRect();
    const isInDialog =
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width;

    if (!isInDialog) {
      closeLightbox();
    }
  });

  // Evento close nativo (cubre modal.close() y la tecla Escape de forma unificada)
  modal.addEventListener("close", onModalClosed);
}

/**
 * --------------------------------------------------------------------------
 * 6. ACCESIBILIDAD EN DESPLAZAMIENTO SUAVE Y FOCO (H-B5)
 * --------------------------------------------------------------------------
 * Asegura que todos los saltos de enlace interno muevan el foco programático al destino.
 */
function initSmoothScrollFocus() {
  const internalLinks = document.querySelectorAll('a[href^="#"]');
  internalLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.setAttribute("tabindex", "-1");
        targetElement.focus({ preventScroll: true });
      }
    });
  });
}

/**
 * --------------------------------------------------------------------------
 * 7. INTEGRACIÓN CON OBSERVABILIDAD LOCAL (Fallback defensivo)
 * --------------------------------------------------------------------------
 */
if (typeof window !== "undefined" && !window.CR7Observability) {
  window.CR7Observability = {
    getSnapshot: function () {
      try {
        const raw = window.localStorage ? window.localStorage.getItem("cr7-observability-store") : null;
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    }
  };
}
