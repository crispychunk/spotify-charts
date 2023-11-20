let lineChart;

d3.csv('data/data.csv').then (data => {
    data.forEach(d => {
        d.weekNum = getWeekNumber(d.week);
        d.rank = +d.rank;
    })
    // filter data where country is 'Canada' and rank is between the numbers 1 and 10
    canada_data = data.filter(d => d.country === 'Canada' && d.rank <= 5);
    canada_data_by_week = d3.group(canada_data, d => d.weekNum);

    console.log(canada_data)
    console.log(canada_data_by_week)
    lineChart = new LineChart({
        parentElement: '#line-chart'
    }, data);
    lineChart.updateVis();
})

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
    // get month and day from dateString
    let month = dateString.split('-')[1];
    let day = dateString.split('-')[2];
    let weekNumber = Math.ceil((monthToDaysMap[month] + parseInt(day)) / 7);
   
    return weekNumber;
  }
   