class ChoroplethMap {
  /**
   * Class constructor with basic configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data, _song_data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 1000,
      containerHeight: _config.containerHeight || 550,
      margin: _config.margin || { top: 0, right: 0, bottom: 0, left: 0 },
      projection: _config.projection || d3.geoMercator(),
      default_date: _config.defaultDate,
    };
    this.data = _data;
    this.songData = _song_data;
    this.initVis();
  }

  /**
   * We initialize scales/axes and append static elements, such as axis titles.
   */
  initVis() {
    let vis = this;

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Define size of SVG drawing area
    vis.svg = d3
      .select(vis.config.parentElement)
      .append("svg")
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

    // Append group element that will contain our actual chart
    // and position it according to the given margin config
    vis.chart = vis.svg.append("g").attr("transform", `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    vis.geoPath = d3.geoPath().projection(vis.config.projection);

    // Genre Colour Scale
    vis.colorScale = d3
      .scaleOrdinal()
      .range(["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#ffff33", "#a65628", "#f781bf"]);

    // Legend
    vis.legend = vis.svg
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${vis.config.margin.left},${vis.height - 180})`);
  }

  updateVis() {
    let vis = this;

    vis.uniqueGenres = new Set(
      vis.songData.map(function (d) {
        return d.artist_genre;
      })
    );
    vis.uniqueGenres = Array.from(vis.uniqueGenres);
    vis.colorScale.domain(vis.uniqueGenres);
    vis.filteredSong = d3.group(
      vis.songData,
      (d) => d.week,
      (d) => d.country
    );
    vis.filteredSong = vis.filteredSong.get(vis.config.default_date);

    // Modify USA country to fit with dataset
    let USObject = vis.data.features.find((d) => d.properties.ADMIN == "United States of America");
    USObject.properties.ADMIN = "United States";

    // Now combine dataset
    vis.data.features.forEach((d) => {
      for (var [mapKey, mapValue] of vis.filteredSong) {
        if (mapKey == d.properties.ADMIN) {
          const topGenre = this.findTopGenre(mapValue);
          d.properties.top_genre = topGenre;
        }
      }
    });
    vis.renderVis();
  }

  findTopGenre(data) {
    let counts = d3.rollup(
      data,
      (v) => v.length,
      (d) => d.artist_genre
    );
    const maxCount = d3.max(counts, (d) => d[1]);
    for (const [key, value] of counts) {
      if (value === maxCount) {
        return key;
      }
    }
  }

  /**
   * Bind data to visual elements.
   */
  renderVis() {
    let vis = this;
    // Draw the map
    vis.chart
      .selectAll("path")
      .data(vis.data.features)
      .join("path")
      .attr("d", vis.geoPath)
      .attr("class", "world-map")
      .attr("fill", (d) => {
        if (d.properties.top_genre) {
          return vis.colorScale(d.properties.top_genre);
        }
        return "#808080";
      });

    vis.legendItems = vis.legend
      .selectAll("g")
      .data(vis.colorScale.domain())
      .join("g")
      .attr("transform", (d, i) => `translate(0, ${i * 20})`);

    vis.legendItems
      .append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", (d) => vis.colorScale(d));

    vis.legendItems
      .append("text")
      .attr("x", 24) // Adjust the position as needed
      .attr("y", 9) // Adjust the position as needed
      .attr("dy", "0.35em")
      .text((d) => d);
    // Additional code for rendering other visual elements on the map can be added here
  }
}
