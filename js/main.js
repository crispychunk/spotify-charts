let lineChart;

d3.csv('data/data.csv')
.then ( data => {
    data.forEach(d => {
        d.weekNum = getWeekNumber(d.week);
        d.rank = +d.rank;
    })

    canada_top_5 = data.filter(d => d.country === 'Canada' && d.rank <= 5);

    lineChart = new LineChart({parentElement: '#line-chart'}, canada_top_5);
    lineChart.updateVis();

    const defaultCountry = 'Canada';
    const defaultDate = '2022-06-16';


    const slopeChart = new SlopeChart({parentElement: '#slope-chart', defaultCountry: defaultCountry, defaultDate: defaultDate}, data);
})

// helper function that returns the week number given a date string from 2022
function getWeekNumber(dateString) {
    monthToDaysMap = {
        '01': 0,
        '02': 31,
        '03': 59,
        '04': 90,
        '05': 120,
        '06': 151,
        '07': 181,
        '08': 212,
        '09': 243,
        '10': 273,
        '11': 304,
        '12': 334
    }
    let month = dateString.split('-')[1];
    let day = dateString.split('-')[2];
    let weekNumber = Math.ceil((monthToDaysMap[month] + parseInt(day)) / 7);
   
    return weekNumber;
}