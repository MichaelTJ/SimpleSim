var constructableReqs = [];
class Constructable extends MyGameObjects{
    constructor(scene, x, y, sprite, owner=''){
        super(scene, x, y, sprite, owner);
        this.requirements = [];
        //Add outerCorner boxes
        constructables.add(globalScene.physics.add.existing(this));
        this.updateExistingNodes();
        this.addOuterCornerNodes();
        
    }
    updateExistingNodes(){
        pathNodes.getChildren().forEach(node => {
            node.updateVisibleNodes(this);
            
        });
    }
    addOuterCornerNodes(){
        
        let leftOuter = this.getTopLeft().x-7;
        let rightOuter = this.getTopRight().x+7;
        let topOuter = this.getTopLeft().y-7;
        let botOuter = this.getBottomLeft().y+7;

        //TODO: Optimization - 
        // Remove pathNodes ones if the construcatable overlaps
        // if exists a constructable +7 px in any direction
        // get Bounds
        // if new overlaps old remove path nodes
        //    
        // if old will overlap new, don't make the modes
        //

        //topLeft
        new PathNode(globalScene, leftOuter, topOuter, this);
        //topRight
        new PathNode(globalScene, rightOuter, topOuter, this);
        //botLeft
        new PathNode(globalScene, leftOuter, botOuter, this);
        //botRight
        new PathNode(globalScene, rightOuter, botOuter, this);
    }
}

//used so that you don't have to create an instance of a fence
//to get the requirements. TODO: Should make a pre-built sprite instead?
constructableReqs.push({name:"Fence", reqs:[[1,'Wood']], 
class: (scene, x, y, sprite, owner)=>{new Fence(scene, x, y, sprite, owner)}});
class Fence extends Constructable{
    constructor(scene, x, y, sprite, owner=''){
        super(scene, x, y, sprite, owner);
        this.type = 0; //0 for top, 1 for right, 2 bot, 3 left
    }
}

constructableReqs.push({name:"MineShaft", reqs:[[10,"Wood"]], 
class: (scene, x, y, sprite, owner)=>{new MineShaft(scene, x, y, sprite, owner)}});
class MineShaft extends Constructable{
    constructor(scene, x, y, sprite, owner=''){
        let sprite = 'mineShaft';
        super(scene, x, y, sprite, owner);
    }
}