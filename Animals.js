class Animal extends MyGameObjects{
    constructor(scene, x, y, sprite, owner=''){
        super(scene, x, y, sprite, owner);
        this.spawnOnKilled = ['meat'];
        this.isTame = false;
        this.curActionFunctions = []

        animals.add(globalScene.physics.add.existing(this));
    }
    chooseAction (){
        this.addToActions("Lapping",() => this.doLaps());
        this.curActionFunctions[0]();
    }
    //Action function
    addToActions(label, fn, index=null){
        if(index==null){
            //this.curActions.push(label);
            this.curActionFunctions.push(fn);
        }
        else{
            //this.curActions.splice(index, 0, label);
            this.curActionFunctions.splice(index, 0, fn);
        }
    }
    //Action function
    finishedAction(){
        //this.curActions.shift();
        this.curActionFunctions.shift();
        if(this.curActionFunctions.length>0){
            this.curActionFunctions[0]();
        }
    }
    //Job
    idle (){
        //get a point that is 30-50 units away
        let target = new Phaser.Math.Vector2();
        target.x = this.x + Phaser.Math.Between(-50,50);
        target.y = this.y + Phaser.Math.Between(-50,50);
        let speed = 20;

        this.addToActions("Idling ", () => this.moveToObject(target, speed),1);
        this.finishedAction();
    }
    //Job
    doLaps(){
        
        let target = new Phaser.Math.Vector2();
        if(this.x<400){
            target.x = 700;
            target.y = 300;
        }
        if(this.x>400){
            target.x = 100;
            target.y = 300;
        }
        let speed = 300;

        this.addToActions("Path to Object", () => this.pathToObject(target, speed),1);
        
        this.finishedAction();
        
    }

    pathToObject(target, speed=this.defaultSpeed){
        let path = Pathing.getPath(this,target);
        
        //reverse path is given (that's how it is created)
        //path re-reverses as it is added
        for(let i=0;i<path.length;i++){
            this.addToActions("Travelling ", () => this.moveToObject(path[i], speed),1);
        }
        this.finishedAction();
    }
    
    //Function
    //target needs .x and .y properties. Vector2 works
    moveToObject (target, speed = this.defaultSpeed){
        globalScene.physics.moveToObject(this, target, speed);
        //need to set target 
        let newTarget = globalScene.physics.add.sprite(target.x, target.y, "");
        //make invisible.
        newTarget.setScale(0.2);
        let collider = globalScene.physics.add.overlap(this, newTarget, function (player)
        {
            ////console.log(collider);
            if(this!=player){
                //wrong player/animal
                return;
            }
            player.body.stop();
            newTarget.destroy();
            ////console.log(player.id+this.curActions);
            this.finishedAction();
            globalScene.physics.world.removeCollider(collider);

        }, null, this);
    }


    
}

class Cow extends Animal{
    constructor(scene, x, y, sprite, owner=''){
        super(scene, x, y, sprite, owner);
        //woods.add(globalScene.physics.add.existing(this));
    }
}