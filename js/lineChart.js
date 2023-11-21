class LineChart {
  /**
   * Class constructor with basic chart configuration
   * @param {Object}
   */
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 1000,
      containerHeight: 300,
      margin: {
        top: 30,
        right: 30,
        bottom: 30,
        left: 30,
      },
    };
    this.data = _data;
    this.initVis();
    // TODO temp data
    this.selected_top_songs = _config.songs;
    this.week_1_top_songs = _data.filter(d => d.weekNum === 1).map(d => d.track_name);
  }

  initVis() {
    let vis = this;
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
    // TODO

    vis.svg = d3.select(vis.config.parentElement)
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    vis.chart = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
    
    vis.xScale = d3.scaleLinear().range([0, vis.width]);
    vis.yScale = d3.scaleLinear().range([0, vis.height]);
    vis.colourScale = d3.scaleOrdinal(d3.schemeTableau10);

    vis.xAxis = d3.axisBottom(vis.xScale)
        .ticks(25)
        .tickSizeOuter(0)
    
    vis.yAxis = d3.axisLeft(vis.yScale)
        .ticks(5)

    vis.xAxisG = vis.chart.append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', `translate(0,${vis.height})`)
    
    vis.yAxisG = vis.chart.append('g')
        .attr('class', 'axis y-axis')
  }

  updateVis() {
    let vis = this;
    // TODO
    // get the max weekNum
    vis.xScale.domain([1, 25]);
    vis.yScale.domain([1, 5]);
    vis.colourScale.domain(vis.week_1_top_songs);

    vis.renderVis();
  }

  renderVis() {
    let vis = this;
    // TODO
    // let week_1_top_songs = vis.data.filter(d => d.weekNum === 1).map(d => d.track_name);

    let filterByWeek1Songs = vis.data.filter(d => vis.week_1_top_songs.includes(d.track_name));
    console.log(filterByWeek1Songs);

    let groupedBySong = d3.group(filterByWeek1Songs, d => d.track_name);
    console.log(groupedBySong);


    
    // filter data for selected songs
    let selected_songs = vis.data.filter(d => vis.week_1_top_songs.includes(d.track_name));

    // TODO TEMP
    d3.select("svg")
        .selectAll(".line")
        .append("g")
        .attr("class", "line")
        .data(groupedBySong)
        .enter()
        .append("path")
        .attr("d", function (d) {
            return d3.line()
                .x(d => xScale(d.weekNum))
                .y(d => yScale(d.rank)).curve(d3.curveCardinal)
                (d.values)
        })
        .attr("fill", "none")
        // .attr("stroke", d => color(d.key))
        .attr("stroke-width", 2)

    //append circle 
    vis.chart.selectAll("circle")
        .append("g")
        .data(selected_songs)
        .enter()
        .append("circle")
        .attr("r", 6)
        .attr("cx", d => vis.xScale(d.weekNum))
        .attr("cy", d => vis.yScale(d.rank))
        .style("fill", d => vis.colourScale(d.track_name))

    vis.xAxisG.call(vis.xAxis);
    vis.yAxisG.call(vis.yAxis);
  }
}
