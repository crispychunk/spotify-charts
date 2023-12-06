let choroplethMap;
let lineChart;
let radarChart;
let genres = ['pop', 'reggaeton', 'rock', 'latin', 'hip hop', 'rap', 'r&b', 'other'];


let colorScale = d3
    .scaleOrdinal()
    .range(d3.schemePaired)
    .domain(genres);

// Define paths to your CSV and JSON files
const csvPath = "data/data.csv";
const jsonPath = "data/world-map-50m.json";

// Use Promise.all to load both CSV and JSON files
Promise.all([d3.csv(csvPath), d3.json(jsonPath)]).then(([csvData, jsonData]) => {
    // csvData is the loaded data from the CSV file
    // jsonData is the loaded data from the JSON file
    csvData.forEach(d => {
        d.weekNum = getWeekNumber(d.week);
        d.rank = +d.rank;
    })

    // Default values and dispatcher
    const defaultCountry = null;
    const defaultDate = "2022-01-06";
    const dispatcher = d3.dispatch('changeWeek', 'changeCountry', 'handleBiDirectionalInteraction')



    // Visualization intialization
    const slopeChart = new SlopeChart(
        {
            parentElement: '#slope-chart',
            defaultCountry: defaultCountry,
            defaultDate: defaultDate,
            colorScale: colorScale,
        },
        csvData,
        dispatcher
    );

    slopeChart.updateVis();

    lineChart = new LineChart({
            parentElement: '#line-chart',
            defaultDate: defaultDate,
            defaultCountry: defaultCountry,
        },
        csvData);
    lineChart.updateVis();

    choroplethMap = new ChoroplethMap(
        {
            parentElement: "#choropleth-map",
            projection: d3.geoMercator(),
            defaultCountry: defaultCountry,
            defaultDate: defaultDate,
            colorScale: colorScale,
        },
        jsonData,
        csvData,
        dispatcher
    );
    choroplethMap.updateVis();


    radarChart = new RadarChart({
        parentElement: "#spider-chart",
        colorScale: colorScale,
        defaultCountry: defaultCountry,
        dispatcher: dispatcher
    }, csvData);
    radarChart.updateVis();



    // Dispatcher listeners
    dispatcher.on('changeWeek', week => {
        week = new Date(week).toISOString().split('T')[0];


        slopeChart.selectedDate = week;
        lineChart.selectedDate = week;
        choroplethMap.config.default_date = week;


        choroplethMap.updateVis();
        slopeChart.updateVis();
        lineChart.updateVis();

    });

    // When the map selects the countries,
    dispatcher.on('changeCountry', selectedCountries => {
        slopeChart.selectedCountry = selectedCountries;
        radarChart.selectedCountry = selectedCountries;
        lineChart.selectedCountries = selectedCountries;
        lineChart.displayedCountry = selectedCountries[0];  

        slopeChart.updateVis();
        radarChart.updateVis();
        lineChart.updateVis();
    });

    dispatcher.on('handleBiDirectionalInteraction', selectedSong => {
        choroplethMap.handleSlopeChartInteraction(selectedSong);
    });



});


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