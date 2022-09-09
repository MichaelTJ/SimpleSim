class ObjectId{
    static curMaxId = 0;
    
    static getNextId(){
        //no ids with the number 0
        //0 is used as falsey
        this.curMaxId +=1;
        return this.curMaxId;
    } 
}