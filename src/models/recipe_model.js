const RunRecipe = function(context){
    console.log(context)
}


export default class Recipe {
    constructor({id, meta,phases,switching}) {
        this.id = id;
        this.meta = meta
        this.phases = phases
        this.switching = switching
        this.func = RunRecipe
    }

    get name(){
        return this.id;
    }




    execute(context){
        return this.func(context)
            .then(result => {
                this.result = "Recipe is Running";
                return this;
            })
            .catch(err => {
                this.errors.push(err);
                throw this;
            });
    }
}
