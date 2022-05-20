const RunRecipe = function(context){
    console.log(context)
}


export default class Recipe {
    constructor({id, meta,phases,switching}) {
        this.id = id;
        this.meta = meta
        this.phases = phases
        this.switching = switching
    }

    get name(){
        return this.id;
    }
}
