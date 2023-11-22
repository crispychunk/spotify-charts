class SlopeChart {

    /*
     * Class constructor with initial configuration.
     * Slope chart should only take 2 countries AND cannot take itself twice.
     */
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 1050,
            containerHeight: 700,
            margin: {
                top: 30,
                right: 100,
                bottom: 20,
                left: 30
            }
        }

        this.data = _data
        this.selectedCountry = [_config.defaultCountry];
        this.selectedDate = _config.defaultDate;
        this.allGenre = ['pop', 'reggaeton', 'rock', 'latin', 'hip hop', 'rap', 'r&b', 'other']
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

        vis.colorScale = d3.scaleOrdinal(d3.schemeSet3);
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

        vis.yAxis = d3.axisLeft(vis.yScale)
            .tickSize(0)
            .ticks(20)

        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0, ${vis.config.height + vis.config.margin.bottom})`);

        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis')

        // legend
        const legend = vis.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${vis.config.width + 50},${vis.config.margin.top})`);

        const legendItems = legend.selectAll(".legend-item")
            .data(vis.allGenre)
            .enter().append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0,${i * 25})`);

        legendItems.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", d => vis.colorScale(d))


        legendItems.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .attr("font-size", 12)
            .text(d => d);


        vis.updateVis();
    }


    /* UpdateVis will group data by week and country, and generate node-link data. If only one country is selected then only nodes are created
     *
     */
    updateVis() {
        let vis = this
        vis.data = d3.group(vis.data, d => d.week, d => d.country);
        vis.filteredData = vis.searchAndJoinCountry();


        vis.colorValue = d => d.artist_genre;
        vis.xValue = d => d.country;
        vis.yValue = d => d.rank;
        vis.calculateStrength = d => Math.abs(d['country1'] - d['country2']);


        vis.xScale.domain([0, 1]);
        vis.yScale.domain([1, 20]);
        vis.colorScale.domain(vis.allGenre);
        vis.rankScale.domain([0, 19]);


        vis.renderVis();

    }

    renderVis() {

        let vis = this;

        const line = d3.line()
            .x((d, i) => vis.xScale(i))
            .y(vis.yScale);


        vis.chart.append("g")
            .attr("fill", "none")
            .attr("stroke", "currentColor")
            .selectAll("path")
            .data(vis.filteredData)
            .join("path")
            .attr("d", (d => {
                if (d['country2'] === undefined || d['country1'] === undefined) {
                    return "";
                }
                return line([d['country1'], d['country2']])
            }))
            .attr("stroke", d => vis.colorScale(vis.colorValue(d)))
            .attr("stroke-width", d => vis.rankScale(vis.calculateStrength(d)))


        // Add text for country1 on the left
        vis.chart.selectAll(".text-country1")
            .data(vis.filteredData)
            .enter()
            .filter(d => d['country1'] !== undefined)  // Only include data with country1 defined
            .append("text")
            .attr("class", "song-text")
            .attr("text-anchor", "end")
            .attr("x", d => vis.xScale(0))
            .attr("y", d => vis.yScale(d['country1']))
            .text(d => d['track_name'] + ' ' + d['country1']);

        // Add text for country2 on the right
        vis.chart.selectAll(".text-country2")
            .data(vis.filteredData)
            .enter()
            .filter(d => d['country2'] !== undefined)  // Only include data with country2 defined
            .append("text")
            .attr("class", "song-text")
            .attr("text-anchor", "start")
            .attr("x", vis.xScale(1))
            .attr("y", d => vis.yScale(d['country2']))
            .text(d => d['country2'] + ' ' + d['track_name']);


        vis.xAxisG
            .call(vis.xAxis)
            .call(g => g.select('.domain').remove());

        vis.yAxisG
            .call(vis.yAxis)
            .call(g => g.select('.domain').remove());

    }

    searchAndJoinCountry() {
        let vis = this;
        let map = new Map();
        vis.selectedCountry.forEach((country) => {
            let countryData = vis.data.get(vis.selectedDate).get(country);
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
        let newData = [...map.values()]
        return newData;

    }


}