/* d3 sunburst based on
  http://jsfiddle.net/5d0zd2s7/
  http://bl.ocks.org/WilliamQLiu/76ae20060e19bf42d774
*/

var d3Layout = function (root, width = 500, height = 500) {

    var radius = Math.min(width, height) / 2; // Que quepa, se ajusta a la dimensión menor de la ventana
    var color = d3.scale.category20c();


    // https://docs.w3cub.com/d3~4/d3-scale-chromatic/#schemeAccent
    // color = d3.scaleOrdinal(d3.schemePastel1);
    //var color = d3.sequential.interpolateInferno(0.5);

    // d3.select("#radialdiagram").html(null); // Elimina datos previos
    var svg = d3.select("#radialdiagram").append("svg")
        .attr("viewBox", `${-radius} ${-radius} ${2 * radius} ${2 * radius}`)
        .append("g");


    var partition = d3.layout.partition()
        .sort(null)
        .size([2 * Math.PI, radius * radius])
        .value(function (d) { return 1; });

    var arc = d3.svg.arc()
        .startAngle(function (d) { return d.x; })
        .endAngle(function (d) { return d.x + d.dx; })
        .innerRadius(function (d) { return Math.sqrt(d.y); })
        .outerRadius(function (d) { return Math.sqrt(d.y + d.dy); });


    var nodecount = 0;
    console.log(root);
    var path = svg.datum(root).selectAll("path")
        .data(partition.nodes)
        .enter().append("g")
        .classed("root", function (d) { return d.depth ? false : true; }) // class the root as root
        .classed("node", function (d) {
            nodecount++;
            return d.depth ? true : false;
        }) // class a non-root as node

    // Define the div for the tooltip
    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    var dpath = svg.datum(root).selectAll("path");
    console.log(dpath);

    path.append("path")
        .attr("d", arc)
        .style("fill", function (d) {
            if (!d.depth) return "white";
            return color((d.children ? d : d.parent).name);
        })
        .on("mouseover", function (d, i) {  // Add interactivity
            /*
            d3.select(this).style({opacity:'0.8'})
            d3.select(this).style("fill", "orange");
            d3.select(this).style("fill",
              d.depth ? "orange" : "none");
            */
            if (d.depth) d3.select(this).style("fill", "orange");

            var coords = d3.mouse(this);

            div.transition()
                .duration(200)
                .style("opacity", .9);
            div.html(`
              <table>
                <tbody>
                  <tr>
                    <th rowspan="2">${d.id}</th>
                    <td>${d.definition}</td>
                  </tr>
                  <tr class="phon">
                      <td>${d.pinyin}</td>
                    </tr>
                </tbody>
              </table>`)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");

        })
        .on("mouseout", function (d, i) {  // Add interactivity
            div.transition()
                .duration(500)
                .style("opacity", 0);
            d3.select(this).style("fill", function (d) {
                if (!d.depth) return "white";
                return color((d.children ? d : d.parent).name);
            })
            //d3.select("#" + d.id).remove();  // Remove text location
        })
        .on("click", function (d) {
            if (d.depth) {
                window.open('?q=' + d.name);
                // window.location.replace('?q=' + d.name);
            } else {
                $('#logogramselectionModal').css('display', 'block');
            }
        })
        .each(stash);

    var fontsize = Math.min(2, 70 / nodecount);

    // Root node and descendants
    path.append("text")
        .html(function (d) {
            if (d.depth) {
                return d.name;
            } else {

                var defs = d.definition.split(';').join('</tspan><tspan x="0px" dy="1.5em">')
                return `
                <tspan class="logogram">${d.id}</tspan>
                <tspan class="phon" x="0px" dy="3em">${d.pinyin}</tspan>
                <tspan x="0px" dy="1.5em">${defs} </tspan>`;
                //  x="0px" dy="0.3em"
            }
        }) //console.log("Q", d.name);  //           return d.depth ? d.name : "root";
        .style("font-size", function (d) {
            if (d.depth) {
                return fontsize + 'em';
            } else {
                return;
            }
        })
        .classed("label", true)
        .attr("x", function (d) { return d.x; })
        .attr("text-anchor", "middle")
        .attr("dominant-middle", "middle")/* vertical align: baseline middle hanging */
        .style("fill", function (d) { return d.color; })
        // translate to the desired point and set the rotation
        .attr("transform", function (d) {
            if (d.depth > 0) {
                return "translate(" + arc.centroid(d) + ")";// + "rotate(" + getAngle(d) + ")"
            } else {
                return null;
            }
        })
        /* .attr("dx", "6") // margin
        .attr("dy", ".35em") // vertical-align */
        .attr("pointer-events", "none");


    function getAngle(d) {
        // Offset the angle by 90 deg since the '0' degree axis for arc is Y axis, while
        // for text it is the X axis.
        var thetaDeg = (180 / Math.PI * (arc.startAngle()(d) + arc.endAngle()(d)) / 2 - 90);
        // If we are rotating the text by more than 90 deg, then "flip" it.
        // This is why "text-anchor", "middle" is important, otherwise, this "flip" would
        // a little harder.
        return (thetaDeg > 90) ? thetaDeg - 180 : thetaDeg;
    }

    // Stash the old values for transition.
    function stash(d) {
        d.x0 = d.x;
        d.dx0 = d.dx;
    }

    // Interpolate the arcs in data space.
    function arcTween(a) {
        var i = d3.interpolate({ x: a.x0, dx: a.dx0 }, a);
        return function (t) {
            var b = i(t);
            a.x0 = b.x;
            a.dx0 = b.dx;
            return arc(b);
        };
    }

    // d3.select(self.frameElement).style("height", height + "px");

}