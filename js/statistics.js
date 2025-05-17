document.addEventListener('DOMContentLoaded', function() {
    const periodSelect = document.getElementById('period-select');
    const averageValue = document.getElementById('average-value');
    const prevButton = document.getElementById('prev-period');
    const nextButton = document.getElementById('next-period');
    const chartCanvas = document.getElementById('chart');
    let chart = null;
    let currentOffset = 0;
    let currentPeriod = '7days';
    periodSelect.innerHTML = `
        <option value="7days">Week</option>
        <option value="1month">Month</option>
        <option value="1year">Year</option>`;
    function safeParseDate(dateStr) {
        if (!dateStr) return new Date(NaN);
        if (/^\d{4}-\d{1,2}-\d{1,2}(?:$|T)/.test(dateStr)) {
            const parts = dateStr.split('-').map(p => parseInt(p, 10));
            return new Date(parts[0], parts[1] - 1, parts[2]);
        }
        if (dateStr.includes(' to ')) {
            const [start] = dateStr.split(' to ');
            const parts = start.split('-').map(p => parseInt(p, 10));
            return new Date(parts[0], parts[1] - 1, parts[2]);
        }
        return new Date(dateStr);
    }
    function initChart(labels = [], data = []) {
        if (chart) chart.destroy();
        const ctx = chartCanvas.getContext('2d');
        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: data.map((val, index) => {
                        const item = DataManager.getFilteredData(currentPeriod, currentOffset)[index];
                        if (item?.isMonthMarker) return 'transparent';
                        return val !== null ? 'rgba(206, 136, 151, 0.9)' : 'rgba(200, 200, 200, 0.2)';
                    }),
                    borderColor: data.map((val, index) => {
                        const item = DataManager.getFilteredData(currentPeriod, currentOffset)[index];
                        if (item?.isMonthMarker) return 'transparent';
                        return val !== null ? 'rgb(192, 75, 100)' : 'rgba(200, 200, 200, 0.5)';
                    }),
                    borderWidth: 0,
                    borderRadius: 1,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grace: '15%',
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: '#5A3E3E',
                            callback: function(value) {
                                return Number.isInteger(value) ? value : '';
                            },

                            maxTicksLimit: 6
                        }
                    },
                    x: {
                        grid: {
                            display: true,
                            color: function(context) {
                                const item = DataManager.getFilteredData(currentPeriod, currentOffset)[context.index];
                                if (currentPeriod === '7days' || currentPeriod === '1year') {
                                    return 'rgba(0, 0, 0, 0.1)';
                                }
                                if (currentPeriod === '1month') {
                                    if (item?.rawDate) {
                                        const date = new Date(item.rawDate);
                                        return date.getDay() === 1 ? 'rgba(0, 0, 0, 0.1)' : 'transparent';
                                    }
                                }
                                return 'transparent';
                            },
                        },
                        ticks: {
                            callback: function(value, index) {
                                const item = DataManager.getFilteredData(currentPeriod, currentOffset)[index];
                                
                                if (currentPeriod === '1month' && item?.rawDate) {
                                    const date = new Date(item.rawDate);
                                    const day = date.getDate();
                                    const isMonday = date.getDay() === 1;
                                    return isMonday ? day.toString() : '';
                                }
                                return this.getLabelForValue(value);
                            },
                            autoSkip: false,
                            maxRotation: 0,
                            minRotation: 0
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: '#5A3E3E',
                        bodyColor: '#5A3E3E',
                        borderColor: 'rgba(75, 192, 192, 0.5)',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const isAggregated = ['1year'].includes(currentPeriod);
                                const labelText = isAggregated ? 'Average' : 'Value';
                                return context.raw !== null ? 
                                    `${labelText}: ${context.raw}` : 
                                    'No data';
                            },
                            title: function(context) {
                                const item = DataManager.getFilteredData(currentPeriod, currentOffset)[context[0].dataIndex];
                                if (currentPeriod === '1year') {
                                    return `${item.label} ${safeParseDate(item.rawDate).getFullYear()}`;
                                }
                                const date = safeParseDate(item.rawDate);
                                if (isNaN(date.getTime())) return 'No date';
                                if (currentPeriod === '7days') {
                                    return date.toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        month: 'long',
                                        day: 'numeric'
                                    });
                                }
                                else if (currentPeriod === '1month') {
                                    return date.toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    });
                                }
                                return date.toLocaleDateString();
                            }
                        }
                    }
                }
            }
        });
    }
    function updateStatistics() {
        const filteredData = DataManager.getFilteredData(currentPeriod, currentOffset);
        console.log('Filtered data:', filteredData);
        const average = DataManager.getDailyAverage(currentPeriod, currentOffset);
        averageValue.textContent = average;
        initChart(
            filteredData.map(item => item.label),
            filteredData.map(item => item.value)
        );
        prevButton.disabled = currentPeriod === 'all';
        nextButton.disabled = currentPeriod === 'all';
    }
    periodSelect.addEventListener('change', (e) => {
        currentPeriod = e.target.value;
        currentOffset = 0;
        updateStatistics();
    });
    prevButton.addEventListener('click', () => {
        currentOffset--;
        updateStatistics();
    });
    nextButton.addEventListener('click', () => {
        currentOffset++;
        updateStatistics();
    });
    updateStatistics();
});