class Flow{
    constructor(startState, transitionAction, endState, 
      checkPossible = () => {return true},
      transitionFunc = () => {}){
        this.startState = startState;
        this.transitionAction = transitionAction;
        this.endState = endState;
        this.checkPossible = checkPossible;
        this.transitionFunc = transitionFunc;
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
          if(flows[i].checkPossible()){
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
  checkPossible(ActionType){
    for(let i=0;i<this.flows.length;i++){
      if(this.curState==this.flows[i].startState){
        if(this.flows[i].transitionAction==ActionType){
          return this.flows[i].checkPossible()
        }
      }
    }
  }
  getCurFlows(){
    let possibleFlows = [];
    for(let i=0;i<this.flows.length;i++){
      if(this.curState==this.flows[i].startState){
        if(this.flows[i].checkPossible()){
          possibleFlows.push(this.flows[i]);
        }
      }
    }
    return possibleFlows;
  }
}

