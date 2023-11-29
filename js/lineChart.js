class LineChart {
    /**
     * Class constructor with basic chart configuration
     * @param {Object}
     */
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 1100,
            containerHeight: 400,
            margin: {
                top: 40,
                right: 50,
                bottom: 130,
                left: 50,
            },
        };
        this.data = _data;
        this.selectedDate = _config.defaultDate;
        this.selectedCountry = _config.defaultCountry;

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

        vis.xScale = d3.scaleLinear().range([0, vis.width]);
        vis.yScale = d3.scaleLinear().range([0, vis.height]);
        vis.colourScale = d3.scaleOrdinal(["#e41a1c", "#0000FF", "#ffaa00", "#33ffff", "#f781bf"]);


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

        // Add x-axis label
        vis.chart.append("text")
            .attr("class", "axis-title")
            .attr("text-anchor", "middle")
            .attr("x", vis.width + 30)
            .attr("y", vis.height + 30)
            .text("Week");

        // Add y-axis label
        vis.svg.append("text")
            .attr("class", "axis-title")
            .attr("x", 20)
            .attr("y", 20)
            .text("Rank");


        vis.updateVis();
    }

    updateVis() {
        let vis = this;
        vis.top_5_songs_in_country = this.data.filter(d => d.country === vis.selectedCountry && d.rank <= 5 );
        vis.week_1_top_songs = vis.top_5_songs_in_country.filter(d => d.weekNum === getWeekNumber(vis.selectedDate)).map(d => d.track_name);

        vis.xScale.domain([1, 25]);
        vis.yScale.domain([1, 5]);
        vis.colourScale.domain(vis.week_1_top_songs);

        vis.renderVis();
    }

    renderVis() {
        let vis = this;

        // Remove existing legend
        vis.svg.select(".legend").remove();

        // Create a new legend
        const legend = vis.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${50},${vis.height + 100})`);

        const legendItems = legend.selectAll(".legend-item")
            .data(vis.week_1_top_songs)
            .enter().append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(${i * 200},0)`);

        legendItems.append("circle")
            .attr("r", 6)
            .attr("fill", d => vis.colourScale(d));

        legendItems.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .attr("font-size", 12)
            .text(d => d);

        // Remove existing circles and paths
        vis.chart.selectAll("circle").remove();
        vis.chart.selectAll(".line").remove();

        let selected_songs = vis.top_5_songs_in_country.filter(d => vis.week_1_top_songs.includes(d.track_name));
        let groupedByTrack = d3.group(selected_songs, d => d.track_name);

        selected_songs.forEach(d => {
            vis.chart.append("circle")
                .attr("r", 6)
                .attr("cx", vis.xScale(d.weekNum))
                .attr("cy", vis.yScale(d.rank))
                .style("fill", vis.colourScale(d.track_name))
                .style("stroke", "black");
        });

        let line = d3.line()
            .x(d => vis.xScale(d.weekNum))
            .y(d => vis.yScale(d.rank));

        groupedByTrack.forEach((group, track_name) => {
            group.forEach((d, i) => {
                let next_week_track = group.find(track => track.weekNum == d.weekNum + 1);
                // draw line from (d.weekNum, d.rank) to (d.weekNum + 1, next_week_track.rank)
                if (next_week_track) {
                    vis.chart.append("path")
                        .datum([d, next_week_track])
                        .attr("class", "line")
                        .attr("d", line)
                        .style("stroke", vis.colourScale(track_name))
                        .style("fill", "none")
                        .style("stroke-width", 3);
                }
            });
        });

        vis.xAxisG.call(vis.xAxis);
        vis.yAxisG.call(vis.yAxis);
    }
}
