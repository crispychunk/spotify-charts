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
        this.displayedCountry = _config.defaultCountry ? _config.defaultCountry : 'Global';
        this.selectedCountries = [this.displayedCountry]

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
        vis.colourScale = d3.scaleOrdinal(["#0000FF", "#785EF0", "#DC267F", "#FE6100", "#FFB000"]);


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

        vis.top_5_songs_all_weeks = this.data.filter(d => d.country === vis.displayedCountry && d.rank <= 5 );
        let top_5_songs_selected_week = vis.top_5_songs_all_weeks.filter(d => d.weekNum === getWeekNumber(vis.selectedDate));
        vis.top_5_song_names = top_5_songs_selected_week.sort((a, b) => a.rank - b.rank).map(d => d.track_name);
   

        vis.xScale.domain([1, 25]);
        vis.yScale.domain([1, 5]);
        vis.colourScale.domain(vis.top_5_song_names);

        vis.renderVis();
    }

    renderVis() {
        let vis = this;

        // Remove existing legend
        vis.svg.select(".legend").remove();

        // Create a new legend
        const legend = vis.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${50},${vis.height + 80})`);

        const legendItems = legend.selectAll(".legend-item")
            .data(vis.top_5_song_names)
            .enter().append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 20})`);

        legendItems.append("circle")
            .attr("r", 6)
            .attr("fill", d => vis.colourScale(d));

        legendItems.append("text")
            .attr("x", 20)
            .attr("y", 0)
            .attr("font-size", 12)
            .text(d => d);
        
        // remove existing dropdown options
        d3.select("#selectButton").selectAll("option").remove();
        const selectButton = d3.select("#selectButton")
            .selectAll("myOptions")
                .data(vis.selectedCountries)
            .enter()
                .append('option')
            .text(d => d)
            .attr("value", d => d)
            .property("selected", d => d === vis.displayedCountry)

        d3.select("#selectButton").on("change", function(d) {
            let selectedOption = d3.select(this).property("value")
            console.log(selectedOption)
            vis.displayedCountry = selectedOption;
            vis.updateVis();
        })

        // Remove existing circles and paths
        vis.chart.selectAll("circle").remove();
        vis.chart.selectAll(".line").remove();

        let selected_songs = vis.top_5_songs_all_weeks.filter(d => vis.top_5_song_names.includes(d.track_name));
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
