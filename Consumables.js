class Consumable extends MyGameObject{
    constructor(scene, x, y, sprite, owner='') {
        super(scene, x, y, sprite);
    }
}

class Meat extends Consumable{
    constructor(scene, x, y, sprite, owner='') {
        super(scene, x, y, sprite);
    }
}