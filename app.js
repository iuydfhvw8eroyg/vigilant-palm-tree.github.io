document.addEventListener('DOMContentLoaded', function() {
    let currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth();
    const calendarGrid = document.getElementById('calendar-grid');
    const currentMonthYearElement = document.getElementById('current-month-year');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    const moodModal = document.getElementById('mood-modal');
    const modalDateElement = document.getElementById('modal-date');
    const emojiOptions = document.querySelectorAll('.emoji-option');
    const clearMoodButton = document.getElementById('clear-mood');
    let moodData = JSON.parse(localStorage.getItem('moodData')) || {};
    function initCalendar() {
        renderCalendar(currentYear, currentMonth);
        setupEventListeners();
    }
    function renderCalendar(year, month) {
        calendarGrid.innerHTML = '';
        const monthNames = ["January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"];
        currentMonthYearElement.textContent = `${monthNames[month]} ${year}`;
        const firstDay = new Date(year, month, 1).getDay() || 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        let dayCount = daysInPrevMonth - firstDay + 2;
        for (let i = 0; i < 42; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'day';
            if (i < firstDay - 1) {
                dayElement.innerHTML = `<span class="day-number">${dayCount++}</span>`;
                dayElement.classList.add('inactive');
            } else if (i < firstDay - 1 + daysInMonth) {
                const currentDay = i - firstDay + 2;
                dayElement.innerHTML = `<span class="day-number">${currentDay}</span>`;
                const today = new Date();
                if (year === today.getFullYear() && month === today.getMonth() && currentDay === today.getDate()) {
                    dayElement.classList.add('today');
                }
                const dateKey = `${year}-${month + 1}-${currentDay}`;
                if (moodData[dateKey]) {
                    const emojiElement = document.createElement('div');
                    emojiElement.className = 'day-emoji';
                    const emojiImg = getEmojiByMood(moodData[dateKey]);
                    if (emojiImg) {
                        emojiElement.appendChild(emojiImg);
                    }
                    dayElement.appendChild(emojiElement);
                }
                dayElement.addEventListener('click', () => openMoodModal(year, month + 1, currentDay));
            } else {
                dayElement.innerHTML = `<span class="day-number">${i - firstDay - daysInMonth + 2}</span>`;
                dayElement.classList.add('inactive');
            }
            calendarGrid.appendChild(dayElement);
        }
    }
    function openMoodModal(year, month, day) {
        const date = new Date(year, month - 1, day);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        modalDateElement.textContent = date.toLocaleDateString('en-US', options);
        moodModal.dataset.year = year;
        moodModal.dataset.month = month;
        moodModal.dataset.day = day;
        moodModal.style.display = 'flex';
    }
    function closeMoodModal() {
        moodModal.style.display = 'none';
    }
    function getEmojiByMood(mood) {
        const icons = {
            'happy': 'icons/icon1-arrow-down.png',
            'sad': 'icons/icon2-hot-cup.png',
            'angry': 'icons/icon3-black-paw.png',
            'tired': 'icons/icon4-white-paw.png',
            'neutral': 'icons/icon5-flag.png',
            'excited': 'icons/icon6-kitty.png',
            'loved': 'icons/icon7-crying.png',
            'depressed': 'icons/icon8-arrow-up.png',
            'scared': 'icons/icon8-cat-with-sign.png',
        };
        if (icons[mood]) {
            const img = document.createElement('img');
            img.src = icons[mood];
            img.alt = mood;
            img.className = 'day-emoji-img';
            return img;
        }
        return null;
    }
    function setupEventListeners() {
        prevMonthButton.addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar(currentYear, currentMonth);
        });
        nextMonthButton.addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar(currentYear, currentMonth);
        });
        let touchStartX = 0;
        let touchEndX = 0;
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, false);
        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, false);
        function handleSwipe() {
            if (touchEndX < touchStartX - 50) {
                nextMonthButton.click();
            } else if (touchEndX > touchStartX + 50) {
                prevMonthButton.click();
            }
        }
        emojiOptions.forEach(option => {
            option.addEventListener('click', () => {
                const mood = option.dataset.mood;
                const dateKey = `${moodModal.dataset.year}-${moodModal.dataset.month}-${moodModal.dataset.day}`;
                moodData[dateKey] = mood;
                localStorage.setItem('moodData', JSON.stringify(moodData));
                renderCalendar(currentYear, currentMonth);
                closeMoodModal();
            });
        });
        clearMoodButton.addEventListener('click', () => {
            const dateKey = `${moodModal.dataset.year}-${moodModal.dataset.month}-${moodModal.dataset.day}`;
            delete moodData[dateKey];
            localStorage.setItem('moodData', JSON.stringify(moodData));
            renderCalendar(currentYear, currentMonth);
            closeMoodModal();
        });
        moodModal.addEventListener('click', (e) => {
            if (e.target === moodModal) {
                closeMoodModal();
            }
        });
    }
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful');
                })
                .catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }
    initCalendar();
});