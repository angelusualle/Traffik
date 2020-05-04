function init_ml() {
    if (ml_initialized) return;
    createFilter("#year-feature")
    createFilter("#speeding-feature")
    createFilter("#bac-feature")
    createFilter("#distracted-feature")
    createFilter("#drowsy-feature")
    createFilter("#weather-feature")
    createFilter("#work-feature")
    createFilter("#age-feature")
    showLoader();
    if (generateSelectionTensors()) {
        hideLoader();
        return;
    };
    setTimeout(_ => get_states_estimates(build_national_map), 100);
    ml_initialized = true;
}
var ml_initialized = false;


// setting up dimensions (px)
const height_ml = 600;
const width_ml = 1200;

//title prefix
const ml_title_ending = " Fatal Traffic Accidents Yearly Estimates";

// set up two svgs
var svg_nn = d3.select("#target_ml1").append("svg")
    .attr("width", width_ml)
    .attr("height", height_ml)
    .attr("id", "svg_ml1");

var svg_linear = d3.select("#target_ml2").append("svg")
    .attr("width", width_ml)
    .attr("height", height_ml)
    .attr("id", "svg_ml2");

// navigation component, joint
var active_ml = d3.select(null);

// ml maps generation
var path_ml1 = d3.geoPath();
var map_ml1 = d3.map();
var heatmap1;

var path_ml2 = d3.geoPath();
var map_ml2 = d3.map();
var heatmap2;

//back button listener
document.querySelector("#back-button-ml1").onclick = e => { resetML(); };
document.querySelector("#back-button-ml2").onclick = e => { resetML(); };

var topojson_file;
var states;
var counties;
var nn_states;
var linear_states;
var tensors;
var selection_tensors = [];

var promises_ml = [
    tf.loadLayersModel('data/ingest/nn/model.json'), //neural network state model
    d3.tsv("data/ingest/us-state-names.tsv"),
    d3.tsv("data/ingest/us-county-names.tsv") // counties
]

tf.loadLayersModel("data/ingest/linear_web/model.json").then(resp => {
    linear_states = resp;
})

Promise.all(promises_ml).then(ready_ml);

function ready_ml([nn_statee, statez, countiez]) {
    states = statez;
    nn_states = nn_statee;
    counties = countiez;
}

function generateSelectionTensors() {
    selection_tensors = []
    //speeding transformation
    var speeding_permutations = [];
    var speedingVals = $('#speeding-feature').val();
    if (speedingVals.length == 2) {
        speeding_permutations.push([0, 1], [1, 0])
    }
    else if (speedingVals.length > 0) {
        if (speedingVals[0] === "1") {
            speeding_permutations.push([1, 0])
        }
        else {
            speeding_permutations.push([0, 1])
        }
    }
    if (speeding_permutations.length === 0) {
        alert("Invalid speeding selection.");
        return true;
    }

    //alcohol transformation
    var alc_permutations = [];
    var alcVals = $('#bac-feature').val();
    if (alcVals.length == 3) {
        alc_permutations.push([0, 0, 1], [0, 1, 0], [1, 0, 0])
    }
    else if (alcVals.length > 0) {
        alcVals.forEach(element => {
            if (element == "1") {
                alc_permutations.push([1, 0, 0]);
            }
            else if (element == "2") {
                alc_permutations.push([0, 1, 0]);
            }
            else if (element == "3") {
                alc_permutations.push([0, 0, 1]);
            }
        });
    }
    if (alc_permutations.length === 0) {
        alert("Invalid Blood Alcohol Content selection.");
        return true;
    }

    //distracted transformation
    var distracted_permutations = [];
    var distractedVals = $('#distracted-feature').val();
    if (distractedVals.length == 2) {
        distracted_permutations.push([0, 1], [1, 0])
    }
    else if (distractedVals.length > 0) {
        if (distractedVals[0] === "1") {
            distracted_permutations.push([1, 0])
        }
        else {
            distracted_permutations.push([0, 1])
        }
    }
    if (distracted_permutations.length === 0) {
        alert("Invalid distracted selection.");
        return true;
    }

    //drowsy transformation
    var drowsy_permutations = [];
    var drowsyVals = $('#drowsy-feature').val();
    if (drowsyVals.length == 2) {
        drowsy_permutations.push([0, 1], [1, 0])
    }
    else if (drowsyVals.length > 0) {
        if (drowsyVals[0] === "1") {
            drowsy_permutations.push([1, 0])
        }
        else {
            drowsy_permutations.push([0, 1])
        }
    }
    if (drowsy_permutations.length === 0) {
        alert("Invalid drowsy selection.");
        return true;
    }


    //age transformation
    var age_permutations = [];
    var ageVals = $('#age-feature').val();
    if (ageVals.length == 3) {
        age_permutations.push([0, 0, 0, 1], [0, 0, 1, 0],
            [0, 1, 0, 0], [1, 0, 0, 0])
    }
    else if (ageVals.length > 0) {
        ageVals.forEach(element => {
            if (element == "Adult (25-64)") {
                age_permutations.push([1, 0, 0, 0]);
            }
            else if (element == "Senior (65+)") {
                age_permutations.push([0, 1, 0, 0]);
            }
            else if (element == "Teen (15-20)") {
                age_permutations.push([0, 0, 1, 0]);
            }
            else if (element == "Young Adult (21-24)") {
                age_permutations.push([0, 0, 0, 1]);
            }
        });
    }
    if (age_permutations.length === 0) {
        alert("Invalid Age selection.");
        return true;
    }

    //weather transformation
    var weather_permutations = [];
    var weatherVals = $('#weather-feature').val();
    if (weatherVals.length == 3) {
        weather_permutations.push([0, 0, 1], [0, 1, 0], [1, 0, 0])
    }
    else if (weatherVals.length > 0) {
        weatherVals.forEach(element => {
            if (element == "0") {
                weather_permutations.push([1, 0, 0]);
            }
            else if (element == "1") {
                weather_permutations.push([0, 1, 0]);
            }
            else if (element == "99") {
                weather_permutations.push([0, 0, 1]);
            }
        });
    }
    if (weather_permutations.length === 0) {
        alert("Invalid weather selection.");
        return true;
    }

    //work transformation
    var work_permutations = [];
    var workVals = $('#work-feature').val();
    if (workVals.length == 6) {
        work_permutations.push([0, 0, 0, 0, 0, 1], [0, 0, 0, 0, 1, 0],
            [0, 0, 0, 1, 0, 0], [0, 0, 1, 0, 0, 0], [0, 1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0, 0])
    }
    else if (workVals.length > 0) {
        workVals.forEach(element => {
            if (element == "0") {
                work_permutations.push([1, 0, 0, 0, 0, 0]);
            }
            if (element == "1") {
                work_permutations.push([0, 1, 0, 0, 0, 0]);
            }
            if (element == "2") {
                work_permutations.push([0, 0, 1, 0, 0, 0]);
            }
            if (element == "3") {
                work_permutations.push([0, 0, 0, 1, 0, 0]);
            }
            if (element == "4") {
                work_permutations.push([0, 0, 0, 0, 1, 0]);
            }
            if (element == "8") {
                work_permutations.push([0, 0, 0, 0, 0, 1]);
            }
        });
    }
    if (work_permutations.length === 0) {
        alert("Invalid work selection.");
        return true;
    }

    //generate all possible tensors
    speeding_permutations.forEach(speeding_possiblity => {
        alc_permutations.forEach(alc_possiblity => {
            distracted_permutations.forEach(dist_possibility => {
                drowsy_permutations.forEach(drowsy_possibility => {
                    work_permutations.forEach(work_possilbity => {
                        weather_permutations.forEach(weather_possibility => {
                            age_permutations.forEach(age_possibility => {
                                selection_tensors.push(
                                    speeding_possiblity
                                        .concat(alc_possiblity)
                                        .concat(dist_possibility)
                                        .concat(drowsy_possibility)
                                        .concat(work_possilbity)
                                        .concat(weather_possibility)
                                        .concat(age_possibility));
                            })
                        })
                    })
                })
            })
        })
    })
}

async function build_national_map(state_estimates, state_estimates_linear) {
    var { color, x } = getScalesML(state_estimates);
    //states in nation layer
    svg_nn.append("g")
        .attr("class", "nationML")
        .selectAll("path")
        .attr("margin-top", "25px")
        .data(topojson.feature(us, us.objects.states).features)
        .enter()
        .append("path")
        .attr("fill", function (d) {
            if (state_estimates[d.id] <= 1) {
                return color(0)
            }
            return color(state_estimates[(d.id[0] === "0") ? d.id[1] : d.id]);
        })
        .attr("class", "stateML")
        .on("click", clickedStateML)
        .attr('stroke', "black")
        .attr('stroke-width', ".33")
        .attr("d", path_ml1)
        .on("mouseover", d => {
            if (active_ml.node()) return
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`<span>${names[d.id]}<br>${Math.round(state_estimates[(d.id[0] === "0") ? d.id[1] : d.id] * 1) / 1} Fatalities</span>`)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 60) + "px");
        })
        .on("mouseout", function (d) {
            tooltip.transition()
                .duration(100)
                .style("opacity", 0);
        });
    hideLoader();
    total = 0;
    for (key in state_estimates) {
        total += state_estimates[key];
    }
    createLegendML(color, x, Math.round(total * 1 / 1).toLocaleString());
    //linear
    var scales = getScalesML(state_estimates_linear);
    svg_linear.append("g")
        .attr("class", "nationML")
        .selectAll("path")
        .attr("margin-top", "25px")
        .data(topojson.feature(us, us.objects.states).features)
        .enter()
        .append("path")
        .attr("fill", function (d) {
            if (state_estimates_linear[d.id] <= 1) {
                return scales.color(0)
            }
            return scales.color(state_estimates_linear[(d.id[0] === "0") ? d.id[1] : d.id]);
        })
        .attr("class", "stateML")
        .on("click", clickedStateML)
        .attr('stroke', "black")
        .attr('stroke-width', ".33")
        .attr("d", path_ml1)
        .on("mouseover", d => {
            if (active_ml.node()) return
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`<span>${names[d.id]}<br>${Math.round(state_estimates_linear[(d.id[0] === "0") ? d.id[1] : d.id] * 1) / 1} Fatalities</span>`)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 60) + "px");
        })
        .on("mouseout", function (d) {
            tooltip.transition()
                .duration(100)
                .style("opacity", 0);
        });
    hideLoader();
    var total2 = 0;
    for (key in state_estimates_linear) {
        total2 += state_estimates_linear[key];
    }
    createLegendML(scales.color, scales.x, Math.round(total2 * 1 / 1).toLocaleString(), linear = true);
}

async function update_national_map(state_estimates, state_estimates_linear) {
    //nn
    var { color, x } = getScalesML(state_estimates);
    //legend
    total = 0;
    for (key in state_estimates) {
        total += state_estimates[key];
    }
    createLegendML(color, x, Math.round(total * 1 / 1).toLocaleString());

    //update fills
    svg_nn.select(".nationML")
        .selectAll(".stateML")
        .attr("fill", function (d) {
            if (state_estimates[d.id] <= 1) {
                return color(0)
            }
            return color(state_estimates[(d.id[0] === "0") ? d.id[1] : d.id]);
        })
        .on("mouseover", d => {
            if (active_ml.node()) return
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`<span>${names[d.id]}<br>${Math.round(state_estimates[(d.id[0] === "0") ? d.id[1] : d.id] * 1) / 1} Fatalities</span>`)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 60) + "px");
        })
        .on("mouseout", function (d) {
            tooltip.transition()
                .duration(100)
                .style("opacity", 0);
        });

    //linear
    var scales = getScalesML(state_estimates_linear, true);
    //legend
    var total2 = 0;
    for (key in state_estimates_linear) {
        total2 += state_estimates_linear[key];
    }
    createLegendML(scales.color, scales.x, Math.round(total2 * 1 / 1).toLocaleString(), linear = true);

    //update fills
    svg_linear.select(".nationML")
        .selectAll(".stateML")
        .attr("fill", function (d) {
            if (state_estimates_linear[d.id] <= 1) {
                return scales.color(0)
            }
            return scales.color(state_estimates_linear[(d.id[0] === "0") ? d.id[1] : d.id]);
        })
        .on("mouseover", d => {
            if (active_ml.node()) return
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`<span>${names[d.id]}<br>${Math.round(state_estimates_linear[(d.id[0] === "0") ? d.id[1] : d.id] * 1) / 1} Fatalities</span>`)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 60) + "px");
        })
        .on("mouseout", function (d) {
            tooltip.transition()
                .duration(100)
                .style("opacity", 0);
        });
    hideLoader()

}
function getScalesML(estimates, big = false) {
    var div = 8
    if (big) div = 4
    var estimates_array = []
    for (key in estimates) {
        estimates_array.push(estimates[key])
    }
    let range = d3.range(d3.min(estimates_array), d3.max(estimates_array));
    let step = range.length / div;
    var x = d3.scaleLinear()
        .domain(d3.range(0, d3.max(estimates_array) + step, step))
        .rangeRound([0, 50]);
    var color = d3.scaleThreshold()
        .domain(d3.range(0, d3.max(estimates_array) + step, step))
        .range(colors);
    return { color, x };
}


async function get_states_estimates(funcToCallWithEstimates) {
    var state_estimates = {}
    var state_estimates_linear = {}
    // generate state posibilities
    states.forEach(async (d, i) => {
        if (i < 51) {
            // predict and sum
            var state_tensor = new Array(51).fill(0);
            state_tensor[i] = 1
            var full_tensors = []
            selection_tensors.forEach(s => {
                full_tensors.push(state_tensor.concat(s))
            })
            var input = tf.tensor(full_tensors);
            nn_states.predict(input).array().then(array => {
                var total = array.reduce((o, n) => o + n[0], 0);
                state_estimates[d.id] = (total < 0) ? 0 : total;
                // linear time
                var linear_total = 0;
                linear_states.predict(input).array().then(array => {
                    linear_total += array.reduce((a, b) => parseInt(a) + parseInt(b), 0)
                    state_estimates_linear[d.id] = linear_total;
                    if (i === 50) {
                        funcToCallWithEstimates(state_estimates, state_estimates_linear)
                    }
                });
            });

        }
    })
    await promises;
    return state_estimates
}


function updateMLMap() {
    showLoader();
    if (generateSelectionTensors()) {
        hideLoader();
        return;
    };
    setTimeout(_ => get_states_estimates(update_national_map), 100);
}


function clickedStateML(d, e, z, county = false) {
    return
}

//graphix
function update_state_map(county_estimate, county_estimate_linear) {
    //nn
    var { color, x } = getScales(county_estimate);
    //legend
    total = 0;
    for (key in county_estimate) {
        total += county_estimate[key];
    }
    createLegendML(color, x, Math.round(total * 1 / 1).toLocaleString());

    //update fills data
    svg_nn.selectAll(`.${names[id.substring(0, 2)].replace(" ", "-")}ML`)
        .attr("fill", function (d) {
            return color(county_estimate[d.id])
        })
        .on("mouseover", d => {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);

            tooltip.html(`<span>${namesCounty[mapCountyId(d.id)]}<br>${county_estimate[d.id]} Fatalities</span>`)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 60) + "px");
        })
        .on("mouseout", function (d) {
            tooltip.transition()
                .duration(100)
                .style("opacity", 0);
        });
    //linear
    var { color, x } = getScales(county_estimate_linear);
    //legend
    total = 0;
    for (key in county_estimate_linear) {
        total += county_estimate_linear[key];
    }
    createLegendML(color, x, Math.round(total * 1 / 1).toLocaleString());

    //update fills data
    svg_nn.selectAll(`.${names[id.substring(0, 2)].replace(" ", "-")}ML`)
        .attr("fill", function (d) {
            return color(county_estimate_linear[d.id])
        })
        .on("mouseover", d => {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);

            tooltip.html(`<span>${namesCounty[mapCountyId(d.id)]}<br>${county_estimate_linear[d.id]} Fatalities</span>`)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 60) + "px");
        })
        .on("mouseout", function (d) {
            tooltip.transition()
                .duration(100)
                .style("opacity", 0);
        });
    hideLoader()
}


function createLegendML(color, x, total = 0, linear = false) {
    var id = (linear) ? "#legend_ml2" : "#legend_ml1";
    document.querySelector(id).innerHTML = "";
    var g = d3.select(id).append("g")
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
        .text("Estimated Traffic Fatalities");
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

function resetML() {
    /*     if (active_ml_county.node()) {
            document.getElementById("gmap_ml").style = "display:none"
            svg_hist.transition().duration(750).attr("style", "display:block");
            active_ml_county.classed("activated", false);
            active_ml_county = d3.select(null);
            //hide map
            document.querySelectorAll(".county.activated").forEach(d => d.classList.remove("activated"))
            //show all counties
            document.querySelectorAll(".county.fadeed").forEach(d => d.classList.remove("fadeed"))
            //update map
            clickedState(active_ml.node().__data__, null, null, county = true);
            return
        } */
    active_ml.classed("activated", false);
    active_ml = d3.select(null);
    document.getElementById("title_ml").textContent = "United States" + hist_title_ending;
    svg_nn.select("g").transition()
        .duration(750)
        .style("stroke-width", "1.5px")
        .attr("transform", "");

    svg_linear.select("g").transition()
        .duration(750)
        .style("stroke-width", "1.5px")
        .attr("transform", "");
    //hide county lines
    document.querySelectorAll(".countyML").forEach(d => d.classList.remove("show-lines"))
    //hide back button:
    document.querySelector("#back-button-ml1").style = "visibility:hidden;"
    document.querySelector("#back-button-ml2").style = "visibility:hidden;"
    //show state
    document.querySelectorAll(".stateML").forEach(d => d.classList.remove("fadeed"))
    //update map
    //updateMap(800);
}

function getStateId(countId) {
    let num = countId.substring(0, countId.length - 3);
    if (num.length == 1) {
        return "0" + num;
    }
    else {
        return num
    }
}
function findWithAttr(array, attr, value) {
    for (var i = 0; i < array.length; i += 1) {
        if (array[i][attr] === value) {
            return i;
        }
    }
    return -1;
}
