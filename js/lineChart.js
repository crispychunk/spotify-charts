class LineChart {
  /**
   * Class constructor with basic chart configuration
   * @param {Object}
   */
  constructor(_config, data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 1000,
      containerHeight: 300,
      margin: {
        top: 30,
        right: 15,
        bottom: 10,
        left: 15,
      },
    };
    this.data = data;
    this.initVis();
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
    
  }

  updateVis() {
    let vis = this;
    // TODO
  }

  renderVis() {
    let vis = this;
    // TODO
  }
}
