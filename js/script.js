// setting up dimensions (px)
const height = 608;
const width = 1050;

//comon color scheme
const colors = ["#cad2ff", "#abb5ff", "#8c99ff", "#6d7ef2", "#4f67d7", "#2d50bd", "#093aa1", "#002282", "#000962", "#000038", "#000000"];

//title
const hist_title_ending = " Fatal Traffic Accidents"

//filters
createFilter('#year-filter')
createFilter('#speeding-filter')
createFilter('#bac-filter')
createFilter('#distracted-filter')
createFilter('#drowsy-filter')
createFilter('#weather-filter')
createFilter('#work-filter')
createFilter('#age-filter')

function createFilter(id) {
    $(id).multiselect({
        includeSelectAllOption: true
    });
}
// tool tip
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
var svg_hist = d3.select("#target_hist").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("id", "svg_hist");

var active_hist = d3.select(null);
var active_hist_county = d3.select(null);

/** Historical Map Generation */
var path = d3.geoPath();
var map = d3.map();
var heatmap

//back button listener
document.querySelector("#back-button-hist").onclick = e => { reset(); };

//load data and draw map and behavior
var promises = [
    d3.json("data/ingest/us-10m.v1.json"), //topo json
    d3.tsv("data/ingest/us-state-names.tsv"), // key to state names
    d3.tsv("data/ingest/us-county-names.tsv"), // key to county names
    d3.csv("data/ingest/file_1_clean_age.csv"), // state level fatality data
    d3.csv("data/ingest/file_2_clean_age.csv"), // county level fatality data
    d3.csv("data/ingest/file_3_clean_age.csv"), // street level fataility data
]
Promise.all(promises).then(ready);

//containers for data global variables
var names = {};
var namesCounty = {}
var us = null;
var fatalities = null;
var fatalitiesCounty = null;
var fatalitiesStreet = null;

function ready([map, lookup, lookupCounty, state, county, street]) {
    //extract just the names and Ids
    lookup.forEach(function (d, i) { var key = d.id.length > 1 ? d.id : '0' + d.id; names[key] = d.name; });
    lookupCounty.forEach(function (d, i) { namesCounty[d.id] = d.name; });
    //save data locally
    us = map
    fatalities = state
    fatalitiesCounty = county;
    fatalitiesStreet = street
    createMap();
}

function createMap() {
    //get data set
    let dataset = getDataset()
    var { color, x } = getScales(dataset);

    //states in nation layer
    svg_hist.append("g")
        .attr("class", "nation")
        .selectAll("path")
        .attr("margin-top", "25px")
        .data(topojson.feature(us, us.objects.states).features)
        .enter()
        .append("path")
        .attr("fill", function (d) {
            if (dataset.filter(data => d.id == data.STATE).length === 0) {
                return color(0)
            }
            return color(dataset.filter(data => d.id == data.STATE)[0].FATALS);
        })
        .attr("class", "state")
        .on("click", clickedState)
        .attr('stroke', "black")
        .attr('stroke-width', ".33")
        .attr("d", path)
        .on("mouseover", d => {
            if (active_hist.node()) return
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            if (dataset.filter(data => d.id == data.STATE).length === 0) {
                tooltip.html(`<span>${names[d.id]}<br>${0} Fatalities</span>`)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 60) + "px");
            }
            else {
                tooltip.html(`<span>${names[d.id]}<br>${dataset.filter(data => d.id == data.STATE)[0].FATALS.toLocaleString()} Fatalities</span>`)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 60) + "px");
            }
        })
        .on("mouseout", function (d) {
            tooltip.transition()
                .duration(100)
                .style("opacity", 0);
        });

    //counties
    svg_hist.select("g").append("g")
        .attr("style", "visibility:hidden")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.counties).features)
        .enter().append("path")
        .on("click", clickedCounty)
        .attr("id", (d) => d.id)
        .attr("fill", function (d) { return "#d1d4ff"; }) //TODO: color to be scaled to fatality rate, see https://material.io/resources/color/#!/?view.left=0&view.right=1 for range
        .attr("class", function (d) { return names[d.id.substring(0, 2)].replace(" ", "-") + " county" })
        .attr("d", path)
        .attr('stroke', "black")
        .attr('stroke-width', ".33");
    //legend
    createLegend(color, x, dataset.reduce((acc, d) => acc += d.FATALS, 0).toLocaleString())
    hideLoader()
}

function updateMap(timeout = 100) {
    if (active_hist.node()) {
        if (active_hist_county.node()) {
            //street view
            updateStreetView(active_hist_county.node().__data__.id, active_hist.node().__data__.id, true);
            return;
        }
        //county view only
        updateStateMap(active_hist.node().__data__.id);
        return
    }
    showLoader()
    setTimeout((d) => {
        let dataset = getDataset()
        if (dataset.length == 0) {
            document.querySelector("#legend_hist").innerHTML = "";
            //update fills
            svg_hist.select(".nation")
                .selectAll(".state")
                .attr("fill", function (d) {
                    return "#cad2ff";
                })
                .on("mouseover", d => {
                    if (active_hist.node()) return
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    if (dataset.filter(data => d.id == data.STATE).length === 0) {
                        tooltip.html(`<span>${names[d.id]}<br>${0} Fatalities</span>`)
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY - 60) + "px");
                    }
                    else {
                        tooltip.html(`<span>${names[d.id]}<br>${dataset.filter(data => d.id == data.STATE)[0].FATALS.toLocaleString()} Fatalities</span>`)
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY - 60) + "px");
                    }
                })
                .on("mouseout", function (d) {
                    tooltip.transition()
                        .duration(100)
                        .style("opacity", 0);
                });
            document.querySelector("#legend_hist").innerHTML = "";
            hideLoader()
            return;
        }
        var { color, x } = getScales(dataset);

        //legend
        createLegend(color, x, dataset.reduce((acc, d) => acc += d.FATALS, 0).toLocaleString());

        //update fills
        svg_hist.select(".nation")
            .selectAll(".state")
            .attr("fill", function (d) {
                if (dataset.filter(data => d.id == data.STATE).length === 0) {
                    return color(0)
                }
                return color(dataset.filter(data => d.id == data.STATE)[0].FATALS);
            })
            .on("mouseover", d => {
                if (active_hist.node()) return
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                if (dataset.filter(data => d.id == data.STATE).length === 0) {
                    tooltip.html(`<span>${names[d.id]}<br>${0} Fatalities</span>`)
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 60) + "px");
                }
                else {
                    tooltip.html(`<span>${names[d.id]}<br>${dataset.filter(data => d.id == data.STATE)[0].FATALS.toLocaleString()} Fatalities</span>`)
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 60) + "px");
                }
            })
            .on("mouseout", function (d) {
                tooltip.transition()
                    .duration(100)
                    .style("opacity", 0);
            });
        hideLoader()
    }, timeout);
}
function updateStateMap(id, timeout = 700) {
    showLoader()
    setTimeout((_) => {
        let dataset = getDataset(id.replace(/^0+/, ''))
        if (dataset.length == 0) {
            //update fills no data
            svg_hist.selectAll(".county")
                .attr("fill", function (d) {
                    return "#cad2ff";
                })
                .on("mouseover", d => {
                    if (active_hist_county.node()) return
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    tooltip.html(`<span>${namesCounty[mapCountyId(d.id)]}<br>${0} Fatalities</span>`)
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 60) + "px");
                })
                .on("mouseout", function (d) {
                    tooltip.transition()
                        .duration(100)
                        .style("opacity", 0);
                });
            hideLoader()

            return;
        }
        var { color, x } = getScales(dataset);
        //legend
        createLegend(color, x, dataset.reduce((acc, d) => acc += d.FATALS, 0).toLocaleString());

        //update fills data
        svg_hist.selectAll(`.${names[id.substring(0, 2)].replace(" ", "-")}`)
            .attr("fill", function (d) {
                if (dataset.filter(data => d.id == getCountyId(data.STATE, data.COUNTY)).length === 0) {
                    return color(0)
                }
                return color(dataset.filter(data => d.id == getCountyId(data.STATE, data.COUNTY))[0].FATALS);
            })
            .on("mouseover", d => {
                if (active_hist_county.node()) return
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                if (dataset.filter(data => d.id == getCountyId(data.STATE, data.COUNTY)).length === 0) {
                    tooltip.html(`<span>${namesCounty[mapCountyId(d.id)]}<br>${0} Fatalities</span>`)
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 60) + "px");
                }
                else {
                    tooltip.html(`<span>${namesCounty[mapCountyId(d.id)]}<br>${dataset.filter(data => d.id == getCountyId(data.STATE, data.COUNTY))[0].FATALS.toLocaleString()} Fatalities</span>`)
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 60) + "px");
                }
            })
            .on("mouseout", function (d) {
                tooltip.transition()
                    .duration(100)
                    .style("opacity", 0);
            });
        hideLoader()
    }, timeout);
}

function getScales(dataset) {
    let range = d3.range(d3.min(dataset, function (d) {
        return d.FATALS;
    }), d3.max(dataset, function (d) {
        return d.FATALS;
    }));
    let step = range.length / 8;
    var x = d3.scaleLinear()
        .domain(d3.range(0, d3.max(dataset, function (d) {
            return d.FATALS;
        }) + step, step))
        .rangeRound([0, 50]);
    var color = d3.scaleThreshold()
        .domain(d3.range(0, d3.max(dataset, function (d) {
            return d.FATALS;
        }) + step, step))
        .range(colors);
    return { color, x };
}

function getDataset(state = "-1") {
    //national
    if (state === "-1") {
        //summarize
        let dataset = fatalities.filter(d => $('#year-filter').val().includes(d.YEAR)
            && $('#speeding-filter').val().includes(d.A_SPCRA)
            && $('#bac-filter').val().includes(d.A_POSBAC)
            && $('#distracted-filter').val().includes(d.A_DIST)
            && $('#drowsy-filter').val().includes(d.A_DROWSY)
            && $('#work-filter').val().includes(d.WRK_ZONE)
            && $('#weather-filter').val().includes(d.WEATHER)
            && $('#age-filter').val().includes(d.DRIVER_AGE_BUCKET)).map(d => {
                d.FATALS = parseInt(d.FATALS);
                if (d.STATE.length == 1) {
                    d.STATE = "0" + d.STATE;
                }
                return d;
            });
        //reduce
        endResult = dataset.reduce((acc, curr) => {
            if (acc.filter(d => d.STATE == curr.STATE).length != 0) {
                acc.filter(d => d.STATE == curr.STATE)[0].FATALS += curr.FATALS
            }
            else {
                acc.push(deepCopy(curr))
            }
            return acc
        }, [])
        return endResult
    }
    else {
        //summarize
        let dataset = fatalitiesCounty.filter(d =>
            d.STATE === state
            && $('#year-filter').val().includes(d.YEAR)
            && $('#speeding-filter').val().includes(d.A_SPCRA)
            && $('#bac-filter').val().includes(d.A_POSBAC)
            && $('#distracted-filter').val().includes(d.A_DIST)
            && $('#drowsy-filter').val().includes(d.A_DROWSY)
            && $('#work-filter').val().includes(d.WRK_ZONE)
            && $('#weather-filter').val().includes(d.WEATHER)
            && $('#age-filter').val().includes(d.DRIVER_AGE_BUCKET)).map(d => {
                d.FATALS = parseInt(d.FATALS);
                return d;
            });
        //reduce
        let endResult = dataset.reduce((acc, curr) => {
            if (acc.filter(d => d.COUNTY == curr.COUNTY).length != 0) {
                acc.filter(d => d.COUNTY == curr.COUNTY)[0].FATALS += curr.FATALS
            }
            else {
                acc.push(deepCopy(curr))
            }
            return acc
        }, [])
        return endResult
    }
}

function createLegend(color, x, total = 0) {
    document.querySelector("#legend_hist").innerHTML = "";
    var g = d3.select("#legend_hist").append("g")
        .attr("class", "key")
        .attr("transform", "translate(60,20)");
    g.selectAll("rect")
        .data(color.range().map(function (d) {
            d = color.invertExtent(d);
            if (d[0] == null)
                d[0] = x.domain()[0];
            if (d[1] == null)
                d[1] = x.domain()[1];
            return d;
        }))
        .enter().append("rect")
        .attr("height", 8)
        .attr("x", function (d) { return x(d[0]); })
        .attr("width", function (d) { return x(d[1]) - x(d[0]); })
        .attr("fill", function (d) { return color(d[0]); });
    g.append("text")
        .attr("class", "caption")
        .attr("x", x.range()[0])
        .attr("y", -6)
        .attr("fill", "#000")
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .attr("font-size", "18px")
        .text("Traffic Fatalities");
    g.call(d3.axisBottom(x)
        .tickSize(13)
        .tickValues(color.domain()))
        .select(".domain")
        .remove();
    g.append("text")
        .attr("class", "caption")
        .attr("x", 700)
        .attr("y", 12)
        .attr("fill", "#000")
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .attr("font-size", "20px")
        .text("Total: " + total);
}
function showLoader() {
    document.querySelector("#loader").style.visibility = 'visible';
    $("li").css("pointer-events", "none");
}
function hideLoader() {
    document.querySelector("#loader").style.visibility = 'hidden';
    $("li").css("pointer-events", "all");
}
function clickedState(d, e, z, county = false) {
    if (active_hist.node() && !county) return
    updateStateMap(d.id);
    //zoom in
    if (!county) {
        active_hist.classed("activated", false);
        active_hist = d3.select(this).classed("activated", true);
    }
    var bounds = path.bounds(d),
        dx = bounds[1][0] - bounds[0][0],
        dy = bounds[1][1] - bounds[0][1],
        x = (bounds[0][0] + bounds[1][0]) / 2,
        y = (bounds[0][1] + bounds[1][1]) / 2,
        scale = .9 / Math.max(dx / width, dy / height),
        translate = [width / 2 - scale * x, height / 2 - scale * y];
    svg_hist.select("g").transition()
        .duration(750)
        .style("stroke-width", 1.5 / scale + "px")
        .attr("transform", "translate(" + translate + ")scale(" + scale + ")");
    document.getElementById("title_hist").textContent = names[d.id] + hist_title_ending

    //show county lines
    document.querySelectorAll(`.${names[d.id].replace(" ", "-")}`).forEach(d => {
        d.classList.add("show-lines");
    });

    //fade states
    document.querySelectorAll(".state").forEach(d => {
        d.classList.add("fadeed");
    });
    //show back button
    document.querySelector("#back-button-hist").style = "visibility:visible;"
}

function clickedCounty(d) {
    if (active_hist_county.node()) return
    active_hist_county = d3.select(this)

    var bounds = path.bounds(d),
        dx = bounds[1][0] - bounds[0][0],
        dy = bounds[1][1] - bounds[0][1],
        x = (bounds[0][0] + bounds[1][0]) / 2,
        y = (bounds[0][1] + bounds[1][1]) / 2,
        scale = .9 / Math.max(dx / width, dy / height),
        translate = [width / 2 - scale * x, height / 2 - scale * y];
    svg_hist.select("g").transition()
        .duration(750)
        .style("stroke-width", 1.5 / scale + "px")
        .attr("transform", "translate(" + translate + ")scale(" + scale + ")");
    document.getElementById("title_hist").textContent = `${namesCounty[mapCountyId(d.id)]}, ${names[active_hist.node().__data__.id]}${hist_title_ending}`;

    //fade counties
    document.querySelectorAll(".county").forEach(d => {
        d.classList.add("fadeed");
    });
    // transition to google map
    setTimeout(_ => svg_hist.attr("style", "display:none"), 750)
    setTimeout(_ => updateStreetView(d.id, active_hist.node().__data__.id), 751)
}


function updateStreetView(countyId, stateId, update = false) {
    showLoader();
    //get lat long box
    setTimeout(function (z) {
        var geocoder = new google.maps.Geocoder();
        var center;
        geocoder.geocode({ 'address': namesCounty[mapCountyId(countyId)] + " county " + names[stateId] }, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                if (!update) {
                    center = results[0].geometry.location;
                    var map = new google.maps.Map(document.getElementById('gmap_hist'), {
                        center: center,
                        mapTypeId: google.maps.MapTypeId.ROADMAP
                    });
                    map.fitBounds(results[0].geometry.viewport)
                    //build county line:
                    map.data.loadGeoJson(`https://nominatim.openstreetmap.org/search.php?q=${encodeURI(namesCounty[mapCountyId(countyId)] + " county " + names[stateId])}&polygon_geojson=1&format=geojson`)
                    map.data.setStyle({
                        fillOpacity: 0.0,
                        strokeColor: "red",
                        strokeWeight: "1"
                    })
                    // Bounds for North America
                    var strictBounds = results[0].geometry.viewport;

                    // Listen for the dragend event
                    google.maps.event.addListener(map, 'dragend', function () {
                        if (strictBounds.contains(map.getCenter())) return;

                        // We're out of bounds - Move the map back within the bounds

                        var c = map.getCenter(),
                            x = c.lng(),
                            y = c.lat(),
                            maxX = strictBounds.getNorthEast().lng(),
                            maxY = strictBounds.getNorthEast().lat(),
                            minX = strictBounds.getSouthWest().lng(),
                            minY = strictBounds.getSouthWest().lat();

                        if (x < minX) x = minX;
                        if (x > maxX) x = maxX;
                        if (y < minY) y = minY;
                        if (y > maxY) y = maxY;
                        map.setCenter(new google.maps.LatLng(y, x));
                    });
                }
                //heatmap data
                var heatmapData = fatalitiesStreet.filter(data => {
                    return (countyId === getCountyId(data.STATE, data.COUNTY))
                        && (data.LATITUDE !== "888888888.0"
                            && $('#year-filter').val().includes(data.YEAR)
                            && $('#speeding-filter').val().includes(data.A_SPCRA)
                            && $('#bac-filter').val().includes(data.A_POSBAC)
                            && $('#distracted-filter').val().includes(data.A_DIST)
                            && $('#drowsy-filter').val().includes(data.A_DROWSY)
                            && $('#work-filter').val().includes(data.WRK_ZONE)
                            && $('#weather-filter').val().includes(data.WEATHER)
                            && $('#age-filter').val().includes(data.DRIVER_AGE_BUCKET))
                }).reduce((acc, data) => {
                    num = parseInt(data.FATALS)
                    i = 0;
                    while (i < num) {
                        acc.push(new google.maps.LatLng(data.LATITUDE, data.LONGITUDE));
                        i += 1
                    }
                    return acc;
                }, []);
                if (!update) {
                    heatmap = new google.maps.visualization.HeatmapLayer({
                        data: heatmapData,
                        radius: 40,
                        maxIntensity:20
                    });
                }
                else {
                    console.log(heatmapData)
                    heatmap.setData(heatmapData)
                }
                document.querySelector("#legend_hist").innerHTML = "";
                var g = d3.select("#legend_hist").append("g")
                    .attr("class", "key")
                    .attr("transform", "translate(60,25)");
                g.append("text")
                    .attr("class", "caption")
                    .attr("fill", "#000")
                    .attr("text-anchor", "start")
                    .attr("font-weight", "bold")
                    .attr("font-size", "20px")
                    .text("Showing " + heatmapData.length + " Fatalities with Latitude/Longitude Data");
                if (!update) {
                    heatmap.setMap(map);
                    document.getElementById("gmap_hist").style = "display:block";
                }
            }
        });
        hideLoader();
    }, 20)
}

function reset() {
    if (active_hist_county.node()) {
        document.getElementById("gmap_hist").style = "display:none"
        svg_hist.transition().duration(750).attr("style", "display:block");
        active_hist_county.classed("activated", false);
        active_hist_county = d3.select(null);
        //hide map
        document.querySelectorAll(".county.activated").forEach(d => d.classList.remove("activated"))
        //show all counties
        document.querySelectorAll(".county.fadeed").forEach(d => d.classList.remove("fadeed"))
        //update map
        clickedState(active_hist.node().__data__, null, null, county = true);
        return
    }
    active_hist.classed("activated", false);
    active_hist = d3.select(null);
    document.getElementById("title_hist").textContent = "United States" + hist_title_ending;
    svg_hist.select("g").transition()
        .duration(750)
        .style("stroke-width", "1.5px")
        .attr("transform", "");
    //hide county lines
    document.querySelectorAll(".show-lines").forEach(d => d.classList.remove("show-lines"))
    //hide back button:
    document.querySelector("#back-button-hist").style = "visibility:hidden;"
    //show state
    document.querySelectorAll(".fadeed").forEach(d => d.classList.remove("fadeed"))
    //update map
    updateMap(800);
}


//useful utilites
function deepCopy(inObject) {
    let outObject, value, key

    if (typeof inObject !== "object" || inObject === null) {
        return inObject // Return the value if inObject is not an object
    }

    // Create an array or object to hold the values
    outObject = Array.isArray(inObject) ? [] : {}

    for (key in inObject) {
        value = inObject[key]

        // Recursively (deep) copy for nested objects, including arrays
        outObject[key] = (typeof value === "object" && value !== null) ? deepCopyFunction(value) : value
    }

    return outObject
}

function getCountyId(state, county) {
    if (state.length < 2) {
        state = "0" + state;
    }
    while (county.length < 3) {
        county = "0" + county;
    }
    return state + county
}

function mapCountyId(Id) {
    if (Id[0] === "0") {
        return Id.substr(1, 1) + Id.substr(2)
    }
    return Id
}