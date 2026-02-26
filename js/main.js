(function () {
  var navToggle = document.querySelector(".nav-toggle");
  var siteNav = document.getElementById("site-nav");
  var year = document.getElementById("year");
  var form = document.getElementById("devis");
  var status = document.getElementById("form-status");
  var contactSuccess = document.getElementById("contact-success");
  var projectCards = Array.prototype.slice.call(document.querySelectorAll(".project-card"));

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
