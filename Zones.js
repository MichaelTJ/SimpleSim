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
        this.inventory = [];
        this.owner = '';
        this.createInventory();
        //collectionZones.add(globalScene.physics.add.existing(this));
    }
    //create array of inventorySpots
    createInventory(){
        this.inventory = [];
        //2D array of 14px boxes
        for(var i=0;i<(this.displayWidth);i+=14){
            this.inventory.push([]);
            for(var j=0;j<(this.displayHeight);j+=14){
                let [x,y] = this.convertIJToXY(i/14,j/14);
                this.inventory[i/14].push(
                    new InventorySpot(globalScene,
                        x,y,
                        i,j,this));
            }
        }
    }
    //returns the drop location
    getDropSpot(myObject){
        //2D array of 14px boxes
        for(var i=0;i<this.inventory.length;i++){
            for(var j=0;j<this.inventory[i].length;j++){
                if(this.inventory[i][j].canDrop(myObject)){
                    return this.inventory[i][j];
                }
            }
        }
        return null;
    }
    //gets the needs of each dropSpot as a job
    //[object, verb, dropspot]
    getNeeds(){
        let needsAsJobs = []
        for(var i=0;i<this.inventory.length;i++){
            for(var j=0;j<this.inventory[i].length;j++){
                let tempNeed = this.inventory[i][j].hasNeed();
                if(tempNeed){
                    needsAsJobs.push(tempNeed)
                }
            }
        }
        return needsAsJobs;
    }
    isFull(){
        for(var i=0;i<this.inventory.length;i++){
            for(var j=0;j<this.inventory[i].length;j++){
                if(this.inventory[i][j].isEmpty()){
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
    createDummy(name){
        var object = {};
        object.constructor = {}
        object.constructor.name = name;
        return object;
    }
    setOwner(id){
        //console.log(id);
        if(!this.owner){
            this.owner = id;
            players.getChildren()[id-1].propertyZones.push(this);
        }
    }
    
}
class InventorySpot extends Zone{
    constructor(scene, x, y, i, j, parent){
        super(scene, x, y, 0,0,'collectionZone');
        this.i = i;
        this.j = j;
        //overwrite super createInventory
        this.inventory = [];
        this.parent = parent;
        this.plan = [];
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
            if(this.getTypeOccurrence(this.inventory,'Wood')<2){
                return ['Wood','find,pickup,dropoff',this];
            }
            else{
                return [this.inventory,'construct,Fence',this];
            }
        }
        if(this.owner==3){
            console.log('asdf');
        }
        if(this.plan.length>0){
            
            if(this.plan[1]=='Grow1'){
                //if it's empty drop seed
                if(this.inventory.length==0){
                    return [this.plan[0],'find,pickup,dropoff',this];
                }
                //if it has a seed, plant it
                if(this.inventory[0].constructor.name=='Seed'){
                    if(!this.inventory[0].isPlanted){
                        return [this.inventory[0],'plant',this];
                    }
                }
                if(this.inventory[0].constructor.name=='Tree'){
                    return [this.inventory[0],'Destroy',this];
                }
                
            }
            else if(this.plan[1]=='Grow0'){
                //if it's empty drop seed
                if(this.inventory.length==0){
                    return [this.plan[0],'find,pickup,dropoff',this];
                }
                //if it has a seed, plant it
                if(this.inventory[0].constructor.name=='Seed'){
                    if(!this.inventory[0].isPlanted){
                        return [this.inventory[0],'plant',this];
                    }
                }

            }
            //else if(this.plan[1]==)
        }
        else if(this.plan.constructable){
            let itemReqs = [];
            //TODO Wet (from player) 
            //Make constructableReqs dictionary instead
            constructableReqs.some(item => {
                if(item.name==this.plan.constructable){
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
                        return ['Wood','find,pickup,dropoff',this];
                    }
                }
                return [this.inventory,'construct,'+this.plan.constructable,this];
            
            }
        }
        return false;
    }

    canDrop(myObject){
        if(this.plan.length>0){
            if(this.plan[1]=='collect'){
                return this.checkCollect(myObject);
            }
        }
        else{
            //If there's no plan, make it a collection spot
            this.plan=[myObject.constructor.name,'collect'];
            if(this.checkCollect(myObject)){
                return true;
            }
            else{
                this.plan = [];
                return false;
            }
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
        //dropable.parent = this.parent;
        dropable.isPickupable = true;
        dropable.isReservedBy = "";
        dropable.setVisible(true);
        dropable.alpha = 1;
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
            constructableReqs.some(item => {
                if(item.name==type){
                    
                    item.class(globalScene,
                        this.x,
                        this.y,
                        '',
                        this.owner);
                }
            })
            this.hasPlan = false;
            this.plan = {};
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
        for(var i=0;i<this.inventory.length;i++){
            for(var j=0;j<this.inventory[i].length;j++){
                //collect anything
                this.inventory[i][j].plan = ['', 'collect'];
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
            this.inventory[0][0].plan.constructable = "MineShaft";
        }
        else{
            for(var i=0;i<this.inventory.length;i++){
                for(var j=0;j<this.inventory[i].length;j++){
                    //bottom row is collection.
                    if(j==this.inventory[i].length-1){
                        this.inventory[i][j].plan = ['', "collect"]
                    }
                    else if(i==1 && j==1){
                        this.inventory[i][j].plan = ['Seed', 'Grow0'];
                    }
                    else if(i%4==0 && j%4==0){
                        this.inventory[i][j].plan = ['Seed', 'Grow1'];
                    }
                    else if(i%2==0 && j%2==0){
                        this.inventory[i][j].plan = ['Seed', 'Grow1'];
                    }
                    else{
                        this.inventory[i][j].plan = ['Seed', 'Grow1'];
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
        for(var i=0;i<this.inventory.length;i++){
            for(var j=0;j<this.inventory[i].length;j++){
                //bottom row is collection.
                if(j==this.inventory[i].length-1){
                    this.inventory[i][j].plan = ['', "collect"];
                    this.inventory[i][j].fenceReq.push(2);
                }
                
                if(j==0){
                    this.inventory[i][j].fenceReq.push(0);
                }
                if(i==0){
                    //keep a gap open
                    if(j!=0){
                        this.inventory[i][j].fenceReq.push(3);
                    }
                }
                if(i==this.inventory.length-1){
                    this.inventory[i][j].fenceReq.push(1);
                }
            }
        }
    }
}




