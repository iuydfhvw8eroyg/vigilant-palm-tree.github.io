document.addEventListener('DOMContentLoaded', function () {
    let currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth();
    const calendarGrid = document.getElementById('calendar-grid');
    const currentMonthYearElement = document.getElementById('current-month-year');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    const moodModal = document.getElementById('mood-modal');
    const modalDateElement = document.getElementById('modal-date');
    const moodInput = document.getElementById('mood-input');
    const saveValueButton = document.getElementById('save-button');
    const clearValueButton = document.getElementById('clear-button');
    const closeModalButton = document.getElementById('close-modal');
    let moodData = JSON.parse(localStorage.getItem('moodData')) || {};
    const moodLegend = [
        { max: 100, key: '<100' },
        { max: 300, key: '100-300' },
        { max: 500, key: '300-500' },
        { max: 700, key: '500-700' },
        { max: 900, key: '700-900' },
        { max: 1100, key: '900-1100' },
        { max: 1300, key: '1100-1300' },
        { max: Infinity, key: '>1300' },
        { max: Infinity, key: 'binge' }
    ];
    function normalizeDateKey(year, month, day) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
                const dateKey = normalizeDateKey(year, month + 1, currentDay);
                if (moodData[dateKey]) {
                    const emojiElement = document.createElement('div');
                    emojiElement.className = 'day-emoji';
                    const emojiImg = getEmojiByMood(moodData[dateKey].range);
                    if (emojiImg) emojiElement.appendChild(emojiImg);
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
    function getEmojiByMood(key) {
        const icons = {
            '<100': 'icons/icon1-arrow-down.png',
            '100-300': 'icons/icon2-hot-cup.png',
            '300-500': 'icons/icon3-black-paw.png',
            '500-700': 'icons/icon4-white-paw.png',
            '700-900': 'icons/icon5-flag.png',
            '900-1100': 'icons/icon6-kitty.png',
            '1100-1300': 'icons/icon7-crying.png',
            '>1300': 'icons/icon8-arrow-up.png',
            'binge': 'icons/icon9-cat-with-sign.png',
        };
        if (icons[key]) {
            const img = document.createElement('img');
            img.src = icons[key];
            img.alt = key;
            img.className = 'day-emoji-img';
            return img;
        }
        return null;
    }
    function determineMood(value) {
        for (let entry of moodLegend) {
            if (value <= entry.max) return entry.key;
        }
        return null;
    }
    function openMoodModal(year, month, day) {
        const date = new Date(year, month - 1, day);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        modalDateElement.textContent = date.toLocaleDateString('en-US', options);
        moodModal.dataset.year = year;
        moodModal.dataset.month = month;
        moodModal.dataset.day = day;
        moodInput.value = '';
        moodModal.style.display = 'flex';
    }
    function closeMoodModal() {
        moodModal.style.display = 'none';
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
        document.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX, false);
        document.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            if (touchEndX < touchStartX - 50) nextMonthButton.click();
            else if (touchEndX > touchStartX + 50) prevMonthButton.click();
        }, false);
        saveValueButton.addEventListener('click', () => {
            const input = moodInput.value.trim();
            let value = null;
            let range = null;
            
            if (input.toLowerCase().startsWith('binge:')) {
                const val = parseInt(input.split(':')[1], 10);
                if (!isNaN(val)) {
                    value = val;
                    range = 'binge';
                }
            } else {
                value = parseInt(input, 10);
                if (!isNaN(value)) {
                    range = determineMood(value);
                }
            }
            
            if (value !== null && range !== null) {
                const dateKey = normalizeDateKey(
                    moodModal.dataset.year,
                    moodModal.dataset.month,
                    moodModal.dataset.day
                );
                
                moodData[dateKey] = {
                    value: value,
                    range: range
                };
                localStorage.setItem('moodData', JSON.stringify(moodData));
                renderCalendar(currentYear, currentMonth);
            }
            closeMoodModal();
        });
        clearValueButton.addEventListener('click', () => {
            const dateKey = `${moodModal.dataset.year}-${moodModal.dataset.month}-${moodModal.dataset.day}`;
            delete moodData[dateKey];
            localStorage.setItem('moodData', JSON.stringify(moodData));
            renderCalendar(currentYear, currentMonth);
            closeMoodModal();
        });
        closeModalButton.addEventListener('click', closeMoodModal);
        moodModal.addEventListener('click', e => {
            if (e.target === moodModal) closeMoodModal();
        });
    }
    renderCalendar(currentYear, currentMonth);
    setupEventListeners();
});
