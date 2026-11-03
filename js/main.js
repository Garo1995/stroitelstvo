/* ==========================================================================
   СтройДом — скрипты лендинга
   1. Шапка и мобильное меню      5. Аккордеон FAQ
   2. Подсветка пункта меню       6. Маска телефона
   3. Плавное появление блоков    7. Отправка формы
   4. Счётчики                    8. Мелочи (год, плавающая кнопка)
   ========================================================================== */

(function () {
  'use strict';

  window.siteReady = true;

  var doc = document;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasObserver = 'IntersectionObserver' in window;

  var header = doc.querySelector('header');
  var floating = doc.querySelector('.floating');
  var hero = doc.querySelector('.hero');
  var request = doc.querySelector('.request');


  /* ---------- 1. Шапка и мобильное меню ---------- */

  var burger = header ? header.querySelector('button') : null;

  function setMenu(open) {
    if (!burger) return;
    header.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  }

  if (burger) {
    burger.addEventListener('click', function () {
      setMenu(!header.classList.contains('is-open'));
    });

    header.querySelectorAll('nav a, .button').forEach(function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });

    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });

    doc.addEventListener('click', function (e) {
      if (!header.contains(e.target)) setMenu(false);
    });

    window.matchMedia('(min-width: 1160px)').addEventListener('change', function () {
      setMenu(false);
    });
  }

  var ticking = false;

  function onScroll() {
    ticking = false;

    if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);

    // Плавающая кнопка: после первого экрана и пока не виден блок с формой
    if (floating && hero && request) {
      var rect = request.getBoundingClientRect();
      var requestVisible = rect.top < window.innerHeight * 0.85 && rect.bottom > 0;
      floating.classList.toggle('is-shown', window.scrollY > hero.offsetHeight * 0.9 && !requestVisible);
    }
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }, { passive: true });

  onScroll();


  /* ---------- 2. Подсветка пункта меню при прокрутке ---------- */

  if (hasObserver && header) {
    var links = {};
    header.querySelectorAll('nav a[href^="#"]').forEach(function (a) {
      links[a.getAttribute('href').slice(1)] = a;
    });

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        Object.keys(links).forEach(function (id) { links[id].removeAttribute('aria-current'); });
        if (links[entry.target.id]) links[entry.target.id].setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    doc.querySelectorAll('main section[id]').forEach(function (section) { spy.observe(section); });
  }


  /* ---------- 3. Плавное появление блоков ---------- */

  // Тот же список, что и в CSS (.js :where(...)); у каждого элемента своя небольшая задержка
  var revealTargets = doc.querySelectorAll('main section > :not(ul):not(ol), main section li');

  revealTargets.forEach(function (el) {
    var index = Array.prototype.indexOf.call(el.parentNode.children, el);
    el.style.animationDelay = Math.min(index, 5) * 70 + 'ms';
  });

  if (hasObserver && !reduceMotion) {
    var revealer = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });

    revealTargets.forEach(function (el) { revealer.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
  }


  /* ---------- 4. Счётчики ---------- */

  var counters = doc.querySelectorAll('[data-count]');

  function formatNumber(value) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  function runCounter(el) {
    var target = Number(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1600;
    var start = null;

    function step(time) {
      if (start === null) start = time;
      var progress = Math.min((time - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatNumber(Math.round(target * eased)) + (progress === 1 ? suffix : '');
      if (progress < 1) window.requestAnimationFrame(step);
    }

    window.requestAnimationFrame(step);
  }

  if (hasObserver && !reduceMotion) {
    var counterObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    counters.forEach(function (el) {
      el.textContent = '0';
      counterObserver.observe(el);
    });
  }


  /* ---------- 5. Аккордеон FAQ (плавное открытие и закрытие) ---------- */

  doc.querySelectorAll('.faq details').forEach(function (details) {
    var summary = details.querySelector('summary');
    var animation = null;

    summary.addEventListener('click', function (e) {
      e.preventDefault();

      if (reduceMotion || !details.animate) {
        details.open = !details.open;
        return;
      }

      if (animation) animation.cancel();

      var opening = !details.open;
      var from = details.offsetHeight;
      var borders = details.offsetHeight - details.clientHeight;
      var to;

      details.style.overflow = 'hidden';

      if (opening) {
        details.open = true;
        to = details.offsetHeight;
      } else {
        to = summary.offsetHeight + borders;
      }

      animation = details.animate(
        { height: [from + 'px', to + 'px'] },
        { duration: 380, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' }
      );

      animation.onfinish = function () {
        details.open = opening;
        details.style.overflow = '';
        animation = null;
      };

      animation.oncancel = function () {
        details.style.overflow = '';
      };
    });
  });


  /* ---------- 6. Маска телефона: только цифры, формат +7 (999) 123-45-67 ---------- */

  // Приводит любой ввод (+7…, 8…, 9…, вставка из буфера) к 10 цифрам без кода страны
  function nationalDigits(raw) {
    var digits = String(raw).replace(/\D/g, '');

    if (digits.charAt(0) === '7') digits = digits.slice(1);
    if (digits.charAt(0) === '8' && digits.length > 10) digits = digits.slice(1);

    // Единственная первая цифра 7 или 8 — это код страны или «восьмёрка», а не начало номера
    if (digits.length === 1 && (digits === '7' || digits === '8')) digits = '';

    return digits.slice(0, 10);
  }

  function formatPhone(digits) {
    if (!digits) return '';

    var out = '+7 (' + digits.slice(0, 3);
    if (digits.length > 3) out += ') ' + digits.slice(3, 6);
    if (digits.length > 6) out += '-' + digits.slice(6, 8);
    if (digits.length > 8) out += '-' + digits.slice(8, 10);

    return out;
  }

  function setPhoneValue(input, digits) {
    var value = formatPhone(digits);
    input.value = value;

    if (doc.activeElement === input) {
      input.setSelectionRange(value.length, value.length);
    }
  }

  function initPhoneMask(input) {
    input.addEventListener('focus', function () {
      if (!input.value) {
        input.value = '+7 (';
        // Нужен для Safari и мобильных браузеров; не трогаем курсор, если пользователь уже начал печатать
        window.setTimeout(function () {
          if (input.value === '+7 (') input.setSelectionRange(4, 4);
        }, 0);
      }
    });

    input.addEventListener('blur', function () {
      if (!nationalDigits(input.value)) input.value = '';
    });

    input.addEventListener('input', function (e) {
      var digits = nationalDigits(input.value);

      // Первая «7» или «8» — это код страны, префикс остаётся в поле
      if (!digits && e.inputType && e.inputType.indexOf('insert') === 0 && doc.activeElement === input) {
        input.value = '+7 (';
        input.setSelectionRange(4, 4);
        return;
      }

      setPhoneValue(input, digits);
    });

    // Backspace перепрыгивает через скобки, пробелы и дефисы
    input.addEventListener('keydown', function (e) {
      if (e.key !== 'Backspace' || input.selectionStart !== input.selectionEnd) return;

      var pos = input.selectionStart;
      while (pos > 0 && !/\d/.test(input.value.charAt(pos - 1))) pos--;

      if (pos !== input.selectionStart) input.setSelectionRange(pos, pos);
    });

    input.addEventListener('paste', function (e) {
      var text = (e.clipboardData || window.clipboardData).getData('text');
      e.preventDefault();
      setPhoneValue(input, nationalDigits(text));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  doc.querySelectorAll('input[type="tel"]').forEach(initPhoneMask);


  /* ---------- 7. Проверка и отправка форм ---------- */

  function setStatus(form, text, state) {
    var status = form.querySelector('[role="status"]');
    if (!status) return;

    status.textContent = text;
    if (state) status.setAttribute('data-state', state);
    else status.removeAttribute('data-state');
  }

  function markInvalid(field, invalid) {
    if (invalid) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
  }

  function validate(form) {
    var nameField = form.elements['name'];
    var phoneField = form.elements['phone'];
    var agreeField = form.elements['agree'];
    var firstBad = null;
    var message = '';

    var nameBad = nameField.value.trim().length < 2;
    var phoneBad = nationalDigits(phoneField.value).length !== 10;
    var agreeBad = !agreeField.checked;

    markInvalid(nameField, nameBad);
    markInvalid(phoneField, phoneBad);

    if (nameBad) { message = 'Укажите, как к вам обращаться'; firstBad = nameField; }
    if (phoneBad) { message = message || 'Введите номер телефона полностью'; firstBad = firstBad || phoneField; }
    if (agreeBad) { message = message || 'Подтвердите согласие на обработку персональных данных'; firstBad = firstBad || agreeField; }

    if (firstBad) {
      setStatus(form, message, 'error');
      firstBad.focus();
      return false;
    }

    return true;
  }

  function initForm(form) {
    var button = form.querySelector('button[type="submit"]');
    var buttonText = button.textContent;

    form.addEventListener('input', function (e) {
      if (e.target.hasAttribute && e.target.hasAttribute('aria-invalid')) markInvalid(e.target, false);
      if (form.querySelector('[data-state="error"]')) setStatus(form, '', '');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Бот заполнил скрытое поле — делаем вид, что всё отправлено
      if (form.elements['website'].value) {
        setStatus(form, 'Спасибо! Заявка принята.', 'success');
        return;
      }

      if (!validate(form)) return;

      var data = new FormData(form);
      data.set('phone', '+7' + nationalDigits(form.elements['phone'].value));
      data.set('agree', 'yes');

      var name = form.elements['name'].value.trim();

      button.disabled = true;
      button.textContent = 'Отправляем…';
      setStatus(form, '', '');

      fetch(form.getAttribute('action'), {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      })
        .then(function (response) {
          if (!response.ok) throw new Error('http');
          return response.json().catch(function () { return { ok: true }; });
        })
        .then(function (result) {
          if (result && result.ok === false) throw new Error('server');

          setStatus(form, 'Спасибо, ' + name + '! Заявка принята — перезвоним в течение 15 минут.', 'success');
          form.reset();

          // Здесь можно отправить цель в Яндекс Метрику:
          // ym(СЧЁТЧИК, 'reachGoal', 'lead');
        })
        .catch(function () {
          setStatus(form, 'Не удалось отправить заявку. Позвоните нам: +7 (495) 000-00-00', 'error');
        })
        .then(function () {
          button.disabled = false;
          button.textContent = buttonText;
        });
    });
  }

  doc.querySelectorAll('form').forEach(initForm);


  /* ---------- 8. Мелочи ---------- */

  doc.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
