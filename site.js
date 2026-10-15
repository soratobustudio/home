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

  // Event dates use Japan time. Keep events visible throughout their final day.
  const japanDay = (now = new Date()) => new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(now);
  const newsList = document.querySelector('.news-list');
  if (newsList) {
    const fullNews = !!document.querySelector('.news-page');
    let sourceItems = Array.from(newsList.querySelectorAll('.news-item'));
    let archive;
    let empty;
    const endDate = item => item.dataset.eventEnd || '';
    if (fullNews) {
      archive = document.createElement('details');
      archive.id = 'archive';
      archive.className = 'news-archive';
      const summary = document.createElement('summary');
      summary.textContent = english ? 'Past events' : '過去のお知らせ';
      archive.append(summary);
      const note = document.createElement('p');
      note.textContent = english ? 'These events have ended. Dates, venues and fees are shown as originally announced.' : '以下のイベントは開催終了しています。日時・会場・料金は告知当時の情報です。';
      archive.append(note);
      const list = document.createElement('div');
      list.className = 'news-list';
      archive.append(list);
      newsList.after(archive);
      if (location.hash === '#archive') archive.open = true;
      window.addEventListener('hashchange', () => {
        if (location.hash === '#archive') archive.open = true;
      });
    }
    const renderNews = () => {
      const today = japanDay();
      const upcoming = sourceItems.filter(item => !endDate(item) || endDate(item) >= today);
      newsList.replaceChildren(...(fullNews ? upcoming : upcoming.slice(0, 3)));
      if (!empty) {
        empty = document.createElement('p');
        empty.className = 'news-empty';
        empty.textContent = english ? 'No upcoming events are currently announced. Please see our past events below.' : '現在、開催予定のお知らせはありません。過去のお知らせもご覧いただけます。';
        newsList.after(empty);
      }
      empty.hidden = upcoming.length > 0;
      if (fullNews) {
        const past = sourceItems.filter(item => endDate(item) && endDate(item) < today)
          .sort((a, b) => endDate(b).localeCompare(endDate(a)));
        const list = archive.querySelector('.news-list');
        list.replaceChildren(...past);
        archive.querySelector('summary').textContent = english ? 'Past events (' + past.length + ')' : '過去のお知らせ（' + past.length + '件）';
        if (!past.length) {
          const p = document.createElement('p');
          p.textContent = english ? 'No archived events yet.' : '現在、過去のお知らせはありません。';
          list.append(p);
        }
        past.forEach(item => {
          if (!item.querySelector('.event-ended')) {
            const badge = document.createElement('p');
            badge.className = 'event-ended';
            badge.textContent = english ? 'Event ended' : '開催終了';
            item.querySelector('.news-info').prepend(badge);
            item.querySelectorAll('.news-link').forEach(a => a.remove());
          }
        });
      }
    };
    renderNews();
    if (!fullNews) {
      fetch(new URL('news.html', location.href))
        .then(response => { if (!response.ok) throw new Error('News unavailable'); return response.text(); })
        .then(html => {
          const doc = new DOMParser().parseFromString(html, 'text/html');
          sourceItems = Array.from(doc.querySelectorAll('.news-list .news-item')).map(item => document.importNode(item, true));
          renderNews();
        }).catch(() => { /* Retain the filtered inline announcements if offline. */ });
    }
    // Refresh an open page after Japan midnight and when returning to the tab.
    window.setInterval(renderNews, 60000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) renderNews(); });
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
