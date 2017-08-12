
class Animator{

    /**
     * 
     * @param {*} svgElement 
     * @param {*} targets [{element:<>, weight:<>})
     * @param {*} duration 
     * @param {*} onComplete 
     */
    static morph(svgElements, targets, duration, onComplete){
        if(targets == null || targets.length == 0){
            onComplete(); 
            return; 
        }    
        
        // start: dev 
        // var tmpTarget = targets[0]; 
        // for(var ii=0; ii<svgElements.length; ii++){
        //     var tmpElement = svgElements[ii];
            
        //     var jj = 0; 
        //     for(jj=0; jj<tmpTarget.elements.length; jj++){
        //         if(tmpTarget.elements[jj].id == tmpElement.id){
        //             break; 
        //         }
        //     }

        //     //debugger; 

        //     var tmpPoints = toPoints(Animator.toPath(tmpTarget.elements[jj])); 
        //     var tmpPath = toPath(tmpPoints);
        //     // assign back to element 
        //     tmpElement.setAttribute("d", tmpPath);
        // }
        // end: dev

        // *** normalise weights 
        // ** sum up the weights 
        let wtSum = 0.0;  
        targets.forEach((target, index) => {            
            wtSum += target['weight'];            
        });               

        targets.forEach((target, index) => {            
            target['n_weight'] = target['weight'] / wtSum;          
        });

        // *** convert all our target into points        
        targets.forEach((target, index) => {
            target['element_points'] = new Array(); 
            var targetElements = target["elements"]; // eye_l, eye_r, mouth (svg)

            targetElements.forEach((element, eIndex) => {
                try{
                    let element_points = toPoints(Animator.toPath(element)); 
                    element_points['id'] = element.id; 
                    target['element_points'].push(element_points);
                }  catch(err){
                    console.log(err); 
                    debugger; 
                }             
            });            
        });                                

        // TODO: match points i.e. make sure they are all the same length   
        // find the largest 
        let maxCounts = {};  
        targets.forEach((target, index) => {
            target['element_points'].forEach((elementPoint, eIndex) => {
                // create entry if it doesn't exist 
                if(!(elementPoint.id in maxCounts)){
                    maxCounts[elementPoint.id] = {
                        'index': -1, 
                        'count': 0, 
                        'eIndex': -1
                    };
                }

                if(maxCounts[elementPoint.id].count < elementPoint.length){
                    maxCounts[elementPoint.id].index = index; 
                    maxCounts[elementPoint.id].count = elementPoint.length;                    
                    maxCounts[elementPoint.id].eIndex = eIndex; 
                }

            });
        });
        
        // ** match all other points to the largest         
        // targets.forEach((target, index) => {
        //     target['element_points'].forEach((elementPoint, eIndex) => {
        //         let [a, b] = matchPoints(
        //             targets[maxCounts[elementPoint.id].index]['element_points'][maxCounts[elementPoint.id].eIndex], 
        //             elementPoint);
                
        //         b.id = elementPoint.id; 
        //         target["element_points"][eIndex] = b;                 
        //     });             
        // });                  

        for(var i=0; i<targets[1].length; i++){
            
        }

        return; 

        // *** create destination slots             
        var destinationPoints = new Array();         
        var target = targets[0]; 
        
        for(var i=0; i<target['element_points'].length; i++){
            var destinationPoint = new Array(); 
            destinationPoint.id = target['element_points'][i].id; 

            for(let j=0; j<target['element_points'][i].length; j++){
                destinationPoint.push(
                    Animator.createPoint(target['element_points'][i][j])
                );
            } 
                    
            destinationPoints.push(destinationPoint);
        }

        //console.log(destinationPoints); 

        // set destination 
        for(var dIdx=0; dIdx<destinationPoints.length; dIdx++){
            var destinationPoint = destinationPoints[dIdx];
            // iterate through all targets 
            for(var tIdx=0; tIdx<targets.length; tIdx++){
                var target = targets[tIdx];
                var targetPoints = target['element_points']; 

                for(var pIdx=0; pIdx<targetPoints.length; pIdx++){
                    if(targetPoints[pIdx].id == destinationPoint.id){                                           
                        destinationPoint = Animator.addPoint(destinationPoint, targetPoints[pIdx], target.n_weight);
                    }
                }
            }
        }
        
        // *** convert the points to descriptions 
        let destinationPaths = new Array(); 

        for(var dIdx=0; dIdx<destinationPoints.length; dIdx++){
            destinationPaths.push({ 
                'id': destinationPoints[dIdx].id, 
                'd': toPath(destinationPoints[dIdx])
            });                        
        }

        // *** assign paths back to the associated element 
        destinationPaths.forEach( (dPath, i) => {
            // find relevant element 
            svgElements.forEach((elem, j) => {
                if(elem.id == dPath.id){
                    elem.setAttribute('d', dPath['d']);
                }
            });
        }); 

        console.log(destinationPaths); 
    }

    static toPath(svgElement){
        //return toPath({type: svgElement.tagName, d: svgElement.getAttribute("d")});
        return {type: svgElement.tagName, d: svgElement.getAttribute("d")};        
    }

    static addPoint(dest, src, w){      
        for(var i=0; i<dest.length; i++){
            if(src[i].hasOwnProperty("x")){
                dest[i]['x'] += src[i]['x'] * w; 
            }

            if(src[i].hasOwnProperty("y")){
                dest[i]['y'] += src[i]['y'] * w; 
            }

            if(src[i].hasOwnProperty("curve")){
                for(var curveAttr in src[i]["curve"]){
                    var curveAttrVal = src[i]["curve"][curveAttr];
                    
                    if(curveAttr.indexOf("Flag") == -1 && typeof curveAttrVal === "number" 
                        && dest[i]["curve"].hasOwnProperty(curveAttr)){
                        dest[i]["curve"][curveAttr] += src[i]["curve"][curveAttr] * w;             
                    } 
                }
            }
        }     
        
        return dest; 
    }

    static createPoint(point){
        let clone = {}; 

        for(var attr in point){
           var attrVal = point[attr];                    

           if(typeof attrVal === "number"){
               //clone[attr] = attrVal;
               clone[attr] = 0.0;
           } else if(attr === "curve"){
                clone["curve"] = {};                             

                for(var curveAttr in attrVal){
                    var curveAttrVal = attrVal[curveAttr];

                    if(typeof curveAttr === "string" && curveAttr.indexOf("Flag") != -1){
                        clone["curve"][curveAttr] = curveAttrVal; 
                    } else if(typeof curveAttrVal === "number"){
                        clone["curve"][curveAttr] = 0.0; 
                    } else{
                        clone["curve"][curveAttr] = curveAttrVal; 
                    }                                        
                }
           } else{
                clone[attr] = attrVal;
           }           
        }

        return clone; 
    }

    static cloneObject(obj) {
        if (null == obj || "object" != typeof obj) return obj;

        var copy = obj.constructor();
        
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
        }

        return copy;
    }
}