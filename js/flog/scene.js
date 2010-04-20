/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};

Flog.RayTracer.Scene = Class.create();

Flog.RayTracer.Scene.prototype = {
    camera : null,
    shapes : [],
    planes : [], // Just "too big" to fit into ntree 
    lights : [], 
    background : null,
    ntree : null,  
    addSphere : function(sphere) {
        this.shapes.push(sphere);
        var aabb = sphere.bb();
        this.ntree.insert({intervals:aabb, object:sphere});
    },
    addPlane : function(plane) {
        this.planes.push(plane);
    },
    addCube : function(cube) { // TODO
//        this.shapes.push(plane);
    },
    initialize : function() {
        this.camera = new Flog.RayTracer.Camera(
            new Flog.RayTracer.Vector(0,0,-5), 
            new Flog.RayTracer.Vector(0,0,1), 
            new Flog.RayTracer.Vector(0,1,0)
        );
        this.ntree = new NTree(3, 10); // 3 dimensions, 10 items to a leaf
        this.background = new Flog.RayTracer.Background(new Flog.RayTracer.Color(0,0,0.5), 0.2);
    }
}