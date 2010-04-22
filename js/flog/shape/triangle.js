/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};
if(typeof(Flog.RayTracer.Shape) == 'undefined') Flog.RayTracer.Shape = {};

EPSILON = 0.0000000001;

Flog.RayTracer.Shape.Triangle = Class.create();

Flog.RayTracer.Shape.Triangle.prototype = {
    V:[],
    aabb:[],
    initialize : function(points, material) {
        this.V = points;
				
				// Precalc intersection test parameters
        this.u = Flog.RayTracer.Vector.prototype.subtract(this.V[1].position, this.V[0].position);
        this.v = Flog.RayTracer.Vector.prototype.subtract(this.V[2].position, this.V[0].position);
        this.n = this.u.cross(this.v);
        if (this.n.x == 0 && this.n.y == 0 && this.n.z == 0 ) { 
            throw "Bad triangle data!";
        }
        // Calculate bounding box
        this.aabb = [];
        var temp = Math.min(this.V[0].position.x, this.V[1].position.x, this.V[2].position.x);
        this.aabb.push({a:temp,b:Math.max(this.V[0].position.x, this.V[1].position.x, this.V[2].position.x)-temp});
        
        temp = Math.min(this.V[0].position.y, this.V[1].position.y, this.V[2].position.y);
        this.aabb.push({a:temp,b:Math.max(this.V[0].position.y, this.V[1].position.y, this.V[2].position.y)-temp});
        
        temp = Math.min(this.V[0].position.z, this.V[1].position.z, this.V[2].position.z);
        this.aabb.push({a:temp,b:Math.max(this.V[0].position.z, this.V[1].position.z, this.V[2].position.z)-temp});
        
        this.position = this.V[0].position;
        this.material = material;
    },
    
    // Adapted From : http://www.softsurfer.com/Archive/algorithm_0105/algorithm_0105.htm#intersect_RayTriangle%28%29
    intersect: function(ray){
        var info = new Flog.RayTracer.IntersectionInfo();
        var dir = ray.direction;
        var w0 = Flog.RayTracer.Vector.prototype.subtract(ray.position, this.V[0].position);
        var a = -this.n.dot(w0);
        var b = this.n.dot(dir);

        if (Math.abs(b) < EPSILON) {     // ray is parallel to triangle plane
            return info;
         //   if (a == 0)                // ray lies in triangle plane
         //       return ;
         //   else return ;             // ray disjoint from plane
        }

        // get intersect point of ray with triangle plane
        var r = a / b;
        if (r < 0)                   // ray goes away from triangle
            return info;                  // => no intersect
        // for a segment, also test if (r > 1.0) => no intersect
        var I = Flog.RayTracer.Vector.prototype.add(ray.position,
                    Flog.RayTracer.Vector.prototype.multiplyScalar(ray.direction, r));           // intersect point of ray and plane

        // is I inside T?
        var  uu, uv, vv, wu, wv, D;
        uu = this.u.dot(this.u);
        uv = this.u.dot(this.v);
        vv = this.v.dot(this.v);
        var w = Flog.RayTracer.Vector.prototype.subtract(I, this.V[0].position);
        wu = w.dot(this.u);
        wv = w.dot(this.v);
        D = uv * uv - uu * vv;

        // get and test parametric coords
        var s, t;
        s = (uv * wv - vv * wu) / D;
        if (s <= -EPSILON || s >= (1+EPSILON))        // I is outside T
            return info;
        t = (uv * wu - uu * wv) / D;
        if (t <= -EPSILON || (s + t) >= (1+EPSILON))  // I is outside T
            return info;
				
				// Interpolate Vertex Normals
				var n1 = Flog.RayTracer.Vector.prototype.multiplyScalar(this.V[0].direction.normalize(), 1-(s+t));
				var n2 = Flog.RayTracer.Vector.prototype.multiplyScalar(this.V[1].direction.normalize(), s);
				var n3 = Flog.RayTracer.Vector.prototype.multiplyScalar(this.V[2].direction.normalize(), t);
				var N1 = Flog.RayTracer.Vector.prototype.add(n1, n2);
				var N = Flog.RayTracer.Vector.prototype.add(N1, n3);
        
        info.shape = this;
        info.isHit = true;
        info.normal = N.normalize();
        info.distance = r;
        info.position = I;
        
        if(this.material.hasTexture){
            info.color = this.material.getColor(s,t);
        } else {
            info.color = this.material.getColor(0,0);
        }

        return info;
    },
    bb : function() {
        return this.aabb;
    },
    toString : function () {
        return 'Triangle [p0=' + this.V[0].toString + ', p1=' + this.V[1].toString + ', p2=' + this.V[2].toString + ']';
    }
}