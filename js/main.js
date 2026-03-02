(function () {
  var navToggle = document.querySelector(".nav-toggle");
  var siteNav = document.getElementById("site-nav");
  var year = document.getElementById("year");
  var form = document.getElementById("devis");
  var status = document.getElementById("form-status");
  var contactSuccess = document.getElementById("contact-success");
  var projectCards = Array.prototype.slice.call(document.querySelectorAll(".project-card"));
  var statsStrip = document.querySelector(".stats-strip");
  var pageTransitionMs = 220;

  function isSamePageHashLink(anchor) {
    var href = anchor.getAttribute("href") || "";
    if (href.indexOf("#") !== 0) return false;
    return true;
  }

  function isTransitionCandidate(anchor) {
    var href = anchor.getAttribute("href") || "";
    if (!href || href.indexOf("javascript:") === 0) return false;
    if (isSamePageHashLink(anchor)) return false;
    if (anchor.hasAttribute("download")) return false;
    if ((anchor.getAttribute("target") || "").toLowerCase() === "_blank") return false;
    if (href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) return false;

    try {
      var targetUrl = new URL(anchor.href, window.location.href);
      var isSameOrigin = targetUrl.origin === window.location.origin;
      if (!isSameOrigin) return false;

      var isSameDocument = targetUrl.pathname === window.location.pathname &&
        targetUrl.search === window.location.search &&
        targetUrl.hash !== "";
      return !isSameDocument;
    } catch (error) {
      return false;
    }
  }

  if (document.body) {
    document.body.classList.add("page-ready-init");
    window.requestAnimationFrame(function () {
      document.body.classList.add("page-ready");
      document.body.classList.remove("page-ready-init");
    });

    document.addEventListener("click", function (event) {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;

      var anchor = event.target.closest("a[href]");
      if (!anchor) return;
      if (!isTransitionCandidate(anchor)) return;

      event.preventDefault();
      document.body.classList.add("page-leaving");
      window.setTimeout(function () {
        window.location.href = anchor.href;
      }, pageTransitionMs);
    });
  }

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  if (contactSuccess && window.location.search.indexOf("envoye=1") !== -1) {
    contactSuccess.textContent = "Votre demande a ete envoyee. Verifiez votre e-mail de contact (activation FormSubmit requise la premiere fois).";
    contactSuccess.style.color = "#0f7a4f";
  }

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!isOpen));
      siteNav.classList.toggle("is-open", !isOpen);
      navToggle.setAttribute("aria-label", !isOpen ? "Fermer le menu" : "Ouvrir le menu");
    });

    siteNav.addEventListener("click", function (event) {
      if (event.target instanceof HTMLElement && event.target.tagName === "A" && window.innerWidth < 900) {
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Ouvrir le menu");
        siteNav.classList.remove("is-open");
      }
    });
  }

  if (projectCards.length) {
    projectCards.forEach(function (card) {
      var button = card.querySelector(".project-toggle");
      var image = card.querySelector("img");
      var beforeSrc = card.getAttribute("data-before");
      var afterSrc = card.getAttribute("data-after");

      if (!button || !image || !beforeSrc || !afterSrc) return;

      var beforeAlt = image.getAttribute("alt") || "Projet avant nettoyage";
      var afterAlt = beforeAlt.replace("avant", "apres");

      button.addEventListener("click", function () {
        var isAfter = card.classList.toggle("is-after");
        image.src = isAfter ? afterSrc : beforeSrc;
        image.alt = isAfter ? afterAlt : beforeAlt;
        button.textContent = isAfter ? "Voir l'avant" : "Voir l'apres";
        button.setAttribute("aria-pressed", String(isAfter));
      });
    });
  }

  var serviceLegends = Array.prototype.slice.call(document.querySelectorAll(".service-legend"));
  if (serviceLegends.length) {
    serviceLegends.forEach(function (legend) {
      var summary = legend.querySelector("summary");
      var toggleButton = legend.querySelector(".service-legend__go");
      if (!summary || !toggleButton) return;

      toggleButton.setAttribute("aria-expanded", String(legend.open));

      summary.addEventListener("click", function (event) {
        if (!(event.target instanceof HTMLElement)) return;
        if (!toggleButton.contains(event.target)) {
          event.preventDefault();
        }
      });

      toggleButton.addEventListener("click", function (event) {
        event.preventDefault();
        legend.open = !legend.open;
        toggleButton.setAttribute("aria-expanded", String(legend.open));
      });

      legend.addEventListener("toggle", function () {
        toggleButton.setAttribute("aria-expanded", String(legend.open));
      });
    });
  }

  function parseCounterTarget(text) {
    var raw = (text || "").replace(/,/g, "");
    var hasPlus = raw.indexOf("+") !== -1;
    var digits = raw.replace(/[^\d]/g, "");

    return {
      target: parseInt(digits, 10) || 0,
      suffix: hasPlus ? "+" : ""
    };
  }

  function animateCounters(container) {
    var counters = Array.prototype.slice.call(container.querySelectorAll(".stat-box strong"));
    if (!counters.length) return;

    counters.forEach(function (counter) {
      if (counter.getAttribute("data-counted") === "true") return;

      var parsed = parseCounterTarget(counter.textContent);
      var target = parsed.target;
      var suffix = parsed.suffix;
      var duration = 2000;
      var startTime = null;

      counter.textContent = "0" + suffix;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;

        var elapsed = timestamp - startTime;
        var progress = Math.min(elapsed / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var value = Math.round(target * eased);

        counter.textContent = value.toLocaleString("en-US") + suffix;

        if (progress < 1) {
          window.requestAnimationFrame(step);
          return;
        }

        counter.textContent = target.toLocaleString("en-US") + suffix;
        counter.setAttribute("data-counted", "true");
      }

      window.requestAnimationFrame(step);
    });
  }

  if (statsStrip) {
    if ("IntersectionObserver" in window) {
      var statsObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounters(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.35 });

      statsObserver.observe(statsStrip);
    } else {
      animateCounters(statsStrip);
    }
  }

  function getErrorMessage(input) {
    if (input.validity.valueMissing) {
      return "Ce champ est obligatoire.";
    }
    if (input.validity.typeMismatch) {
      return "Veuillez saisir une valeur valide.";
    }
    if (input.validity.patternMismatch) {
      return "Veuillez saisir un numero de telephone valide.";
    }
    return "";
  }

  function validateField(fieldEl) {
    var input = fieldEl.querySelector("input, select, textarea");
    var errorEl = fieldEl.querySelector(".field__error");
    if (!input || !errorEl) return true;

    var isValid = input.checkValidity();
    fieldEl.classList.toggle("is-invalid", !isValid);
    errorEl.textContent = isValid ? "" : getErrorMessage(input);
    return isValid;
  }

  if (form) {
    var fields = Array.prototype.slice.call(form.querySelectorAll(".field"));

    fields.forEach(function (fieldEl) {
      var input = fieldEl.querySelector("input, select, textarea");
      if (!input) return;

      input.addEventListener("blur", function () {
        validateField(fieldEl);
      });

      input.addEventListener("input", function () {
        if (fieldEl.classList.contains("is-invalid")) {
          validateField(fieldEl);
        }
      });
    });

    form.addEventListener("submit", function (event) {
      var allValid = fields.every(validateField);
      var action = (form.getAttribute("action") || "").toLowerCase();
      var isEmailSubmit = action.indexOf("formsubmit.co") !== -1;

      if (!allValid) {
        event.preventDefault();
        if (status) {
          status.textContent = "Veuillez corriger les champs en erreur avant l'envoi.";
          status.style.color = "#c0392b";
        }
        var firstInvalid = form.querySelector(".field.is-invalid input, .field.is-invalid select, .field.is-invalid textarea");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      if (isEmailSubmit) {
        if (status) {
          status.textContent = "Envoi en cours...";
          status.style.color = "#2f93df";
        }
        return;
      }

      event.preventDefault();
      if (status) {
        status.textContent = "Formulaire pret a etre branche au backend (envoi front-end uniquement).";
        status.style.color = "#0f7a4f";
      }
      form.reset();
      fields.forEach(function (fieldEl) {
        fieldEl.classList.remove("is-invalid");
        var errorEl = fieldEl.querySelector(".field__error");
        if (errorEl) errorEl.textContent = "";
      });
    });
  }
})();
