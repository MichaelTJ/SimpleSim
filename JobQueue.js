class JobQueue{
    constructor(){
        //each job has an object and a flow (see FSM)
        //TODO: heuristic
        this.jobs = {}
    }
    appendJobs(obj, flows){
        if(this.jobs[obj]){this.jobs[obj].push(...flows)}
        else{this.jobs[obj] = flows;}
    }
    addJobs(obj, flows){
        //if it exists or not
        //overwrite existing jobs
        //used for change of state
        this.jobs[obj] = flows;
    }
    removeJobs(obj, flows){
        this.jobs[obj]=[];
    }
    removeObj(obj){
        delete this.jobs[obj];
    }
}