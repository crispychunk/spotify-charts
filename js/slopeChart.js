class SlopeChart {

    /*
     * Class constructor with initial configuration.
     * Slope chart should only take 2 countries AND cannot take itself twice.
     */
    constructor(_config, _data, _dispatcher) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 800,
            containerHeight: 750,
            margin: {
                top: 100,
                right: 100,
                bottom: 50,
                left: 100
            }
        }

        this.data = _data
        this.selectedCountry = _config.defaultCountry ? [_config.defaultCountry] : [];
        this.selectedDate = _config.defaultDate;
        this.dispatcher = _dispatcher;
        this.allGenre = ['pop', 'reggaeton', 'rock', 'latin', 'hip hop', 'rap', 'r&b', 'other']
        this.colorScale = _config.colorScale;
        this.initVis();
    }

    initVis() {
        let vis = this;
        // Calculate inner chart size. Margin specifies the space around the actual chart.
        vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        vis.rankScale = d3.scaleLinear().range([1, 9]);
        vis.xScale = d3.scalePoint().range([0, vis.config.width]).padding(1.2);
        vis.yScale = d3.scaleLinear().range([0, vis.config.height]);

        vis.xAxis = d3.axisTop(vis.xScale)
            .tickSize(0)
            .tickFormat(d => {
                if (vis.selectedCountry[d]) {
                    return vis.selectedCountry[d];
                } else {
                    return ""
                }
            });

        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0, ${vis.config.height + vis.config.margin.bottom})`);

        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis');

        // Creating Legend
        const legend = vis.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${vis.config.width},0)`);

        const legendItems = legend.selectAll(".legend-item")
            .data(vis.allGenre)
            .enter().append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(${Math.floor(i / 4) * 100},${(i % 4 * 20)})`);

        legendItems.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", d => vis.colorScale(d))


        legendItems.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .attr("font-size", 12)
            .text(d => d);
    }


    /*
     * UpdateVis will group data by week and country, and generate node-link data. If only one country is selected then only nodes are created
     */
    updateVis() {
        let vis = this;

        //Default State
        if (vis.selectedCountry.length <= 1 && !vis.selectedCountry.includes('Global')) {
            vis.selectedCountry.push('Global')
        }
        vis.filteredData = d3.group(vis.data, d => d.week, d => d.country);
        vis.filteredData = vis.searchAndJoinCountry();

        // Ensure the color scale domain is set based on the genres in the current data
        vis.colorScale.domain(vis.allGenre);

        vis.colorValue = d => d.artist_genre;
        vis.xValue = d => d.country;
        vis.yValue = d => d.rank;
        vis.calculateStrength = d => Math.abs(d['country1'] - d['country2']);

        vis.xScale.domain([0, 1]);
        vis.yScale.domain([1, 20]);
        vis.rankScale.domain([0, 19]);

        vis.renderVis();
    }

    renderVis() {
        let vis = this;

        const line = d3.line()
            .x((d, i) => vis.xScale(i))
            .y(vis.yScale);

        // Select all existing paths and update them
        vis.chart.selectAll(".slope-line")
            .data(vis.filteredData)
            .join(
                enter => enter
                    .append("path")
                    .attr("class", d => `slope-line slope-${vis.sanitizeSelector(d.track_name)}`)
                    .attr("fill", "none")
                    .attr("stroke", "currentColor")
                    .attr("stroke-width", d => vis.rankScale(vis.calculateStrength(d)))
                    .attr("d", d => {
                        if (d['country2'] === undefined || d['country1'] === undefined) {
                            return "";
                        }
                        return line([d['country1'], d['country2']]);
                    }),
                update => update
                    .attr("d", d => {
                        if (d['country2'] === undefined || d['country1'] === undefined) {
                            return "";
                        }
                        return line([d['country1'], d['country2']]);
                    })
            );

        // Select all existing text for country1 and update them
        vis.chart.selectAll(".text-country1")
            .data(vis.filteredData.filter(d => d['country1'] !== undefined))
            .join("text")
            .attr("class", d => `song-text  text-country1 slope-${vis.sanitizeSelector(d.track_name)}`)
            .attr("text-anchor", "end")
            .attr("x", d => vis.xScale(0))
            .attr("y", d => vis.yScale(d['country1']))
            .attr("fill", d => vis.colorScale(vis.colorValue(d)))
            .text(d => d['track_name'] + ' ' + d['country1'])
            .on('mouseenter', (event, d) => {
                // Given all text element, highlight the elements
                let elements = d3.selectAll(`.slope-${vis.sanitizeSelector(d.track_name)}`);
                elements.classed('hover-slope', !elements.classed('hover-slope'));

                vis.dispatcher.call('handleBiDirectionalInteraction', null, d.track_name);
            })
            .on('mouseleave', (event, d) => {
                // Given all text element, highlight the elements
                let elements = d3.selectAll(`.slope-${vis.sanitizeSelector(d.track_name)}`);
                elements.classed('hover-slope', !elements.classed('hover-slope'));

                vis.dispatcher.call('handleBiDirectionalInteraction', null, d.track_name);
            }).on('click', (event, d) => {
                //TODO interaction with linechart maybe?
        })


        // Select all existing text for country2 and update them
        vis.chart.selectAll(".text-country2")
            .data(vis.filteredData.filter(d => d['country2'] !== undefined))
            .join("text")
            .attr("class", d => `song-text text-country2 slope-${vis.sanitizeSelector(d.track_name)}`)
            .attr("text-anchor", "start")
            .attr("x", vis.xScale(1))
            .attr("y", d => vis.yScale(d['country2']))
            .attr("fill", d => vis.colorScale(vis.colorValue(d)))
            .text(d => d['country2'] + ' ' + d['track_name'])
            .on('mouseenter', (event, d) => {
                // Given all text element, highlight the elements
                let elements = d3.selectAll(`.slope-${vis.sanitizeSelector(d.track_name)}`);
                elements.classed('hover-slope', !elements.classed('hover-slope'));

                vis.dispatcher.call('handleBiDirectionalInteraction', null, d.track_name);
            })
            .on('mouseleave', (event, d) => {
                // Given all text element, highlight the elements
                let elements = d3.selectAll(`.slope-${vis.sanitizeSelector(d.track_name)}`);
                elements.classed('hover-slope', !elements.classed('hover-slope'));

                vis.dispatcher.call('handleBiDirectionalInteraction', null, d.track_name);
            })

        vis.xAxisG
            .call(vis.xAxis)
            .call(g => g.select('.domain').remove());
    }


    searchAndJoinCountry() {
        let vis = this;
        let map = new Map();
        vis.selectedCountry.forEach((country) => {
            let countryData = vis.filteredData.get(vis.selectedDate).get(country);
            let countryIndex = vis.selectedCountry.indexOf(country) + 1;
            let key = 'country' + countryIndex;
            countryData.forEach(song => {
                if (!map.has(song['track_name'])) {
                    let object = {
                        track_name: song['track_name'],
                        [key]: song['rank'],
                        artist_genre: song['artist_genre']
                    };
                    map.set(song['track_name'], object);
                } else {
                    let object = map.get(song['track_name']);
                    map.set(song['track_name'], {...object, [key]: song['rank']});
                }
            })
        });
        return [...map.values()];

    }

    // Given a track_name, create a className that removes spaces and replaces it with an underscore
    sanitizeSelector(track_name) {
        return track_name.replace(/[^a-zA-Z0-9-_]/g, '_');
    }

}

