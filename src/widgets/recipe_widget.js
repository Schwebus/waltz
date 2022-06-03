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

// helper for recipe execution

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
   }

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







    // ######################## Exec Recipe ######################## //





    async ExecuteRecipe(recipe, rest_host, rest_port, rest_version, tango_host, tango_port){
        console.log('exec started')
        var phases = recipe.phases
        var switching = recipe.switching
    
        var no_phases = Object.keys(phases).length
    
        for (var i = 1; i <= no_phases; i++){
            console.log('phase ' + i + " started")
    
            var parameters = phases["Phase " + i]
    var parameters = ['double_scalar', 'boolean_scalar']
            var promises = []
    
            for (var j = 1; j <= Object.keys(parameters).length; j++){
                
                var repeat_parameter_setting = false

                var post = webix.ajax().put("http://" + rest_host + ":"
                + rest_port + "/tango/rest/" + rest_version + "/hosts/"
                + tango_host + ";" + tango_port + "=" + "/devices/" 
                //+ "bioreactor/parameters
                + "sys/tg_test/1/attributes/" + parameters[j-1]
                //+ String(Object.keys(parameter)[j-1]).toLowerCase()
                + "/value?=" + i//String(Object["Values"](parameter)[j-1])
                )
                //console.log(post)
                //console.log(eval('const ' + 'promise_' + j + ' = ' + post + ';'))
                //promises.push(eval('const ' + 'promise_' + j + ' = ' + post + ';'))
                promises.push(post)
            
            }

            await Promise.all(promises)

            //console.log('parameter setting promises done, testing if any return invalid quality or promise failure')
            .then(function(data){
    
                    for (var k = 0; k < Object.keys(data).length; k++){
                        if (data[k].json().quality != "ATTR_VALID"){
                            console.log('a parameter write return invalid attr:')
                            console.log(data[k].json())
    
                            // try setting parameter values again

                            repeat_parameter_setting = true
    
                        }

                    }
                    //return new Promise( function (resolve, reject){reject()});

            console.log('all good with parameter setting')
                }
    
             , function(data){

                 console.log('some parameter setting promise returned error')
    
                return new Promise( function (resolve, reject){reject()});
    
             }
    
             )
    
            //print its running to screen
    
    
            console.log("Phase " + i + "running")
    
             if (repeat_parameter_setting){

                i -= 1

                continue

             }

             // test because one less switching

             if (i < no_phases){
                if (switching["Switching " + i]["Logic"] == "or"){

                    var promise_time;
                    var promise_weight;
                    var promise_exito2;
                    var promise_exitco2;
    
                    if (switching["Switching " + i]["Checked"].time){
                        promise_time = new Promise( async function (resolve, reject){
                        await sleep(switching["Switching " + i]["Values"].time * 60 * 1000)
                            resolve()
                            }
                        )
                    }
                    
    
                    if (switching["Switching " + i]["Checked"].weight){
                        promise_weight = new Promise( function (resolve, reject){
                            var finished = false
    
                            while (finished != true){
                                
                           // webix.ajax().get("http://localhost:8081/tango/rest/v11/hosts/tangobox;port=10000/devices/bioreactor/parameters/weight/attributes/value/value")
                            webix.ajax().get("http://localhost:8081/tango/rest/v11/hosts/tangobox;port=10000/devices/sys/tg_test/1/attributes/double_scalar/value")
    
                            .then(function(data){
     
                                if (
                                    parseFloat(data.json().value) == parseFloat(switching["Switching " + i]["Values"].weight)
                                ||  parseFloat(data.json().value) == parseFloat(switching["Switching " + i]["Values"].weight) + 0.5
                                ||  parseFloat(data.json().value) == parseFloat(switching["Switching " + i]["Values"].weight) + 0.5
                                ){
                                finished = true
                                }
                                }
                    
                             , function(data){
                    
                                console.log('Could not query weight')
                    
                                        }
                                    )
                                }
                            
                                resolve()
    
                            }
                        )
                    }
    
                    if (switching["Switching " + i]["Checked"].exito2){
                        promise_exito2 = new Promise( function (resolve, reject){
                            var finished = false
    
                            while (finished != true){
    
                            webix.ajax().get("http://localhost:8081/tango/rest/v11/hosts/tangobox;port=10000/devices/sys/tg_test/1/attributes/double_scalar/value")
                                //"http://localhost:8081/tango/rest/v11/hosts/tangobox;port=10000/\
                                //devices/bioreactor/parameters/exito2/attributes/value/value")
                            .then(function(data){
     
                                if (
                                    parseFloat(data.json().value) == parseFloat(switching["Switching " + i]["Values"].exito2)
                                ||  parseFloat(data.json().value) == parseFloat(switching["Switching " + i]["Values"].exito2) + 0.1
                                ||  parseFloat(data.json().value) == parseFloat(switching["Switching " + i]["Values"].exito2) + 0.1
                                ){
                                finished = true
                                }
                                }
                    
                             , function(){
                    
                                console.log('Could not query exit o2')
                    
                                        }
                                    )
                                }
                                
                                resolve()
    
                            }
                        )
                    }
    
                    if (switching["Switching " + i]["Checked"].exitco2){
                        promise_exitco2 = new Promise( function (resolve, reject){
                            var finished = false
    
                            while (finished != true){
    
                            webix.ajax().get("http://localhost:8081/tango/rest/v11/hosts/tangobox;port=10000/devices/sys/tg_test/1/attributes/double_scalar/value")
                                //"http://localhost:8081/tango/rest/v11/hosts/tangobox;port=10000/\
                                //devices/bioreactor/parameters/exitco2/attributes/value/value")
                            .then(function(data){
     
                                if (
                                    parseFloat(data.json().value) == parseFloat(switching["Switching " + i]["Values"].exitco2)
                                ||  parseFloat(data.json().value) == parseFloat(switching["Switching " + i]["Values"].exitco2) + 0.1
                                ||  parseFloat(data.json().value) == parseFloat(switching["Switching " + i]["Values"].exitco2) + 0.1
                                ){
                                finished = true
                                }
                                }
                    
                             , function(){
                    
                                console.log('Could not query exit co2')
                    
                                        }
                                    )
                                }
    
                                resolve()
    
                            }
                        )
                    }

                var promises_race_array = [];

                    if (typeof promise_time != 'undefined'){
                        promises_race_array.push(promise_time)
                        }
                    if (typeof promise_weight != 'undefined'){
                        promises_race_array.push(promise_weight)
                        }
                    if (typeof promise_exito2 != 'undefined'){
                        promises_race_array.push(promise_exito2)
                        }
                    if (typeof promise_exitco2 != 'undefined'){
                        promises_race_array.push(promise_co2)
                        }
                
                console.log(promises_race_array)

                    await Promise.race(promises_race_array)

                    //define a catch
                }
    
                else if (switching["Logic"] == "and"){

                    var promise_time;
                    var promise_weight;
                    var promise_exito2;
                    var promise_exitco2;
    
                    if (switching["Switching " + i]["Checked"].time){
                        promise_time = new Promise( function (resolve, reject){resolve()})
                            setTimeout(promise_time,
                            switching["Switching " + i]["Values"].time * 60 * 1000)                    
                        }
                    
    
                    if (switching["Switching " + i]["Checked"].weight){
                        promise_weight = new Promise( function (resolve, reject){
                            var finished = false
    
                            while (finished != true){
    
                            webix.ajax().get("http://localhost:8081/tango/rest/v11/hosts/tangobox;port=10000/devices/sys/tg_test/1/attributes/double_scalar/value")
                            //("http://localhost:8081/tango/rest/v11/hosts/tangobox;port=10000/devices/bioreactor/parameters/weight/attributes/value/value")
                            .then(function(data){
     
                                if (
                                    parseFloat(data.json().value) == parseFloat(switching["Switching " + i]["Values"].weight)
                                ||  parseFloat(data.json().value) == parseFloat(switching["Switching " + i]["Values"].weight) + 0.5
                                ||  parseFloat(data.json().value) == parseFloat(switching["Switching " + i]["Values"].weight) + 0.5
                                ){
                                finished = true
                                }
                                }
                    
                             , function(data){
                    
                                console.log('Could not query weight')
                    
                                        }
                                    )
                                }
    
                                resolve()
    
                            }
                        )
                    }
    
                    if (switching["Switching " + i]["Checked"].exito2){
                        promise_exito2 = new Promise( function (resolve, reject){
                            var finished = false
    
                            while (finished != true){
    
                            webix.ajax().get("http://localhost:8081/tango/rest/v11/hosts/tangobox;port=10000/devices/sys/tg_test/1/attributes/double_scalar/value")
                                //"http://localhost:8081/tango/rest/v11/hosts/tangobox;port=10000/\
                                //devices/bioreactor/parameters/exito2/attributes/value/value")
                            .then(function(data){
     
                                if (
                                    parseFloat(data.json().value) == parseFloat(switching["Switching " + i]["Values"].exito2)
                                ||  parseFloat(data.json().value) == parseFloat(switching["Switching " + i]["Values"].exito2) + 0.1
                                ||  parseFloat(data.json().value) == parseFloat(switching["Switching " + i]["Values"].exito2) + 0.1
                                ){
                                finished = true
                                }
                                }
                    
                             , function(){
                    
                                console.log('Could not query exit o2')
                    
                                        }
                                    )
                                }
    
                                resolve()
    
                            }
                        )
                    }
    
                    if (switching["Switching " + i]["Checked"].exitco2){
                        promise_exitco2 = new Promise( function (resolve, reject){
                            var finished = false
    
                            while (finished != true){
    
                            webix.ajax().get("http://localhost:8081/tango/rest/v11/hosts/tangobox;port=10000/devices/sys/tg_test/1/attributes/double_scalar/value")
                                //"http://localhost:8081/tango/rest/v11/hosts/tangobox;port=10000/\
                                //devices/bioreactor/parameters/exitco2/attributes/value/value")
                            .then(function(data){
     
                                if (
                                    parseFloat(data.json().value) == parseFloat(switching["Switching " + i]["Values"].exitco2)
                                ||  parseFloat(data.json().value) == parseFloat(switching["Switching " + i]["Values"].exitco2) + 0.1
                                ||  parseFloat(data.json().value) == parseFloat(switching["Switching " + i]["Values"].exitco2) + 0.1
                                ){
                                finished = true
                                }
                                }
                    
                             , function(){
                    
                                console.log('Could not query exit co2')
                    
                                        }
                                    )
                                }
    
                                resolve()
                                
                            }
                        )
                    }

                    var promises_all_array = [];

                    if (typeof promise_time != 'undefined'){
                        promises_all_array.push(promise_time)
                        }
                    if (typeof promise_weight != 'undefined'){
                        promises_all_array.push(promise_weight)
                        }
                    if (typeof promise_exito2 != 'undefined'){
                        promises_all_array.push(promise_exito2)
                        }
                    if (typeof promise_exitco2 != 'undefined'){
                        promises_all_array.push(promise_co2)
                        }

                    await Promise.all(promises_all_array)

                    //define a catch
                }
    
                /*else{
                        CUSTOM 
                }*/
    
             }
    
        }
        console.log('for loop finished')
        return new Promise( function (resolve, reject){resolve()})
    }

}