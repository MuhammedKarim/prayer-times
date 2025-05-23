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
    document.getElementById('current-date').textContent = formattedDate.toUpperCase();
  }
  
  function isJumuahPeriod(todayStr) {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
  
    const today = new Date(todayStr);
    const day = today.getDay();
  
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    const tomorrowStr = tomorrow.getFullYear() + '-' +
                    String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' +
                    String(tomorrow.getDate()).padStart(2, '0');
  
    const todayData = allData[todayStr];
    const tomorrowData = allData[tomorrowStr];
  
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
    const prayerMinutes = h * 60 + m + 5;

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


  const MAX_POSTERS = 5;
  let posterImages = [];
  let posterIndex = 0;

  function preloadAndCheckPosters() {
    let loaded = 0;
    for (let i = 1; i <= MAX_POSTERS; i++) {
      const url = `posters/${i}.jpg?t=${Date.now()}`;
      const img = new Image();
      img.onload = () => {
        posterImages.push(url);
        loaded++;
        if (loaded === MAX_POSTERS) startPrayerPosterCycle();
      };
      img.onerror = () => {
        loaded++;
        if (loaded === MAX_POSTERS) startPrayerPosterCycle();
      };
      img.src = url;
    }
  }

  function cyclePosters() {
    if (posterImages.length === 0) return;
  
    const overlay = document.getElementById('poster-overlay');
    const img = overlay.querySelector('.poster-img');
    const imgUrl = posterImages[posterIndex % posterImages.length];
  
    overlay.style.display = 'block';
    overlay.style.setProperty('--poster-url', `url(${imgUrl})`);
    img.src = imgUrl;
  
    setTimeout(() => {
      overlay.style.display = 'none';
      posterIndex++;
    }, 10000);
  }
  
  let posterCycleInterval = null;
  function startPrayerPosterCycle() {
    if (posterImages.length === 0) return;
    
    if (posterCycleInterval) {
      clearInterval(posterCycleInterval);
    }

    posterCycleInterval = setInterval(() => {
      const overlay = document.getElementById('poster-overlay');
      if (!overlay.style.display || overlay.style.display === 'none') {
        cyclePosters();
      }
    }, 60000);
  }

  function checkLiveStatusAndToggleOverlay() {
    fetch('https://live-status.muhammedkarim.workers.dev/')
      .then(res => res.json())
      .then(status => {
        const overlay = document.getElementById('dim-overlay');
        const shouldShowOverlay = status.isLive && status.kalimat !== 'kk-bayan'
        overlay.style.display = shouldShowOverlay ? 'block' : 'none';      
      })
      .catch(err => {
        console.error('Failed to fetch live status:', err);
      });
  }

  function fetchPrayerTimes() {
    fetch(`prayer-times.json?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        allData = data;
        loadPrayerTimes();
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
  preloadAndCheckPosters();
  checkLiveStatusAndToggleOverlay();
  
  setInterval(updateClock, 1000);
  setInterval(loadPrayerTimes, 60000);
  setInterval(fetchPrayerTimes, 300000);
  setInterval(refreshPosters, 300000);
  setInterval(checkLiveStatusAndToggleOverlay, 5000);
  setInterval(checkVersionAndReload, 60000);
}
