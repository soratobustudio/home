(() => {
  'use strict';
  const english = document.documentElement.lang === 'en';
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  if (navToggle && navMenu) {
    navToggle.hidden = false;
    const closeMenu = () => {
      navMenu.classList.remove('open');
      navToggle.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', english ? 'Open menu' : 'メニューを開く');
    };
    navToggle.addEventListener('click', () => {
      const open = navMenu.classList.toggle('open');
      navToggle.classList.toggle('active', open);
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? (english ? 'Close menu' : 'メニューを閉じる') : (english ? 'Open menu' : 'メニューを開く'));
    });
    navMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && navMenu.classList.contains('open')) { closeMenu(); navToggle.focus(); }
    });
    const wide = window.matchMedia('(min-width: 1001px)');
    wide.addEventListener('change', closeMenu);
    document.documentElement.classList.add('nav-ready');
  }
  const form = document.querySelector('.contact-form');
  if (!form) return;
  const category = document.getElementById('category');
  const event = document.getElementById('event');
  const phone = document.getElementById('phone');
  const params = new URLSearchParams(location.search);
  const kinds = { yoga: english ? 'Yoga Class' : 'ヨガ教室', cooking: english ? 'Cooking Class' : '料理教室', corporate: english ? 'Corporate Program' : '法人向けメニュー開発', catering: english ? 'Catering' : 'ケータリング' };
  if (category && kinds[params.get('type')]) category.value = kinds[params.get('type')];
  if (event && params.has('event')) event.value = params.get('event').slice(0, 160);
  const setPhoneRequired = () => {
    const method = form.querySelector('input[type="radio"]:checked');
    phone.required = !!method && ['電話', 'Phone'].includes(method.value);
    const note = document.getElementById('phone-note');
    if (note) note.textContent = phone.required ? (english ? 'Required when you choose phone contact.' : '電話での連絡を希望する場合は必須です。') : (english ? 'Optional unless you choose phone contact.' : '電話での連絡を希望する場合はご記入ください。');
  };
  form.querySelectorAll('input[type="radio"]').forEach(r => r.addEventListener('change', setPhoneRequired));
  setPhoneRequired();
  let pending = false;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (pending || !form.reportValidity()) return;
    const button = form.querySelector('button[type="submit"]');
    const status = document.getElementById('form-status');
    const data = new FormData(form);
    pending = true; button.disabled = true; form.setAttribute('aria-busy', 'true');
    status.textContent = english ? 'Sending…' : '送信中です…';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' }, signal: controller.signal });
      if (!response.ok) throw new Error('Submission rejected');
      location.assign(new URL('thank-you.html', location.href).href);
    } catch (error) {
      status.textContent = error.name === 'AbortError' ? (english ? 'We could not confirm receipt. Check your connection and whether a confirmation arrived before trying again. Your entries have been kept.' : '受付を確認できませんでした。通信状況と確認メールの有無を確認してから、再度お試しください。入力内容は保持しています。') : (english ? 'Your message could not be sent. Check your connection and try again. Your entries have been kept. You can also contact us via Instagram.' : '送信できませんでした。通信状況を確認して再度お試しください。入力内容は保持しています。Instagramからもお問い合わせいただけます。');
      status.focus();
    } finally {
      clearTimeout(timer); pending = false; button.disabled = false; form.removeAttribute('aria-busy');
    }
  });
})();
