//based off Australian jobs taxonomy

class Labourer {
    static CleanersAndLaundry = new Labourer(CleanersAndLaundry);
    static ConstructionAndMining = new Labourer(ConstructionAndMining);
    static FactoryProcess = new Labourer(FactoryProcess);
    static FarmForestryAndGarden = new Labourer(FarmForestryAndGarden);
    static FoodPreparation = new Labourer(FoodPreparation);
    static Other = new Labourer(Other);
  
    constructor(name) {
      this.name = name;
    }
  }