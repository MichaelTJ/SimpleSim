class Flow{
    constructor(startState, transitionAction, endState, curPossible = () => {return true}){
        this.startState = startState;
        this.transitionAction = transitionAction;
        this.endState = endState;
        this.curPossible = curPossible;
    }
}


class StateMachine{
  constructor(initial, flows){
    this.curState = initial;
    this.flows = flows;
  }
  can(ActionType){
    for(let i=0;i<this.flows.length;i++){
      if(this.curState==this.flows[i].startState){
        if(this.flows[i].transitionAction==ActionType){
          return true;
        }
      }
    }
  }
  //get the possible flow for a given action (knowing current state)
  getFlow(ActionType){
    for(let i=0;i<this.flows.length;i++){
      if(this.curState==this.flows[i].startState){
        if(this.flows[i].transitionAction==ActionType){
          if(flows[i].curPossible()){
            //returned flow used by obj for onEnter() and onLeave()
            return this.flows[i];
          }
          return null;
        }
      }
    }
    //Code shouldn't reach here
    return null;
  }
  makeTransition(ActionType){
    for(let i=0;i<this.flows.length;i++){
      if(this.curState==this.flows[i].startState){
        if(this.flows[i].transitionAction==ActionType){
          this.curState=this.flows[i].endState;
          this.curFlows = this.getCurFlows();
          //returned flow used by obj for onEnter() and onLeave()
          return this.flows[i];
        }
      }
    }
  }
  checkCurPossible(ActionType){
    for(let i=0;i<this.flows.length;i++){
      if(this.curState==this.flows[i].startState){
        if(this.flows[i].transitionAction==ActionType){
          return this.flows[i].curPossible()
        }
      }
    }
  }
  getCurFlows(){
    let possibleFlows = [];
    for(let i=0;i<this.flows.length;i++){
      if(this.curState==this.flows[i].startState){
        if(this.possibleFlows.curPossible()){
          possibleFlows.push(this.flows[i]);
        }
      }
    }
    return possibleFlows;
  }
}

