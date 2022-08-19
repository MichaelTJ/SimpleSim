class Zone extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, width, height, sprite){
        super(scene, x, y,sprite);
        this.alpha = 0.5;
        this.displayWidth = width;
        this.displayHeight = height;
        globalScene.add.existing(this);
        this.isPickupable = false;
        this.isReservedBy = false;
        this.parent = "";
        this.subZones = [];
        this.owner = '';
        this.createSubZones();
        //collectionZones.add(globalScene.physics.add.existing(this));
    }
    //create array of subZonesSpots
    createSubZones(){
        this.subZones = [];
        //2D array of 14px boxes
        for(var i=0;i<(this.displayWidth);i+=14){
            this.subZones.push([]);
            for(var j=0;j<(this.displayHeight);j+=14){
                let [x,y] = this.convertIJToXY(i/14,j/14);
                this.subZones[i/14].push(
                    new SubZone(globalScene,
                        x,y,
                        i,j,this));
            }
        }
    }
    //returns the drop location
    getDropSpot(myObject){
        //2D array of 14px boxes
        for(var i=0;i<this.subZones.length;i++){
            for(var j=0;j<this.subZones[i].length;j++){
                if(this.subZones[i][j].canDrop(myObject)){
                    return this.subZones[i][j];
                }
            }
        }
        return null;
    }
    //gets the needs of each dropSpot as a job
    //[object, verb, dropspot]
    getNeeds(){
        let needsAsJobs = []
        for(var i=0;i<this.subZones.length;i++){
            for(var j=0;j<this.subZones[i].length;j++){
                let tempNeed = this.subZones[i][j].hasNeed();
                if(tempNeed){
                    needsAsJobs.push(tempNeed)
                }
            }
        }
        return needsAsJobs;
    }
    isFull(){
        for(var i=0;i<this.subZones.length;i++){
            for(var j=0;j<this.subZones[i].length;j++){
                if(this.subZones[i][j].isEmpty()){
                    return false;
                }
            }
        }
        return true;
    }
    convertXYToIJ(dropSpot){
        var i = (dropSpot.x -(this.x-this.displayWidth/2+7))/14;
        var j = (dropSpot.y -(this.y-this.displayHeight/2+7))/14;
        return [i,j]
    }
    convertIJToXY(i,j){
        var x = i*14+this.x-this.displayWidth/2+7;
        var y = j*14+this.y-this.displayHeight/2+7;
        return [x,y];
    }
    setOwner(id){
        //console.log(id);
        if(!this.owner){
            this.owner = id;
            //players are id'd starting from 1 to avoid falsey 0
            players.getChildren()[id-1].propertyZones.push(this);
        }
    }
    
}
class SubZone extends Zone{
    constructor(scene, x, y, i, j, parent){
        super(scene, x, y, 0,0,'collectionZone');
        this.i = i;
        this.j = j;
        //overwrite super createInventory
        this.inventory = [];
        this.parent = parent;
        this.plan = [];
        this.invPlan = {};
        this.isFulfilled = false;
        this.fenceReq = [];
        this.fences = [];
    }

    isEmpty(){
        if(this.inventory.length==0){return true;}
        else{return false;}
    }

    getXY(){
        return [this.x,this.y];
    }
    hasNeed(){
        //check fences first
        let nextFenceType = this.getNextFenceType();
        if(typeof nextFenceType == 'number'){
            //if it's empty drop wood
            //TODO: change so '2' matches requirements instead
            if(this.getTypeOccurrence(this.inventory,'Wood')<2){
                return ['Wood','find,pickup,dropoff',this];
            }
            else{
                return [this.inventory,'construct,Fence',this];
            }
        }
        //TODO: refactor this into objects
        //  started in next if-statement {any}.length=0 
        if(this.invPlan.job){
            if(this.inventory.length==0){
                this.invPlan = {};
            }
            else{
                if(this.invPlan.job=="interact"){
                    if(this.invPlan.type=='Plant'){
                        return [this.inventory[0],'plant',this];
                    }
                    else if(this.invPlan.type=='mining'){
                        return false;
                        //TODO: next
                        /*
                        return {gameObj:this.inventory[0],
                        type:'mining',
                        subZone:this}*/
                    }
                }
                else if(this.invPlan.job=='destroy'){
                    return [this.inventory[0],'Destroy',this];
                }
            }
        }
        if(this.plan.job){

            if(this.plan.job=='getObj'){
                //if it's empty drop seed
                if(this.inventory.length==0){
                    return [this.plan.type,'find,pickup,dropoff',this];
                }
                else if(this.inventory[0].constructor.name==this.plan.type){
                    if(this.plan.planOnComplete=='checkObj'){
                        this.invPlan=this.inventory[0].getPlan();

                    }
                }
                //else if need multiple
                //else destroy stuff
            }
            else if(this.plan.job=='construct'){
                let itemReqs = [];
                //TODO Wet (from player) 
                //Make constructableReqs dictionary instead
                constructableReqs.some(item => {
                    if(item.name==this.plan.type){
                        itemReqs=item.reqs;
                        return true;
                    }
                });
                let inventoryCopy = [...this.inventory];
                let removed = []
                //for each material
                for(let i=0;i<itemReqs.length;i++){
                    //first item is count, second is material constructor name
                    for(let j=0;j<itemReqs[i][0];j++){
                        let hasMaterial = false;
                        //Go through each item in inventory for matching materials
                        for(let k=0;k<inventoryCopy.length;k++){
                            if(inventoryCopy[k].constructor.name==itemReqs[i][1]){
                                //console.log(inventoryCopy[k].constructor.name, tempFence[i][1])
                                let removedElem = inventoryCopy.splice(k,1);
                                removed.push(removedElem[0]);
                                hasMaterial = true;
                                break;
                            }
                        }
                        if(!hasMaterial){
                            return [itemReqs[i][1],'find,pickup,dropoff',this];
                        }
                    }
                    return [this.inventory,'construct,'+this.plan.type,this];
                
                }
            }
        }
        return false;
    }
    canDrop(myObject){
        if(this.plan.job){
            if(this.plan.job=='store'){
                return this.checkCollect(myObject);
            }
        }
        else{
            //If there's no plan, make it a collection spot
            this.plan={job:'collect',type:myObject.constructor.name};
            return this.checkCollect(myObject);
            /*
            if(this.checkCollect(myObject)){
                return true;
            }
            else{
                this.plan = [];
                return false;
            }*/
        }
        
    }
    checkCollect(myObject){
        //assumed plan.length>0
        //if it has a plan but doesn't match the object
        if(this.plan[0]==true && this.plan[0]!=myObject.constructor.name){return false;}
        if(this.inventory.length==0){
            //if it has been reserved and it wasn't reserved by this object type
            if(this.isReservedBy==true && this.isReservedBy.constructor.name!=myObject.constructor.name){
                return false;
            }
            return true;
        }
        else if(this.inventory.length>=64){
            return false;
        }
        else{
            // the name doesn't match
            if(this.inventory[0].constructor.name != myObject.constructor.name){
                return false;
            }
            //or the name matches and it's not stackable
            else if(!myObject.isStackable){
                return false;
            }
            return true;
        }

    }
    drop(dropable, dropSpot){
        this.inventory.push(dropable);
        dropable.x = dropSpot.x;
        dropable.y = dropSpot.y;
        
        dropable.parent = this;
        dropable.isPickupable = true;
        dropable.isReservedBy = "";
        dropable.setVisible(true);
        dropable.alpha = 1;
        this.updatePlan();
    }
    updatePlan(invPlan={}){
        if(this.plan.job=='getObj'){
            //check if I've gotten the obj
            if(this.inventory.length>0){
                //if plant seed check it
                if(this.inventory[0].constructor.name==this.plan.type){
                    if(this.plan.planOnComplete=='checkObj'){
                        this.invPlan=this.inventory[0].getPlan();
                    }
                }
            }
        }
        if(invPlan!={}){
            this.invPlan=invPlan;
        }
    }
    getNextFenceType(){
        for(let i=0;i<this.fenceReq.length;i++){
            let hasMatch = false;
            for(let j=0;j<this.fences.length;j++){
                if(this.fences[j].type==this.fenceReq[i]){
                    hasMatch=true
                    break;
                }
            }
            if(!hasMatch){
                return this.fenceReq[i];
            }
        }
        return null;
    }
    
    addConstructable(type){
        
        if(type=='Fence'){
            this.addFence();
        }
        else{
            let newConstruct = {};
            constructableReqs.some(item => {
                if(item.name==type){
                    newConstruct = item.class(globalScene,
                            this.x,
                            this.y,
                            '',
                            this.owner);
                }
            })
            this.inventory.push(newConstruct);
            this.invPlan = newConstruct.getNeed();
        }
    }
    addFence(){
        let nextFenceType = this.getNextFenceType();
        if(nextFenceType==null){return null;}
        let nF = undefined;
        //0 for top, 1 for right, 2 bot, 3 left
        if(nextFenceType === 0){
            nF = new Fence(globalScene,this.x, this.y-7, 'fenceH',this.owner);
            nF.type = 0;
        }
        else if(nextFenceType === 1){
            nF = new Fence(globalScene,this.x+7, this.y, 'fenceV',this.owner);
            nF.type = 1;
        }
        else if(nextFenceType === 2){
            nF = new Fence(globalScene,this.x, this.y+7, 'fenceH',this.owner);
            nF.type = 2;
        }
        else if(nextFenceType === 3){
            nF = new Fence(globalScene,this.x-7, this.y, 'fenceV',this.owner);
            nF.type = 3;
        }
        this.fences.push(nF);
        this.inventory.push(nF);
    }
    getTypeOccurrence(array, value) {
        let count = 0;
        array.forEach((v) => (v.constructor.name === value && count++));
        return count;
    }
    
}

var collectionZones;
class CollectionZone extends Zone{
    constructor(scene, x, y, width, height){
        super(scene, x, y, width, height,'collectionZone');
        collectionZones.add(globalScene.physics.add.existing(this));
        this.createPlan();
    }
    createPlan(){
        this.hasPlan = true;
        for(var i=0;i<this.subZones.length;i++){
            for(var j=0;j<this.subZones[i].length;j++){
                //collect anything
                this.subZones[i][j].plan = {job:'store', type:null};
            }
        }
    }
}


var propertyZones;
class PropertyZone extends Zone{
    constructor(scene, x, y, width, height,id,weightings={}){
        super(scene, x, y, width, height,'collectionZone',id);
        this.setOwner(id);
        //this.createPlan(id);
        this.hasPlan = false;
        propertyZones.add(globalScene.physics.add.existing(this));
        this.createPlan(id,weightings);
    }
    //create the layout for the property
    createPlan(id,weightings){
        if('mining' in weightings){
            //TODO check size of PropertyZone
            this.subZones[0][0].plan = 
            {job:'construct',type:"MineShaft"};
            
        }
        else{
            for(var i=0;i<this.subZones.length;i++){
                for(var j=0;j<this.subZones[i].length;j++){
                    //bottom row is collection.
                    if(j==this.subZones[i].length-1){
                        this.subZones[i][j].plan = {job:'store',
                        type:null}//['', "collect"]
                    }
                    else if(i==1 && j==1){
                        this.subZones[i][j].plan = 
                        {job:'getObj', 
                        type:'Seed',
                        planOnComplete:''}
                        //['Seed', 'Grow0'];
                    }
                    else if(i%4==0 && j%4==0){
                        this.subZones[i][j].plan = 
                        {job:'getObj', 
                        type:'Seed',
                        planOnComplete:'checkObj'}
                        //['Seed', 'Grow1'];
                    }
                    else if(i%2==0 && j%2==0){
                        this.subZones[i][j].plan = 
                        {job:'getObj', 
                        type:'Seed',
                        planOnComplete:'checkObj'}
                    }
                    else{
                        this.subZones[i][j].plan = 
                        {job:'getObj', 
                        type:'Seed',
                        planOnComplete:'checkObj'}
                    }
                }
            }
        }
        this.hasPlan = true;
    }

}

class FencedZone extends Zone{
    constructor(scene, x, y, width, height,id){
        super(scene, x, y, width, height,'collectionZone',id);
        this.setOwner(id);
        this.hasPlan = '';
        propertyZones.add(globalScene.physics.add.existing(this));
        this.createPlan(id);
    }
    //create the layout for the property
    createPlan(id){
        this.hasPlan = true;
        for(var i=0;i<this.subZones.length;i++){
            for(var j=0;j<this.subZones[i].length;j++){
                //bottom row is collection.
                if(j==this.subZones[i].length-1){
                    this.subZones[i][j].plan = ['', "collect"];
                    this.subZones[i][j].fenceReq.push(2);
                }
                
                if(j==0){
                    this.subZones[i][j].fenceReq.push(0);
                }
                if(i==0){
                    //keep a gap open
                    if(j!=0){
                        this.subZones[i][j].fenceReq.push(3);
                    }
                }
                if(i==this.subZones.length-1){
                    this.subZones[i][j].fenceReq.push(1);
                }
            }
        }
    }
}




