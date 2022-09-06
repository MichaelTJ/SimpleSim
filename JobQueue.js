class JobQueue{
    constructor(){
        //each job has an object as key and values:(isReserved and flows) (see FSM)
        //TODO: heuristic
        this.jobs = {}
    }
    appendJobs(obj, flows){
        if(this.jobs[obj]){
            this.jobs[obj].isReserved = false;
            this.jobs[obj].flows.push(...flows)}
        else{this.jobs[obj] = {isReserved:false, flows:flows};}
    }
    removeJobs(obj, flows){
        this.jobs[obj]={isReserved:false, flows:[]};
    }
    removeObj(obj){
        delete this.jobs[obj];
    }
    getRandom(){
        let keys = Object.keys(this.jobs);
        let index = keys.length * Math.random() << 0;
        if(obj[keys[index]].isReserved){
            
        }
        obj[keys[index]].isReserved = true;
        return obj[keys[index]];
    }
    //observe when children objs add to jbo queue filter then.
}