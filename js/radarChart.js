class RadarChart {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 700,
            containerHeight: _config.containerHeight || 700,
            margin: _config.margin || {
                top: 20,
                right: 50,
                bottom: 45,
                left: 50
            }
        };

        // Define radialScale as a class property
        this.radialScale = d3.scaleLinear()
            .domain([0, 1])
            .range([0, 250]);

        this.features = ["Acousticness", "Danceability", "Instrumentalness", "Liveness", "Energy", "Valence", "Speechiness"];

        // Add a color scale for genres
        this.colorScale = _config.colorScale

        this.data = _data;
        this.initVis();
    }

    angleToCoordinate(angle, value) {
        let x = Math.cos(angle) * this.radialScale(value);
        let y = Math.sin(angle) * this.radialScale(value);
        return {"x": this.width / 2 + x, "y": this.height / 2 - y};
    }

    getPathCoordinates(data_point) {
        let coordinates = [];
        for (var i = 0; i < this.features.length; i++) {
            let ft_name = this.features[i];
            let angle = (Math.PI / 2) + (2 * Math.PI * i / this.features.length);
            coordinates.push(this.angleToCoordinate(angle, data_point[ft_name]));
        }
        coordinates.push(coordinates[0]);
        return coordinates;
    }


    initVis() {
        let vis = this;

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;


        vis.svg = d3
            .select(vis.config.parentElement)
            .attr("width", vis.config.containerWidth)
            .attr("height", vis.config.containerHeight);

        vis.chartArea = vis.svg
            .append("g")
            .attr(
                "transform",
                `translate(${vis.config.margin.left},${vis.config.margin.top})`
            );


        let ticks = [0.2, 0.4, 0.6, 0.8, 1];


        let featureData = this.features.map((f, i) => {
            let angle = (Math.PI / 2) + (2 * Math.PI * i / this.features.length);
            return {
                "name": f,
                "angle": angle,
                "line_coord": vis.angleToCoordinate(angle, 1),
                "label_coord": vis.angleToCoordinate(angle, 1.08)
            };
        });

        vis.svg.selectAll(".axislabel")
            .data(featureData)
            .join(
                enter => enter.append("text")
                    .attr("x", d => d.label_coord.x - 15)
                    .attr("y", d => d.label_coord.y)
                    .text(d => d.name)
            );

        vis.svg.selectAll("line")
            .data(featureData)
            .join(
                enter => enter.append("line")
                    .attr("x1", vis.width / 2)
                    .attr("y1", vis.height / 2)
                    .attr("x2", d => d.line_coord.x)
                    .attr("y2", d => d.line_coord.y)
                    .attr("stroke", "black")
            );


        vis.svg.selectAll("circle")
            .data(ticks)
            .join(
                enter => enter.append("circle")
                    .attr("cx", vis.width / 2)
                    .attr("cy", vis.height / 2)
                    .attr("fill", "none")
                    .attr("stroke", "gray")
                    .attr("r", d => this.radialScale(d))
            );
        vis.svg.selectAll(".ticklabel")
            .data(ticks)
            .join(
                enter => enter.append("text")
                    .attr("class", "ticklabel")
                    .attr("x", vis.width / 2 + 5)
                    .attr("y", d => vis.height / 2 - this.radialScale(d) - 5)
                    .text(d => d.toString())
            );


        // Create a legend
        let legend = vis.svg
            .append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${vis.width + vis.config.margin.right - 45}, ${vis.config.margin.top})`);

        // Create legend color rectangles
        let legendRects = legend
            .selectAll(".legend-rect")
            .data(vis.colorScale.domain())
            .join("rect")
            .attr("class", "legend-rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("y", (_, i) => i * 20)
            .attr("fill", d => vis.colorScale(d));

        // Create legend labels
        legend
            .selectAll(".legend-label")
            .data(vis.colorScale.domain())
            .join("text")
            .attr("class", "legend-label")
            .attr("x", 20)
            .attr("y", (_, i) => i * 20 + 12)
            .text(d => d);


        vis.updateVis();
    }

    updateVis() {
        let vis = this;
        // Update the visualization with new data
        vis.renderVis();
    }


    renderVis() {
        let vis = this;
        let line = d3.line()
            .x(d => d.x)
            .y(d => d.y);


        // Draw the radar paths
        vis.svg.selectAll("path")
            .data(vis.data)
            .join(
                enter => enter.append("path")
                    .attr("d", d => line(vis.getPathCoordinates(d))) // Use line function directly
                    .attr("stroke-width", 3)
                    .attr("stroke", (_, i) => vis.colorScale(vis.data[i].Genre))
                    .attr("fill", (_, i) => vis.colorScale(vis.data[i].Genre))
                    .attr("stroke-opacity", 1)
                    .attr("fill-opacity", 0.4)
            );


        // Draw dots at data points
        vis.svg.selectAll(".dot")
            .data(vis.data)
            .join("g")
            .attr("class", "dot")
            .selectAll("circle")
            .data(d => vis.getPathCoordinates(d))
            .join("circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", 3)
            .attr("fill", "gray")


    }


}
