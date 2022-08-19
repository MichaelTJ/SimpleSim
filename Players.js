class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, id) {
        super(scene, x, y, "ball");
        globalScene.add.existing(this);
        this.defaultSpeed = 200;
        this.z = 1;
        this.curActions = [];
        this.hunger = 50;
        this.hungerRate = 0.1;
        this.id = id;
        this.followText = globalScene.add.text(0, 0, id);
        this.curActionFunctions = [];
        players.add(globalScene.physics.add.existing(this));
        this.reservedInventory = [];
        this.inventory = [];
        this.propertyZones = [];
        this.isfirs = false;
        this.dodgeyJobTimer;
        this.setupDodgeyTimer();
    }
    setupDodgeyTimer(){
        this.dodgeyJobTimer = globalScene.time.addEvent({ 
                delay: 10000, 
                callback: this.clearJobs, 
                callbackScope: this});
    }
    //setCallbacks to choose next action
    chooseAction (){
        /*
        if(this.isfirs){
            this.addToActions("Idling",() => this.idle());
            this.addToActions("Idling",() => this.idle());
            this.isfirs = false;
            this.curActionFunctions[0]();
            return;
        }*/
        
        this.checkPersonalJobs();
        if(this.curActionFunctions.length==0){
            this.checkGlobalJobs(); 
            if(this.curActionFunctions.length==0){
                this.addToActions("Idling",() => this.idle());
            }
        }
        
        if(this.dodgeyJobTimer){this.dodgeyJobTimer.remove();}
        this.dodgeyJobTimer.reset({
            delay: 10000,                // ms
            callback: this.clearJobs,
            callbackScope: this
        })
        globalScene.time.addEvent(this.dodgeyJobTimer);
        //do the first job on the list
        this.curActionFunctions[0]();
    }
    clearJobs(){
        
        this.curActionFunctions = [];
        this.curActions = [];
    }
    checkPersonalJobs(){
        let personalJobs = [];
        let thisID = this.id;
        
        let overlappingObjects = globalScene.physics.add.group();
        //get items by property
        for(let i=0;i<this.propertyZones.length;i++){
            let curPropZone = propertyZones.getChildren()[i];
            let extraBoundary= 14;
            let selected = globalScene.physics.overlapRect(
                curPropZone.x-(curPropZone.displayWidth/2)-extraBoundary,
                curPropZone.y-(curPropZone.displayHeight/2)-extraBoundary, 
                curPropZone.displayWidth+2*extraBoundary,
                curPropZone.displayHeight+2*extraBoundary);
            //convert to physics group for functions
            for(let i=0;i<selected.length;i++){
                //things aren't being destroyed properly
                //destroying trees leaves arcanesprite
                //probably due to the overlapping Objects physics group
                //globaljobs doesn't have this problem, only personalJobs
                if(selected[i].gameObject.active){
                    if(selected[i].gameObject.constructor.name != 'Player' &&
                    selected[i].gameObject.constructor.name != 'Animal'){
                        overlappingObjects.add(
                            selected[i].gameObject
                        );
                    }
                }
            }
        }
        personalJobs.push(...this.checkPickupables([overlappingObjects]));
        personalJobs.push(...this.checkDestroyables([overlappingObjects]));
        personalJobs.push(...this.checkDroppables([propertyZones]));
        personalJobs.push(...this.checkZoneNeeds([propertyZones]));
        
        overlappingObjects.destroy();
        
        //globalJobs array items = [object, jobtype (string)]
        //TODO: heuristic to choose best Job/s
        //filter out 'find' jobs that don't have a matching object
        //TODO Double check
        for(let i=personalJobs.length-1;i>=0;i--){
            if(personalJobs[i][1].split(",")[0]=="find"){
                if(!this.findObject(personalJobs[i][0])){
                    personalJobs.splice(i, 1);
                }
            }
        }
        if(personalJobs.length>0){
            //For now just do a random job
            let randJob = Phaser.Math.Between(0,personalJobs.length-1);
            this.doJob(personalJobs[randJob]);
        }
        


    }
    checkGlobalJobs(){
        
        let globalJobs = [];
        //super wierd - iterate below can't see 'this'
        //but it can see it when i create thisID
        let thisID = this.id;

        globalJobs.push(...this.checkPickupables([seeds, woods]));
        globalJobs.push(...this.checkDestroyables([trees]));
        globalJobs.push(...this.checkDroppables([collectionZones]));

        //choose global jobs
        if(globalJobs.length>0){
            //globalJobs array items = [object, jobtype (string)]
            //TODO: heuristic to choose best Job/s
            
            //For now just do a random job
            let randJob = Phaser.Math.Between(0,globalJobs.length-1);

            this.doJob(globalJobs[randJob]);
        }
    }

    doJob(jobArray){

        //console.log(globalJobs);
        if(jobArray[1] == "Pickup"){
            jobArray[0].isReservedBy = this.id;
            this.addToActions("Picking up "+jobArray[0].constructor.name, 
                () => this.pickupObject(jobArray[0]));
        }
        else if(jobArray[1] == "Destroy"){
            jobArray[0].isReservedBy = this.id;
            this.addToActions("Destroying "+jobArray[0].constructor.name, 
                () => this.destroyObject(jobArray[0]));
        }
        else if(jobArray[1] == "Dropoff"){
            //reserve the dropspot by object
            jobArray[2].isReservedBy = jobArray[0];
            //reserve the inventory item
            jobArray[0].isReservedBy = this.id;
            this.addToActions("Dropping off "+jobArray[0].constructor.name, 
                () => this.dropoffObject(jobArray[0], jobArray[2]));
        }
        else if(jobArray[1] == "find,pickup,dropoff"){
            
            let myObject = this.findObject(jobArray[0]);
            //console.log(myObject);asdf
            if(!myObject){return;}
            myObject.isReservedBy = this.id;
            //reserve the dropspot by object
            jobArray[2].isReservedBy = myObject;
            jobArray[2].isFulfilled = true;
            this.addToActions("Picking up "+myObject.constructor.name, 
                () => this.pickupObject(myObject));
            this.addToActions("Dropping off "+myObject.constructor.name, 
                () => this.dropoffObject(myObject, jobArray[2]));
        }
        else if(jobArray[1] == 'plant'){
            jobArray[0].isReservedBy = this.id;
            this.addToActions("Planting "+jobArray[0].constructor.name, 
                () => this.plantObject(jobArray[0]));
        }
        else if(jobArray[1].split(",")[0] == "construct"){
            let constructArray = jobArray[1].split(",");
            if(constructArray[1]== "Fence"){
                this.addToActions("Constructing " + constructArray[1], 
                () => this.constructObject(constructArray[1], jobArray[2]));
            }
            else{
                this.addToActions("Constructing " + constructArray[1], 
                () => this.constructObject(constructArray[1], jobArray[2]));
            }
        }
    }

    checkPickupables(pickupables, canGetFromZone=false){
        let tempPickups = [];
        //needed because iterate can't find this.id
        let curId = this.id;
        
        pickupables.forEach(group => {
            group.children.iterate(function (groupItem) {
                if(!groupItem.isPickupable){return;}
                if(groupItem.parent.isFulfilled){return;}
                
                if(groupItem.parent){
                    if(!canGetFromZone){
                            if(groupItem.parent.parent.constructor.name=="CollectionZone"
                                || groupItem.parent.parent.constructor.name=="PropertyZone"){return;}
                        }
                    if(groupItem.parent.parent.constructor.name=="PropertyZone"&&
                        groupItem.parent.owner!=curId){return;}
                
                }
                if(groupItem.owner){
                    if(groupItem.owner.id!=curId){
                        return;
                    }
                }
                //if(collectionZones.getChildren()[0].isFull()){return;}
                //if the seed was put there on purpose
                if(groupItem.isDoingJob){return;}
                if(groupItem.isReservedBy==curId || groupItem.isReservedBy==''){
                    tempPickups.push([groupItem, "Pickup"]);
                }
            });
        });
        return tempPickups;
    }
    checkDestroyables(destroyables){
        let tempDestroyables = [];
        //needed because iterate can't find this.id
        let curId = this.id;
        destroyables.forEach(group => {
            group.children.iterate(function (groupItem) {
                if(!groupItem.isDestroyable){return;}
                //if tree was planted
                //if(groupItem.parent){return;}
                if(groupItem.owner!='' && groupItem.owner!=curId){
                    return;
                }
                if(groupItem.isReservedBy==curId || groupItem.isReservedBy==''){
                    tempDestroyables.push([groupItem, "Destroy"]);
                }
            });
        });
        return tempDestroyables;
    }
    checkDroppables(droppableSpots){
        let tempDroppables = [];
        //needed because iterate can't find this.id
        let curId = this.id;
        //for each type of droppablezone ([physics groups])
        droppableSpots.forEach(zoneTypeSet => {
            //for each zone of that type ([collection zone])
            for(const individZone of zoneTypeSet.children.entries){
                //individe zone = PropertyZone

                if(individZone.owner != '' && individZone.owner!=this.id){return;}
                for(const item of this.inventory){
                    //if the item is reserved, don't drop it
                    let skip = false;
                    for(const reservedItem of this.reservedInventory){
                        if(reservedItem == item.constructor.name){skip=true;}
                    }
                    if(skip){continue;}
                    if(item.owner == true && item.owner != individZone.owner){return;}
                    let myDropSpot = individZone.getDropSpot(item);
                    if(myDropSpot==null){return;}
                    if(item.isReservedBy==curId || item.isReservedBy==''){
                        tempDroppables.push([item,'Dropoff',myDropSpot]);
                    }
                }
            }
        });
        return tempDroppables;
    }
    checkZoneNeeds(zoneTypes){
        let tempNeeds = [];
        //needed because iterate can't find this.id
        let curId = this.id;
        //for each type of droppablezone ([physics groups])
        zoneTypes.forEach(zoneTypeSet => {
            //for each zone of that type ([collection zone])
            for(const individZone of zoneTypeSet.children.entries){
                //individe zone = PropertyZone1
                if(individZone.owner != '' && individZone.owner!=this.id){continue;}
                
                tempNeeds.push(...individZone.getNeeds());
            }
        });
        /*
        if(this.inventory.length == 0){return [];}
        for(let i=tempNeeds.length-1; i>=0;i--){
            if(this.inventory.length>0){
                if(tempNeeds[i][0] != this.inventory[0].constructor.name){
                    tempNeeds.splice(i, 1);
                }
            }
        }*/
        return tempNeeds;
    }
    //Job
    pickupObject(pickupableObject){
        if(this.isObjectClose(pickupableObject)){
            pickupableObject.isPickupable = false;
            if(pickupableObject.parent.inventory){
                //remove from inventory
                let index = pickupableObject.parent.inventory.indexOf(pickupableObject);
                if (index > -1) {
                    pickupableObject.parent.inventory.splice(index, 1); 
                }
            }
            pickupableObject.parent = this;
            pickupableObject.alpha = 0;
            pickupableObject.active = false;
            this.inventory.push(pickupableObject);
        }
        else{
            this.addToActions("Moving to "+pickupableObject.constructor.name, 
                () => this.pathToObject(pickupableObject),1);
            this.addToActions("Picking up "+pickupableObject.constructor.name, 
                () => this.pickupObject(pickupableObject),2);
        }
        //console.log("End of destroy");
        this.finishedAction();
        //console.log(this.curActions);
    }
    //Job
    destroyObject(destroyableObject){
        if(this.isObjectClose(destroyableObject)){
            destroyableObject.selfDestruct();
        }
        else{
            this.addToActions("Moving to "+destroyableObject.constructor.name, 
                () => this.pathToObject(destroyableObject),1);
            this.addToActions("Destroying "+destroyableObject.constructor.name, 
                () => this.destroyObject(destroyableObject),2);
        }
        //console.log("End of destroy");
        this.finishedAction();
        //console.log(this.curActions);

    }
    //Job
    dropoffObject(dropableObject, dropSpot){
        if(this.isObjectClose(dropSpot)){
            //remove from inventory
            let index = dropableObject.parent.inventory.indexOf(dropableObject);
            
            if (index > -1) {
                dropableObject.parent.inventory.splice(index, 1); // 2nd parameter means remove one item only
            }
            //add to dropspot
            dropSpot.drop(dropableObject, dropSpot);
        }
        else{
            this.addToActions("Moving to "+dropableObject.constructor.name, 
                () => this.pathToObject(dropSpot),1);
            this.addToActions("Dropping "+dropableObject.constructor.name, 
                () => this.dropoffObject(dropableObject, dropSpot),2);
        }

        this.finishedAction();
    }
    plantObject(myObject){
        if(this.isObjectClose(myObject)){
            myObject.owner = this;
            //remove from inventory
            myObject.interact('Plant');
            //add to dropspot
            
        }
        else{
            this.addToActions("Moving to "+myObject.constructor.name, 
                () => this.pathToObject(myObject),1);
            this.addToActions("Planting "+myObject.constructor.name, 
                () => this.plantObject(myObject),2);
        }
        this.finishedAction();
    }
    constructObject(objectType, dropSpot){
        if(this.isObjectClose(dropSpot)){
            //All this to check if the dropSpot has the required materials
            //Effectively remove them if it does.
            let itemReqs = [];
            constructableReqs.some(item => {
                if(item.name==objectType){
                    itemReqs=item.reqs;
                    return true;
                }
            })
            let inventoryCopy = [...dropSpot.inventory];
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
                        this.finishedAction();
                        return;
                    }
                }
            }
            for(let i=removed.length-1;i>=0;i--){
                removed[i].selfDestruct();
            }
            //add to dropspot
            dropSpot.addConstructable(objectType);
            
        }
        else{
            this.addToActions("Moving to "+objectType, 
                () => this.pathToObject(dropSpot),1);
            this.addToActions("Constructing "+objectType, 
                () => this.constructObject(objectType, dropSpot),2);
        }
        this.finishedAction();

    }

    //Job
    doNothing(){
        let delayInt = Phaser.Math.Between(1000,3000);
        let timer = globalScene.time.addEvent({ delay: delayInt, callback: this.finishedAction, callbackScope: this });  
    }
    //Job
    idle (){
        //get a point that is 30-50 units away
        let target = new Phaser.Math.Vector2();
        //get a location that is close and LOS
        //(to prevent trying to run around a fence)
        let randNumAttempts=0;
        let locFound=false;
        while(randNumAttempts<20){
            target.x = this.x + Phaser.Math.Between(-50,50);
            target.y = this.y + Phaser.Math.Between(-50,50);
            if(Pathing.isLOS(this,target)){
                locFound=true;
                break;
            }
            randNumAttempts+=1;
        }
        if(!locFound){
            target.x=this.x;target.y=this.y}
        let speed = 20;
        
        this.addToActions("Path to Object", () => this.pathToObject(target, speed),1);
        this.finishedAction();
        
    }
    //Job
    pathToObject(target, speed=this.defaultSpeed){
        let path = Pathing.getPath(this,target);
        
        //reverse path is given (that's how it is created)
        //path re-reverses as it is added
        for(let i=0;i<path.length;i++){
            this.addToActions("Travelling ", () => this.moveToObject(path[i], speed),1);
        }
        this.finishedAction();
    }
    //Job
    //target needs .x and .y properties. Vector2 works
    moveToObject (target, speed = this.defaultSpeed){
        globalScene.physics.moveToObject(this, target, speed);
        //need to set target 
        let newTarget = globalScene.physics.add.sprite(target.x, target.y, "");
        //make invisible.
        if(showDebug){
            newTarget.setScale(0.2);}
        else{
            newTarget.setScale(0);
        }
        let collider = globalScene.physics.add.overlap(this, newTarget, function (player)
        {
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
    
    //Object function
    findObject(objectConstructorName){
        //If there's an item in inventory
        for(let i=0;i<this.inventory.length;i++){
            if(this.inventory[i].constructor.name==objectConstructorName){
                return this.inventory[i];
            }
        }
        let pickupables = [];
        //Look for pickupables that match the object physics group
        //Can pickup from communal zones
        pickupables.push(...this.checkPickupables([groupsMap.get(objectConstructorName)],true));
        if(pickupables.length>0){
            //TODO get closest?
            return pickupables[0][0]; 
        }
        return false;
    }
    
    //Object function
    isObjectClose(ObjectSprite){
        let close = 15;
        return Phaser.Math.Distance.Between(ObjectSprite.x,ObjectSprite.y,this.x,this.y)<close;
    }
    
    //Action function
    addToActions(label, fn, index=null){
        if(index==null){
            this.curActions.push(label);
            this.curActionFunctions.push(fn);
        }
        else{
            this.curActions.splice(index, 0, label);
            this.curActionFunctions.splice(index, 0, fn);
        }
    }
    //Action function
    finishedAction(){
        this.curActions.shift();
        this.curActionFunctions.shift();
        if(this.curActionFunctions.length>0){
            this.curActionFunctions[0]();
        }
    }
}