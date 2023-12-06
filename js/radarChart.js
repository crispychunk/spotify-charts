class RadarChart {
    constructor(_config, _data, _dispatcher) {
        // Configuration settings for the radar chart
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 525,
            containerHeight: _config.containerHeight || 425,
            margin: _config.margin || {
                top: 10,
                right: 50,
                bottom: 10,
                left: 50
            }
        };

        // Define radialScale as a class property
        this.radialScale = d3.scaleLinear()
            .domain([0, 1])
            .range([0, 170]);

        // Properties to be displayed on the radar chart
        this.properties = ["Acousticness", "Danceability", "Instrumentalness", "Liveness", "Energy", "Valence", "Speechiness"];

        // Color scale for genres
        this.colorScale = _config.colorScale;
        this.dispatcher = _dispatcher;

        // Input data for the radar chart
        this.data = _data;

        // Initially selected country (default or from configuration)
        this.selectedCountry = _config.defaultCountry ? [_config.defaultCountry] : [];

        // Initialize the radar chart
        this.initVis();
    }

    // Convert angle and value to Cartesian coordinates
    angleToCoordinate(angle, value) {
        let x = Math.cos(angle) * this.radialScale(value);
        let y = Math.sin(angle) * this.radialScale(value);
        return { "x": this.width / 2 + x, "y": this.height / 2 - y };
    }

    // Get coordinates for the radar path based on data point
    getPathCoordinates(data_point) {
        let coordinates = [];
        for (var i = 0; i < this.properties.length; i++) {
            let ft_name = this.properties[i];
            let angle = (Math.PI / 2) + (2 * Math.PI * i / this.properties.length);
            coordinates.push(this.angleToCoordinate(angle, data_point[ft_name]));
        }
        coordinates.push(coordinates[0]); // Connect the path back to the starting point
        return coordinates;
    }

    // Find top genres based on the number of occurrences
    findTopGenres(data, numGenres) {
        let counts = d3.rollup(
            data,
            (v) => v.length,
            (d) => d.artist_genre
        );

        // Sort genres by count in descending order
        let sortedGenres = Array.from(counts).sort((a, b) => b[1] - a[1]);

        // Extract the top N genres
        return sortedGenres.slice(0, numGenres).map(([genre, count]) => genre);
    }

    // Calculate average properties for a specific genre
    calculateAverageProperties(data, genre) {
        // Filter data for the specific genre and country if selected
        let genreData = data.filter(d => d.artist_genre === genre && (!this.selectedCountry || this.selectedCountry.includes(d.country)));

        // Calculate the sum of properties for the genre
        let sumProperties = genreData.reduce((acc, d) => {
            for (let property of this.properties) {
                acc[property] = (acc[property] || 0) + +d[property.toLowerCase()];
            }
            return acc;
        }, {});

        // Calculate the average of properties for the genre
        let averageProperties = {};
        for (let property of this.properties) {
            averageProperties[property] = sumProperties[property] / genreData.length;
        }

        return {
            Genre: genre,
            ...averageProperties
        };
    }

    // Change the selected country and update the visualization
    changeCountry(selectedCountries) {
        this.selectedCountry = selectedCountries;
        this.data = this.processData(this.data);
        this.updateVis();
    }

    // Process the data based on selected country and checkbox state
    processData(data) {
        // Default State: If only one country is selected and it's not 'Global', add 'Global' to the selection
        if (this.selectedCountry.length <= 1 && !this.selectedCountry.includes('Global')) {
            this.selectedCountry.push('Global');
        }

        let localSelectedCountry1 = this.selectedCountry[0];
        let filterDataCountry1 = data.filter(d => localSelectedCountry1.includes(d.country));
        let topGenres1 = this.findTopGenres(filterDataCountry1, 5);
        // Calculate average properties for each top genre
        const averagePropertiesByGenre1 = topGenres1.map(genre => this.calculateAverageProperties(filterDataCountry1, genre));

        let localSelectedCountry2;
        let filterDataCountry2;
        let topGenres2;
        let averagePropertiesByGenre2;

        // If more than one country is selected, calculate average properties for the second country
        if (this.selectedCountry.length > 1) {
            localSelectedCountry2 = this.selectedCountry[1];
            filterDataCountry2 = localSelectedCountry2 ? data.filter(d => localSelectedCountry2.includes(d.country)) : data;
            topGenres2 = this.findTopGenres(filterDataCountry2, 5);
            averagePropertiesByGenre2 = topGenres2.map(genre => this.calculateAverageProperties(filterDataCountry2, genre));
        }

        // Get the text box element
        const countryTextBox = d3.select(".country-textbox");

        // Set the text content to the selected country name
        countryTextBox.text(`Selected Country: ${this.isFirstCheckboxChecked() ? localSelectedCountry1 : localSelectedCountry2}`);

        // Return the average properties based on checkbox state
        if (this.isFirstCheckboxChecked()) {
            return averagePropertiesByGenre1;
        } else if (this.isFirstCheckboxChecked() == false && averagePropertiesByGenre2 != null) {
            return averagePropertiesByGenre2;
        }
        return averagePropertiesByGenre1;
    }

    // Helper method to check if the first checkbox is checked
    isFirstCheckboxChecked() {
        const firstCheckbox = d3.select(".country-checkbox").node();
        return firstCheckbox && firstCheckbox.checked;
    }

    // Initialize the radar chart
    initVis() {
        let vis = this;

        // Calculate width and height of the chart area
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Create an SVG element
        vis.svg = d3
            .select(vis.config.parentElement)
            .attr("width", vis.config.containerWidth)
            .attr("height", vis.config.containerHeight);

        // Create a chart area within the SVG
        vis.chartArea = vis.svg
            .append("g")
            .attr(
                "transform",
                `translate(${vis.config.margin.left},${vis.config.margin.top})`
            );

        // Define ticks for the radar chart
        let ticks = [0.2, 0.4, 0.6, 0.8, 1];

        // Data for radar chart axes
        let propertyData = this.properties.map((f, i) => {
            let angle = (Math.PI / 2) + (2 * Math.PI * i / this.properties.length);
            return {
                "name": f,
                "angle": angle,
                "line_coord": vis.angleToCoordinate(angle, 1),
                "label_coord": vis.angleToCoordinate(angle, 1.08)
            };
        });

        // Create labels for radar chart axes
        vis.svg.selectAll(".axislabel")
            .data(propertyData)
            .join(
                enter => enter.append("text")
                    .attr("x", d => d.label_coord.x - 15)
                    .attr("y", d => d.label_coord.y)
                    .text(d => d.name)
            );

        // Create lines for radar chart axes
        vis.svg.selectAll("line")
            .data(propertyData)
            .join(
                enter => enter.append("line")
                    .attr("x1", vis.width / 2)
                    .attr("y1", vis.height / 2)
                    .attr("x2", d => d.line_coord.x)
                    .attr("y2", d => d.line_coord.y)
                    .attr("stroke", "white")
            );

        // Create circles for radar chart ticks
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

        // Create labels for radar chart ticks
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
        vis.legend = this.svg
            .append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${this.width + this.config.margin.right - 45}, ${this.config.margin.top + 20})`);

        // Call the updateVis method to render the initial chart
        this.updateVis();
    }

    // Update the radar chart with new data
    updateVis() {
        let vis = this;
        // Process data during initialization
        this.filter_data = this.processData(this.data);
        // Update the visualization with new data
        vis.renderVis();
    }

    // Uncheck checkboxes other than the selected checkbox
    uncheckOtherCheckboxes(selectedCheckboxId) {
        d3.selectAll(".country-checkbox")
            .filter(function () {
                return this.id !== selectedCheckboxId;
            })
            .property("checked", false);
    }

    // Handle checkbox change event
    handleCheckboxChange(country, checked) {
        if (checked) {
            // Uncheck other checkboxes
            this.uncheckOtherCheckboxes(`${country}-checkbox`);
        } else {
            // Check the first checkbox if no checkbox is checked
            const allCheckboxes = d3.selectAll(".country-checkbox");
            const anyCheckboxChecked = allCheckboxes.nodes().some(node => node.checked);

            if (!anyCheckboxChecked) {
                allCheckboxes.property("checked", true);
                this.uncheckOtherCheckboxes(`${country}-checkbox`);
            }
        }

        // Call update function when checkbox changes
        this.updateVis();
    }

    // Render the radar chart
    renderVis() {
        let vis = this;
        let line = d3.line()
            .x(d => d.x)
            .y(d => d.y);

        // Get unique genres from the processed data
        let uniqueGenres = [...new Set(this.filter_data.map(d => d.Genre))];

        // Create legend color rectangles for unique genres
        let legendRects = vis.legend
            .selectAll(".legend-rect")
            .data(uniqueGenres)
            .join("rect")
            .attr("class", "legend-rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("y", (_, i) => i * 20)
            .attr("fill", d => this.colorScale(d));

        // Raise the legend item on mousemove
        legendRects
            .on('mousemove', (e, d) => {
                d3.selectAll('.properties').attr('opacity', 0.3);
                d3.select(`#${d.replace(' ', '').replace('&', '\\&')}`).raise().attr("fill-opacity", 0.7);
                d3.select(`#${d.replace(' ', '').replace('&', '\\&')}`).raise().attr("opacity", 1);
            })
            .on('mouseleave', (e, d) => {
                const radarPath = d3.select(`#${d.replace('&', '\\&')}`);
                d3.selectAll('.properties').attr('opacity', 1);
                radarPath.attr("fill-opacity", 0.2); // Reset the fill opacity of the path
            });

        // Create legend labels for unique genres
        vis.legend
            .selectAll(".legend-label")
            .data(uniqueGenres)
            .join("text")
            .attr("class", "legend-label")
            .attr("x", 20)
            .attr("y", (_, i) => i * 20 + 12)
            .text(d => d);

        // Add title for the legend
        vis.legend.append('text')
            .text(` Top 5 Genres`)
            .attr('dx', -15)
            .attr('dy', -5);

        // Add checkboxes for selected countries
        let checkboxes = this.svg.selectAll('.checkbox')
            .data(this.selectedCountry)
            .join('foreignObject')
            .attr("class", "checkbox")
            .attr('width', 16)
            .attr('height', 16)
            .attr('x', 10)
            .attr('y', (_, i) => i * 25 + 10)
            .html((d, i) => `<input type="checkbox" id="${d}-checkbox" class="country-checkbox" ${i === 0 ? 'checked' : ''}/>`)

            .on('change', (event, d) => {
                // Handle checkbox change
                this.handleCheckboxChange(d, event.target.checked);
            });

        // Add title for the selected country
        vis.svg.selectAll('.title')
            .data(vis.selectedCountry)
            .join('text')
            .text(d => d)
            .attr('x', 30)  // Adjust the x position to leave space for checkboxes
            .attr('y', (d, i) => i * 25 + 25)
            .attr('class', 'title');

        // Draw the radar paths
        vis.svg.selectAll("path")
            .data(vis.filter_data)
            .join("path")
            .attr("d", d => line(vis.getPathCoordinates(d)))
            .attr("stroke-width", 3)
            .attr("stroke", (_, i) => vis.colorScale(vis.filter_data[i].Genre))
            .attr("fill", (_, i) => vis.colorScale(vis.filter_data[i].Genre))
            .attr("class", "properties")
            .attr("stroke-opacity", 1)
            .attr("fill-opacity", 0.2)
            .attr('id', d => d.Genre.replace(" ", ""));

        // Draw dots at data points
        vis.svg.selectAll(".dot")
            .data(vis.filter_data)
            .join("g")
            .attr("class", "dot")
            .selectAll("circle")
            .data(d => vis.getPathCoordinates(d))
            .join("circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", 3)
            .attr("fill", "gray");
    }

}