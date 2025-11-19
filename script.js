function initPrayerTimes() {
  const prayersOrder = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  let allData = {};

  function formatTo12Hour(timeStr) {
    if (!timeStr) return '--';
    let [hour, minute] = timeStr.split(':').map(Number);
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute.toString().padStart(2, '0')}`;
  }

  function updateClock() {
    const now = new Date();
    let h = now.getHours();
    let m = now.getMinutes();
    h = h % 12;
    if (h === 0) h = 12;
    const formattedTime = `${h}:${m.toString().padStart(2, '0')}`;
  
    document.getElementById('current-time').textContent = formattedTime;
  
    const day = now.getDate();
    const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
    const month = now.toLocaleDateString('en-US', { month: 'long' });
  
    let suffix = 'th';
    if (day === 1 || day === 21 || day === 31) suffix = 'st';
    else if (day === 2 || day === 22) suffix = 'nd';
    else if (day === 3 || day === 23) suffix = 'rd';
  
    const formattedDate = `${weekday} ${day}${suffix} ${month}`;
    var nowH = umalqura();
    document.getElementById('current-date').textContent = formattedDate.toUpperCase();
    document.getElementById('arabic-date').textContent = nowH.format('d MMMM yyyy').toUpperCase() + ' AH';
  }
  
  function isJumuahPeriod(todayStr) {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
  
    const today = new Date(todayStr);
    const day = today.getDay();
  
    const todayData = allData[todayStr];
  
    if (day === 4 && todayData?.dhuhr?.jamat) {
      const [h, m] = todayData.dhuhr.jamat.split(':').map(Number);
      return nowMinutes >= h * 60 + m + 5;
    }
  
    if (day === 5 && todayData?.dhuhr?.jamat) {
      const [h, m] = todayData.dhuhr.jamat.split(':').map(Number);
      return nowMinutes <= h * 60 + m + 5;
    }
  
    return false;
  }
  
  function getStartTime(prayer, today, tomorrow) {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const todayStart = allData[today]?.[prayer]?.start;
    const tomorrowStart = allData[tomorrow]?.[prayer]?.start;

    if (!todayStart) return formatTo12Hour(tomorrowStart) || '--';

    const [h, m] = todayStart.split(':').map(Number);
    const offset = prayer === 'sunrise' ? 15 : 5;
    const prayerMinutes = h * 60 + m + offset;

    if (nowMinutes < prayerMinutes) {
      return formatTo12Hour(todayStart);
    } else {
      return formatTo12Hour(tomorrowStart || todayStart);
    }
  }

  function getJamatTime(prayer, today, tomorrow) {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const todayData = allData[today]?.[prayer];
    const tomorrowData = allData[tomorrow]?.[prayer];

    const todayJamat = todayData?.jamat || todayData?.start;
    const tomorrowJamat = tomorrowData?.jamat || tomorrowData?.start;

    if (!todayJamat) return formatTo12Hour(tomorrowJamat) || '--';

    const [h, m] = todayJamat.split(':').map(Number);
    const jamatMinutes = h * 60 + m + 5;

    if (nowMinutes < jamatMinutes) {
      return formatTo12Hour(todayJamat);
    } else {
      return formatTo12Hour(tomorrowJamat || todayJamat);
    }
  }

  function loadPrayerTimes() {
    const now = new Date();
    const todayStr = now.getFullYear() + '-' +
                 String(now.getMonth() + 1).padStart(2, '0') + '-' +
                 String(now.getDate()).padStart(2, '0');
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = tomorrow.getFullYear() + '-' +
                    String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' +
                    String(tomorrow.getDate()).padStart(2, '0');

    if (!allData[todayStr] || !allData[tomorrowStr]) return;

    document.getElementById('dhuhr-label').textContent = isJumuahPeriod(todayStr) ? 'JUMUAH' : 'DHUHR';
    
    prayersOrder.forEach(prayer => {
      document.getElementById(`${prayer}-start`).textContent = getStartTime(prayer, todayStr, tomorrowStr);
      if (prayer !== 'sunrise') {
        document.getElementById(`${prayer}-jamat`).textContent = getJamatTime(prayer, todayStr, tomorrowStr);
      }
    });
  }

  function updateIshaWeekendHighlight() {
    const el = document.getElementById('isha-jamat');
    if (!el) return;

    const now = new Date();
    const friday = new Date(now);
    while (friday.getDay() !== 5) friday.setDate(friday.getDate() - 1);
    const sunday = new Date(friday);
    sunday.setDate(friday.getDate() + 2);

    const fridayStr = friday.getFullYear() + '-' +
      String(friday.getMonth() + 1).padStart(2, '0') + '-' +
      String(friday.getDate()).padStart(2, '0');

    const sundayStr = sunday.getFullYear() + '-' +
      String(sunday.getMonth() + 1).padStart(2, '0') + '-' +
      String(sunday.getDate()).padStart(2, '0');

    const fridayJamat = allData[fridayStr]?.isha?.jamat || allData[fridayStr]?.isha?.start;
    const sundayJamat = allData[sundayStr]?.isha?.jamat || allData[sundayStr]?.isha?.start;

    if (!fridayJamat || !sundayJamat) {
      el.classList.remove('weekend-red');
      return;
    }

    const [fH, fM] = fridayJamat.split(':').map(Number);
    const [sH, sM] = sundayJamat.split(':').map(Number);
    const friDate = new Date(friday.getFullYear(), friday.getMonth(), friday.getDate(), fH, fM);
    const sunDate = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate(), sH, sM);

    if (now >= friDate && now < sunDate) {
      el.classList.add('weekend-red');
    } else {
      el.classList.remove('weekend-red');
    }
  }

  let dhikrData = null;

  function parseHHMMToToday(hhmm) {
    if (!hhmm) return null;
    const [h, m] = hhmm.split(":").map(Number);
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
  }

  function getDisplayTime(slot) {
    if (!dhikrData) return null;
    const todayVal = dhikrData.today[slot];
    const tomorrowVal = dhikrData.tomorrow[slot];
    if (!todayVal) return tomorrowVal || null;
    const now = new Date();
    const todayTime = parseHHMMToToday(todayVal);
    const fifteens = 15 * 60 * 1000;
    if (now - todayTime >= fifteens) return tomorrowVal || todayVal;
    return todayVal;
  }

  function checkDhikr() {
  fetch('https://sufi.org.uk/live-dzp', { cache: "no-store" })
    .then(res => res.json())
    .then(status => {
      dhikrData = status;
      if (!dhikrData) return;
      document.getElementById("dhikr-morning").textContent = formatTo12Hour(getDisplayTime("morning")) || "12:00";
      document.getElementById("dhikr-evening").textContent = formatTo12Hour(getDisplayTime("evening")) || "12:00";
      // document.getElementById("dhikr-night").textContent =  formatTo12Hour(getDisplayTime("night")) || "12:00";
    })
    .catch(err => console.error("Dhikr fetch error:", err));
}

  const MAX_POSTERS = 5;
  let posterImages = [];
  let posterIndex = 0;

  function shouldIncludePhotosPoster() {
    const now = new Date();
    const day = now.getDay();
    const minutes = now.getHours() * 60 + now.getMinutes();

    if (day === 4 && minutes >= 1260) return true;
    if (day === 5 && minutes <= 840) return true;
    return false;
  }

  function preloadAndCheckPosters() {
    let loaded = 0;
    posterImages = [];

    const max = MAX_POSTERS;
    const total = shouldIncludePhotosPoster() ? max + 1 : max;

    for (let i = 1; i <= max; i++) {
      const url = `posters/${i}.jpg?t=${Date.now()}`;
      const img = new Image();
      img.onload = () => {
        posterImages.push(url);
        loaded++;
        if (loaded === total) startPrayerPosterCycle();
      };
      img.onerror = () => {
        loaded++;
        if (loaded === total) startPrayerPosterCycle();
      };
      img.src = url;
    }

    if (shouldIncludePhotosPoster()) {
      const url = `posters/photos.jpg?t=${Date.now()}`;
      const img = new Image();
      img.onload = () => {
        posterImages.push(url);
        loaded++;
        if (loaded === total) startPrayerPosterCycle();
      };
      img.onerror = () => {
        loaded++;
        if (loaded === total) startPrayerPosterCycle();
      };
      img.src = url;
    }
  }

  function cyclePosters() {
    if (posterImages.length === 0) return;

    const overlay = document.getElementById('poster-overlay');
    const img = overlay.querySelector('.poster-img');
    const imgUrl = posterImages[posterIndex % posterImages.length];

    overlay.style.setProperty('--poster-url', `url(${imgUrl})`);
    img.src = imgUrl;
    overlay.style.display = 'block';
    setTimeout(() => {
      overlay.style.opacity = '1';
    }, 10);

    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.style.display = 'none';
        posterIndex++;
      }, 1500);
    }, 10000);
  }
  
  let posterCycleInterval = null;
  function startPrayerPosterCycle() {
    if (posterImages.length === 0 || posterCycleInterval) return;

    posterCycleInterval = setInterval(() => {
      const overlay = document.getElementById('poster-overlay');
      if (!overlay.style.display || overlay.style.display === 'none') {
        cyclePosters();
      }
    }, 60000);
  }

  function stopPosterCycle() {
    if (posterCycleInterval) {
      clearInterval(posterCycleInterval);
      posterCycleInterval = null;
    }
    const overlay = document.getElementById('poster-overlay');
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 1500);
  }

  let makroohShowing = false;

  function checkMakroohPoster() {
    const now = new Date();
    const todayStr = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0');

    const dhuhrStartStr = allData[todayStr]?.dhuhr?.start;
    if (!dhuhrStartStr) return;

    const [h, m] = dhuhrStartStr.split(':').map(Number);
    const dhuhrStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    const makroohStart = new Date(dhuhrStart.getTime() - 10 * 60000); // 10 mins before
    const makroohEnd = new Date(dhuhrStart); // end at Dhuhr start

    if (now >= makroohStart && now < makroohEnd) {
      if (!makroohShowing) {
        makroohShowing = true;
        document.getElementById('makrooh-overlay').style.display = 'block';
      }
    } else {
      if (makroohShowing) {
        makroohShowing = false;
        document.getElementById('makrooh-overlay').style.display = 'none';
      }
    }
  }

  function checkLiveStatusAndToggleOverlay() {
    fetch('https://sufi.org.uk/live-status')
      .then(res => res.json())
      .then(status => {
        // const dimOverlay = document.getElementById('dim-overlay');
        // const shouldShowDim = status.isLive && status.kalimat == 'Muraaqabah';
        // dimOverlay.style.display = shouldShowDim ? 'block' : 'none';
        // dimOverlay.style.opacity = shouldShowDim ? '1' : '0';
        if (status.isLive) {
          stopPosterCycle();
          startKalimatPolling();
        } else {
          stopKalimatPolling();
          startPrayerPosterCycle();
        }
      })
      .catch(err => {
        console.error('Failed to fetch live status:', err);
      });
  }

  let currentKalimat = null;
  let kalimatInterval = null;

  function fetchKalimatStatus() {
    fetch('https://sufi.org.uk/live-status')
      .then(res => res.json())
      .then(status => {
        const kalimatOverlay = document.getElementById('kalimat-overlay');
        const kalimatImg = kalimatOverlay.querySelector('.kalimat-img');

        if (!status.isLive || !status.kalimat) {
          kalimatOverlay.style.opacity = '0';
          setTimeout(() => {
            kalimatOverlay.style.display = 'none';
          }, 1500);
          currentKalimat = null;
          return;
        }

        if (status.kalimat !== currentKalimat) {
          if (status.kalimat == 'blank' && currentKalimat == "Dua") status.kalimat = null
          const kalimatPath = `kalimat/${status.kalimat}.jpg?t=${Date.now()}`;
          const img = new Image();
          img.onload = () => {
            kalimatImg.src = kalimatPath;
            kalimatOverlay.style.setProperty('--kalimat-url', `url(${kalimatPath})`);
            kalimatOverlay.style.display = 'block';
            setTimeout(() => {
              kalimatOverlay.style.opacity = '1';
            }, 10);
            currentKalimat = status.kalimat;
          };
          img.onerror = () => {
            console.warn(`Missing kalimat image: ${kalimatPath}`);
            kalimatOverlay.style.opacity = '0';
            setTimeout(() => {
              kalimatOverlay.style.display = 'none';
            }, 1500);
            currentKalimat = null;
          };
          img.src = kalimatPath;
        } else {
          kalimatOverlay.style.display = 'block';
          kalimatOverlay.style.opacity = '1';
        }
      })
      .catch(err => {
        console.error('Failed to fetch kalimat:', err);
      });
  }

  function startKalimatPolling() {
    if (!kalimatInterval) {
      kalimatInterval = setInterval(fetchKalimatStatus, 1000);
    }
  }

  function stopKalimatPolling() {
    clearInterval(kalimatInterval);
    kalimatInterval = null;
    currentKalimat = null;
    const overlay = document.getElementById('kalimat-overlay');
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 1500);
  }

  const FRI_DUROOD_URL = 'posters/fri_durood.jpg';
  let fridayDuroodShowing = false;

  function inFridayDuroodWindow() {
    const now = new Date();
    if (now.getDay() !== 5) return false;
    const todayStr = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0');
    const asr = allData?.[todayStr]?.asr;
    if (!asr) return false;
    const jamatStr = (asr.jamat || asr.start);
    if (!jamatStr) return false;
    const [H, M] = jamatStr.split(':').map(Number);
    const jamat = new Date(now.getFullYear(), now.getMonth(), now.getDate(), H, M, 0, 0);
    const windowStart = new Date(jamat.getTime() + 4 * 60 * 1000);
    const windowEnd   = new Date(windowStart.getTime() + 15 * 60 * 1000);
    return now >= windowStart && now < windowEnd;
  }

  function showFridayDurood() {
    const overlay = document.getElementById('friday-durood-overlay');
    const img = overlay.querySelector('.poster-img');
    const url = `${FRI_DUROOD_URL}?t=${Date.now()}`;
    overlay.style.setProperty('--friday-durood-url', `url(${url})`);
    img.src = url;
    overlay.style.display = 'block';
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });
  }

  function hideFridayDurood() {
    const overlay = document.getElementById('friday-durood-overlay');
    overlay.style.opacity = '0';
    setTimeout(() => { overlay.style.display = 'none'; }, 1500);
  }

  function checkFridayDuroodOverlay() {
    if (inFridayDuroodWindow()) {
      if (!fridayDuroodShowing) {
        fridayDuroodShowing = true;
        showFridayDurood();
      }
    } else if (fridayDuroodShowing) {
      fridayDuroodShowing = false;
      hideFridayDurood();
    }
  }

  function fetchPrayerTimes() {
    fetch(`prayer-times.json?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        allData = data;
        loadPrayerTimes();
        updateIshaWeekendHighlight();
      });
  }
  
  function refreshPosters() {
    posterImages = [];
    posterIndex = 0;
    preloadAndCheckPosters();
  }
  
  let currentVersion = null;
  function checkVersionAndReload() {
    fetch(`version.json?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (currentVersion && data.version !== currentVersion) {
          location.reload(true);
        }
        currentVersion = data.version;
      });
  }
  
  fetchPrayerTimes();
  updateClock();
  loadPrayerTimes();
  checkDhikr();
  checkMakroohPoster();
  preloadAndCheckPosters();
  checkLiveStatusAndToggleOverlay();
  
  setInterval(updateClock, 1000);
  setInterval(loadPrayerTimes, 60000);
  setInterval(checkDhikr, 60000);
  setInterval(updateIshaWeekendHighlight, 30000);
  setInterval(checkMakroohPoster, 1000);
  setInterval(checkFridayDuroodOverlay, 1000);
  setInterval(fetchPrayerTimes, 300000);
  setInterval(refreshPosters, 300000);
  setInterval(checkLiveStatusAndToggleOverlay, 5000);
  setInterval(checkVersionAndReload, 60000);
}
