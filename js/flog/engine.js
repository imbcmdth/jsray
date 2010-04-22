/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};

EPSILON = 0.0000000001; // Lord, have mercy upon my soul but I don't know what else to do.

Flog.RayTracer.Engine = Class.create();

Flog.RayTracer.Engine.prototype = {
    canvas: null, /* 2d context we can render to */
    currentX:0,    /* Used for throttling rendering */
    currentY:0,    /* Used for throttling rendering */
    raysRendered:0,  /* Statistics for Nerds */
    pixelsRendered:0,/* Statistics for Nerds */
    initialize: function(options){
        this.options = Object.extend({  
                canvasHeight: 100,
                canvasWidth: 100,
                pixelWidth: 2,
                pixelHeight: 2,
                renderDiffuse: false,
                renderShadows: false,
                renderHighlights: false,
                renderReflections: false,
                renderTree: "NTree",                
                rayDepth: 2
            }, options || {});
    
        this.options.canvasHeight /= this.options.pixelHeight;
        this.options.canvasWidth /= this.options.pixelWidth;
        
        /* TODO: dynamically include other scripts */
    },
    
    setPixel: function(x, y, color){
        var pxW, pxH;
        pxW = this.options.pixelWidth;
        pxH = this.options.pixelHeight;

        this.canvas.fillStyle = color.toString();
        this.canvas.fillRect (x * pxW, y * pxH, pxW, pxH);
    },
    
    renderScene: function(scene, canvas, is_canceled, finished_callback, update_callback){
        /* Get canvas */
        this.canvas = canvas.getContext("2d");
        this.raysRendered = 0;
        this.pixelsRendered = 0;

        var canvasHeight = this.options.canvasHeight;
        var canvasWidth = this.options.canvasWidth;
        var startTime = (new Date()).getTime();

        if(is_canceled.well_is_it){
            finished_callback(this.raysRendered, this.pixelsRendered);
            return;
        } else {
            for(var y = this.currentY; y < canvasHeight; y++){
                for(var x = this.currentX; x < canvasWidth; x++){
                    var yp = y * (1.0 / canvasHeight) * 2 - 1;
                    var xp = x * (1.0 / canvasWidth) * 2 - 1;

                    var ray = scene.camera.getRay(xp, yp);

                    this.setPixel(x, y, this.getPixelColor(ray, scene));
                    this.pixelsRendered++;
                    // Below is a renderer - throttle. It makes sure that the ray-tracer
                    // burns for no more than a second before yielding to the user agent.
                    // This ensures that the user agent doesn't complain about a hung script
                    // and stays fairly responsive to user input even while rendering.
                    if( ((new Date()).getTime() - startTime) > 1000 ) {
                        this.currentX = x + 1;
                        update_callback(this.raysRendered, this.pixelsRendered);
                        setTimeout(
                            (function(lscene, lcanvas, liscanceled, lfinishcallback, lengine, lupdatecallback ){
                                return(function(){
                                    lengine.renderScene(lscene, lcanvas, liscanceled, lfinishcallback, lupdatecallback);
                                 });
                             })(scene, canvas, is_canceled, finished_callback, this, update_callback),
                         1); // Might need more time for FF and some other agents.
                        return;
                    }
                }
                this.currentX = 0;
                this.currentY = y + 1;
                if(this.currentY >= canvasHeight){
                    finished_callback(this.raysRendered, this.pixelsRendered);
                    return;
                }
            }
        }
    },
    
    getPixelColor: function(ray, scene){
        var info = this.testIntersection(ray, scene, null);
        if(info.isHit){
            var color = this.rayTrace(info, ray, scene, 0);
            return color;
        }
        return scene.background.color;
    },
    
    testIntersection: function(ray, scene, exclude){
        var hits = 0;
        var tests = 0;
        var best = new Flog.RayTracer.IntersectionInfo();
        best.distance = 2000000;
        var shape_set = [];

        this.raysRendered++;

        best.position = Flog.RayTracer.Vector.prototype.add(
                        ray.position,
                        Flog.RayTracer.Vector.prototype.multiplyScalar(
                            ray.direction,
                            best.distance
                        )
                    );

        // Intersect with planes...
        // They are special since planes are "infinite" they kind of don't "fit" into a BVH.
        for(var i = scene.planes.length - 1; i >= 0; i--){
            var shape = scene.planes[i];
            if( shape != exclude ){
                var info = shape.intersect(ray);
                if(info.isHit && info.distance >= 0 && info.distance < best.distance){
                    best = info;
                    hits++;
                }
                tests++;
            }
        }
         var r = ray.toIntervals();
         var bb_intersections;
        // Intersect with shapes using chosen acceleration method (or none)
        if( scene.ntree !== null &&  this.options.renderTree == "NTree" ){
            bb_intersections = scene.ntree.intersect({ray:r});
            // Sort by the AABB's nearest intersection (by time)
            bb_intersections.sort(function(a, b){ return(a.intersect - b.intersect); });
            for(var j = bb_intersections.length-1; j>=0; j--)
            {
                shape_set.push(bb_intersections[j]);
            }
            for(var i=shape_set.length-1; i>=0; i--){
                var shape = shape_set[i];
                if( shape.object != exclude ){
                    if( shape.intersect > best.distance )
                    {
                        return best;
                    }
                    var info = shape.object.intersect(ray);
                    if(info.isHit && info.distance >= 0 && info.distance < best.distance){
                        best = info;
                        hits++;
                    }
                    tests++;
                }
            }
            best.hitCount = hits;
            best.testCount = tests;
        } else {
            shape_set = scene.shapes;
            for(var i=shape_set.length-1; i>=0; i--){
                var shape = shape_set[i];
                if( shape != exclude ){
                    var info = shape.intersect(ray);
                    if(info.isHit && info.distance >= 0 && info.distance < best.distance){
                        best = info;
                        hits++;
                    }
                    tests++;
                }
            }
            best.hitCount = hits;
            best.testCount = tests;
        }
       return best;
    },
    
    getReflectionRay: function(P,N,V){
        var new_N = N;
        var cI = -new_N.dot(V);
        if(cI < 0) { // If inside object coming out
        		// n = 1/n;
            new_N = Flog.RayTracer.Vector.prototype.multiplyScalar(N, -1);
            cI*=-1;
        }
        var R1 = Flog.RayTracer.Vector.prototype.add(
            Flog.RayTracer.Vector.prototype.multiplyScalar(N, 2*cI),
            V
        );
        var P1 = Flog.RayTracer.Vector.prototype.add(
        		P, 
        		Flog.RayTracer.Vector.prototype.multiplyScalar(new_N, EPSILON)
        );
        return new Flog.RayTracer.Ray(P1, R1);
    },
    getRefractedRay: function(P,N,V,n){ // n == index of refraction outside / index of refraction inside
        var new_N = N;
        var cI = -V.dot(new_N);
        if(cI < 0) { // If inside object coming out
        		// n = 1/n;
            new_N = Flog.RayTracer.Vector.prototype.multiplyScalar(N, -1);
            cI*=-1;
        }
        var cT = 1 - n * n * (1 - cI * cI);
        var P1 = Flog.RayTracer.Vector.prototype.add(
        		P, 
        		Flog.RayTracer.Vector.prototype.multiplyScalar(new_N, -EPSILON)
        );
        if(cT > 0){
            cT = Math.sqrt(cT);
            var R1 = Flog.RayTracer.Vector.prototype.add( Flog.RayTracer.Vector.prototype.multiplyScalar(V, n),
                                                          Flog.RayTracer.Vector.prototype.multiplyScalar(new_N, n * cI - cT));
	
            return new Flog.RayTracer.Ray(P1, R1);
        } else {
            return new Flog.RayTracer.Ray(P1, V);
        }
    },

    rayTrace: function(info, ray, scene, depth){
        // Calc ambient
        var color = Flog.RayTracer.Color.prototype.multiplyScalar(info.color, scene.background.ambience);
        var ambcolor = Flog.RayTracer.Color.prototype.multiplyScalar(info.color, scene.background.ambience);
        var shininess = Math.pow(10, info.shape.material.gloss + 1);
				
				var diffcolor = speccolor = reflcolor = transcolor = new Flog.RayTracer.Color();
				
        for(var i=0; i<scene.lights.length; i++){
            var light = scene.lights[i];

            // Calc diffuse lighting
            var v = Flog.RayTracer.Vector.prototype.subtract(
                                light.position,
                                info.position
                            ).normalize();

           /* Render shadows */

           var shadowInfo = new Flog.RayTracer.IntersectionInfo();
           var L = v.dot(info.normal);
           if(L > 0){
            if(this.options.renderShadows){
                var shadowRay = new Flog.RayTracer.Ray(info.position, v);
                shadowInfo = this.testIntersection(shadowRay, scene, info.shape);
            }

            if(this.options.renderDiffuse && !shadowInfo.isHit){
				          	L *= info.shape.material.diffuse;
                    diffcolor = Flog.RayTracer.Color.prototype.add(diffcolor, 
                    								Flog.RayTracer.Color.prototype.multiply(
                                            info.color,
                                            Flog.RayTracer.Color.prototype.multiplyScalar(
                                                light.color,
                                                L
                                 	         )
                                     )
                                 );
            }

          // Phong specular highlights
          if(this.options.renderHighlights && !shadowInfo.isHit && info.shape.material.gloss > 0){
            var Lv = Flog.RayTracer.Vector.prototype.subtract(
                                info.shape.position,
                                light.position
                            ).normalize();

            var E = Flog.RayTracer.Vector.prototype.subtract(
                                scene.camera.position,
                                info.shape.position
                            ).normalize();

            var H = Flog.RayTracer.Vector.prototype.subtract(
                                E,
                                Lv
                            ).normalize();

            var glossWeight = Math.pow(Math.max(info.normal.dot(H), 0), shininess);
            speccolor = Flog.RayTracer.Color.prototype.add(speccolor, Flog.RayTracer.Color.prototype.multiplyScalar(light.color, glossWeight));
          }
        }
        }
        // The greater the depth the more accurate the colours, but
        // this is exponentially (!) expensive
        if(depth <= this.options.rayDepth){
          // calculate reflection ray
          if(this.options.renderReflections && info.shape.material.reflection > 0)
          {
              var reflectionRay = this.getReflectionRay(info.position, info.normal, ray.direction);
              var refl = this.testIntersection(reflectionRay, scene/*, info.shape*/);

              if (refl.isHit && refl.distance > 0){
                  refl.color = this.rayTrace(refl, reflectionRay, scene, depth + 1);
              } else {
                  refl.color = scene.background.color;
              }

                  reflcolor = Flog.RayTracer.Color.prototype.multiplyScalar(refl.color, info.shape.material.reflection);
          }

                // Refraction
          // calculate Refracted ray
          if(this.options.renderTransparency && info.shape.material.transparency > 0)
          {
              var refractedRay = this.getRefractedRay(info.position, info.normal, ray.direction, info.ior / info.shape.material.refraction);
              var refr = this.testIntersection(refractedRay, scene/*, info.shape*/);
							refr.ior = info.shape.material.refraction;
              if (refr.isHit && refr.distance > 0){
                  refr.color = this.rayTrace(refr, refractedRay, scene, depth + 1);
              } else {
                  refr.color = scene.background.color;
              }

              transcolor = Flog.RayTracer.Color.prototype.multiplyScalar(refr.color, info.shape.material.transparency);
          }
        }
        color = Flog.RayTracer.Color.prototype.add( Flog.RayTracer.Color.prototype.add( Flog.RayTracer.Color.prototype.add( Flog.RayTracer.Color.prototype.add( diffcolor, speccolor ), reflcolor ), transcolor ), ambcolor );
      // Uncomment to see the number intersection tests performed per pixel.
      //  var new_color = new Flog.RayTracer.Color(info.testCount, info.testCount, info.testCount);
      //  return(new_color);
        color.limit();
        return color;
     }
};