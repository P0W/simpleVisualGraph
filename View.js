define([
   "dojo/_base/declare",
   "d3/d3.js"
], function (declare, d3) {
   'use strict';

   return declare(null, {
      constructor: function (height, width, margin, data) {
         // Find out the adjusted height ( from margins needed )
         var adjustedHeight = this.getAdjustedHeight(height, margin);
         // Find out the adjusted width ( from margins needed )
         var adjustedWidth = this.getAdjustedWidth(width, margin);

         this.data = data;

         // Create X scales
         var xScale = d3.scaleLinear()
            .range([0, adjustedWidth])
         var xScaleTemp = d3.scaleLinear()
            .range([0, adjustedWidth])

         // Create Y scales
         var yScale = d3.scaleLinear()
            .range([adjustedHeight, 0])
         var yScaleTemp = d3.scaleLinear()
            .range([adjustedHeight, 0])

         // Create Axes - X-Axis without ticks
         var xAxis = d3.axisBottom(xScale)
         // Create Axes - Y-Axis
         var yAxis = d3.axisLeft(yScale)
            .ticks(10)
            .tickSize(-adjustedWidth)

         // Create a bisector for X, this will be later used to find a nearest point on mouse over event         
         var bisectX = d3.bisector(function (d) { return d.x; }).left;

         // Setup domains for scales
         xScale.domain(d3.extent(this.data, function (d) { return d.x; }))
         yScale.domain([d3.min(this.data, function (d) { return d.y; }), d3.max(this.data, function (d) { return d.y; })])
         xScaleTemp.domain(xScale.domain());
         yScaleTemp.domain(yScale.domain())


         // Create the value line 
         var valueLine = d3.line()
            .x(function (d) { return xScale(d.x); })
            .y(function (d) { return yScale(d.y); });

         // Create a scalable vector graphic as a canvas to draw things on
         var svg = d3.select('#xyplotContainer')
            .append("svg")
            .attr("width", width)
            .attr("height", height);

         // Add a clipping container to the SVG
         svg.append("defs").append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("width", adjustedWidth)
            .attr("height", adjustedHeight)
            .attr("x", 0)
            .attr("y", 0);

         // Append a group to the SVG
         var focus = svg.append("g")
            .attr("class", "focus")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

         // Add the X-Axis
         var gX = focus.append("g")
            .attr("class", "axis axis--x")
            .attr('transform', 'translate(' + margin.left + ',' + (adjustedHeight) + ')')
            .call(xAxis);

         // Add the Y-Axis
         var gY = focus.append("g")
            .attr("class", "axis axis--y")
            .call(yAxis);

         // Add the dataset, and constrain to the clipping container
         var valueLineGraph = focus.append("path")
            .data([this.data])
            .attr("class", "valueLineGraph")
            .attr("clip-path", "url(#clip)")
            .attr("d", valueLine)

         // Grab the reset bottom and bind the zoomIdentity function
         d3.select("#resetZoomButton")
            .on("click", function () {
               svg.transition()
                  .duration(1500)
                  .call(zoom.transform, d3.zoomIdentity);
            });

         // define the trendline
         var theTrendLine = d3.line()
            .x(function (d) {
               return xScale(d.x);
            })
            .y(function (d) {
               return yScale(d.yhat);
            });

         var theTrendLineGraph = focus.append("path")
            .datum(this.bestfitLine(data))
            .attr("class", "trendline")
            .attr("clip-path", "url(#clip)")
            .attr("d", theTrendLine);

         // Hilight Lines, make the display to not visible (none)
         var hilight = focus.append('g').style('display', 'none');

         // define and add droplines - X and Y cursor markers
         var droplineX = hilight.append("line")
            .style("stroke", "#7e7e7e");
         var droplineY = hilight.append("line")
            .style("stroke", "#7e7e7e");

         // Add the circle hilighter
         hilight.append('circle')
            .attr('id', 'focusCircle')
            .attr('r', 5.5)
            .attr('class', 'circle focusCircle');

         // Add rectangle overlay to catch pointer events
         focus.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('fill', 'none')
            .attr("clip-path", "url(#clip)")
            .style('pointer-events', 'all')
            //.style('cursor', 'crosshair')
            .on("mouseover", function () {
               hilight.style('display', null);
            })
            .on("mousemove", function () { // update hilighter
               var mouseX = xScale.invert(d3.mouse(this)[0]);
               var index = bisectX(data, mouseX);

               if (index !== 0 && index < data.length) {
                  var d0 = data[index - 1];
                  var d1 = data[index];
                  var d = mouseX - d0.x > d1.x - mouseX ? d1 : d0;
                  var x = xScale(d.x);
                  var y = yScale(d.y);
                  hilight.select('#focusCircle')
                     .attr('cx', x)
                     .attr('cy', y);

                  droplineX
                     .attr("x1", x)
                     .attr("y1", yScale(yScale.domain()[0]))
                     .attr("x2", x)
                     .attr("y2", yScale(yScale.domain()[1]))

                  droplineY
                     .attr("x1", xScale(xScale.domain()[0]))
                     .attr("y1", y)
                     .attr("x2", xScale(xScale.domain()[1]))
                     .attr("y2", y);
               }
            })
            .on("mouseout", function () { // hide hilighter
               hilight.style('display', 'none');
            })

         // draw dots
         focus.append("g")
            .attr("clip-path", "url(#clip)")
            .selectAll(".dot")
            .data(this.data)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr('fill-opacity', 0.5)
            .attr("r", 3.5)
            .attr("cx", function (d) { return xScale(d.x); })
            .attr("cy", function (d) { return yScale(d.y); })
            .append("svg:title")
            .text(function (d) { return ("( " + d.x + ", " + d.y + " )") });

         // Add Zooming controls
         var zoom = d3.zoom()
            //.scaleExtent([1, Infinity])
            .extent([[0, 0], [adjustedWidth, adjustedHeight]])
            .on("zoom", function () {
               var t = d3.event.transform;
               d3.selectAll(".dot").attr("transform", t);

               xScale.domain(t.rescaleX(xScaleTemp).domain());
               yScale.domain(t.rescaleY(yScaleTemp).domain());
               gX.call(xAxis);
               gY.call(yAxis);
               valueLineGraph.attr("d", valueLine);

               theTrendLineGraph.attr("d", theTrendLine);
            })
         svg.call(zoom);
      },

      getAdjustedHeight: function (height, margin) {
         return height - margin.bottom - margin.top;
      },

      getAdjustedWidth: function (width, margin) {
         return width - margin.left - margin.right;
      },

      bestfitLine: function (data) {
         var x = [];
         var y = [];
         var n = data.length;
         var x_mean = 0;
         var y_mean = 0;
         var term1 = 0;
         var term2 = 0;

         data.forEach(function (d, i) {
            y.push(d['y']);
            x.push(d['x']);
         });

         // calculate mean x and y
         x_mean = d3.mean(x);
         y_mean = d3.mean(y);

         // Pearson Corelation Coefficient
         var sq_dev = [];
         for (var i = 0; i < x.length; i++) {
            sq_dev[i] = (x[i] - x_mean) * (y[i] - y_mean);
         }
         var covar = d3.sum(sq_dev) / (x.length - 1);
         var karlPearson = covar / (d3.deviation(x) * d3.deviation(y));

         console.log(karlPearson);

         // Calculate coefficients
         var xr = 0;
         var yr = 0;
         for (var i = 0; i < x.length; i++) {
            xr = x[i] - x_mean;
            yr = y[i] - y_mean;
            term1 += xr * yr;
            term2 += xr * xr;
         }

         var b1 = term1 / term2;
         var b0 = y_mean - (b1 * x_mean);

         // Perform regression 
         var yhat = [];
         // Fit line using coeffs
         for (i = 0; i < x.length; i++) {
            yhat.push(b0 + (x[i] * b1));
         }

         var trendLine = [];
         for (i = 0; i < y.length; i++) {
            trendLine.push({
               "yhat": yhat[i],
               "y": y[i],
               "x": x[i]
            })
         }
         return (trendLine);
      }
   });

});