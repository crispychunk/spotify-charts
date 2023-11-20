d3.csv('data/data.csv')
.then ( data => {
    const slopeChart = new SlopeChart({parentElement: '#slope-chart', defaultCountry: 'Canada', defaultDate: '2022-01-06'}, data);
})
