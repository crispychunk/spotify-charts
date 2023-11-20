d3.csv('data/data.csv')
.then ( data => {
    const defaultCountry = 'Canada';
    const defaultDate = '2022-06-16';


    const slopeChart = new SlopeChart({parentElement: '#slope-chart', defaultCountry: defaultCountry, defaultDate: defaultDate}, data);
})
