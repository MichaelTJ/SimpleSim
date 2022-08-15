var pathNodes;
class PathNode extends Phaser.Physics.Arcade.Sprite{
    constructor(scene, x, y, parent) {
        super(scene, x, y);
        this.parentConstructable = parent;
        //other node stuff here
        //set to 0 to make invisible
        
        //see player -> MoeToObject for implementation
        this.visibleNodes = [];
        this.updateVisibleNodes();
        
        pathNodes.add(globalScene.physics.add.existing(this));
        this.setScale(0.2);
        
    }
    //Nodes with a clear LOS
    updateVisibleNodes(constructable=null){
        if(constructable!=null){
            //go through all nodes **Could be log(N) - double checking nodes twice
            
            this.visibleNodes.forEach(visibleNode => {
                //if you can no longer see it
                if(!Pathing.isLOS(this,visibleNode.node,constructable)){
                    //remove from that nodes' visible nodes
                    visibleNode.node.visibleNodes = 
                        visibleNode.node.visibleNodes.filter(element => element.node!=this);
                    //remove from this nodes visible nodes
                    this.visibleNodes = this.visibleNodes.filter(element => element!=visibleNode);
                }
            });
        }
        if(constructable==null){
            pathNodes.getChildren().forEach(node => {
                if(Pathing.isLOS(this, node)){
                    let distance = Phaser.Math.Distance.BetweenPoints(this, node);
                    this.visibleNodes.push({node:node, distance:distance});
                    node.visibleNodes.push({node:this, distance:distance});
                }
            });
        }
    }

    

}


class Pathing{
    static isLOS(node1, node2, rect=null){        
        //3 lines created between start and finish
        let midLine = new Phaser.Geom.Line(node1.x, node1.y, node2.x, node2.y);

        let run = 6.5*Phaser.Geom.Line.NormalX(midLine);
        let rise = 6.5*Phaser.Geom.Line.NormalY(midLine);

        let leftLine = new Phaser.Geom.Line(
            node1.x-run, 
            node1.y+rise, 
            node2.x-run, 
            node2.y+rise);
        let test = node1.x+run;
        let rightLine = new Phaser.Geom.Line(
            node1.x+run, 
            node1.y-rise, 
            node2.x+run, 
            node2.y-rise);
        
        if(rect!=null){
            let spriteBounds = rect.getBounds();
            return !(Phaser.Geom.Intersects.LineToRectangle(leftLine, spriteBounds)||
                Phaser.Geom.Intersects.LineToRectangle(rightLine, spriteBounds));
        }
        else{
            //if the new sprite overlaps with a constructable return false
            return !constructables.getChildren().some(constructable => {
                let spriteBounds = constructable.getBounds();
                
                //return true (notLOS) if neither line intersects
                return(Phaser.Geom.Intersects.LineToRectangle(leftLine, spriteBounds)||
                Phaser.Geom.Intersects.LineToRectangle(rightLine, spriteBounds));
                
            });
        }
    }

    static getPath(start, finish, openList=[], closedList = [], endList=[]){
        //If getting started, check for LOS
        if(Pathing.isLOS(start, finish)){
            return [finish];
        }
        //If there's no straight LOS get LOS Nodes to start
        //also get LOS Nodes to finish
        else{
            //Repeat code from PathNode.UpdateConnectedNodes //TODO dry
            pathNodes.getChildren().forEach(node => {
                if(Pathing.isLOS(start, node)){
                    let distance = Phaser.Math.Distance.BetweenPoints(start, node);
                    start.visibleNodes = []
                    start.visibleNodes.push({node:node, distance:distance});
                    //Don't need the other node to see us
                    //node.visibleNodes.push({node:this, distance:distance});
                    let g = distance;
                    let h = Phaser.Math.Distance.BetweenPoints(node, finish);
                    openList.push({node:node, g:g, h:h, f:(g+h), parent:start});
                }
                
                if(Pathing.isLOS(finish, node)){
                    let distance = Phaser.Math.Distance.BetweenPoints(finish, node);
                    finish.visibleNodes = []
                    finish.visibleNodes.push({node:node, distance:distance});
                    //sort out f, g, h, parent later
                    endList.push({node:node, g:undefined, h:undefined, f:undefined, parent:undefined});
                }
            })

        }
        
        let nodeSteps = 0;
        let bestEndScore=Number.MAX_SAFE_INTEGER;
        let bestEndNode=null;
        while(nodeSteps<20){
            //get smallest f
            if(openList.length==0){
                return [finish];
            }
            let smallestF = openList.reduce(function(prev, curr) {
                return prev.f < curr.f ? prev : curr;
            });
            
            //if the smallest of the open nodes is not better than curBest
            //this won't run until an end node is found
            if(smallestF.f>=bestEndScore){
                //finished
                return Pathing.convertNodeToPath(start, bestEndNode, finish);
            }
            

            //add it's visible nodes to the openList
            for(let i=0;i<smallestF.node.visibleNodes.length;i++){
                let curVisible = smallestF.node.visibleNodes[i];
                //if I've been there before it was a more optimal path
                if(closedList.some(node=>node.node==curVisible.node)){continue;}
                let newG = smallestF.g+curVisible.distance;
                //if you've already seen the node but it's newG is smaller
                let isOpen = false;
                //TODO:Better loop is available
                openList.forEach(node => {
                    if(node.node==curVisible.node){
                        isOpen = true;
                        if(newG<node.g){
                            node.g=newG
                            node.f=newG+node.h
                            node.parent=smallestF
                        }
                        return;
                    }
                })
                if(!isOpen){
                    let h = Phaser.Math.Distance.BetweenPoints(curVisible.node, finish);
                    
                    openList.push({node:curVisible.node, g:newG, h:h, f:(newG+h), parent:smallestF});
                }
                    //if the new node matches an end node
                if(endList.some(visNode=>visNode.node==curVisible.node)){
                    let h = Phaser.Math.Distance.BetweenPoints(curVisible.node, finish);
                    if((newG+h)<bestEndScore){
                        bestEndScore=(newG+h);
                        bestEndNode={node:curVisible.node, g:newG, h:h, f:(newG+h), parent:smallestF};
                    }
                }
            }
            closedList.push(smallestF);
            for(let j=0;j<openList.length;j++){
                if(openList[j]==smallestF){
                    openList.splice(j, 1);
                }
            }

        }
        //If nothing found after 20 steps, return best
        return convertNodeToPath(start, bestEndNode, finish);
        

    }
    static convertNodeToPath(start, bestEndNode, finish){
        let path = [];
        //each item on path needs .x and .y
        path.push(finish);
        while(bestEndNode.parent!=start){
            path.push(bestEndNode.node);
            bestEndNode = bestEndNode.parent;
        }
        path.push(bestEndNode.node);

        return path;
    }
}


/*
    getPath(start, finish, solidPoints){

        let interceptPoints = getSolidPointsBetween(start, finish, solidPoints);
        if(interceptPoints.length==0){
            //Return a path with 1 point on it.
            return finish;
        }
        let closestToStart = Math.min(...interceptPoints.map(item => item.distance));
        let secondPoints = getPathsToSolidCorners(start, closestToStart.parent, solidPoints);

        let closestToFinish = Math.max(...interceptPoints.map(item => item.distance));
        let secondLastPoints = getPathsToSolidCorners(finish, closestToFinish.parent, solidPoints);

        return findShortestGraphPath(start, secondPoints, secondLastPoints, finish, graph);
    }
    //outer corners are right-handed if going clockwise
    //TODO: handle other solidObjects in the way
    getPathsToSolidCorners(start,solidObject, solidPoints){
        let directCorners = [];
        //parent of closest point
        for(let i=solidObject.outerCornerBoxes.length-1; i>=0;i--){
            //closest corners
            //get LOS of closest corners
            let cornerIntercepts = getSolidPointsBetween(start, solidObject.outerCornerBoxes[i], solidPoints);
            if(cornerIntercepts.length>0){
                for(let j=0;j<cornerIntercepts.length;j++){
                    //if the solidObject in question is between start and outerCorner
                    if(cornerIntercepts[j].parent===solidObject){
                        solidObject
                    }
                    else{
                        
                    }
                }
                //get the next solid object
                //should keep track of solid objects seen so far to avoid loop.

            }
            else{
                directCorners.push(solidObject.outerCornerBoxes[i]);
            }
        }
        return directCorners;
    }
    getRelativeQuadrant(start, finish){
        if(start.x<finish.x){
            if(start.y<=finish.y){
                return 1;
            }
        }
        else if(start.x>finish.x){
            if(start.y<=finish.y){
                return 2;
            }
        }
        else if(start.x<finish.x){
            if(start.y>=finish.y){
                return 3;
            }
        }
        else if(start.x>finish.x){
            if(start.y>=finish.y){
                return 4;
            }
        }
    }
    getSolidPointsBetween(start, finish, solidPoints){
        let m = (finish.y-start.y)/(finish.x/start.x);
        let c = start.y-(m*start.x);
        let interceptPoints = [];
        for(let i=0; i<solidPoints.length;i++){
            //if the point is inbetween the start and finish x-axis
            if((start.x<=solidPoints[i].x&&finish.x>=solidPoints[i].x) ||
                (start.x>=solidPoints[i].x&&finish.x<=solidPoints[i].x)){
                let lineY = m*solidPoints[i].x+c;
                if(Phaser.Math.Difference(lineY,solidPoints[i].y)<=7){
                    interceptPoints.push({point:solidPoints[i],
                        distance:Phaser.Math.DistanceBetweenPoints(solidPoints[i],start)});
                }
            }
        }
        return interceptPoints;
    }
    findShortestGraphPath(start, secondPoints, secondLastPoints, finish, graph){
        let totalPath = [start]
    }
}*/