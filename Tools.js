var tools = [];
var toolData = [];
class Tool extends Phaser.Physics.Arcade.Sprite{
    constructor(scene, x, y, sprite, owner='') {
        super(scene, x, y, sprite);
        globalScene.add.existing(this);
        this.isReservedBy = '';
        this.parent = '';
        this.owner = owner;
        this.isStackable = false;
        this.isPickupable = false;
        this.isDestroyable = false;
        this.isSolid = false;
        tools.add(globalScene.physics.add.existing(this));
    }
    selfDestruct(){
        if(this.parent){
            if(this.parent.inventory){
                
                let index = this.parent.inventory.indexOf(this);
                if (index > -1) {
                    this.parent.inventory.splice(index, 1); 
                }
            }
        }
        var index = tools.getChildren().indexOf(this);
        if (index > -1) {
            woods.getChildren().splice(index, 1); 
        }
        this.destroy();

    }
}
toolData.push({
    name:"Axe", 
    materialReqs:[[1,"Wood"],[1,"Stone"]], 
    skillReqs:[],
    constructionReqs:[],
    abilities:[[Labourer.FarmForestryAndGarden, 2]],
    attackDamage:2,
    constructor: (scene, x, y, sprite, owner)=>{
        return new Axe(scene, x, y, sprite, owner)}
    });
class Axe extends Tool{
    constructor(scene, x, y, sprite, owner=''){
        super(scene, x, y, sprite, owner);
        this.isPickupable = true;
        this.isStackable = true;
    }
    selfDestruct(){
        super.selfDestruct();
    }

}