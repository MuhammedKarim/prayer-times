document.addEventListener('DOMContentLoaded', function () {
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
  
  function isJummahPeriod(todayData, tomorrowData) {
    const now = new Date();
    const day = now.getDay();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    if (day === 4 && todayData?.dhuhr?.jamaat) {
      const [h, m] = todayData.dhuhr.jamaat.split(':').map(Number);
      const jummahStart = h * 60 + m + 5;
      return nowMinutes >= jummahStart;
    }

    if (day === 5 && todayData?.dhuhr?.jamaat) {
      const [h, m] = todayData.dhuhr.jamaat.split(':').map(Number);
      const jummahEnd = h * 60 + m + 5;
      return nowMinutes <= jummahEnd;
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

  function getJamaatTime(prayer, today, tomorrow) {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const todayData = allData[today]?.[prayer];
    const tomorrowData = allData[tomorrow]?.[prayer];

    const todayJamaat = todayData?.jamaat || todayData?.start;
    const tomorrowJamaat = tomorrowData?.jamaat || tomorrowData?.start;

    if (!todayJamaat) return formatTo12Hour(tomorrowJamaat) || '--';

    const [h, m] = todayJamaat.split(':').map(Number);
    const jamaatMinutes = h * 60 + m + 5;

    if (nowMinutes < jamaatMinutes) {
      return formatTo12Hour(todayJamaat);
    } else {
      return formatTo12Hour(tomorrowJamaat || todayJamaat);
    }
  }

  function loadPrayerTimes() {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (!allData[todayStr] || !allData[tomorrowStr]) return;

    const zuhrLabel = document.getElementById('zuhr-label');
    if (zuhrLabel) {
      zuhrLabel.textContent = isJummahPeriod(todayStr, tomorrowStr) ? 'JUMMAH' : 'DHUHR';
    }
    
    prayersOrder.forEach(prayer => {
      document.getElementById(`${prayer}-start`).textContent = getStartTime(prayer, todayStr, tomorrowStr);
      if (prayer !== 'sunrise') {
        document.getElementById(`${prayer}-jamaat`).textContent = getJamaatTime(prayer, todayStr, tomorrowStr);
      }
    });
  }


  const MAX_POSTERS = 5;
  let posterImages = [];
  let posterIndex = 0;

  function preloadAndCheckPosters() {
    let loaded = 0;
    for (let i = 1; i <= MAX_POSTERS; i++) {
      const url = `posters/${i}.jpg`;
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
    const imgUrl = posterImages[posterIndex % posterImages.length];
  
    overlay.style.display = 'block';
    overlay.style.setProperty('--poster-image', `url(${imgUrl})`);
  
    overlay.style.setProperty('--poster-image', `url(${imgUrl})`);
    overlay.style.backgroundImage = `url(${imgUrl})`; // fallback if needed
    overlay.style.setProperty('--poster-image', `url(${imgUrl})`);
    overlay.querySelector('::before')?.style.setProperty('background-image', `url(${imgUrl})`);
    overlay.querySelector('::after')?.style.setProperty('background-image', `url(${imgUrl})`);

    setTimeout(() => {
      overlay.style.display = 'none';
      posterIndex++;
    }, 10000);
  }
  
  function startPrayerPosterCycle() {
    if (posterImages.length === 0) return;
  
    setInterval(() => {
      if (!document.getElementById('poster-overlay').style.display || document.getElementById('poster-overlay').style.display === 'none') {
        cyclePosters();
      }
    }, 40000);
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
  
  fetchPrayerTimes();
  updateClock();
  loadPrayerTimes();
  preloadAndCheckPosters();
  
  setInterval(updateClock, 1000);
  setInterval(loadPrayerTimes, 60000);
  setInterval(fetchPrayerTimes, 300000);
  setInterval(refreshPosters, 300000);
});
