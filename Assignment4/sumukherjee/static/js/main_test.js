var origData = null; //has all data {d.X, d.Y, d.cluster}
var select = false;
var selected_cluster_num = -1;
window.onload = function () { // calls this on loading index.html
  $.get("loadData", function (data) { //first api call
    groupedData = JSON.parse(data);
    origData = groupedData.df;

    clusterData = groupedData.cluster_otherquestion;
    renderScatter(origData);
    renderBar(clusterData, selected_cluster_num);
    renderSanky(origData, -1);

  });
}

async function getYMax(selecteddata) {
  var ymax = undefined;
  let max = undefined;
  for (let loopVar = 0; loopVar < selecteddata.length; loopVar++) {
    max = undefined;
    for (let key in selecteddata[loopVar]) {
      if (!isNaN(selecteddata[loopVar][key])) {
        if (max == undefined) {
          max = selecteddata[loopVar][key];
        } else if (max < selecteddata[loopVar][key]) {
          max = selecteddata[loopVar][key];
        }
      }
    }
    if (ymax == undefined || max > ymax) {
      ymax = max;
    }
  }
return ymax;
}

function renderBar(data, selected_cluster_num) {

  var scoregroup1 = d3.keys(data[0]);

  var toberemoved = ["cluster", "question"];


  function removeFromArray(original, remove) {
    return original.filter(value => !remove.includes(value));
  }

  var scoregroup = removeFromArray(scoregroup1, toberemoved);



  var questions = ["Horror", "Thriller", "Comedy", "Romantic", "Sci-fi", "War", "Fantasy/Fairy tales", "Animated", "Documentary", "Western", "Action"];


  var selecteddata = [];

  data.forEach(function (d) {
    if (selected_cluster_num < 0) { // should it be false or undefined/null?
      if (d.cluster == 'all') {
        selecteddata.push(d)
      }
    }
    else {
      if (d.cluster == selected_cluster_num) {
        selecteddata.push(d)
      }
    }
  });


  getYMax(selecteddata).then(ymax => {
  var margin = { top: 50, right: 160, bottom: 50, left: 30 };

  var width = 1500 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

  var svg = d3.select("#bar")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // List of groups = species here = value of the first column called group -> I show them on the X axis

  // Add X axis
  var x = d3.scaleBand()
    .domain(questions)
    .range([0, width])
    .padding([0.1])
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickSize(0));

  // Add Y axis
  var y = d3.scaleLinear()
    .domain([0, ymax+50])
    .range([height, 0]);
  svg.append("g")
    .call(d3.axisLeft(y));

  // Another scale for subgroup position?
  var xSubgroup = d3.scaleBand()
    .domain(scoregroup)
    .range([0, x.bandwidth()])
    .padding([0.05])

  // color palette = one color per subgroup
  var color = d3.scaleOrdinal()
    .domain(scoregroup)
    .range(["#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"])
  // Define the div for the tooltip
  var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
  // Show the bars
  svg.append("g")
    .selectAll("g")
    // Enter in data = loop group per group
    .data(selecteddata)
    .enter()
    .append("g")
    .attr("transform", function (d) { return "translate(" + x(d.question) + ",0)"; })
    .selectAll("rect")
    .data(function (d) {
      return scoregroup.map(function (key) {
        return { key: key, value: d[key] };
      });
    })
    .enter().append("rect")
    .attr("x", function (d) { return xSubgroup(d.key); })
    .attr("y", function (d) { return y(d.value); })
    .attr("width", xSubgroup.bandwidth())
    .attr("height", function (d) { return height - y(d.value); })
    .attr("fill", function (d) { return color(d.key); })
    .on("mouseover", function (d) {
      div.transition()
                .duration(200)
                .style("opacity", .9);
            div	.html("<p style='padding-top:10%;'><b>"+d.value+"</b></p>")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
    })
    .on("mouseout", function(d) {
      div.transition()
          .duration(500)
          .style("opacity", 0);
  });


  //legends

  var legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', 'translate(' + (width + 12) + ', 0)')
    .attr("text-anchor", "end")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10);

  legend.selectAll('rect')
    .data(scoregroup)
    .enter()
    .append('rect')
    .attr('x', 0)
    .attr('y', function (d, i) {
      return i * 18;
    })
    .attr('width', 12)
    .attr('height', 12)
    .attr('fill', function (d, i) {
      return color(i);
    });

  legend.selectAll('text')
    .data(scoregroup)
    .enter()
    .append('text')
    .text(function (d) {
      return "Rating "+d;
    })
    .attr('x', 18)
    .attr('y', function (d, i) {
      return i * 18;
    })
    .attr('text-anchor', 'start')
    .attr('alignment-baseline', 'hanging');


  });


}

function renderScatter(data) {
  var xmin = undefined,
    xmax = undefined,
    ymin = undefined,
    ymax = undefined;
  for (let loopVar = 0; loopVar < data.length; loopVar++) {
    if (xmin == undefined) {
      xmin = data[loopVar].X;
      xmax = data[loopVar].X;
      ymin = data[loopVar].Y;
      ymax = data[loopVar].Y;
    } else {
      if (xmin > data[loopVar].X) {
        xmin = data[loopVar].X;
      }
      if (xmax < data[loopVar].X) {
        xmax = data[loopVar].X;
      }
      if (ymin > data[loopVar].Y) {
        ymin = data[loopVar].Y;
      }
      if (ymax < data[loopVar].Y) {
        ymax = data[loopVar].Y;
      }
    }
  }
  xmin = Math.floor(xmin) - 1;
  ymin = Math.floor(ymin) - 1;
  xmax = Math.ceil(xmax) + 1;
  ymax = Math.ceil(xmax) + 1;
  var margin = { top: 10, right: 30, bottom: 50, left: 60 },
    width = 800 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;
  var color = d3.scaleOrdinal().domain(data)
    .range(["blue", "red", "green", "yellow", "black", "orange"]);


  var svg = d3.select("#scatter")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");

  var x = d3.scaleLinear()
    .domain([xmin, xmax])
    .range([0, width]);
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .append("text")
    .attr("fill", "black")//set the fill here
    .attr("transform", "translate(" + width / 2 + ", 40)")
    .attr("font-size", "14px")
    .text("Principal Component 1");
  // Add Y axis
  var y = d3.scaleLinear()
    .domain([ymin, ymax])
    .range([height, 0]);
  var yax = svg.append("g")
    .call(d3.axisLeft(y));
  var ylabl = yax.append("text")
    .attr("fill", "black")//set the fill here
    .attr("transform", "rotate(-90) translate(" + -height / 3 + "," + -20 + ")")
    .attr("font-size", "14px")
    .text("Principal Component 2");


  // Add dots
  svg.append('g')
    .selectAll("dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", function (d) { return "dot c" + d.cluster })
    .attr("cx", function (d) { return x(d.X); })
    .attr("cy", function (d) { return y(d.Y); })
    .attr("r", 5)
    .style("fill", function (d) {
      return color(d.cluster);
    })
    .style("stroke", "black")
    .on("mouseover", function (d) {
      if (!select) {
        highlight(d);
      }
    })
    .on("mouseout", function (d) {
      if (!select) {
        doNotHighlight(d);
      }
    })
    .on("click", function (d) {
      if (select == false) {
        selected_cluster_num = d.cluster;
        select = true;
        highlight(d);
        d3.select("#bar").selectAll("*").remove();
        renderBar(clusterData, selected_cluster_num);
      } else {
        select = false;
        selected_cluster_num = -1;
        doNotHighlight(d);
        d3.select("#bar").selectAll("*").remove();
        renderBar(clusterData, selected_cluster_num);
      }
      d3.select("#sanky").selectAll("*").remove();
      renderSanky(origData, selected_cluster_num);
    });



  var highlight = function (d) {
    selected_cluster = d.cluster;
    d3.selectAll(".dot")
      .transition()
      .duration(200)
      .style("fill", "lightgrey")
      .attr("r", 3)

    d3.selectAll(".c" + selected_cluster)
      .transition()
      .duration(200)
      .style("fill", color(selected_cluster))
      .attr("r", 7)
  }

  var doNotHighlight = function (d) {
    d3.selectAll(".dot")
      .transition()
      .duration(200)
      .style("fill", function (dat) { return color(dat.cluster) })
      .attr("r", 5)
  }


}

function changeCluster() {
  $.ajax("cluster", {
    data: JSON.stringify({ "clusterNum": $('#widget option:selected').text(), "dat": origData }),
    method: "POST",
    contentType: "application/json"
  }).done(function (data) {

    groupedData = JSON.parse(data);

    origData = groupedData.df;

    clusterData = groupedData.cluster_otherquestion;
    d3.select("#scatter").selectAll("*").remove();
    d3.select("#bar").selectAll("*").remove();
    renderScatter(origData);
    renderBar(clusterData, -1);
  });
}

function renderSanky(origData, selectedCluster) {
  getSankyDat(origData, selectedCluster).then(graph => {
    var units = "Widgets";

    var smargin = { top: 10, right: 10, bottom: 10, left: 10 },
      swidth = 700 - smargin.left - smargin.right,
      sheight = 1000 - smargin.top - smargin.bottom;

    var formatNumber = d3.format(",.0f"),    // zero decimal places
      format = function (d) { return formatNumber(d); },
      color = d3.schemeCategory20;

    var color = d3.scaleLinear().domain([1, 20])
      .interpolate(d3.interpolateHcl)
      .range([d3.rgb("#007AFF"), d3.rgb('#FFF500')]);
    var svg = d3.select("#sanky")
      .attr("width", swidth + smargin.left + smargin.right)
      .attr("height", sheight + smargin.top + smargin.bottom)
      .append("g")
      .attr("transform",
        "translate(" + smargin.left + "," + smargin.top + ")");
    var color = d3.scaleOrdinal()
      .range(d3.schemeCategory20)
    var sankey = d3.sankey()
      .nodeWidth(36)
      .nodePadding(40)
      .size([swidth, sheight]);

    var path = sankey.link();
    sankey
      .nodes(graph.nodes)
      .links(graph.links)
      .layout(32);

    var link = svg.append("g").selectAll(".link")
      .data(graph.links)
      .enter().append("path")
      .attr("class", "link")
      .attr("d", path)
      .style("stroke-width", function (d) { return Math.max(1, d.dy); })
      .sort(function (a, b) { return b.dy - a.dy; });

    link.append("title")
      .text(function (d) {
        return d.source.name + " → " +
          d.target.name + "\n" + format(d.value);
      });


    var node = svg.append("g").selectAll(".node")
      .data(graph.nodes)
      .enter().append("g")
      .attr("class", "node")
      .attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      })
      .call(d3.drag()
        .on("drag", dragmove));

    node.append("rect")
      .attr("height", function (d) { return d.dy; })
      .attr("width", sankey.nodeWidth())
      .style("fill", function (d) {
        return d.color = color(d.name);
      })
      .style("stroke", function (d) {
        return d3.rgb(d.color).darker(2);
      })
      .append("title")
      .text(function (d) {
        return d.name + "\n" + format(d.value);
      });

    node.append("text")
      .attr("x", -6)
      .attr("y", function (d) { return d.dy / 2; })
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .attr("transform", null)
      .text(function (d) {
        if (Number.isInteger(d.name)) {
          return d.name;
        }
        return d.name;
      })
      .filter(function (d) { return d.x < swidth / 2; })
      .attr("x", 6 + sankey.nodeWidth())
      .attr("text-anchor", "start");

    function dragmove(d) {
      d3.select(this).attr("transform",
        "translate(" + (
          d.x = Math.max(0, Math.min(swidth - d.dx, d3.event.x))
        )
        + "," + (
          d.y = Math.max(0, Math.min(sheight - d.dy, d3.event.y))
        ) + ")");
      sankey.relayout();
      link.attr("d", path);
    }

  });
}

async function getSankyDat(origData, selectedCluster) {
  sankyFilterDat = origData;
  if (selected_cluster_num >= 0) {
    sankyFilterDat = sankyFilter(origData, selectedCluster);
  }
  var graph = { "nodes": [], "links": [] };
  let nodeVal = 0;
  let genderGraph = {};
  let firstNode = { "node": nodeVal++, "name": selectedCluster >= 0 ? "Cluster-" + selectedCluster : "All Cluster" };
  graph.nodes.push(firstNode);
  for (let loopVar = 0; loopVar < sankyFilterDat.length; loopVar++) {
    if (genderGraph[sankyFilterDat[loopVar].Gender] == undefined) {
      genderGraph[sankyFilterDat[loopVar].Gender] = {};
      genderGraph[sankyFilterDat[loopVar].Gender].count = 1;
      genderGraph[sankyFilterDat[loopVar].Gender].ages = [];
      let ageKey = sankyFilterDat[loopVar].Age;
      genderGraph[sankyFilterDat[loopVar].Gender].ages.push({ key: ageKey, count: 1 });
    } else {
      genderGraph[sankyFilterDat[loopVar].Gender].count = genderGraph[sankyFilterDat[loopVar].Gender].count + 1;
      let ageKey = sankyFilterDat[loopVar].Age;
      let agerec = null;
      for (let inloop = 0; inloop < genderGraph[sankyFilterDat[loopVar].Gender].ages.length; inloop++) {
        if (genderGraph[sankyFilterDat[loopVar].Gender].ages[inloop].key == ageKey) {
          agerec = genderGraph[sankyFilterDat[loopVar].Gender].ages[inloop];
          break;
        }
      }
      if (agerec == undefined) {
        genderGraph[sankyFilterDat[loopVar].Gender].ages.push({ key: ageKey, count: 1 });
      } else {
        agerec.count = agerec.count + 1;
      }
    }
  }

  let ageNodes = {};
  for (let genKey in genderGraph) {
    let genNode = { "node": nodeVal++, "name": genKey.toUpperCase() };
    let genNodeVal = nodeVal - 1;
    graph.nodes.push(genNode);
    let newlink = {};
    newlink.source = firstNode.node;
    newlink.target = genNodeVal;
    newlink.value = genderGraph[genKey].count;
    graph.links.push(newlink);
    for (let inloop = 0; inloop < genderGraph[genKey].ages.length; inloop++) {
      let ageNodeVal = -1;
      if (ageNodes[genderGraph[genKey].ages[inloop].key] == undefined) {
        let ageNode = { "node": nodeVal++, "name": genderGraph[genKey].ages[inloop].key };
        ageNodeVal = nodeVal - 1;
        ageNodes[genderGraph[genKey].ages[inloop].key] = ageNode;
        graph.nodes.push(ageNode);
        let ageLink = {};
        ageLink.source = genNodeVal;
        ageLink.target = ageNodeVal;
        ageLink.value = genderGraph[genKey].ages[inloop].count;
        graph.links.push(ageLink);
      } else {
        let ageLink = {};
        ageLink.source = genNodeVal;
        ageLink.target = ageNodes[genderGraph[genKey].ages[inloop].key].node;
        ageLink.value = genderGraph[genKey].ages[inloop].count;
        graph.links.push(ageLink);
      }
    }
  }
  return graph;
}

function sankyFilter(origData, selectedCluster) {
  newSankyFilterDat = [];
  for (let loopVar = 0; loopVar < origData.length; loopVar++) {
    if (origData[loopVar].cluster == selectedCluster) {
      newSankyFilterDat.push(origData[loopVar]);
    }
  }
  return newSankyFilterDat;
}