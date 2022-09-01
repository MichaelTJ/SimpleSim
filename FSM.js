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

/*
example sm:
const wordMachine = createMachine({
  states: {
    bold: {
      initial: 'off',
      states: {
        on: {
          on: { TOGGLE_BOLD: 'off' }
        },
        off: {
          on: { TOGGLE_BOLD: 'on' }
        }
      }
    },
    underline: {
      initial: 'off',
      states: {
        on: {
          on: { TOGGLE_UNDERLINE: 'off' }
        },
        off: {
          on: { TOGGLE_UNDERLINE: 'on' }
        }
      }
    },
    italics: {
      initial: 'off',
      states: {
        on: {
          on: { TOGGLE_ITALICS: 'off' }
        },
        off: {
          on: { TOGGLE_ITALICS: 'on' }
        }
      }
    },
    list: {
      initial: 'none',
      states: {
        none: {
          on: { BULLETS: 'bullets', NUMBERS: 'numbers' }
        },
        bullets: {
          on: { NONE: 'none', NUMBERS: 'numbers' }
        },
        numbers: {
          on: { BULLETS: 'bullets', NONE: 'none' }
        }
      }
    }
  }
});

const boldState = wordMachine.transition('bold.off', 'TOGGLE_BOLD').value;

// {
//   bold: 'on',
//   italics: 'off',
//   underline: 'off',
//   list: 'none'
// }

const nextState = wordMachine.transition(
  {
    bold: 'off',
    italics: 'off',
    underline: 'on',
    list: 'bullets'
  },
  'TOGGLE_ITALICS'
).value;

// {
//   bold: 'off',
//   italics: 'on',
//   underline: 'on',
//   list: 'bullets'
// }
*/

class Flow{
    constructor(startState, transitionEvent, endState, conditions = false){
        this.startState = startState;
        this.transitionEvent = transitionEvent;
        this.endState = endState;
        this.conditions = conditions;
    }
}



class StateMachine{
  constructor(initial, flows){
    this.curState = initial;
    this.flows = flows;
  }
  can(MGOActionType){
    for(let i=0;i<this.flows.length;i++){
      if(this.curState==this.flows[i].startState){
        if(this.flows[i].transitionEvent==MGOActionType){
          return true;
        }
      }
    }
  }
  
  getFlow(MGOActionType){
    for(let i=0;i<this.flows.length;i++){
      if(this.curState==this.flows[i].startState){
        if(this.flows[i].transitionEvent==MGOActionType){
          //returned flow used by obj for onEnter() and onLeave()
          return this.flows[i];
        }
      }
    }
  }
  makeTransition(MGOActionType){
    for(let i=0;i<this.flows.length;i++){
      if(this.curState==this.flows[i].startState){
        if(this.flows[i].transitionEvent==MGOActionType){
          this.curState=this.flows[i].endState;
          this.curFlows = this.getCurFlows();
          //returned flow used by obj for onEnter() and onLeave()
          return this.flows[i];
        }
      }
    }
  }
  checkConditions(MGOActionType){
    for(let i=0;i<this.flows.length;i++){
      if(this.curState==this.flows[i].startState){
        if(this.flows[i].transitionEvent==MGOActionType){
          if(this.flows[i].conditions){
            return this.flows[i].conditions()
          };
        }
      }
    }
  }
  getCurFlows(){
    let possibleFlows = [];
    for(let i=0;i<this.flows.length;i++){
      if(this.curState==this.flows[i].startState){
        possibleFlows.push(this.flows[i]);
      }
    }
    return possibleFlows;
  }
}

