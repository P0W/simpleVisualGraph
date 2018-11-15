define([
   "dojo/_base/declare",
   "d3/d3.js"
], function (declare, d3) {
   'use strict';

   return declare(null, {

      constructor: function () {
         var width = 800;
         var height = 600;

         var margin = {
            top: 25,
            left: 20,
            bottom: 25,
            right: 20
         };


         this.data = [];

         for (var i = 0; i <= 50; ++i) {
            this.data.push({ x: i, y: 50 * Math.random() });
         }

         var svg = d3.select('#xyplotContainer')
            .append("svg")
            .attr("width", width)
            .attr("height", height);

         var xScale = d3.scaleLinear()
            .range([0, width - margin.left - margin.right])
         //.nice()
         var xScaleTemp = d3.scaleLinear()
            .range([0, width - margin.left - margin.right])

         xScale.domain(d3.extent(this.data, function (d) { return d.x; }))
            .nice();

         var yScale = d3.scaleLinear()
            .range([height - margin.bottom - margin.top, 0])
         //.nice()

         yScale.domain([0, d3.max(this.data, function (d) { return d.y; })])
            .nice();


         var xAxis = d3.axisBottom(xScale)
            .ticks((width + 2) / (height + 2) * 10)
            .tickSize(-height)


         var yAxis = d3.axisLeft(yScale)
            .ticks(5)
            .tickSize(-width)

         // define the line
         var valueline = d3.line()
            .x(function (d) { return xScale(d.x); })
            .y(function (d) { return yScale(d.y); })


         var view = svg.append("rect")
            .attr("class", "view")
            .attr("width", width - 1)
            .attr("height", height - 1);

         var gX = svg.append("g")
            .attr("class", "axis axis--x")
            .attr('transform', 'translate(' + margin.left + ',' + (height - margin.bottom) + ')')
            .call(xAxis);

         var gY = svg.append("g")
            .attr("class", "axis axis--y")
            .attr('transform', 'translate(' + margin.left + ',' + (margin.bottom) + ')')
            .call(yAxis);

         // add the valueline path.
         var linegraph = svg.append("path")
            .data([this.data])
            .attr("class", "linegraph")
            .attr("d", valueline);

         // draw dots
         svg.selectAll(".dot")
            .data(this.data)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("r", 3.5)
            .attr("cx", function (d) { return xScale(d.x); })
            .attr("cy", function (d) { return yScale(d.y); })

         d3.select("button")
            .on("click", function () {
               svg.transition()
                  .duration(1500)
                  .call(zoom.transform, d3.zoomIdentity);

            });

         var zoom = d3.zoom()
            .on("zoom", function () {
               var t = d3.event.transform;

               var _x = xAxis.scale(d3.event.transform.rescaleX(xScale));

               gX.call(xAxis.scale(d3.event.transform.rescaleX(xScale)));
               gY.call(yAxis.scale(d3.event.transform.rescaleY(yScale)));

               var neValue = d3.line()
                  .x(function (d) { return _x(d.x); })
                  .y(function (d) { return yScale(d.y); })

               d3.selectAll(".dot").attr("transform", t);
               linegraph.select(".linegraph").attr("d", neValue);
            })

         svg.call(zoom);

      }
   });

});