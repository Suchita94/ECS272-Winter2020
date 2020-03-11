var width = 1500;
var height = 1500;
var radius = Math.min(width, height) / 2;
var vis;
var activeClick = false;
window.onload = function () { // calls this on loading index.html
    $.get("loadData", function (data) { //first api call
        //origData = JSON.parse(data);
        data = JSON.parse(data);
        var result = { "name": "parent", "children": data };
        $.get("getRepos", function (val) {
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
        // .filter(function (d) {
        //     return (d.dx > 0.005); // 0.005 radians = 0.29 degrees
        // });
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
        .style("fill", function(d) {
            d.centroid = arc.centroid(d);
            return '#808080';
        })//function(d, i) { console.log(colors(d.name));return colors(d.name); })
        .style("opacity", 1)
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)
        .on("click", click);


    function mouseout(d) {
        if (!activeClick) {
            $('#breadcrumbs').html('');
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
                        crumbStr += '->';
                    }
                }
                
            }
            $('#breadcrumbs').html(crumbStr);
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
        } else {
            activeClick = false;
            d.selected = false;
            mouseout(d);
        }
    }

    function mouseover(d) {
        if (!activeClick) {
            highlightHierarchy(d)
        }
    }
    // Given a node in a partition layout, return an array of all of its ancestor
    // nodes, highest first, but excluding the root.
    
    processScatter(origNodes, scatterData);
}

function highlightHierarchy(d) {
    sequenceArray = getAncestors(d);
            crumbStr = '';
            for (let node in sequenceArray) {
                if (sequenceArray[node]['name'].length != 0) {
                    crumbStr += sequenceArray[node]['name'];
                    if (node < sequenceArray.length - 1) {
                        crumbStr += '->';
                    }
                }
                
            }
            $('#breadcrumbs').html(crumbStr);
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
                    return (sequenceArray.indexOf(node)  ==  sequenceArray.length - 1);
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
    
    for (let loopVar = 4; loopVar < scatterData.length; loopVar++) {
        let newDat = {};
        newDat['repo'] = scatterData[loopVar]['repo'];
        newDat['repo_commits'] = scatterData[loopVar]['repo_commits'];
        let centroid = null;
        let highestNode = null;

        let nodedepth1 = getNodesAtDepth(nodes, 1, "parent", scatterData[loopVar]['lang'])
        
        
        let searchStr = scatterData[loopVar]['os'] + ','
                        + scatterData[loopVar]['patch_loc'] + ',' + scatterData[loopVar]['status'] + ',' 
                        + scatterData[loopVar]['test_framework'] + ',' + scatterData[loopVar]['build_system'];
        let childArr = getChildren(nodedepth1, searchStr, []);
        
        if (childArr == undefined) {
            console.log("not found");
            console.log(loopVar);
            console.log(scatterData[loopVar]);
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
        if (centroid[1] > 0) {
            centroid[1] = centroid[1] - 275;
        } else {
            centroid[1] = centroid[1] + 275;
        }
        newDat['centroid'] = centroid;
        newDat['highestNode'] = highestNode;
        bubbleData.push(newDat)
    }
    var scat = d3.select("#container").selectAll("circle")
                        .data(bubbleData).enter()
                        .append("circle")
                        .attr("cx", function(d){
                            return d.centroid[0];
                        })
                        .attr("cy", function(d) {
                            return d.centroid[1];
                        })
                        .attr("r", function(d) {
                            return Math.pow(d.repo_commits, 0.4);
                        })
                        .style("fill", 'red')
                        .style("stroke", 'black')
                        .on("click", function(d) {
                            
                            activeClick = true;
                            highlightHierarchy(highestNode);
                            
                        });


}

function getNodesAtDepth(nodes, depth, parentName, nodeName) {
    for (let loopVar = 0; loopVar < nodes.length; loopVar++) {
        if (nodes[loopVar].depth == depth && nodes[loopVar]['parent']['name'] == parentName && nodes[loopVar]['name'] == nodeName) {
            return nodes[loopVar];
        }
    }
    return null;
}

