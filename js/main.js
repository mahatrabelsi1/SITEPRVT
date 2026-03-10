(function () {
  var navToggle = document.querySelector(".nav-toggle");
  var siteNav = document.getElementById("site-nav");
  var year = document.getElementById("year");
  var forms = Array.prototype.slice.call(document.querySelectorAll(".quote-form"));
  var contactSuccess = document.getElementById("contact-success");
  var projectCards = Array.prototype.slice.call(document.querySelectorAll(".project-card"));
  var autoGalleries = Array.prototype.slice.call(document.querySelectorAll(".auto-gallery"));
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

  function startAutoGallery(gallery) {
    var slides = Array.prototype.slice.call(gallery.querySelectorAll("img"));
    if (slides.length < 2) return;

    var activeIndex = Math.max(slides.findIndex(function (slide) {
      return slide.classList.contains("is-active");
    }), 0);
    var intervalMs = parseInt(gallery.getAttribute("data-interval"), 10) || 1800;

    slides.forEach(function (slide, index) {
      slide.classList.toggle("is-active", index === activeIndex);
    });

    window.setInterval(function () {
      slides[activeIndex].classList.remove("is-active");
      activeIndex = (activeIndex + 1) % slides.length;
      slides[activeIndex].classList.add("is-active");
    }, intervalMs);
  }

  function parseDirectoryImages(htmlText, rootPath) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(htmlText, "text/html");
    var links = Array.prototype.slice.call(doc.querySelectorAll("a[href]"));
    var exts = /\.(avif|bmp|gif|jpe?g|png|svg|webp)$/i;
    var seen = {};
    var baseUrl = new URL(rootPath, window.location.href);

    return links
      .map(function (link) {
        var href = link.getAttribute("href") || "";
        return href.split("#")[0].split("?")[0];
      })
      .filter(function (href) {
        return exts.test(href);
      })
      .map(function (href) {
        return new URL(href, baseUrl).href;
      })
      .filter(function (url) {
        if (seen[url]) return false;
        seen[url] = true;
        return true;
      });
  }

  function buildAutoGalleriesFromFolder() {
    if (!autoGalleries.length) return;

    var wrapper = document.querySelector(".auto-gallery-grid[data-gallery-root]");
    if (!wrapper || !("fetch" in window) || !("DOMParser" in window)) {
      autoGalleries.forEach(startAutoGallery);
      return;
    }

    var rootPath = wrapper.getAttribute("data-gallery-root") || "imageG/";

    fetch(rootPath)
      .then(function (response) {
        if (!response.ok) throw new Error("Directory listing not available");
        return response.text();
      })
      .then(function (htmlText) {
        var images = parseDirectoryImages(htmlText, rootPath);
        if (!images.length) throw new Error("No images found in folder");

        autoGalleries.forEach(function (gallery, galleryIndex) {
          var assigned = images.filter(function (_, imageIndex) {
            return imageIndex % autoGalleries.length === galleryIndex;
          });

          if (!assigned.length) assigned = images;

          gallery.innerHTML = "";
          assigned.forEach(function (src, index) {
            var img = document.createElement("img");
            img.src = src;
            img.alt = "Galerie projet nettoyage " + (galleryIndex + 1) + " - " + (index + 1);
            img.loading = "lazy";
            if (index === 0) img.classList.add("is-active");
            gallery.appendChild(img);
          });

          startAutoGallery(gallery);
        });
      })
      .catch(function () {
        autoGalleries.forEach(startAutoGallery);
      });
  }

  buildAutoGalleriesFromFolder();

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

  forms.forEach(function (form) {
    var fields = Array.prototype.slice.call(form.querySelectorAll(".field"));
    var status = form.querySelector("#form-status") || form.querySelector(".form-status");
    var replyToField = form.querySelector('input[name="_replyto"]');
    var emailField = form.querySelector('input[name="email"]');
    var urlField = form.querySelector('input[name="_url"]');

    if (urlField) {
      urlField.value = window.location.href;
    }

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
        event.preventDefault();

        if (replyToField && emailField) {
          replyToField.value = emailField.value;
        }

        if (status) {
          status.textContent = "Envoi en cours...";
          status.style.color = "#2f93df";
        }

        var submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) submitButton.disabled = true;

        var formData = new FormData(form);
        var ajaxAction = action.replace("https://formsubmit.co/", "https://formsubmit.co/ajax/");

        fetch(ajaxAction, {
          method: "POST",
          headers: {
            "Accept": "application/json"
          },
          body: formData
        })
          .then(function (response) {
            return response.json().catch(function () {
              return {};
            }).then(function (data) {
              if (!response.ok) {
                throw new Error((data && data.message) || "Erreur reseau");
              }
              return data;
            });
          })
          .then(function (data) {
            if (!data || data.success === "false" || data.success === false) {
              throw new Error((data && data.message) || "Envoi impossible");
            }

            if (status) {
              status.textContent = "Votre message a bien ete envoye.";
              status.style.color = "#0f7a4f";
            }

            form.reset();
            fields.forEach(function (fieldEl) {
              fieldEl.classList.remove("is-invalid");
              var errorEl = fieldEl.querySelector(".field__error");
              if (errorEl) errorEl.textContent = "";
            });
          })
          .catch(function (error) {
            if (status) {
              status.textContent = error && error.message ? error.message : "Erreur lors de l'envoi. Verifiez la connexion ou reessayez.";
              status.style.color = "#c0392b";
            }
          })
          .finally(function () {
            if (submitButton) submitButton.disabled = false;
          });
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
  });
})();
