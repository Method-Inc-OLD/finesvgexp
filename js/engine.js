
class Engine{
    constructor(canvas){
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.fullscreen = false;

        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);

        this.onResize = this.onResize.bind(this);

        this.clear = this.clear.bind(this);
        this.present = this.present.bind(this);

        this.gameLoop = this.gameLoop.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
        this.onDraw = this.onDraw.bind(this);

        window.addEventListener("resize", () => {
            this.onResize();
        });

        this.loadSVG(); 

        this.running = false;
    }

    loadSVG(){
        let svgFiles = [
            "assets/Emotion_Anxiety.svg", 
            "assets/Emotion_Anxiety.svg", 
        ];
        Utils.loadSVG("assets/Emotion_Anxiety.svg")
        .then((res) => {
            console.log(res); 
        }); 
    }

    start(){
        if(this.running){
            return;
        }
        this.running = true;
        window.requestAnimationFrame(this.gameLoop);
    }

    stop(){
        this.running = false;
    }

    gameLoop(timestamp){

        this.onUpdate(timestamp);
        this.onDraw();

        if(this.running){
            window.requestAnimationFrame(this.gameLoop);
        }
    }

    onUpdate(timestamp){

    }

    clear(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.backbuffer = this.ctx.getImageData(0, 0, this.width, this.height);
    }

    present(){
        
    }

    onDraw(){
        this.clear();

        this.present();
    }

    onResize(){
        if(this.fullscreen){
            this.canvas.width  = document.width || document.body.clientWidth;
            this.canvas.height = document.height || document.body.clientHeight;
        }
    }
}