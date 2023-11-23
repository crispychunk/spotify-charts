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
      containerHeight: _config.containerHeight || 750,
      margin: _config.margin || { top: 0, right: 0, bottom: 0, left: 0 },
      projection: _config.projection || d3.geoMercator(),
      default_date: _config.defaultDate,
    };
    this.data = _data;
    this.songData = _song_data;
    this.colorScale = _config.colorScale;
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
    vis.config.projection = d3.geoMercator().fitSize([vis.config.containerWidth,vis.config.containerHeight-50], vis.data);
    vis.geoPath = d3.geoPath().projection(vis.config.projection);


    // Legend
    vis.legend = vis.svg
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${vis.config.margin.left},${vis.height - 180})`);



    //Timeline
    vis.slider = d3.sliderBottom()
    .min(0)
    .max(2000)
    .width(vis.config.containerWidth)
    .height(200)
    .tickFormat(d3.timeFormat("%b %Y"))
    .ticks(12)
    .on('onchange', val => {
        // Handle changes in the time range
        console.log(val);
    });

    
  }

  updateVis() {
    let vis = this;

    vis.uniqueGenres = new Set(
      vis.songData.map(function (d) {
        return d.artist_genre;
      })
    );
    vis.uniqueGenres = Array.from(vis.uniqueGenres);
    vis.filteredSong = d3.group(
      vis.songData,
      (d) => d.week,
      (d) => d.country
    );
    vis.filteredSong = vis.filteredSong.get(vis.config.default_date);

    // Modify USA country to fit with dataset
    let USObject = vis.data.features.find((d) => d.properties.admin == "United States of America");
    USObject.properties.admin = "United States";


    let KoreaObject = vis.data.features.find((d) => d.properties.admin == "South Korea");
    KoreaObject.properties.admin = "Korea";

    
    // Now combine dataset
    vis.data.features.forEach((d) => {
      for (var [mapKey, mapValue] of vis.filteredSong) {
        if (mapKey == d.properties.admin) {
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
      .attr("transform", (d, i) => `translate(0, ${i * 20-40})`);

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

    vis.timelineSlider = vis.svg.append('g')
    .attr('class', 'slider')
    .attr('transform', `translate(0, ${vis.height-40})`)
    .call(vis.slider);
  }


}
