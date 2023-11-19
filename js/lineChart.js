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
    // TODO
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
