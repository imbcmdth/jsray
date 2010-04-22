/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};

Flog.RayTracer.Camera = Class.create();

Flog.RayTracer.Camera.prototype = {
    position: null,
    lookAt: null,
    equator: null,
    up: null,
    screen: null,
    pinhole:false,
    zoom:1,
    initialize : function(pos, lookAt, up, pinhole, zoom) {
        this.position = pos;
        this.lookAt = lookAt;
        this.up = up;
        this.equator = lookAt.normalize().cross(this.up);
        this.screen = Flog.RayTracer.Vector.prototype.add(this.position, this.lookAt);
        this.zoom = zoom ? zoom : 1;
        if(pinhole) {
            this.pinhole = true;
        }
    },

    getRay: function(vx, vy){
        var pos = Flog.RayTracer.Vector.prototype.subtract(
            this.screen,
            Flog.RayTracer.Vector.prototype.subtract(
                Flog.RayTracer.Vector.prototype.multiplyScalar(this.equator, (vx / this.zoom)),
                Flog.RayTracer.Vector.prototype.multiplyScalar(this.up, (vy / this.zoom))
            )
        );
        pos.y = pos.y * -1;
        var dir = Flog.RayTracer.Vector.prototype.subtract(
            pos,
            this.position
        );

        var ray;
        if(this.pinhole){
            ray = new Flog.RayTracer.Ray(this.position, dir.normalize());
        } else {
            ray = new Flog.RayTracer.Ray(pos, dir.normalize());
        }

        return ray;
    },

    toString : function () {
        return 'Ray []';
    }
}