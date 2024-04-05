var zoom;
var svg;
var g;
var simulation;
var link;
var linkChildren = [];
var node;
var nodeLabels;
var column = [];
var nodeLabelsChildren = [];
var record;

function drag(simulation) {
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
   
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
    
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }    

    return d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}

window.addEventListener('resize', function(event){
  width = document.querySelector(".content").clientWidth;
  height = document.querySelector(".content").clientHeight;

  if (svg != undefined) {
    svg
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("width", width)
      .attr("height", height);
  }

});