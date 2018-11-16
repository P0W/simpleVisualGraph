define([
   "dojo/_base/declare",
   "d3/d3.js"
], function (declare, d3) {
   'use strict';

   return declare(null, {

      constructor: function () {
         var width = 1500;
         var height = 800;


         var margin = {
            top: 25,
            left: 20,
            bottom: 25,
            right: 20
         };

         var adjustedHeight = this.getAdjustedHeight(height, margin);
         var adjustedWidth = this.getAdjustedWidth(width, margin);

         this.data = [];

         for (var i = 0; i <= 25; i += 0.15) {
            this.data.push({ x: .0025 * i, y: 150 * Math.sin(i) });
         }



         var xScale = d3.scaleLinear()
            .range([0, adjustedWidth])
         var xScaleTemp = d3.scaleLinear()
            .range([0, adjustedWidth])


         var yScale = d3.scaleLinear()
            .range([adjustedHeight, 0])
         var yScaleTemp = d3.scaleLinear()
            .range([adjustedHeight, 0])


         var xAxis = d3.axisBottom(xScale)
            .ticks((adjustedWidth + 2) / (adjustedHeight + 2) * 10)
            .tickSize(-adjustedHeight)


         var yAxis = d3.axisLeft(yScale)
            .ticks(5)
            .tickSize(-adjustedWidth)

         xScale.domain(d3.extent(this.data, function (d) { return d.x; }))
         yScale.domain([d3.min(this.data, function (d) { return d.y; }), d3.max(this.data, function (d) { return d.y; })])
         xScaleTemp.domain(xScale.domain());
         yScaleTemp.domain(yScale.domain())


         // define the line
         var valueline = d3.line()
            .x(function (d) { return xScale(d.x); })
            .y(function (d) { return yScale(d.y); })

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

         // var view = focus.append("rect")
         //    .attr("class", "view")
         //    .attr("width", adjustedWidth)
         //    .attr("height", adjustedHeight);

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
         var linegraph = focus.append("path")
            .data([this.data])
            .attr("class", "linegraph")
            .attr("clip-path", "url(#clip)")
            .attr("d", valueline);

         // draw dots
         // focus.selectAll(".dot")
         //    .data(this.data)
         //    .enter().append("circle")
         //    .attr("class", "dot")
         //    .attr("clip-path", "url(#clip)")
         //    .attr("r", 2.5)
         //    .attr("cx", function (d) { return xScale(d.x); })
         //    .attr("cy", function (d) { return yScale(d.y); })

         d3.select("#resetZoomButton")
            .on("click", function () {
               svg.transition()
                  .duration(1500)
                  .call(zoom.transform, d3.zoomIdentity);

            });

         // Add Zooming controls
         var zoom = d3.zoom()
            .scaleExtent([1, Infinity])
            .extent([[0, 0], [adjustedWidth, adjustedHeight]])
            .on("zoom", function () {
               var t = d3.event.transform;
               d3.selectAll(".dot").attr("transform", t);

               xScale.domain(t.rescaleX(xScaleTemp).domain());
               yScale.domain(t.rescaleY(yScaleTemp).domain());
               gX.call(xAxis);
               gY.call(yAxis);
               linegraph.attr("d", valueline);
            })

         svg.call(zoom);

      },

      getAdjustedHeight: function (height, margin) {
         return height - margin.bottom - margin.top;
      },

      getAdjustedWidth: function (width, margin) {
         return width - margin.left - margin.right;
      }

   });




});