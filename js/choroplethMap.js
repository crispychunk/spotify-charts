class ChoroplethMap {
  /**
   * Class constructor with basic configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data, _song_data, _dispatcher) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 800,
      containerHeight: _config.containerHeight || 500,
      tooltipPadding: 15,
      margin: _config.margin || { top: 0, right: 0, bottom: 0, left: 0 },
      projection: _config.projection || d3.geoMercator(),
      default_date: _config.defaultDate,
    };
    this.data = _data;
    this.songData = _song_data;
    this.colorScale = _config.colorScale;
    this.dispatcher = _dispatcher;
    this.selectedCountry = _config.defaultCountry ? [_config.defaultCountry] : [];
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

    vis.config.projection = d3
      .geoMercator()
      .fitSize([vis.config.containerWidth, vis.config.containerHeight - 50], vis.data);
    vis.geoPath = d3.geoPath().projection(vis.config.projection);

    // Legend
    vis.legend = vis.svg
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${vis.config.margin.left},${vis.height - 180})`);

    let weeks = Array.from(d3.group(vis.songData, (d) => d.week).keys()).sort((a, b) => new Date(a) - new Date(b));
    weeks = weeks.map((d) => new Date(d));

    //Timeline
    vis.slider = d3
      .sliderBottom()
      .domain(d3.extent(weeks))
      .width(vis.config.containerWidth - 60)
      .height(200)
      .tickFormat(d3.timeFormat("%b %d"))
      .ticks(weeks.length)
      .marks(weeks)
      .tickValues(weeks)
      .displayValue(false)
      .on("onchange", (week) => {
        vis.dispatcher.call("changeWeek", null, week);
      });

    vis.sliderG = vis.svg
      .append("g")
      .attr("class", "slider")
      .attr("id", "slider")
      .attr("transform", `translate(25, ${vis.height - 40})`);

    vis.zoom = d3
      .zoom()
      .scaleExtent([1, 8])
      .translateExtent([
        [0, 0],
        [vis.width, vis.height],
      ])
      .on("zoom", vis.zoomed);
  }

  zoomed(e) {
    let vis = this;
    const ans = d3.selectAll(".world-map").attr("transform", e.transform);
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
    let USObject = vis.data.features.find((d) => d.properties.admin === "United States of America");
    if (USObject) {
      USObject.properties.admin = "United States";
    }

    // Modify Korea country to fit with dataset
    let KoreaObject = vis.data.features.find((d) => d.properties.admin === "South Korea");
    if (KoreaObject) {
      KoreaObject.properties.admin = "Korea";
    }

    vis.data.features.forEach((d) => {
      d.properties.top_genre = null;
    });

    // Now combine dataset
    vis.data.features.forEach((d) => {
      for (let [mapKey, mapValue] of vis.filteredSong) {
        if (mapKey === d.properties.admin) {
          const topGenre = this.findTopGenre(mapValue);
          d.properties.top_genre = topGenre;
        }
      }
    });

    // Filter selectedCountry Array if country data is not valid
    vis.data.features.forEach((d) => {
      if (!d.properties.top_genre && vis.selectedCountry.includes(d.properties.admin)) {
        vis.selectedCountry = vis.selectedCountry.filter((item) => item !== d.properties.admin);
      }
    });

    // Update other visualizations if country is filtered
    vis.dispatcher.call("changeCountry", null, vis.selectedCountry);

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
      .attr("id", (d) => vis.sanitizeCountryID(d.properties.admin))
      .attr("fill", (d) => {
        if (d.properties.top_genre) {
          return vis.colorScale(d.properties.top_genre);
        }
        return "#808080";
      })
      .on("mouseenter", (event, d) => {
        // If the dataset contains a valid country, display the tooltip for that country
        if (d.properties.top_genre) {
          d3.select("#choropleth-map-tooltip")
            .style("display", "block")
            .html(() => {
              return `
                        <div class="tooltip-label">${d.properties.admin}</div>
                        `;
            });
          // If the map shows a valid country, then change cursor to a pointer
          vis.chart.style("cursor", "pointer");
        }
      })
      .on("mouseleave", () => {
        d3.select("#choropleth-map-tooltip").style("display", "none");
        // When mouse leaves map, change pointer back to cursor
        vis.chart.style("cursor", "auto");
      })
      .on("mousemove", (event) => {
        // Move tooltip based on cursor position
        d3.select("#choropleth-map-tooltip")
          .style("left", event.pageX + vis.config.tooltipPadding + "px")
          .style("top", event.pageY + vis.config.tooltipPadding + "px");
      })
      .on("click", (event, d) => {
        let country = d.properties.admin;

        // Upon clicking a country, the selectedCountry array can hold a maximum of 2 countries and a minimum of 1 country
        if (d.properties.top_genre) {
          let selectedCountry = d3.select(event.target);
          selectedCountry.classed("highlight-country", (d) => {
            if (vis.selectedCountry.includes("Global")) {
              if (selectedCountry.classed("highlight-country") && vis.selectedCountry.includes(country)) {
                console.log("enter: unselected a country and GLOBAL is in array");
                vis.selectedCountry = vis.selectedCountry.filter((d) => d !== country);
              } else if (
                !selectedCountry.classed("highlight-country") &&
                !vis.selectedCountry.includes(country) &&
                vis.selectedCountry.length >= 2
              ) {
                vis.selectedCountry = vis.selectedCountry.filter((d) => d !== "Global");
                vis.selectedCountry.push(country);
              } else if (!selectedCountry.classed("highlight-country") && vis.selectedCountry.length <= 1) {
                vis.selectedCountry.push(country);
              } else {
                vis.selectedCountry.push("Global");
              }
            } else {
              if (selectedCountry.classed("highlight-country") && vis.selectedCountry.length === 2) {
                vis.selectedCountry = vis.selectedCountry.filter((d) => d !== country);
                vis.selectedCountry.push("Global");
              } else if (!selectedCountry.classed("highlight-country") && vis.selectedCountry.length < 1) {
                vis.selectedCountry.push("Global");
                vis.selectedCountry.push(country);
              } else if (vis.selectedCountry.length >= 2 && !selectedCountry.classed("highlight-country")) {
                return;
              }
            }
            vis.dispatcher.call("changeCountry", null, vis.selectedCountry);
            return !selectedCountry.classed("highlight-country");
          });
        }
      });

    // Given the selectedCountry, highlight the borders of the country selected
    vis.selectedCountry.forEach((d) => {
      let selectedCountry = d3.selectAll(`#${d}`);
      if (!selectedCountry.empty()) {
        selectedCountry.classed("highlight-country", !selectedCountry.classed("highlight-country"));
      }
    });

    // Legend render

    vis.legend.append("text").attr("x", 0).attr("y", -50).attr("font-weight", "bold").text("Top Genres");

    vis.legendItems = vis.legend
      .selectAll("g")
      .data(vis.colorScale.domain())
      .join("g")
      .attr("transform", (d, i) => `translate(0, ${i * 20 - 40})`);

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

    vis.sliderG.call(vis.slider).call((g) => g.select("#slider").remove());
    vis.svg.call(vis.zoom);
  }

  //Bi-directional interaction that highlights all countries with the selected song
  handleSlopeChartInteraction(track_name) {
    let vis = this;
    let countriesWithSongInTop20 = [];
    // Find all countries with the selected song as top 20
    for (let [mapKey, mapValue] of vis.filteredSong) {
      //TODO make sure if we want to add Hong Kong to map
      if (mapKey !== "Global" && mapKey !== "Hong Kong" && mapValue.some((d) => d.track_name === track_name)) {
        countriesWithSongInTop20.push(mapKey);
        d3.selectAll(`#${vis.sanitizeCountryID(mapKey)}`).classed(
          "highlight-top-20",
          !d3.selectAll(`#${vis.sanitizeCountryID(mapKey)}`).classed("highlight-top-20")
        );
      }
    }
  }

  sanitizeCountryID(country) {
    return country.replace(/[^a-zA-Z0-9-_]/g, "-");
  }
}
