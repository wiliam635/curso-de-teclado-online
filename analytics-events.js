(function () {
  var video = document.querySelector('.hero-video video');
  var progressMarks = [25, 50, 75];
  var sentMarks = Object.create(null);
  var started = false;
  var completed = false;
  var watchedSeconds = 0;
  var lastVideoTime = 0;

  function send(name, parameters) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, parameters || {});
    }
  }

  function getSessionValue(key) {
    try { return window.sessionStorage.getItem(key); } catch (_) { return null; }
  }

  function setSessionValue(key, value) {
    try { window.sessionStorage.setItem(key, value); } catch (_) {}
  }

  if (video) {
    if ('IntersectionObserver' in window) {
      var impressionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            send('sales_video_impression', { video_title: 'Curso de Teclado Online' });
            impressionObserver.disconnect();
          }
        });
      }, { threshold: [0.5] });
      impressionObserver.observe(video);
    }

    video.addEventListener('play', function () {
      if (started) return;
      started = true;
      lastVideoTime = video.currentTime;
      send('sales_video_start', { video_title: 'Curso de Teclado Online', video_method: 'html5' });
    });

    video.addEventListener('seeking', function () { lastVideoTime = video.currentTime; });
    video.addEventListener('seeked', function () { lastVideoTime = video.currentTime; });

    video.addEventListener('timeupdate', function () {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      if (!video.paused && !video.seeking) {
        var delta = video.currentTime - lastVideoTime;
        if (delta > 0 && delta <= 2) watchedSeconds += delta;
      }
      lastVideoTime = video.currentTime;
      var percent = Math.floor((watchedSeconds / video.duration) * 100);
      progressMarks.forEach(function (mark) {
        if (percent >= mark && !sentMarks[mark]) {
          sentMarks[mark] = true;
          if (mark >= 25) setSessionValue('teclado_sales_video_watched', '1');
          send('sales_video_progress', { video_title: 'Curso de Teclado Online', percent_watched: mark });
        }
      });
    });

    video.addEventListener('ended', function () {
      if (completed) return;
      completed = true;
      setSessionValue('teclado_sales_video_watched', '1');
      setSessionValue('teclado_sales_video_completed', '1');
      send('sales_video_complete', { video_title: 'Curso de Teclado Online', video_method: 'html5' });
    });
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;

    var checkout;
    try {
      checkout = new URL(link.href, window.location.href);
    } catch (_) {
      return;
    }
    if (checkout.hostname !== 'pay.hotmart.com') return;

    var watched = getSessionValue('teclado_sales_video_watched') === '1';
    var videoCompleted = getSessionValue('teclado_sales_video_completed') === '1';
    var details = {
      destination: 'hotmart',
      video_watched: watched,
      video_completed: videoCompleted,
    };
    send('checkout_click', details);
    if (watched) send('checkout_click_after_video_view', details);
  });
})();
