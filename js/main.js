let choroplethMap;
let lineChart;
let features = ["Acousticness", "Danceability", "Instrumentalness", "Liveness", "Energy", "Valence", "Speechiness"];
let genres = ['pop', 'reggaeton', 'rock', 'latin', 'hip hop', 'rap', 'r&b', 'other'];
let loadedData = []

let colorScale = d3
    .scaleOrdinal()
    .range(d3.schemeAccent)
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

    // Assuming you want to use certain columns for rada chart features
    loadedData = csvData.slice(0, 5).map(d => ({
        Acousticness: +d.acousticness,
        Danceability: +d.danceability,
        Instrumentalness: +d.instrumentalness,
        Liveness: +d.liveness,
        Energy: +d.energy,
        Valence: +d.valence,
        Speechiness: +d.speechiness,
        Genre: d.artist_genre
    }));

    let canada_top_5 = csvData.filter(d => d.country === 'Canada' && d.rank <= 5);
    const defaultCountry = "Canada";
    const defaultDate = "2022-06-16";

    const slopeChart = new SlopeChart(
        {
            parentElement: '#slope-chart',
            defaultCountry: defaultCountry,
            defaultDate: defaultDate,
            colorScale: colorScale,
        },
        csvData
    );

    slopeChart.updateVis();

    lineChart = new LineChart({
            parentElement: '#line-chart'
        },
        canada_top_5);
    lineChart.updateVis();

    choroplethMap = new ChoroplethMap(
        {
            parentElement: "#choropleth-map",
            projection: d3.geoMercator(),
            defaultDate: defaultDate,
            colorScale: colorScale,
        },
        jsonData,
        csvData
    );
    choroplethMap.updateVis();
    // You can use jsonData in your charts as needed

    const radarchart = new RadarChart({parentElement: "#spider-chart", colorScale: colorScale}, loadedData);
    radarchart.updateVis();
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
