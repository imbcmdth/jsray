/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};
if(typeof(Flog.RayTracer.Shape) == 'undefined') Flog.RayTracer.Shape = {};

Flog.RayTracer.Shape.Cube = Class.create();

Flog.RayTracer.Shape.Cube.prototype = {
    initialize : function(pos, material, v1, v2) {
        this.position = pos;
        this.material = material;
        
        /* Haven't done it yet - feel free to */
    },
    
    intersect: function(ray){
        var info = new Flog.RayTracer.IntersectionInfo();
        info.shape = this;
        
        return info;
    },
    bb: function(){
  //      return [{a:this.position.x-this.radius,b:this.radius*2},{a:this.position.y-this.radius,b:this.radius*2},{a:this.position.z-this.radius,b:this.radius*2}];
    },
    toString : function () {
        return 'Box [position=' + this.position + ']';  
    }
}