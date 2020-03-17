var width = 1650;
var height = 1650;
var radius = 750;
var vis;
var activeClick = false;
var activeLasso = false;
var padding = 2;
var maxRadius = 1000;
var colorOptions = '<option value = "blue"> Blue </option> <option value = "green"> Green </option> <option value = "blue"> Blue </option> <option value = "blue"> Blue </option>'
var selectBubbleColor = null;
var selectBubbleColorUnselected = null;
var lassoSelected = [];


window.onload = function () { // calls this on loading index.html
    $('#breadcrumbs').html('No Selection');
    selectBubbleColor = $('#bubbleColorPicker')[0].value;
    selectBubbleColorUnselected = $('#bubbleColorPickerUnselected')[0].value;
    $.get("getArcData", function (data) { //first api call
        //origData = JSON.parse(data);
        data = JSON.parse(data);
        var result = { "name": "parent", "children": data };
        $.get("getRepoData", function (val) {
            val = JSON.parse(val);
            createVisualization(result, val);
        });
    });
}
// Main function to draw and set up the visualization, once we have the data.
function createVisualization(arcData, scatterData) {

    vis = d3.select("#chart").append("svg:svg")
        .attr("width", width)
        .attr("height", height)
        .append("svg:g")
        .attr("id", "container")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    // Data strucure
    var partition = d3.layout.partition()
        .size([2 * Math.PI, (radius * radius) + 50])
        .value(function (d) { return d.value; });
    var inner = { 1: 500, 2: 535, 3: 570, 4: 605, 5: 640, 6: 675, 7: 710, 8: 745 };
    var outer = { 1: 530, 2: 565, 3: 600, 4: 635, 5: 670, 6: 705, 7: 740, 8: 775 };

    var arc = d3.svg.arc()
        .startAngle(function (d) { return d.x; })
        .endAngle(function (d) { return d.x + d.dx; })
        .innerRadius(function (d) { return inner[d.depth]; })
        .outerRadius(function (d) { return outer[d.depth] });
    // console.log("hmmm"); console.log(partition.nodes(nodeData).filter(function (d) {
    //     return (d.value > 0); // 0.005 radians = 0.29 degrees
    // }));
    var nodes = partition.nodes(arcData)
    .filter(function (d) {
        return (d.dx > 0.005); // 0.005 radians = 0.29 degrees
    });
    var origNodes = nodes;
    // nodes = nodes.filter(function (d) {
    //     return (d.name != "NA" && d.name.length > 0); // BJF: Do not show the "end" markings.
    // });

    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    var path = vis.data([arcData]).selectAll("path")
        .data(nodes)
        .enter().append("svg:path")
        .attr("display", function (d) { return d.depth ? null : "none"; })
        .attr("d", arc)
        .attr("fill-rule", "evenodd")
        .style("fill", function (d) {
            d.centroid = arc.centroid(d);
            return '#808080';
        })//function(d, i) { console.log(colors(d.name));return colors(d.name); })
        .style("opacity", 1)
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)
        .on("click", click);


    function mouseout(d) {
        if (!activeClick && !activeLasso) {
            $('#breadcrumbs').html('No Selection');
            d3.selectAll("path")
                .style("opacity", 1)
                .transition()
                .duration(1500);
        }
    }


    function click(d) {
        if (d.selected == undefined || d.selected == null || d.selected == false) {
            d.selected = true;
            activeClick = true;
            sequenceArray = getAncestors(d);
            crumbStr = '';
            for (let node in sequenceArray) {
                if (sequenceArray[node]['name'].length > 0) {
                    crumbStr += sequenceArray[node]['name'];
                    if (node < sequenceArray.length - 1) {
                        crumbStr += ' -> ';
                    }
                }

            }
            $('#breadcrumbs').html(crumbStr);
            // Fade all the segments.
            d3.selectAll("path")
                .style("opacity", 0.3)
                .transition()
                .duration(500);
                d3.selectAll(".dust")
                .style("opacity", 1)
            // Then highlight only those that are an ancestor of the current segment.
            vis.selectAll("path")
                .filter(function (node) {
                    return (sequenceArray.indexOf(node) >= 0);
                })
                .style("opacity", 1)
                .transition()
                .duration(500);
        } else {
            activeClick = false;
            d.selected = false;
            mouseout(d);
        }
    }

    function mouseover(d) {
        d3.select('#targetArea')
            .attr("r", 400)
            .attr("cx", 0)
            .attr("cy", 0)
            .style("opacity", 0);
        if (!activeClick && !activeLasso) {
            $('#breadcrumbs').html('No Selection');
            highlightHierarchy(d)
        }
    }
    // Given a node in a partition layout, return an array of all of its ancestor
    // nodes, highest first, but excluding the root.

    setTimeout(processScatter(origNodes, scatterData), 10);
}

function highlightHierarchy(d) {
    sequenceArray = getAncestors(d);
    crumbStr = '';
    for (let node in sequenceArray) {
        if (sequenceArray[node]['name'].length != 0) {
            crumbStr += sequenceArray[node]['name'];
            if (node < sequenceArray.length - 1 && !(node == sequenceArray.length - 2 && sequenceArray[sequenceArray.length - 1]['name'].length == 0)) {
                crumbStr += ' -> ';
            }
        }

    }
    $('#breadcrumbs').html(crumbStr);
    // oldCrumbs = $('#breadcrumbs').html();
    // if (oldCrumbs =='No Selection') {
        
    // } else {
    //     $('#breadcrumbs').html(oldCrumbs + '<br>' + crumbStr);
    // }
    // Fade all the segments.
    d3.selectAll("path")
        .style("opacity", 0.3)
        .transition()
        .duration(500);

    // Then highlight only those that are an ancestor of the current segment.
    vis.selectAll("path")
        .filter(function (node) {
            return (sequenceArray.indexOf(node) >= 0);
        })
        .style("opacity", 1)
        .transition()
        .duration(500);

    vis.selectAll("path")
        .filter(function (node) {
            return (sequenceArray.indexOf(node) == sequenceArray.length - 1);
        })
        .style("opacity", 1)
        .transition()
        .duration(500);
}
function getAncestors(node) {
    var path = [];
    var current = node;
    while (current.parent) {
        path.unshift(current);
        current = current.parent;
    }
    return path;
}
function getChildren(node, searchStr, childArr) {

    if (searchStr.length == 0) {
        return childArr;
    }
    let firstDelim = searchStr.indexOf(',');
    let currChild = searchStr;
    let nextSearch = "";
    if (firstDelim == 0) {
        currChild = "";
        nextSearch = searchStr.substring(firstDelim + 1);
    } else if (firstDelim != -1) {
        currChild = searchStr.split(",")[0];
        nextSearch = searchStr.substring(firstDelim + 1);
    }

    for (let i = 0; i < node.children.length; i++) {
        if (node.children[i].name == currChild) {
            childArr.push(node.children[i]);
            return getChildren(node.children[i], nextSearch, childArr);
        }
    }
}

function processScatter(nodes, scatterData) {
    bubbleData = [];
    repos = []
    for (let loopVar = 0; loopVar < scatterData.length; loopVar++) {
        if (repos.includes(scatterData[loopVar]['repo'])) {
            continue;
        }
        let newDat = {};

        newDat['repo'] = scatterData[loopVar]['repo'];
        newDat['diff_url'] = scatterData[loopVar]['diff_url']
        repos.push(scatterData[loopVar]['repo']);

        newDat['repo_commits'] = scatterData[loopVar]['repo_commits'];
        let centroid = null;
        let highestNode = null;

        let nodedepth1 = getNodesAtDepth(nodes, 1, "parent", scatterData[loopVar]['lang'])


        let searchStr = scatterData[loopVar]['os'] + ','
            + scatterData[loopVar]['patch_loc'] + ',' + scatterData[loopVar]['status'] + ','
            + scatterData[loopVar]['test_framework'] + ',' + scatterData[loopVar]['build_system'];
        let childArr = getChildren(nodedepth1, searchStr, []);

        if (childArr == undefined) {
            continue;
        }
        let nodedepth2 = childArr[0];
        let nodedepth3 = childArr[1];
        let nodedepth4 = childArr[2];
        let nodedepth5 = childArr[3];
        let nodedepth6 = childArr[4];
        if (nodedepth1.centroid != null && nodedepth1.centroid != undefined) {
            centroid = nodedepth1.centroid;
            highestNode = nodedepth1;
        }
        if (nodedepth2.centroid != null && nodedepth2.centroid != undefined) {
            centroid = nodedepth2.centroid;
            highestNode = nodedepth2;
        }
        if (nodedepth3.centroid != null && nodedepth3.centroid != undefined) {
            centroid = nodedepth3.centroid;
            highestNode = nodedepth3;
        }
        if (nodedepth4.centroid != null && nodedepth4.centroid != undefined) {
            centroid = nodedepth4.centroid;
            highestNode = nodedepth4;
        }
        if (nodedepth5.centroid != null && nodedepth5.centroid != undefined) {
            centroid = nodedepth5.centroid;
            highestNode = nodedepth5;
        }
        if (nodedepth6.centroid != null && nodedepth6.centroid != undefined) {
            centroid = nodedepth6.centroid;
            highestNode = nodedepth6;
        }
        x = centroid[0];
        y = centroid[1];
        theta = Math.atan(y / x);
        r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
        if (x >= 0 && y >= 0) {

            y = (0.7 * r) * Math.sin(theta);
            x = (0.7 * r) * Math.cos(theta);
        } else if (x < 0 && y < 0) {

            y = -(0.7 * r) * Math.sin(theta);
            x = -(0.7 * r) * Math.cos(theta);
        } else if (x > 0 && y < 0) {

            y = (0.7 * r) * Math.sin(theta);
            x = (0.7 * r) * Math.cos(theta);
        } else if (x < 0 && y > 0) {

            y = -(0.7 * r) * Math.sin(theta);
            x = -(0.7 * r) * Math.cos(theta);
        }

        centroid[0] = x;
        centroid[1] = y;
        newDat['idealcx'] = centroid[0];
        newDat['idealcy'] = centroid[1];
        newDat['x'] = centroid[0];
        newDat['y'] = centroid[1];
        newDat['centroid'] = centroid;
        newDat['highestNode'] = highestNode;
        newDat['idealradius'] = Math.pow(scatterData[loopVar]['repo_commits'], 0.4) == 0 ? 20 : Math.pow(scatterData[loopVar]['repo_commits'], 0.4);
        newDat['collide'] = 0;
        newDat['additions'] = scatterData[loopVar]['additions'];
        newDat['deletions'] = scatterData[loopVar]['deletions'];
        newDat['changes'] = scatterData[loopVar]['changes'];
        newDat['color'] = selectBubbleColorUnselected;
        checkCollision(newDat, loopVar, scatterData);
        bubbleData.push(newDat);

    }
    console.log(bubbleData.length);
    var container = d3.select("#container");


    //Lasso functions to execute while lassoing
    var lasso_start = function () {
        activeLasso = true;
        lasso.items()
            .style("fill", null) // clear all of the fills
            .classed({ "not_possible": true, "selected": false }); // style as not possible
    };

    var lasso_draw = function () {

        // Style the possible dots
        lasso.items().filter(function (d) { return d.possible === true })
            .style("fill", selectBubbleColor) // clear all of the fills
            .classed({ "not_possible": false, "possible": true });

        // Style the not possible dot
        lasso.items().filter(function (d) { return d.possible === false })
            .classed({ "not_possible": true, "possible": false });
    };

    var lasso_end = function () {
        // Reset the color of all dots
        // lasso.items()
        //    .style("fill", function(d) { return 'red'; });
        let selected = lasso.items().filter(function (d) { return d.selected === true });
        if (selected[0].length == 0) {
            activeLasso = false;
            d3.selectAll("path")
                .style("opacity", 1)
                .transition()
                .duration(500);
                d3.selectAll(".dust")
                .style("opacity", 1);
                d3.select('#targetArea')
            .attr("r", 400)
            .attr("cx", 0)
            .attr("cy", 0)
            .style("opacity", 0);
                
        } else {
            activeLasso = true;
            d3.selectAll('.dust')
                    .style('opacity', 0.3);
        }
        let nodeSet = new Set();
        // for (let i = 0; i < selected[0].length; i++) {


        // }
        
        $('#breadcrumbs').html('No Selection');
        
        // Style the selected dots
        lassoSelected = [];
        lasso.items().filter(function (d) { return d.selected === true })
            .classed({ "not_possible": false, "possible": false })
            .attr("r", function (d) { 
                console.log(d);
                lassoSelected.push(d);
                if (!nodeSet.has(d.highestNode)) {
                    nodeSet.add(d.highestNode);
                    highlightHierarchy(d.highestNode);
                }
                ;
                let classkey= 'path.spoke' + d.pos;
                // let ind = classkey.indexOf('/');
                // if (ind != -1) {
                //     classkey = classkey.substring(0, ind - 1) + "\\" + classkey.substring(ind);
                // }
                console.log(classkey);
                    d3.selectAll(classkey)
                        .style('opacity', 1);
                return Math.pow(d.repo_commits, 0.4) == 0 ? 5 : Math.pow(d.repo_commits, 0.4) });
                

        // Reset the style of the not selected dots
        lasso.items().filter(function (d) { return d.selected === false })
            .classed({ "not_possible": false, "possible": false })
            .style("fill", function (d) { return selectBubbleColorUnselected; });


    };

    // Create the area where the lasso event can be triggered
    var lasso_area = vis.append("circle")
        .attr("r", 400)
        .attr("cx", 0)
        .attr("cy", 0)
        .attr('id', 'targetArea')
        .style("opacity", 0);

    // Define the lasso
    var lasso = d3.lasso()
        .closePathDistance(75) // max distance for the lasso loop to be closed
        .closePathSelect(true) // can items be selected by closing the path?
        .hoverSelect(true) // can items by selected by hovering over them?
        .area(d3.select("#container")) // area where the lasso can be started
        .on("start", lasso_start) // lasso start function
        .on("draw", lasso_draw) // lasso draw function
        .on("end", lasso_end); // lasso end function
    vis.call(lasso);
    var div = d3.select("body").append("div")
        .attr("class", "tooltip");
    var scat = container.selectAll("circle")
        .data(bubbleData).enter()
        .append("circle")
        .attr("cx", function (d, i) {
            return d.centroid[0];
        })
        .attr("cy", function (d, i) {
            return d.centroid[1];
        })
        .attr("r", function (d) {
            //                           console.log(d.repo_commits);
            return Math.pow(d['repo_commits'], 0.4) == 0 ? 5 : Math.pow(d['repo_commits'], 0.4);
        })
        .attr('id', function (d) { return d.repo; })
        .style("fill", function (d) { return d.color; })
        .style("stroke", 'black')
        .on('mouseover', function (d) {
            div.style("display", "none");
            div
                .html(d.repo)
                .style("left", (d3.event.pageX + 12) + "px")
                .style("top", (d3.event.pageY - 10) + "px")
                .style("opacity", 1)
                .style("display", "block")
                .transition().duration(10000);
        })
        .on("mouseout", function(d) {
            div.style("display", "none");
        })


    lasso.items(d3.selectAll("circle"));

    

    createStarDust(scatterData, bubbleData);

}

function changeColorBubbles() {
    selectBubbleColor = $('#bubbleColorPicker')[0].value;
    
    // let ind = classkey.indexOf('/');
    // if (ind != -1) {
    //     classkey = classkey.substring(0, ind - 1) + "\\" + classkey.substring(ind);
    // }
    for (let x = 0; x < lassoSelected.length; x++) {
        d3.selectAll('circle').each(function() {
            let currCircle = d3.select(this);
            if (currCircle.attr("id") == lassoSelected[x]['repo']) {
                currCircle.style("fill", selectBubbleColor);
            }
        });
    }
    // lassoSelected.forEach(function(d) {
    //     d3.select(d).style("fill", selectBubbleColor);
    // });
}

function changeColorBubblesUnselected() {
    selectBubbleColorUnselected = $('#bubbleColorPickerUnselected')[0].value;
    let selectedIds = [];
    for (let x = 0; x < lassoSelected.length; x++) {
        selectedIds.push(lassoSelected[x]['repo']);
    }

    d3.selectAll('circle').each(function() {
        let currCircle = d3.select(this);
        if (!selectedIds.includes(currCircle.attr("id"))) {
            currCircle.style("fill", selectBubbleColorUnselected);
        }
    });
    // lassoSelected.forEach(function(d) {
    //     d3.select(d).style("fill", selectBubbleColor);
    // });
}

function createStarDust(scatterData, bubbleData) {
    // vis.append('circle')
    // .attr('r', 800)
    // .attr("fill-opacity","0")
    // .style('stroke', 'white');
    var dustdiv = d3.select("body").append("div")
        .attr("class", "dust-tooltip");
    let centroidMap = [];
    for (let i = 0; i < bubbleData.length; i++) {
        bubbleData[i]['pos'] = i;
        let scale = 50 / (bubbleData[i]['additions'] + bubbleData[i]['changes'] + bubbleData[i]['deletions']);

        var lineGenerator = d3.svg.line();
        let x = bubbleData[i]['centroid'][0];
        let y = bubbleData[i]['centroid'][1];
        let theta = Math.atan(y / x);
        let centroidKey = theta.toFixed(2);

        if (centroidMap[centroidKey] != undefined) {
            // console.log('exists');
            // console.log(theta);
            if (centroidMap[centroidKey] % 2 == 0) {
                theta += 0.01 * centroidMap[centroidKey];
            } else {
                theta -= 0.01 * centroidMap[centroidKey];
            }
            centroidMap[centroidKey] = centroidMap[centroidKey] + 1;
            //console.log(centroidKey);
        } else {
            centroidMap[centroidKey] = 1;
        }
        //console.log(centroidMap);
        if ((x < 0 && y < 0) || (x < 0 && y > 0)) {
            x1 = -800 * Math.cos(theta);
            y1 = -800 * Math.sin(theta);
            x2 = -(800 - (scale * bubbleData[i]['deletions'])) * Math.cos(theta);
            y2 = -(800 - (scale * bubbleData[i]['deletions'])) * Math.sin(theta);
            x3 = -(800 - (scale * (bubbleData[i]['deletions'] + bubbleData[i]['changes']))) * Math.cos(theta);
            y3 = -(800 - (scale * (bubbleData[i]['deletions'] + bubbleData[i]['changes']))) * Math.sin(theta);
            x4 = -750 * Math.cos(theta);
            y4 = -750 * Math.sin(theta);
        } else {
            x1 = 800 * Math.cos(theta);
            y1 = 800 * Math.sin(theta);
            x2 = (800 - (scale * bubbleData[i]['deletions'])) * Math.cos(theta);
            y2 = (800 - (scale * bubbleData[i]['deletions'])) * Math.sin(theta);
            x3 = (800 - (scale * (bubbleData[i]['deletions'] + bubbleData[i]['changes']))) * Math.cos(theta);
            y3 = (800 - (scale * (bubbleData[i]['deletions'] + bubbleData[i]['changes']))) * Math.sin(theta);
            x4 = 750 * Math.cos(theta);
            y4 = 750 * Math.sin(theta);
        }

        if (centroidKey == -0.61) {
            console.log(x);
            console.log(y);
            console.log(x1);
            console.log(y1);
        }

        var line1 = lineGenerator([[x1, y1], [x2, y2]]);
        var line2 = lineGenerator([[x2, y2], [x3, y3]]);
        var line3 = lineGenerator([[x3, y3], [x4, y4]]);
        
        vis.append('path')
            .attr('d', line1)
            .attr('class', 'dust spoke' + i)
            .style('fill', 'rgb(255, 0, 0, 1)')
            .style('stroke', 'rgb(255, 0, 0, 1)')
            .style('stroke-opacity', 3)
            .style('stroke-width', 3)
            .on("mouseover", function(d) {
               
                dustdiv.transition()
				.duration(200)	
				.style("opacity", .9);
                dustdiv
                .html('<a href="' + bubbleData[i]['diff_url'] +'" target = "_blank">' + bubbleData[i]['repo'] + '</a>')
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY) + "px")
                .style("opacity", 1)
                .style("display", "block")
                .transition().duration(10000);
            })
            .on("mouseleave", function(d) {
                dustdiv
                .transition().delay(1000)
                .style("display", "none");
            });
        vis.append('path')
            .attr('d', line2)
            .attr('class', 'dust spoke' + i)
            .style('fill', '#ff9900')
            .style('stroke', '#ff9900')
            .style('stroke-opacity', 3)
            .style('stroke-width', 3)
            .on("mouseover", function(d) {
                
                dustdiv.transition()
				.duration(200)	
				.style("opacity", .9);
                dustdiv
                .html('<a href="' + bubbleData[i]['diff_url'] +'" target = "_blank">' + bubbleData[i]['repo'] + '</a>')
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY) + "px")
                .style("opacity", 1)
                .style("display", "block")
                .transition().duration(10000);
            })
            .on("mouseleave", function(d) {
                dustdiv
                .transition().delay(1000)
                .style("display", "none");
            });
        vis.append('path')
            .attr('d', line3)
            .attr('class', 'dust spoke' + i)
            .style('stroke', 'green')
            .style('fill', 'green')
            .style('stroke-opacity', 3)
            .style('stroke-width', 3)
            .on("mouseover", function(d) {
                dustdiv.transition()
				.duration(500)	
				.style("opacity", 0);
                dustdiv.transition()
				.duration(200)	
				.style("opacity", .9);
                dustdiv
                .html('<a href="' + bubbleData[i]['diff_url'] +'" target = "_blank">' + bubbleData[i]['repo'] + '</a>')
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY) + "px")
                .style("opacity", 1)
                .style("display", "block")
                .transition().duration(10000);
            })
            .on("mouseleave", function(d) {
                dustdiv
                .transition().delay(1000)
                .style("display", "none");
            });


    }
    console.log(centroidMap);
}

function checkCollision(newDat, pos, scatterData) {

    let x = newDat['centroid'][0];
    let y = newDat['centroid'][1];
    let r = newDat['repo_commits'];
    let theta = Math.atan(y / x);
    // for (let i = 0; i < 2; i++) {
    for (let j = 0; j < pos; j++) {
        let prevx = scatterData[j][0];
        let prevy = scatterData[j][1];
        let prevr = scatterData[j]['repo_commits']
        let dist = Math.sqrt(Math.pow(prevx - x, 2) + Math.pow(prevy - y, 2));
        if (dist < prevr + r - 20) {
            if (x < 0 && y < 0)
                // console.log("a");
                // x = Math.max(radius, x - (0.1 * Math.cos(theta)));
                // y = Math.max(radius, y - (0.1 * Math.sin(theta)));
                x = x - (0.1 * Math.cos(theta));
            y = y - (0.1 * Math.sin(theta));
            if (Math.sqrt(x * x + y * y) >= 480) {
                x = -450 * Math.cos(theta);
                y = -450 * Math.sin(theta);
            }
        } else if (x > 0 && y < 0) {
            // console.log("b");
            // x = Math.max(radius, x + (0.1 * Math.cos(theta)));
            // y = Math.max(radius, y - (0.1 * Math.sin(theta)));
            x = x + (0.1 * Math.cos(theta));
            y = y + (0.1 * Math.sin(theta));
            if (Math.sqrt(x * x + y * y) >= 480) {
                x = 450 * Math.cos(theta);
                y = 450 * Math.sin(theta);
            }
        } else if (x < 0 && y > 0) {
            // console.log("c");
            // x = Math.max(radius, x - (0.1 * Math.cos(theta)));
            // y = Math.max(radius, y + (0.1 * Math.sin(theta)));
            x = x - (0.1 * Math.cos(theta));
            y = y - (0.1 * Math.sin(theta));
            if (Math.sqrt(x * x + y * y) >= 480) {
                x = -450 * Math.cos(theta);
                y = -450 * Math.sin(theta);
            }
        } else if (x >= 0 && y >= 0) {
            x = x + (0.1 * Math.cos(theta));
            y = y + (0.1 * Math.sin(theta));
            if (Math.sqrt(x * x + y * y) >= 480) {
                x = 450 * Math.cos(theta);
                y = 450 * Math.sin(theta);
            }
        }
    }
    // }
    newDat['centroid'] = [];
    newDat['centroid'].push(x);
    newDat['centroid'].push(y);
}

function search() {
    d3.selectAll('.dust')
                    .style('opacity', 0.3);
    let searchStr = $('#searchRepo')[0].value;
    let found = false;
    d3.selectAll('circle').each(function() {
        let currCircle = d3.select(this);
        if (currCircle.attr("id") == searchStr) {
            currCircle.style("fill", selectBubbleColor);
            console.log(currCircle.data());
            let d = currCircle.data()[0];
            highlightHierarchy(d['highestNode']);
            d3.selectAll('path.spoke' + d.pos).style('opacity', 1);
            found = true;
        } else {
            currCircle.style("fill", selectBubbleColorUnselected);
        }
    });
    if (found) {
        $("#result").html('Found It!');
    } else {
        $("#result").html('Not Found...');
    }
    return false;
}

function getNodesAtDepth(nodes, depth, parentName, nodeName) {
    for (let loopVar = 0; loopVar < nodes.length; loopVar++) {
        if (nodes[loopVar].depth == depth && nodes[loopVar]['parent']['name'] == parentName && nodes[loopVar]['name'] == nodeName) {
            return nodes[loopVar];
        }
    }
    return null;
}

