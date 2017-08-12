var app;

window.onload = () => {
    "use strict";
    app = new App(document.getElementById("container"));
    app.start();
};

class Emotion{
    constructor(emotion='unknown', lEye=null, rEye=null, mouth=null){
        this.emotion = emotion; 
        this.lEye = lEye; 
        this.rEye = rEye;
        this.mouth = mouth;  
    }        
}

class App{
    constructor(container){
        this.container = container; 
        this.emotionalStates = {};
        this.emotionalStateControls = {};
        this.running = false;
        this.width = 0.0; 
        this.height = 0.0; 

        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);

        this.onResize = this.onResize.bind(this);

        this.updateLoop = this.updateLoop.bind(this);
        this.onUpdate = this.onUpdate.bind(this);

        this.faceElements = new Array(); 

        window.addEventListener("resize", () => {
            this.onResize();
        });

        this.svgFiles = [
            "assets/Emotion_Anxiety.svg", 
            "assets/Emotion_Betrayal.svg",
            "assets/Emotion_Despair.svg", 
            "assets/Emotion_Ecstasy.svg", 
            "assets/Emotion_Hatred.svg", 
            "assets/Emotion_Horror.svg", 
            "assets/Emotion_Intrigue.svg", 
            "assets/Emotion_Loathing.svg", 
            "assets/Emotion_Melancholy.svg", 
            "assets/Emotion_Neutral.svg", 
            "assets/Emotion_Revulsion.svg", 
            "assets/Emotion_Righteousness.svg", 
            "assets/Emotion_Shame.svg", 
            "assets/Emotion_Spite.svg", 
            "assets/Emotion_Surprise.svg" 
        ];
        
        this.onResize(); 

        this.loadAssets(() => {         
            let failedEmotions = [];             

            this.initFace("Neutral");

            this.initControls(); 
            
            // Animator.morph(this.faceElements, targets, 1000, () => {

            // });
        });         
    }

    loadAssets(onComplete){   
        Utils.loadSVGs(this.svgFiles)
        .then((results) => {
            
            results.forEach((result, idx) => {
                let name = result['name'];
                let svgString = result['data']; 

                name = name.replace("assets/", "").replace("Emotion_", "").replace(".svg", "");

                let oParser = new DOMParser();
                let oDOM = oParser.parseFromString(svgString, "image/svg+xml");

                let root = oDOM.documentElement;

                let svgElements = this.parseSlackSVGFile(name, svgString); 

                this.emotionalStates[name] = svgElements;                                                  
            });            

            onComplete(); 
        }); 
    }      
    
    initFace(emotion){
        var emotionObj = this.emotionalStates[emotion];

        this.faceElements.push(emotionObj.lEye);
        this.container.appendChild(emotionObj.lEye);

        this.faceElements.push(emotionObj.rEye);
        this.container.appendChild(emotionObj.rEye);

        this.faceElements.push(emotionObj.mouth);
        this.container.appendChild(emotionObj.mouth);
    }

    updateFace(){
        let emotions = []; 
        let total = 0; 
        for(var key in this.emotionalStateControls){
            if(this.emotionalStateControls[key].value <= 0){
                continue; 
            }

            emotions.push({
                'emotion': key, 
                'value': this.emotionalStateControls[key].value
            });

            total += this.emotionalStateControls[key].value;
        }

        if(total > 1){
            total = 1.0; 

            // noramlise 
            for(let i=0; i<emotions.length; i++){
                emotions['value'] = emotions['value']/total; 
            }
        }        

        // sort 
        emotions.sort((a, b) => {
            return b['value'] > a['value'];
        });

        // build up path 
        var lEyeTarget = this.getEmotion("Neutral").lEye.getAttribute("d");
        var rEyeTarget = this.getEmotion("Neutral").rEye.getAttribute("d");
        var mouthTarget = this.getEmotion("Neutral").mouth.getAttribute("d");

        for(let i=0; i<emotions.length; i++){
            var lEyeVal = this.getEmotion(emotions[i]["emotion"]).lEye.getAttribute("d");
            var rEyeVal = this.getEmotion(emotions[i]["emotion"]).rEye.getAttribute("d");
            var mouthVal = this.getEmotion(emotions[i]["emotion"]).mouth.getAttribute("d");

            var interpolator = flubber.interpolate(lEyeTarget, lEyeVal);
            lEyeTarget = interpolator(emotions[i]["value"]);            

            interpolator = flubber.interpolate(rEyeTarget, rEyeVal);
            rEyeTarget = interpolator(emotions[i]["value"]);            

            interpolator = flubber.interpolate(mouthTarget, mouthVal);
            mouthTarget = interpolator(emotions[i]["value"]);            
        }
        
        this.leftEye.setAttribute("d", lEyeTarget);
        this.rightEye.setAttribute("d", rEyeTarget);
        this.mouth.setAttribute("d", mouthTarget);
    }

    initControls(){
        let ctrlContainer = document.getElementById("ui_container");
        for(let key in this.emotionalStates){
            let emotion = this.emotionalStates[key];
            if(emotion.emotion == "Neutral"){
                continue; 
            }
            
            // create div 
            let div = document.createElement("div");
            //div.style = "float: left;";
            div.innerHTML = key; 

            // create slider 
            var slider = document.createElement("INPUT");
            slider.setAttribute("type", "range"); 
            slider.id = key;
            slider.min = 0.0; 
            slider.max = 1.0; 
            slider.step = 0.1; 
            slider.value = 0.0;
            slider.onchange = () => {
                this.onEmotionalSliderChanged(); 
            };
            slider.oninput = () => {
                this.onEmotionalSliderChanged(); 
            };
            this.emotionalStateControls[key] = slider; 
            div.appendChild(slider); 
            ctrlContainer.appendChild(div);        
        }
    }

    onEmotionalSliderChanged(){
        this.updateFace(); 
    }

    get leftEye(){
        return this.container.getElementById("eye_l");
    }

    get rightEye(){
        return this.container.getElementById("eye_r");
    }

    get mouth(){
        return this.container.getElementById("mouth");
    }

    getEmotion(emotion){
        if(emotion in this.emotionalStates){
            return this.emotionalStates[emotion]; 
        }

        throw Error(emotion + " doesn't exist"); 
    }

    parseSlackSVGFile(emotion, svgString){    

        let oParser = new DOMParser();
        let oDOM = oParser.parseFromString(svgString, "image/svg+xml");
        let svgRoot = oDOM.documentElement;

        const styleAttributes = [
            'stroke', 'stroke-width', 'fill', 'fill-rule'
        ];
        
        let gElems = svgRoot.getElementsByTagName("g");

        let globalStyles = {};
                
        for(var gIdx=0; gIdx < gElems.length; gIdx++){
            styleAttributes.forEach((attr) => {
                if(gElems[gIdx].hasAttribute(attr)){
                    globalStyles[attr] = gElems[gIdx].getAttribute(attr);
                }
            });            
        }

        let lEye = svgRoot.getElementById("eye_l"); 
        let rEye = svgRoot.getElementById("eye_r"); 
        let mouth = svgRoot.getElementById("mouth"); 
        
        if(lEye.tagName === "circle"){
            lEye = this.convertCircleToPath(lEye);
        } else if(lEye.tagName === "ellipse"){
            lEye = this.convertEllipseToPath(lEye);
        }

        if(rEye.tagName === "circle"){
            rEye = this.convertCircleToPath(rEye);
        } else if(rEye.tagName === "ellipse"){
            rEye = this.convertEllipseToPath(rEye);
        }

        for(let key in globalStyles){
            if(!lEye.hasAttribute(key)){
                lEye.setAttribute(key, globalStyles[key]);
            }
            if(!rEye.hasAttribute(key)){
                rEye.setAttribute(key, globalStyles[key]);
            }
            if(!mouth.hasAttribute(key)){
                mouth.setAttribute(key, globalStyles[key]);
            }
        }

        if(lEye.tagName !== "path"){
            lEye = flatten(lEye, false, true, false);
        }

        if(rEye.tagName !== "path"){
            rEye = flatten(rEye, false, true, false);
        }

        if(mouth.tagName !== "path"){
            mouth = flatten(mouth, false, true, false);
        }

        return new Emotion(
            emotion, 
            lEye, 
            rEye, 
            mouth); 
    }

    convertCircleToPath(elem){
        let r = parseFloat(elem.getAttribute('r'));
        let cx = parseFloat(elem.getAttribute('cx'));
        let cy = parseFloat(elem.getAttribute('cy')); 

        let rx = r; 
        let ry = r; 

        let path = document.createElementNS('http://www.w3.org/2000/svg',"path"); 

        var d = "M" + (cx-rx).toString() + "," + cy.toString();
        d += "a" + rx.toString() + "," + ry.toString() + " 0 1,0 " + (2 * rx).toString() + ",0";
        d += "a" + rx.toString() + "," + ry.toString() + " 0 1,0 " + (-2 * rx).toString() + ",0";
        
        path.setAttributeNS(null, "d", d); 

        path = Utils.copyAttributes(elem, path);

        return path; 
    }
    
    convertEllipseToPath(elem){
        let rx = parseFloat(elem.getAttribute('rx'));
        let ry = parseFloat(elem.getAttribute('ry'));
        let cx = parseFloat(elem.getAttribute('cx'));
        let cy = parseFloat(elem.getAttribute('cy')); 

        let path = document.createElementNS('http://www.w3.org/2000/svg',"path"); 

        var d = "M" + (cx-rx).toString() + "," + cy.toString();
        d += "a" + rx.toString() + "," + ry.toString() + " 0 1,0 " + (2 * rx).toString() + ",0";
        d += "a" + rx.toString() + "," + ry.toString() + " 0 1,0 " + (-2 * rx).toString() + ",0";
        
        path.setAttributeNS(null, "d", d); 

        path = Utils.copyAttributes(elem, path);

        return path; 
    }

    parseStyle(styleHTML){
        const PARSING_NAME = 0; 
        const PARSING_STYLE = 1;  
        let parsing = PARSING_NAME; 

        let stylesChars = styleHTML.split('');

        let stylesDict = {}; 
        let tmpClsName = "";
        let tmpStyle = "";

        for(var cIdx =0; cIdx<stylesChars.length; cIdx++){
            let c = stylesChars[cIdx];

            if(parsing === PARSING_NAME){
                if(c === '{'){
                    tmpClsName = tmpClsName.replace(".", "");
                    stylesDict[tmpClsName] = ""; 
                    parsing = PARSING_STYLE; 
                } else{
                    tmpClsName += c; 
                }
            }
            else if(parsing === PARSING_STYLE){
                if(c === '}'){
                    stylesDict[tmpClsName] = tmpStyle; 
                    tmpClsName = ""; 
                    tmpStyle = ""; 

                    parsing = PARSING_NAME; 
                } else{
                    tmpStyle += c; 
                }
            }             
        }

        return stylesDict; 
    }

    start(){
        if(this.running){
            return;
        }
        this.running = true;
        window.requestAnimationFrame(this.updateLoop);
    }

    stop(){
        this.running = false;
    }

    updateLoop(timestamp){

        this.onUpdate(timestamp);

        if(this.running){
            window.requestAnimationFrame(this.updateLoop);
        }
    }

    onUpdate(timestamp){

    }

    onResize(){
        this.width  = document.width || document.body.clientWidth;
        this.height = document.height || document.body.clientHeight;
    }

}