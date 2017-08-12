
class Utils{

    static loadSVG(uri){
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();

            var xhr = new XMLHttpRequest();
            xhr.overrideMimeType('mage/svg+xml');
            xhr.open("GET", uri, true);            
            xhr.onload = function () {
                if (this.status >= 200 && this.status < 300) {
                    resolve({
                        "name": uri, 
                        "data": xhr.response
                    });
                } else {
                    reject({
                        status: this.status,
                        statusText: xhr.statusText
                    });
                }
            };
            xhr.onerror = function () {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            };
            xhr.send();
        });
    }
    
    static loadSVGs(uris){
        let promises = new Array(); 

        for(let i=0; i<uris.length; i++){
            promises.push(Utils.loadSVG(uris[i]));
        }
        
        return Promise.all(promises);
    }

    static copyAttributes(source, dest){
        let excludedAttributes = [
            'r', 'd', 'rx', 'ry', 'cx', 'cy'
        ];
        for (var i = 0; i < source.attributes.length; i++) {
            var attrib = source.attributes[i];
            
            if(excludedAttributes.indexOf(attrib.name) > 0){
                continue; 
            }
          
            dest.setAttribute(attrib.name, attrib.value);
        }

        return dest; 
    }
}