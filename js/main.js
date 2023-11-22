let choroplethMap;
let lineChart;
let features = ["Acousticness", "Danceability", "Instrumentalness", "Liveness", "Energy", "Valence", "Speechiness"];

// Define paths to your CSV and JSON files
const csvPath = "data/data.csv";
const jsonPath = "data/world-map.json";

// Use Promise.all to load both CSV and JSON files
Promise.all([d3.csv(csvPath), d3.json(jsonPath)]).then(([csvData, jsonData]) => {
  // csvData is the loaded data from the CSV file
  // jsonData is the loaded data from the JSON file
  csvData.forEach(d => {
    d.weekNum = getWeekNumber(d.week);
    d.rank = +d.rank;
  })
  
   // Assuming you want to use certain columns for radar chart features
    loadedData = data.slice(0, 5).map(d => ({
        Acousticness: +d.acousticness,
        Danceability: +d.danceability,
        Instrumentalness: +d.instrumentalness,
        Liveness: +d.liveness,
        Energy: +d.energy,
        Valence: +d.valence,
        Speechiness: +d.speechiness,
        Genre: d.artist_genre
    }));
  
  
  canada_top_5 = csvData.filter(d => d.country === 'Canada' && d.rank <= 5);

  // BUILD CHARTS HERE
  const defaultCountry = "Canada";
  const defaultDate = "2022-06-16";

  const slopeChart = new SlopeChart(
    {
      parentElement: '#slope-chart',
      defaultCountry: defaultCountry,
      defaultDate: defaultDate
  },
    csvData
  );

  lineChart = new LineChart({
    parentElement: '#line-chart'}, 
    canada_top_5);
  lineChart.updateVis();
  
  choroplethMap = new ChoroplethMap(
    { parentElement: "#choropleth-map", projection: d3.geoMercator(), defaultDate: defaultDate },
    jsonData,
    csvData
  );
  choroplethMap.updateVis();
  // You can use jsonData in your charts as needed
  
  const radarchart = new radarChart({ parentElement: "#vis" }, loadedData);
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
