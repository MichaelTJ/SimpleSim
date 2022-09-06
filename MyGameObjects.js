var myGameObjects = [];
var myGameObjectData = [];

//stateMachine states and actions
class MGOState {
    static Waiting = new MGOState('Waiting');
    static Destroyed = new MGOState('Destroyed');
    static InPlayerInv = new MGOState('InPlayerInv');
    static InZoneInv = new MGOState('InZoneInv');
    //used when an action applies to any state. Eg Destroy
    //Unused atm
    static Any = new MGOState('Any');
  
    constructor(name) {
      this.name = name;
    }
}

//interactions from a player
class MGOAction {
    static Drop = new MGOAction('Drop');
    //DropTo implies giving object to another (has inventory)
    static DropTo = new MGOAction('DropTo');
    static Pickup = new MGOAction('Pickup');
    static Destroy = new MGOAction('Destroy');
    static Work = new MGOAction('Work');
    static Use = new MGOAction('Use');
    static Steal = new MGOAction('Steal');
    constructor(name) {
      this.name = name;
    }
}
class MyGameObject extends Phaser.Physics.Arcade.Sprite{
    constructor(scene, x, y, sprite, owner='') {
        super(scene, x, y, sprite);
        globalScene.add.existing(this);
        this.spawners = [];
        this.inventory = [];
        this.timers = [];
        this.isReservedBy = '';
        this.parent = '';
        this.owner = owner;
        this.isStackable = false;
        this.isPickupable = false;
        this.isDestroyable = false;
        this.isSolid = false;
    }
    selfDestruct(){
        //spawn all the items in inventory
        for(var i=0;i<this.inventory.length;i++){
            this.inventory[i].x = this.x+Phaser.Math.Between(-randDist,randDist);
            this.inventory[i].y = this.y+Phaser.Math.Between(-randDist,randDist);
            this.inventory[i].setVisible(true);
            this.inventory[i].parent = '';
        }

        //clear any timers
        for(var i=0;i<this.timers.length;i++){
            this.timers[0].remove();
            this.timers[0].destroy();
        }

        //clear spawner timers
        for(let i=0;i<this.spawners.length;i++){
            this.spawners[i].selfDestruct();
        }
        //remove from parent inventory
        if(this.parent){
            if(this.parent.inventory){
                
                let index = this.parent.inventory.indexOf(this);
                if (index > -1) {
                    this.parent.inventory.splice(index, 1); 
                }
            }
        }
        //remove from gameObjects
        
        let index = myGameObjects.indexOf(this);
        if (index > -1) {
            myGameObjects.splice(index, 1); 
        }

    }
}

var trees;
class Tree extends MyGameObject{
    constructor(scene, x, y, sprite, owner=''){
        super(scene, x, y, sprite, owner);
        //Can be set to spawn 1 seed before becoming destroyable
        this.isDestroyable = false;
        this.spawnRadius = 30;

        this.seedsMade = 0;
        this.maxSeedSpawnTime = 1000;
        trees.add(globalScene.physics.add.existing(this));
        this.addSeedSpawner();
        this.firstSeedTimer = globalScene.time.addEvent({ delay: this.maxSeedSpawnTime, callback: this.changeIsDestroyable, callbackScope: this});
    }

    getPlan(){
        return{
            job:'destroy',
            //workAmount:5
            //Creates:[3,'Wood']
            planOnComplete:'getObj'}
        
    }

    addSeedSpawner(){
            //newObject.x += Phaser.Math.Between(-this.spawnRadius, this.spawnRadius);
            //newObject.y += Phaser.Math.Between(-this.spawnRadius, this.spawnRadius);

        let seedSpawner = new Spawner(
            globalScene, this.x, this.y, '', this, 
            () => new Seed(globalScene, 
                this.x+ Phaser.Math.Between(-this.spawnRadius, this.spawnRadius), 
                this.y+ Phaser.Math.Between(-this.spawnRadius, this.spawnRadius), 
                'seed'),
            3, 999, this.maxSeedSpawnTime, 30);
        this.spawners.push(seedSpawner);
    }
    changeIsDestroyable(){
        this.isDestroyable = true;
        
        this.firstSeedTimer.remove();
        this.firstSeedTimer.destroy();
    }

    selfDestruct(){
        super.selfDestruct();
        //spawn 1-3 wood (because tree)
        var woodAmount = Phaser.Math.Between(1,3);
        for(var i=0;i<woodAmount;i++){
            let tempWood = new Wood(globalScene, 
                this.x+Phaser.Math.Between(-randDist,randDist),   
                this.y+Phaser.Math.Between(-randDist,randDist),
                'wood', this.owner);
        }
        var index = trees.getChildren().indexOf(this);
        if (index > -1) {
            trees.getChildren().splice(index, 1); 
        }
        //this.active = false;
        if(this.parent){this.parent.isfulFilled = false;}
        
        this.destroy();
    }
}

var woods;
class Wood extends MyGameObject{
    constructor(scene, x, y, sprite, owner=''){
        super(scene, x, y, sprite, owner);
        this.isPickupable = true;
        this.isStackable = true;
        woods.add(globalScene.physics.add.existing(this));
    }
    selfDestruct(){
        super.selfDestruct();
        var index = woods.getChildren().indexOf(this);
        if (index > -1) {
            woods.getChildren().splice(index, 1); 
        }
        this.destroy();
    }
}

var ores;
class Ores extends MyGameObject{
    constructor(scene, x, y, sprite, owner=''){
        sprite = 'ore';
        super(scene, x, y, sprite, owner);
        this.isPickupable = true;
        this.isStackable = true;
        ores.add(globalScene.physics.add.existing(this));
    }
    selfDestruct(){
        super.selfDestruct();
        var index = ores.getChildren().indexOf(this);
        if (index > -1) {
            ores.getChildren().splice(index, 1); 
        }
        this.destroy();
    }
} 

var seeds;
class Seed extends MyGameObject{
    constructor(scene, x, y, sprite, owner=''){
        super(scene, x, y, sprite, owner);
        this.isPickupable = true;
        this.isStackable = true;
        this.isPlanted = false;
        this.minTime = 3000;
        this.maxTime = 5000;
        this.becomeTreeTimer;
        seeds.add(globalScene.physics.add.existing(this));
    }
    getPlan(){
        //if planted, wait to grow
        if(this.isPlanted){
            return {}
        }
        else{
            return {
                job:'interact', 
                type:'Plant',
                //Tree create will update the subZone plan
                planOnComplete:''}
        }
    }
    interact(type){
        if(type=='Plant'){
            this.isPlanted = true;
            this.parent.updatePlan({});
            this.setTexture('plant');
            let delayInt = Phaser.Math.Between(this.minTime,this.maxTime);
            this.becomeTreeTimer = globalScene.time.addEvent({ 
                delay: delayInt, 
                callback: this.becomeTree, 
                callbackScope: this,
                loop: false});
        }
        else if(type=='Destroy'){
            this.selfDestruct();
        }

    }
    becomeTree(){
        //TODO fix this? Errors with overlaps?
        if(this.becomeTreeTimer!=undefined){
            this.becomeTreeTimer.remove();
            this.becomeTreeTimer.destroy();
            this.becomeTreeTimer = undefined;
        }
        if(this.parent.inventory){
            //remove from inventory
            var index = this.parent.inventory.indexOf(this);
            if (index > -1) {
                this.parent.inventory.splice(index, 1); 
            }
        }
        let curScene = this.parent.scene;
        let newTree = new Tree(curScene,this.x, this.y,'tree', this.owner);
        newTree.parent = this.parent;
        newTree.parent.inventory.push(newTree);
        newTree.parent.updatePlan(newTree.getPlan());
        newTree.isReservedBy = "";
        newTree.isDestroyable = false;

        this.selfDestruct();
    }
    
    selfDestruct(){
        super.selfDestruct();
        var index = seeds.getChildren().indexOf(this);
        if (index > -1) {
            woods.getChildren().splice(index, 1); 
        }
        this.destroy();
    }
}




class Spawner extends MyGameObject{
    constructor(scene, x, y, sprite, parent, 
        spawnObjectConstructor, maxObjects, minTime, maxTime, spawnRadius){
        super(scene, x, y, sprite);
        this.parent = parent;
        this.x = parent.x;
        this.y = parent.y;
        this.inventory = [];
        this.timers = [];
        this.spawnObjectConstructor = spawnObjectConstructor, 
        this.maxObjects = maxObjects, 
        this.minTime = minTime, 
        this.maxTime = maxTime,
        this.spawnRadius = this.spawnRadius,
        this.spawnInProgress = false;
        this.startSpawner();
        this.setScale(0);
    }
    startSpawner(){
        //TODO set a more realistic timer for seed production
        let delayInt = Phaser.Math.Between(this.minTime,this.maxTime);
        this.timers.push(globalScene.time.addEvent({ 
            delay: delayInt, 
            callback: this.addObjectNew, 
            callbackScope: this, 
            loop: true }));

    }
    addObjectNew(){
        this.timers[0].delayInt = Phaser.Math.Between(this.minTime,this.maxTime);
        if(this.inventory.length<this.maxObjects){

            var newObject = this.spawnObjectConstructor();
            this.inventory.push(newObject);
            newObject.parent = this.parent;
            newObject.owner = this.parent.owner;
            newObject.setVisible(true);
        }
    }

    removeSeed(seed){
        //console.log(seed, this.inventory);
        seed.parent = '';
        //remove the item from inventory
        this.inventory = this.inventory.filter(item => item !== seed);
        this.checkSpawnObjects();
    }

    selfDestruct(){//clear any timers
        for(let i=0;i<this.timers.length;i++){
            this.timers[i].remove();
        }
    }
}

/*
Eventually want to build from data
myGameObjectData['stone']={
    materialReqs:[], 
    skillReqs:[],
    constructionMaterialReqs:[],
    constructionParentReqs:[],
    value:1,
    jobType:Labourer.Other,
    constructor: (scene, x, y, owner)=>{
        return new Resource(scene, x, y, owner)}
    };
    */
class Resource extends MyGameObject{
    constructor(scene, x, y, owner=''){
        let sprite = 'ore';
        super(scene, x, y, sprite, owner);
        this.isStackable = true;
        this.stateMachine = this.createStateMachine();
        this.addToJobQueues();
        //myGameObjects.add(globalScene.physics.add.existing(this));
    }
    createStateMachine(){
        return new StateMachine(MGOState.Waiting,
            [
                new Flow(MGOState.Waiting,MGOAction.Pickup,MGOState.InPlayerInv,
                    undefined,
                    (reqData) => {
                        removeFromInventory(this.parent, this);
                        this.parent = reqData.PickupToObj;
                        this.parent.inventory.push(this);
                    }),
                    //drop to ground
                new Flow(MGOState.InPlayerInv,MGOAction.Drop,MGOState.Waiting,
                    undefined,
                    (reqData) => {
                        removeFromInventory(this.parent, this);
                        this.parent = '';
                    }),
                new Flow(MGOState.InPlayerInv,MGOAction.DropTo,MGOState.InPlayerInv, 
                    //checkPossible
                    (reqData)=>{
                        if(reqData.DropToObj.Inventory.length>64){return false;}
                        return true;},
                    //transitionFunc
                    (reqData) => {
                        removeFromInventory(this.parent, this);
                        this.parent = reqData.DropToObj;
                        this.parent.inventory.push(this);
                    }),
                    //both things need access to 
                new Flow(MGOState.InPlayerInv,MGOAction.DropTo,MGOState.InZoneInv),
                new Flow(MGOState.InPlayerInv,MGOAction.Steal,MGOState.InPlayerInv),
                new Flow(MGOState.InZoneInv,MGOAction.Pickup,MGOState.InPlayerInv),
                //not handled yet
                new Flow(MGOState.Any,MGOAction.Destroy,MGOState.Destroyed),
                new Flow(MGOState.Any,MGOAction.Use,MGOState.Destroyed)
            ]
            
        )
    }
    //duplicate code, should put into fsm.
    interact(reqData, MGOActionType){
        //doesn't check transitions yet
        let proposedFlow = this.stateMachine.getFlow(MGOActionType);
    
        if(proposedFlow){
            let returnData = {}
            returnData.leaveStateData = this.leaveState(reqData, proposedFlow);
            this.stateMachine.makeTransition(ActionType);
            returnData.enterStateData = this.enterState(reqData, proposedFlow);
            return returnData;
        }
        else{
            return null;
        }
        
    }
    leaveState(reqData, flow){
        //remove from job queue
        this.removeFromJobQueues();
        switch(flow.startState){
            case MGOState.Waiting:
                //another switch needed here
                break;
            case MGOState.InPlayerInv:
                break;
            case MGOState.InZoneInv:
                break;
        }
    }
    enterState(reqData, MGOStateType){
        switch(MGOStateType){
            case MGOState.Waiting:
                this.active = true;
                break;
            case MGOState.InPlayerInv:
                this.alpha = 0;
                this.active = false;
                break;
            case MGOState.InZoneInv:
                this.active = true;
                break;
        }
        this.addToJobQueues()
    }
    removeFromJobQueues(){
        //should I record which job queues this is attached to?
        if(this.parent){
            this.parent.jobQueue.removeJobs(this, this.stateMachine.getCurFlows());
        }
        else{
            globalJobQueue.removeJobs(this, this.stateMachine.getCurFlows());
        }
    }
    addToJobQueues(){
        if(this.parent){
            this.parent.jobQueue.appendJobs(this, this.stateMachine.getCurFlows());
        }
        else{
            globalJobQueue.appendJobs(this, this.stateMachine.getCurFlows());
        }
    }
}
function removeFromInventory(objWithInventory, element){
    if(objWithInventory.inventory){
        //remove from inventory
        let index = objWithInventory.inventory.indexOf(element);
        if (index > -1) {
            objWithInventory.inventory.splice(index, 1); 
        }
    }
}
