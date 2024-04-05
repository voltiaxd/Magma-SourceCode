var resizerSidebar = document.querySelector("#resizer-sidebar");
var sidebar = document.querySelector(".sidebar");

var resizerEditor = document.querySelector("#resizer-editor");
var editorSection = document.querySelector("#editor-section");
var resultsql = document.querySelector("#query-results");

var queryOptions = document.querySelector("#queries-options-wrapper");

function initResizerSidebar() {

   var x, w, maxw, minw;

   function rs_mousedownHandler(e) {

      x = e.clientX;

      w = parseInt( window.getComputedStyle( sidebar ).width, 10 );
      maxw = parseInt( window.getComputedStyle( sidebar ).maxWidth, 10 );
      minw = parseInt( window.getComputedStyle( sidebar ).minWidth, 10 );

      resizerSidebar.classList.add("focussed");

      document.addEventListener("mousemove", rs_mousemoveHandler);
      document.addEventListener("mouseup", rs_mouseupHandler);
   }

   function rs_mousemoveHandler( e ) {
      var dx = e.clientX - x;

      var cw = w + dx;
      
      if ( cw > maxw ) cw = maxw;
      if ( cw < minw ) cw = minw;
      
      sidebar.style.width = `${ cw }px`;
      setPosQueryResultSection();
   }

   function rs_mouseupHandler() {
        resizerSidebar.classList.remove("focussed");
        document.removeEventListener("mouseup", rs_mouseupHandler);
        document.removeEventListener("mousemove", rs_mousemoveHandler);
   }

   resizerSidebar.addEventListener("mousedown", rs_mousedownHandler);
}


function initResizerEditor() {

   var y, h, maxh, minh;

   function rs_mousedownHandler(e) {

        y = e.clientY;

        h = parseInt( window.getComputedStyle( editorSection ).height, 10 );
        maxh = parseInt( window.getComputedStyle( editorSection ).maxHeight, 10 );
        minh = parseInt( window.getComputedStyle( editorSection ).minHeight, 10 );

        resizerEditor.classList.add("focussed");

        document.addEventListener("mousemove", rs_mousemoveHandler);
        document.addEventListener("mouseup", rs_mouseupHandler);
   }

   function rs_mousemoveHandler( e ) {
      var dy = e.clientY - y;

      var ch = h + dy;
      
      if ( ch > maxh ) ch = maxh;
      if ( ch < minh ) ch = minh;

      editorSection.style.height = `${ ch }px`;
      resultsql.style.height = `calc(100vh - var(--h-title-bar) - var(--h-editor-helpbar) - ${ ch }px)`;
      
   }

   function rs_mouseupHandler() {
      resizerEditor.classList.remove("focussed");
      document.removeEventListener("mouseup", rs_mouseupHandler);
      document.removeEventListener("mousemove", rs_mousemoveHandler);
   }

   resizerEditor.addEventListener("mousedown", rs_mousedownHandler);
}

function setPosQueryResultSection() {
   resultsql.style.width = `calc(100vw - ${ sidebar.offsetWidth }px)`;
}

initResizerSidebar();
initResizerEditor();
