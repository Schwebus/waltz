import {WaltzWidget} from "@waltz-controls/middleware";
import {kUserContext} from "@waltz-controls/waltz-user-context-plugin";
import {kChannelLog, kTopicLog} from "controllers/log";
import Recipe from "models/recipe_model";
import {kMainWindow} from "widgets/main_window";
import {
    kControllerUserAction,
    ReadTangoAttribute,
    WriteTangoAttribute
} from "@waltz-controls/waltz-user-actions-plugin";

import "views/recipe_view"


export const kWidgetRecipe = 'widget:recipe';
const kOverwrite = true;

const kRecipesPanelHeader = '<span class="webix_icon mdi mdi-notebook"></span> Recipes';

const kRecipesPanelListId = 'panel:recipes_list';

export default class RecipeWidget extends WaltzWidget {
    constructor(app) {
        super(kWidgetRecipe, app);
        const proxy = {
        $proxy: true,
            load: (view, params) => {
            return this.app.getContext(kUserContext)
                .then(userContext => userContext.getOrDefault(this.name, []).map(recipe => new Recipe(recipe)));
        },
            save: (master, params, dataProcessor) =>{

            let promiseContext = this.app.getContext(kUserContext);
            switch(params.operation){
                case "insert":
                promiseContext = promiseContext
                        .then(userContext => userContext.updateExt(this.name, ext => ext.push(params.data)))
                    break;
                case "update":

                    promiseContext = promiseContext
                        .then(userContext => userContext.updateExt(this.name, ext =>
                            webix.extend(
                                ext.find(recipe => recipe.id === params.id),
                                params.data,
                                kOverwrite)));
                    break;
                case "delete":


                    promiseContext = promiseContext
                        .then(userContext => {
                            const indexOf = userContext.get(this.name).findIndex(recipe => recipe.id === params.id)
                            return userContext.updateExt(this.name, ext => ext.splice(indexOf, 1));
                        });
                    break;
            }

            return promiseContext
                .then(userContext => userContext.save())
                .then(() => this.dispatch(`Successfully ${params.operation}ed Recipe[${params.id}]`,kTopicLog, kChannelLog));
        }
    };

    this.data = new webix.DataCollection({
        url: proxy,
        save: proxy
    });
}

    ui(){
        return {
            header: "<span class='webix_icon wxi-pencil'></span> Recipe",
            close: true,
            body:
                {   
                    id: this.name,
                    view: "recipe_view",
                    root:this
                }
        }
    }

    panel(){
        return {
            view:"accordionitem",
            header: kRecipesPanelHeader,
            headerAlt: kRecipesPanelHeader,
            headerHeight: 32,
            headerAltHeight: 32,
            collapsed: true,
            id: kRecipesPanelListId,
            body:{
                view: 'recipes_list',
                root: this
            }
        }
    }

    run(){
        const tab = $$(this.name) || $$(this.app.getWidget(kMainWindow).mainView.addView(this.ui()));
        tab.show();

        const panel = $$(kRecipesPanelListId) || $$(this.app.getWidget(kMainWindow).leftPanel.addView(this.panel()));
        panel.expand();
    }


    beforeCloseMain(){
        const panel = $$(kRecipesPanelListId);
        panel.collapse();
        this.app.getWidget(kMainWindow).leftPanel.removeView(panel);
    }


    saveRecipe(recipe){
        if (this.data.exists(recipe.id))
            this.data.updateItem(recipe.id, recipe);
        else
            this.data.add(recipe);

        this.dispatch(`Saving Recipe[${recipe.name}]`,kTopicLog, kChannelLog);

        return recipe;
    }



    removeRecipe(id){
        this.data.remove(id);

        this.dispatch(`Removing Recipe[${id}]`,kTopicLog, kChannelLog);
    }

    async ExecuteRecipe(recipe){

        webix.ajax().get("http://localhost:8081/tango/rest/v11/hosts/tangobox;port=10000/devices/sys/tg_test/1/attributes/boolean_scalar/value")
        .then(function(data){

            //response text
console.log(data.text())
            return(data.text())

        },
        function(data){
            console.log('fail')
            this.dispatch(`Could not read attribute[${data}]`,kTopicLog, kChannelLog)        
        });
    }

}