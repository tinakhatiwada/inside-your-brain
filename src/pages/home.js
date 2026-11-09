import '../main.js';
var stage = document.getElementById('portrait-stage');
var wrap3d = document.getElementById('portrait-3d');
if (stage && wrap3d) {
  stage.addEventListener('mousemove', function(e) {
    var r = stage.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width - 0.5;
    var y = (e.clientY - r.top) / r.height - 0.5;
    wrap3d.style.transform = 'rotateY(' + (x * 12) + 'deg) rotateX(' + (-y * 10) + 'deg)';
  });
  stage.addEventListener('mouseleave', function() { wrap3d.style.transform = ''; });
  stage.addEventListener('click', function() { window.location.href = 'explore.html'; });
}
