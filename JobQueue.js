class JobQueue{
    constructor(){
        //each job has an object as key and values:(isReserved and flows) (see FSM)
        //TODO: heuristic
        this.jobs = {}
        
    }
    //can't have obj as key (Maybe WeakMap works?), using id instead
    //TODO - Phaser probably generates ids automatically?
    //generating ids through objectIdSingleton instead
    //
    appendJobs(obj, flows){
        if(this.jobs[obj.id]){
            this.jobs[obj.id].obj = obj;
            this.jobs[obj.id].flows.push(...flows)}
        else{this.jobs[obj.id] = {obj:obj, flows:flows};}
    }
    //TODO: reuse objects. Need to sort out getRandomJob to 
    //make sure it has a flow. Deleting the obj means any random
    //obj will have a possible flow.
    /*
    removeJobs(obj, flows){
        this.jobs[obj.id]={flows:[]};
    }*/
    removeObj(obj){
        delete this.jobs[obj.id];
    }
    getJobs(){
        return this.jobs;
    }
    //observe when children objs add to obj queue filter then.
}