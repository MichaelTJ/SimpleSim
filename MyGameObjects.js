class MyGameObjects extends Phaser.Physics.Arcade.Sprite{
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
        if(this.parent){
            if(this.parent.inventory){
                
                let index = this.parent.inventory.indexOf(this);
                if (index > -1) {
                    this.parent.inventory.splice(index, 1); 
                }
            }
        }

    }
}

var trees;
class Tree extends MyGameObjects{
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
class Wood extends MyGameObjects{
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

var seeds;
class Seed extends MyGameObjects{
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
    plant(){
        this.isPlanted = true;
        this.setTexture('plant');
        let delayInt = Phaser.Math.Between(this.minTime,this.maxTime);
        this.becomeTreeTimer = globalScene.time.addEvent({ 
            delay: delayInt, 
            callback: this.becomeTree, 
            callbackScope: this,
            loop: false});

    }
    becomeTree(){
        //TODO fix this?
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
        newTree.isReservedBy = "";
        newTree.isDestroyable = false;

        
        //remove from inventory
        var index = seeds.getChildren().indexOf(this);
        if (index > -1) {
            seeds.getChildren().splice(index, 1); 
        }
        super.selfDestruct();
        this.destroy();
    }
}




class Spawner extends MyGameObjects{
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