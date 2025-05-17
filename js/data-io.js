// In data-io.js, at the top of the file
if (!localStorage.getItem('moodData')) {
    localStorage.setItem('moodData', JSON.stringify({}));
}
const DataManager = {
    init: function() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('import-button')) {
                this.importData();
            } else if (e.target.classList.contains('export-button')) {
                this.exportData();
            }
        });
    },
    getPeriodRange: function(period, offset = 0) {
        const now = new Date();
        let start, end;
        switch(period) {
            case '7days':
                start = new Date(now);
                start.setDate(now.getDate() - now.getDay() + 1 + (offset * 7));
                start.setHours(0, 0, 0, 0);
                end = new Date(start);
                end.setDate(start.getDate() + 6);
                break;
            case '1month':
                start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
                end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
                break;
            case '1year':
                start = new Date(now.getFullYear() + offset, 0, 1);
                end = new Date(now.getFullYear() + offset, 11, 31);
                break;
            case 'all':
            default:
                return null;
        }
        end.setHours(23, 59, 59, 999);
        return { start, end };
    },
    generateDateRange: function(startDate, endDate) {
        const dates = [];
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates.map(date => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        });
    },
    getFilteredData: function(period, offset = 0) {
        const moodData = JSON.parse(localStorage.getItem('moodData') || '{}');
        let result = [];
        const range = this.getPeriodRange(period, offset);
        if (!range) return [];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthNamesShort = ["J", "F", "M", "A", "M", "J", 
            "J", "A", "S", "O", "N", "D"];
        switch(period) {
            case '7days':
                const weekDates = this.generateDateRange(range.start, range.end);
                result = weekDates.map(dateStr => {
                    const entry = moodData[dateStr];
                    const date = new Date(dateStr);
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    return {
                        label: dayName,
                        value: entry ? entry.value : null,
                        rawDate: dateStr
                    };
                });
                break;
            case '1month':
                const monthDates = this.generateDateRange(range.start, range.end);
                result = monthDates.map(dateStr => {
                    const entry = moodData[dateStr];
                    const date = new Date(dateStr);
                    const dayNum = date.getDate();
                    return {
                        label: dayNum.toString(),
                        value: entry ? entry.value : null,
                        rawDate: dateStr
                    };
                });
                break;
        case '1year':
            const monthsMap = new Map();
            for (let i = 0; i < 12; i++) {
                monthsMap.set(i, {
                    label: monthNamesShort[i],
                    value: 0,
                    dayCount: 0
                });
            }
            Object.entries(moodData).forEach(([dateStr, entry]) => {
                if (!entry || entry.value === null) return;
                const date = new Date(dateStr);
                if (date < range.start || date > range.end) return;
                const month = date.getMonth();
                const monthData = monthsMap.get(month);
                monthData.value += entry.value;
                monthData.dayCount++;
            });
            result = Array.from(monthsMap.values()).map(month => ({
                label: month.label,
                value: month.dayCount > 0 ? Math.round(month.value / month.dayCount) : null,
                rawDate: `${range.start.getFullYear()}-${monthNamesShort.indexOf(month.label) + 1}-01`
            }));
            break;
        }
        return result;
    },
    getWeekStartDate: function(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    },
    getLabelForDate: function(dateStr, period) {
        const date = new Date(dateStr);
        switch(period) {
            case '7days':
                return date.toLocaleDateString('en-US', { weekday: 'short' });
            case '1month':
                return date.getDate().toString();
            case '1year':
                return date.toLocaleDateString('en-US', { month: 'short' });
            default:
                return dateStr;
        }
    },
    getISOWeek: function(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
        const week1 = new Date(d.getFullYear(), 0, 4);
        return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    },
    getAverage: function(data, period) {
        if (!data || !Array.isArray(data)) return 0;
        if (period === '7days' || period === '1month') {
            const values = data.filter(d => d.value !== null).map(d => d.value);
            if (values.length === 0) return 0;
            const sum = values.reduce((total, val) => total + val, 0);
            return Math.round(sum / values.length);
        }
        let totalSum = 0;
        let totalDays = 0;
        data.forEach(item => {
            if (item.value !== null) {
                const daysInPeriod = period === '6months' ? 7 : 
                                    period === '1year' ? 30 : 1;
                totalSum += item.value * daysInPeriod;
                totalDays += daysInPeriod;
            }
        });
        return totalDays > 0 ? Math.round(totalSum / totalDays) : 0;
    },
    getDailyAverage: function(period, offset) {
        const moodData = JSON.parse(localStorage.getItem('moodData') || '{}');
        const range = this.getPeriodRange(period, offset);
        if (!range) return 0;
        const allDates = this.generateDateRange(range.start, range.end);
        let sum = 0;
        let daysWithData = 0;
    
        allDates.forEach(dateStr => {
            const entry = moodData[dateStr];
            if (entry && entry.value !== null) {
                sum += entry.value;
                daysWithData++;
            }
        });
        return daysWithData > 0 ? Math.round(sum / daysWithData) : 0;
    },
    exportData: function() {
        try {
            const moodData = JSON.parse(localStorage.getItem('moodData') || '{}');
            const settings = JSON.parse(localStorage.getItem('settings') || '{}');
            const exportData = {
                moodData: moodData,
                settings: settings,
                exportedAt: new Date().toISOString(),
                app: "Tracking app"
            };
            const filename = `tracker-data-${new Date().toISOString().slice(0,10)}.json`;
            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        } catch (error) {
            console.error('Export error:', error);
        }
    },
    importData: function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const fileContent = await file.text();
                const parsedData = JSON.parse(fileContent);
                if (!parsedData.moodData) {
                    console.error('Invalid data format');
                    return;
                }
                localStorage.setItem('moodData', JSON.stringify(parsedData.moodData));
                
                if (parsedData.settings) {
                    localStorage.setItem('settings', JSON.stringify(parsedData.settings));
                }
                if (window.location.pathname.includes('index.html') || 
                    window.location.pathname.includes('statistics.html')) {
                    window.location.reload();
                }
            } catch (error) {
                console.error('Import error:', error);
            }
        };
        input.click();
    }
};
DataManager.init();