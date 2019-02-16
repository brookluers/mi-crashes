var w = 700;
var h = 350;
var w_textselector = 180,
    w_textlabel = 35;
var y_statelabel, ylab = " crashes per 100,000 residents";
var svg_padding = 75;
var ccr;
var counties, counties_num, counties_display;
var showing_rate = true;
var selectors_ready = false, counties_ready = false;
var active_counties = [];
active_counties["Michigan"] = true;
var county_pop16;
var svg = d3.select("#main-chart")
    //.style("width", "40%")
    .append("svg")
    .attr("width", w)
    .attr("height", h)
    .attr("id", "plot-area");

var rowConv = function(d, i, columns) {
    d.year = parseInt(d.year);
    for (var i = 1; i < columns.length; ++i) {
	d[columns[i]] = +d[columns[i]]
    }
    return d;
}


function selector_mover(d, i) {
    sthis = d3.select(this);
    if (sthis.attr("id") == "none-selector") {
	county_pop16.forEach(function(x) { active_counties[x.county] = false; });
	sthis.classed("active", true)
	    .classed("inactive", false);
	d3.select("#text-selectors")
	    .selectAll(".county-selector")
	    .classed("inactive", true)
	    .classed("active", false);
    } else {
	d3.select("#none-selector")
	    .classed("active", false)
	    .classed("inactive", true);
	active_counties[d.county] = !active_counties[d.county];
	d3.select(this)
	    .classed("active", active_counties[d.county])
	    .classed("inactive", !active_counties[d.county]);
    }

    y.domain([
	      d3.min(counties_display.filter(function(d) { return active_counties[d.county]==true;}), 
		     function(c) { return d3.min(c.years_yvals, function(d) { return d.yval; }); }),
	      d3.max(counties_display.filter(function(d) { return active_counties[d.county]==true;}),
		     function(c) { return d3.max(c.years_yvals, function(d) { return d.yval; }); })
	      ]);

    svg.select("#yaxis")
	.transition()
	.call(customYAxis);

    show_counties(counties_display.filter(function(cc) { return active_counties[cc.county] == true ;}));
}
    
function onmouseover(d, i) {
    var county_name = d3.select(this.parentNode).attr("county");
    var cclass = d3.select(this)
	.attr("class");
    if (county_name != "Michigan"){
	d3.select(this)
	    .attr("class", cclass + " highlight")
	    .style("opacity","1.0");
	d3.select(this.parentNode)
	    .append("text")
	    .datum(function(dd) { return { nm: dd.county, val: dd.years_yvals[dd.years_yvals.length - 1]}; })
	    .attr("transform", function(dd) 
		  { 
		      var yret; 
		      if (Math.abs(y(dd.val.yval) - y_statelabel) < 5 ){
			  yret = y(dd.val.yval)- 10;
		      } else {yret = y(dd.val.yval);}
		      return "translate(" + x(dd.val.year) + "," +  yret + ")"; 
		  } )
	    .text(function(dd) { return dd.nm; } ) //  + " County"; } )
	    .classed("highlight","true");
    }
}

function titleclick(d, i) {
    showing_rate = !showing_rate;
    var title;
    if (showing_rate) {
	counties_display = counties;
	ylab = " crashes per 100,000 residents";
	title = "rate (click to change)";
    } else {
	counties_display = counties_num;
	svg.select(".michigan")
	    .selectAll(".text")
	    .remove();
	ylab = " crashes";
	title = "number (click to change)";
    }
    y.domain([
	      d3.min(counties_display.filter(function(d) { return active_counties[d.county]==true;}), 
		     function(c) { return d3.min(c.years_yvals, function(d) { return d.yval; }); }),
	      d3.max(counties_display.filter(function(d) { return active_counties[d.county]==true;}),
		     function(c) { return d3.max(c.years_yvals, function(d) { return d.yval; }); })
	      ]);
    yAxis.scale(y)
	.ticks(4)
	.tickFormat(function(d) {
		return this.parentNode.nextSibling
		    ? "\xa0" + d
		    : d + ylab;
	    });
    svg.select("#yaxis")
	.transition()
	.call(customYAxis);
    d3.select(this)
	.text(title);

    show_counties(counties_display.filter(function(d) {return active_counties[d.county]==true;} ));
}

function onmouseout(d, i) {
    var county_name = d3.select(this.parentNode).attr("county");    
    if (county_name != "Michigan"){
	var cclass = d3.select(this)
	    .attr("class");
	var pclass = cclass.substring(0, cclass.length - " highlight".length);
	
	d3.select(this)
	    .attr("class", pclass)
	    .style("opacity", "0.5");
	d3.select(this.parentNode)
	    .select("text")
	    .remove();
    }
}

var ncounties = 83;
var textnrows = 25;
var textncol  = Math.ceil(ncounties / textnrows);
var xtband = d3.scalePoint()
    .domain(d3.range(0, textncol))
    .range([50, w - 75]);
var ytband = d3.scaleBand()
    .domain(d3.range(0, textnrows))
    .range([60, h-10]);
    
var x = d3.scaleLinear()
    .range([svg_padding + 160, w - svg_padding - w_textlabel])
    .domain([2004, 2016])
    .nice();

var xAxis = d3.axisBottom();
var yAxis = d3.axisRight();

function customYAxis(g) {
    g.call(yAxis);
    g.select(".domain").remove();
    g.selectAll(".tick line") //(".tick:not(:first-of-type) line")
	.attr("stroke", "#777")
	.attr("stroke-dasharray", "2,2");
    //g.selectAll(".tick:first-of-type line").attr("display","none");
    g.selectAll(".tick text").attr("x", x(2003.5))
	//.attr("dy", -4)
	.attr("transform", "translate(0, -5)")
    	.attr("fill", "rgb(13,13,13)");
}

var y = d3.scaleLinear()
    .range([h - svg_padding, 0 + svg_padding])
    .nice();

var line = d3.line()
    .x(function(r) { return x(r.year); } )
    .y(function(r) { return y(r.yval); } );


d3.csv("ncr-county-year.csv", rowConv, function(error, data) {
	if (error) {
	    console.log(error);
	} else {
	    counties_num = data.columns.slice(1).map(function(county_name) {
		    return {
			county: county_name,
			years_yvals: data.map(function(crow) {
				return { year: crow.year, yval: crow[county_name]};
			    })
		    };
		});
	}
    });

d3.csv("cr-county-year.csv", rowConv, function(error, data) {
	if (error) {
	    console.log(error);
	} else {
	    ccr = data;
	    counties = data.columns.slice(1).map(function(county_name) {
		    return {
			county: county_name,
			    years_yvals: data.map(function(crow) {
				return {year: crow.year, yval: crow[county_name]};
			    })
		    };
		});
	    
	    yAxis.tickSize(x(2016));

	    
	    y.domain([
		      d3.min(counties, function(c) { return d3.min(c.years_yvals, function(d) { return d.yval; }); }),
		      d3.max(counties, function(c) { return d3.max(c.years_yvals, function(d) { return d.yval; }); })
		      ]);


	    xAxis.scale(x)
		.tickValues([2004, 2008, 2012, 2016])
		.tickFormat(d3.format("d"));

	    yAxis.scale(y)
		.ticks(4)
		.tickFormat(function(d) {
			return this.parentNode.nextSibling
			    ? "\xa0" + d
			    : d + ylab;
		    });
	    
	    svg.append("g")
		.attr("class", "axis")
		.attr("id", "xaxis")
		.style("text-anchor", "middle")
		.attr("transform", "translate(0," + (h - svg_padding)  + ")")
		.call(xAxis);
		//.select(".domain").remove();
	    svg.append("g")
		.attr("class","axis")
		.attr("id", "yaxis")
		.style("text-anchor","end")
		.call(customYAxis);

	    counties_display = counties;
	    counties_ready = true;
	    after_loading();
	}
    });



d3.csv("county-pop16.txt", function(d, i, columns) { 
	d.pop16 = parseInt(d.pop16);
	return d;
    }, function(error, data) {
	if (error) { 
	    console.log(error);
	} else {
	    county_pop16 = data;
	    //svg.selectAll(".county-selector")
	    d3.select("#text-selectors")
		.append("svg")
		.attr("height", 1.5 * h)
		.attr("width", w_textselector)
		.selectAll(".county-selector")
		.data(county_pop16, function(d) { return d.county; })
		.enter()
		//.append("p")
		.append("text")
		.attr("class","county-selector")
		.attr("county", function(d) { return d.county; })
		.classed("active", function(d, i){ 
			if (i < 25) {
			    active_counties[d.county] = true;
			} else {active_counties[d.county] = false;}
			return i < 25; })
		.classed("inactive", function(d, i) { return i >= 25; })
		.attr("x", function(d, i) { 
			return xtband(Math.floor(i / textnrows));
		  })
		.attr("y", function(d, i) { 
			return ytband(i - Math.floor(i/textnrows)*textnrows); 
	       })
		.attr("font-size", "10px")
		.attr("fill", "rgb(13,13,13)")
		.attr("opacity", "0.75")
		.text(function(d) { return d.county == "Michigan" ? "" : d.county;} )
		.on("mouseover", selector_mover);
	    
		
	    d3.select("#text-selectors")
		.select("svg")
		//.append("p")
		.append("text")
		.attr("id", "none-selector")
		.classed("active", false)
		.classed("inactive", true)
		.attr("x", xtband(0))
		.attr("y", 30)
		//.attr("font-size", "10px")
		.attr("fill", "rgb(13,13,13)")
		.attr("opacity", "0.75")
		.text("None")
		.on("mouseover", selector_mover);

	    //svg.append("text")
	    //	.attr("x", x(2010))
	    //.attr("y", 18)
	    //.text("")
	    //.style("font-size", "20px")
	    //.style("text-anchor", "middle")
	    //.style("fill", "rgb(13,13,13)");
	    svg.append("text")
		.attr("x", x(2010))
		.attr("y", 18)
		.text("rate (click to change)")
		.style("font-size", "14px")
		.style("font-style", "italic")
		.style("text-anchor", "middle")
		.style("fill", "rgb(13,13,13)")
		.on("click", titleclick);

	    d3.select("#text-selectors")
		.select("svg")
		.append("text")
		.attr("id","selectprompt")
		.attr("x", xtband(0))
		.attr("y", 10)
		.attr("font-size", "14px")
		.style("font-style", "italic")
		.text("select counties");
	    
	    selectors_ready = true;

	    after_loading();
	}
    });

function after_loading() {
    if (selectors_ready && counties_ready) {
	show_counties(counties_display.filter(function(d) {return active_counties[d.county]==true;} ));
    }
    
}

function show_counties(current_counties) {
    var county = svg.selectAll(".county")
	.data(current_counties.filter(function(d) { return active_counties[d.county]==true;}),
	      function(d) { return d.county; });
    var county_enter = county.enter();
    
    county
	//.selectAll("g")
	.select(".line")
	.transition()
	.duration(750)
	.attr("d", function(d) { return line(d.years_yvals); });

    county_enter
	.append("g")
	.attr("county", function(d) { return d.county })
	.classed("county", true) // function(d) { return d.county != "Michigan"; })
	.classed("michigan", function(d) { return d.county=="Michigan";})
	.append("path")
	.on("mouseover", onmouseover)
	.on("mouseout", onmouseout)
	.attr("class", "line")
	.attr("d", function(d) { return line(d.years_yvals); })
	.style("stroke", function(d) { return d.county == "Michigan" ? "teal" : "black"; })
	.style("opacity", function(d) { return d.county != "Michigan" ? "0.5" : "1.0"; });

    var mich = svg.selectAll(".michigan").selectAll(".stickylabel")
	.data(current_counties.filter(function(d) { return d.county=="Michigan"; }),
	      function(d) { return d.county; });

    mich.enter()
	.append("text")
	.classed("stickylabel", true)
	.classed("highlight", true)
	.attr("transform", function(d) { return "translate(" + x(d.years_yvals[d.years_yvals.length-1].year) +  
		    "," + y(d.years_yvals[d.years_yvals.length-1].yval) + ")";})
	.text("Statewide")
	.style("fill","teal")
	.on("mouseover", null)
	.on("mouseout", null);

    mich
	.transition()
	.duration(750)
	.attr("transform", function(d) { return "translate(" + x(d.years_yvals[d.years_yvals.length-1].year) +  
		    "," + y(d.years_yvals[d.years_yvals.length-1].yval) + ")";});

    mich.exit().remove();

	
    county
	.exit()
	.remove();
}


