let choroplethMap;

// Define paths to your CSV and JSON files
const csvPath = "data/data.csv";
const jsonPath = "data/world-map.json";

// Use Promise.all to load both CSV and JSON files
Promise.all([d3.csv(csvPath), d3.json(jsonPath)]).then(([csvData, jsonData]) => {
  // csvData is the loaded data from the CSV file
  // jsonData is the loaded data from the JSON file

  // BUILD CHARTS HERE
  const defaultCountry = "Canada";
  const defaultDate = "2022-06-16";

  const slopeChart = new SlopeChart(
    { parentElement: "#slope-chart", defaultCountry: defaultCountry, defaultDate: defaultDate },
    data
  );

  choroplethMap = new ChoroplethMap(
    { parentElement: "#choropleth-map", projection: d3.geoMercator() },
    jsonData,
    csvData
  );
  // You can use jsonData in your charts as needed
});
