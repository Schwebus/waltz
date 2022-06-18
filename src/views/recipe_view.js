 import Recipe from "models/recipe_model";

 import {WaltzWidgetMixin} from "@waltz-controls/waltz-webix-extensions";

// class to globally keep track of number of phases currently displayed

class no_phases {

    constructor(inital_no_phases){

        this.current_no_phases = inital_no_phases;

    }

    get get(){
        return this.current_no_phases
    }

    set set(x){
        this.current_no_phases =  x
    }

}


function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
   }


var current_no_phases = new no_phases(1);


// toolbar to make, save, delete and run recipes

const upper_toolbar = function (current_no_phases){
    return{
     view: 'toolbar',
     cols: [
         
         {
             maxWidth: 380,
             view: 'text',
             id: 'recipe_name',
             name: 'recipe_name',
             placeholder: 'recipe name',
             label: 'Recipe name:',
             labelWidth: 100,
             validate:webix.rules.isNotEmpty, 
             invalidMessage:"Recipe name can not be empty",
             on: {

                 onBindApply: function (recipe) {
                     if (!recipe || recipe.id === undefined) {
                         this.setValue(''); //reset this value after recipe removal
                         return false;
                     }
                     this.setValue(recipe.name);
                 },
                 
                 /*
                  * Event listener. Work-around [object Object] in this field.
                  */

                 onBindRequest:function(){
                     if(typeof this.data.value === 'object')
                         this.data.value = '';
                 }
             }
         },
         {
             view: "icon",
             icon: 'wxi-check',
             click: function () {
                 this.getTopParentView().save();
             },
             hotkey: 'ctrl+s',
             tooltip: 'Hotkey: ctrl+s'
         },
         {
             view: "icon",
             icon: 'wxi-trash',
             click: function () {
                 this.getTopParentView().remove();
                 this.getTopParentView().new(current_no_phases);
             }
         },
         {
             view: "icon",
             icon: 'mdi mdi-play',
             click: function () {
                 this.getTopParentView().execute();
             },
             hotkey: 'ctrl+enter',
             tooltip: 'Hotkey: ctrl+enter'
         },
         {
            view: "icon",
            icon: 'mdi mdi-stop',
            click: function () {
                this.getTopParentView().stop();
            },
            hotkey: 'ctrl+enter',
            tooltip: 'Hotkey: ctrl+enter'
        },
         {
            view: "icon",
            icon: 'wxi-plus',
            click: function () {
                this.getTopParentView().new(current_no_phases);
            },
            hotkey: 'ctrl+s',
            tooltip: 'Hotkey: ctrl+s'
        },
     ]
 }
};
 
 // list in panel which shows saved recipes for user

const recipes_list = webix.protoUI({
     name: 'recipes_list',
     $init(config){
         this.$ready.push(() => {
             this.data.sync(config.root.data);
         })
     },
     defaults:{
         select: true,
         template: '<span class="webix_list_icon mdi mdi-file-document-outline"></span> #name#',
         on: {
             onAfterSelect(id) {
                 this.config.root.data.setCursor(id);
             }
         }
     }
 },webix.ui.list);


// output field for info about recipe execution

const output = {
    view: 'fieldset',
    label: 'Fermentation State',
    body: {
        cols:[
        {
            view:"icon",
            icon:"wxi-sync",
            click(){
                webix.ajax().get(
                    "http://localhost:8080/tango/rest/v11/hosts/databaseds;port=10000/devices/bioreactor/processes/recipe/attributes/cur_status/value").then(
                        function(data){
                            webix.ui.views["$accordion1"].getTopParentView().$$('output').setValue(data.json().value)
                        },
                        function(){

                            webix.ui.views["$accordion1"].getTopParentView().$$('output').setValue("No recipe being currently executed")
                        }
                    )

            }
        },

        {
            view: 'textarea',
            height: 80,
            value: "Init...",
            readonly: true,
            id: 'output',
            on: {
                onBindApply: async function () {
                    while (true){
                    webix.ajax().get(
                        "http://localhost:8080/tango/rest/v11/hosts/databaseds;port=10000/devices/bioreactor/processes/recipe/attributes/cur_status/value").then(
                            function(data){
                                webix.ui.views["$accordion1"].getTopParentView().$$('output').setValue(data.json().value)
                            },
                            function(){
                                webix.ui.views["$accordion1"].getTopParentView().$$('output').setValue("No recipe being currently executed")
                            }
                        )

                    await sleep(10000)
                        }

                },

                /*
                  * Event listener. Work-around [object Object] in this field.
                  */

                onBindRequest:function(){
                    webix.ui.views["$accordion1"].getTopParentView().$$('output').setValue("Init...")
                }
            }
        }
    ]

    }
};

// main view

 const recipe_view = webix.protoUI(

    
     {

     name: 'recipe_view',

     // function to empty forms to make new recipe

     new:function(current_no_phases){


        remove_views(current_no_phases, this)
        this.getTopParentView().$$("parameters_phase_1").setValues({

            temp:       "",
            pressure:   "",
            pH:         "",
            flow:       "",
            af:         "",
            stirrer:    "",
            po2:        "",
            feed:       ""

        })
        
        this.getTopParentView().$$("acc").addView(
            switching_view({}, 1, true)
        )


        

     },

        /* function triggered by clicking save button
            --> saves recipe in user context
            structure of recipe is a nested object
            documenting the phases' and switching
            conditions as well as meta data */

     save:function(){
         
        if(!this.isVisible() || this.$destructed) return;
 
         if(!this.$$('recipe_name').validate()) return;

         var current_no_phases = this.getTopParentView().$$("acc")._cells.length / 2

         var phases = {}

         var switching = {}

         for (var i=1; i<=current_no_phases; i++){
            var which_switching = this.getTopParentView().$$("acc").getChildViews()[i*2-1].getChildViews()[0].getTabbar().getValue()

            switching["Switching " + (i)] = { 
                
                                            "Logic": which_switching.slice(0,(which_switching.length - 2)),

                                            "Checked": {
                                                
                                                time: (which_switching.slice(0,(which_switching.length - 2)) == 'custom') ? 
                                                    "" : this.getTopParentView().$$(
                                                    which_switching.slice(0,(which_switching.length - 2)) + "_check_time_" + (i))
                                                    .getValue(),
                                                weight: (which_switching.slice(0,(which_switching.length - 2)) == 'custom') ? 
                                                    "" : this.getTopParentView().$$(
                                                    which_switching.slice(0,(which_switching.length - 2)) + "_check_weight_" + (i))
                                                    .getValue(),
                                                exito2: (which_switching.slice(0,(which_switching.length - 2)) == 'custom') ? 
                                                    "" : this.getTopParentView().$$(
                                                    which_switching.slice(0,(which_switching.length - 2)) + "_check_exito2_" + (i))
                                                    .getValue(),
                                                exitco2: (which_switching.slice(0,(which_switching.length - 2)) == 'custom') ? 
                                                    "" : this.getTopParentView().$$(
                                                    which_switching.slice(0,(which_switching.length - 2)) + "_check_exitco2_" + (i))
                                                    .getValue()
                
                                            },

                                            "Values": this.getTopParentView().$$(which_switching).getValues()

            }

            phases["Phase " + i] = this.getTopParentView().$$("parameters_phase_" + i).getValues()

         }

         var meta = {
             "Recipe Name": this.$$("recipe_name").getValue(),
             "Number of Phases" : current_no_phases,
         }

         const id = this.$$('recipe_name').getValue().trim()

         const recipe = new Recipe({id, meta, phases, switching})

         return this.config.root.saveRecipe(recipe)
     },

     /* function triggered by remove button
        --> deletes recipe from user context */

     remove:function(){

         if(!this.$$('recipe_name').validate()) return null;
         const id = this.$$('recipe_name').getValue().trim();
 
         this.config.root.removeRecipe(id);
     },

     stop:function(){

        if(!this.isVisible() || this.$destructed) return;
 
        const recipe = this.save();
        if(recipe == null) return;

       const rest_host = 'localhost'
       const rest_port = '8080'
       const rest_version = 'v11'
       const tango_host = 'databaseds'
       const tango_port = '10000'

       webix.ajax()
       .headers({
           "Content-type":"application/json"})
           .put(

           "http://"+rest_host+":"+rest_port+"/tango/rest/"+rest_version+"/hosts/"+tango_host+";port="+tango_port+"/devices/bioreactor/processes/recipe/commands/Stop?filter=!input",
            
           {"host":tango_host":"+tango_port,"device":"bioreactor/processes/recipe","name":"Stop"}
           
           )

   .then(function(data){

           console.log(data.json())

       }

    , function(data){

       console.log(data.json())

               }
           )
        
        },


     /* function triggered by execute button
        --> calls tango api */

     execute: function () {

         if(!this.isVisible() || this.$destructed) return;
 
         const recipe = this.save();
         if(recipe == null) return;

       const rest_host = 'localhost'
       const rest_port = '8080'
       const rest_version = 'v11'
       const tango_host = 'databaseds'
       const tango_port = '10000'

       webix.ajax()
       .headers({
           "Content-type":"application/json"})
           .put(

           "http://"+rest_host+":"+rest_port+"/tango/rest/"+rest_version+"/hosts/"+tango_host+";port="+tango_port+"/devices/bioreactor/processes/recipe/commands/Start?filter=!input",
            
           {"host":tango_host":"+tango_port,"device":"bioreactor/processes/recipe","name":"Start","input":JSON.stringify(recipe)}
            
            )

    .then(function(data){

            console.log(data.json())

        }

     , function(data){

        console.log(data.json())

                }
            )

    },

     /* function to create to views */

     _ui:function(){

        return {

            // UI is nested structure of multiple views

          rows: [

              upper_toolbar(current_no_phases),

              // scrollview as main container

              { view: 'scrollview',     
                  body:{
                      rows:[

                        /* accordion view to make interface interactive
                            - each acc-item represents either parameters
                            for a phase or switching conditions */

                {view:"accordion",
                    id:"acc",
                     multi:true,
                     rows:[
                     { header: "Phase 1",
                     body:
                     {
                     view:"form", 
                     id:"parameters_phase_1",

                     // this function loads saved recipes from user context

                     on: {

                        onBindApply: function (recipe) {

                            // if no recipe

                            if (!recipe  || recipe.id === undefined) return false;
                            
                            // setting appropriate variables and filling first form

                            var phases = recipe.phases

                            this.setValues(phases["Phase 1"]);

                            var no_phases_loaded_recipe = Object.keys(phases).length
                                      
                            var switching = recipe.switching

                            /*  removing currently displayed views other than first one
                                which has already been set according to loaded recipe   */

                                remove_views(current_no_phases,this);

                            // set current_no_phases (next phase to be added) correctly

                            current_no_phases.set = no_phases_loaded_recipe

                            // adding new views

                            for (var i=1; i<=current_no_phases.get; i++){

                                if (i != 1){
                              
                                this.getTopParentView().$$("acc").addView(

                                phase_view(phases, i)

                              )
                                }

                              var end_conditions;

                              if (i != current_no_phases.get){

                                end_conditions = false

                              }

                              else{
                                end_conditions = true

                              }
                              this.getTopParentView().$$("acc").addView(

                                switching_view(switching, i, end_conditions)

                              )
                            
                              // select correct tab

                            this.getTopParentView().$$("tabbar_switching_" + (i)).setValue(
                                switching["Switching " + (i)]["Logic"] + "_" + (i))
                        
                            }
                                                             
                            }

                        }
                    ,


                        /* basic view of one phase which can be extended by creating
                            a new recipe or loading an old one */

                     elements:[

                      {cols:[

                        {rows:[
                      { view:"text", id:"temp", label:"Temperature (°C)", name:"temp", maxWidth:200, labelWidth:150},
                      { view:"text", id: "pressure", label:"Pressure (bar)", name:"pressure", maxWidth:200, labelWidth:150},
                  ]},

                        {rows:[
                      { view:"text", label:"pH", name:"ph", maxWidth:200, labelWidth:150},
                      { view:"text", label:"Air Flow (L/min)", name:"flow", maxWidth:200, labelWidth:150}
                  ]},
                      
                        {rows:[
                      { view:"text", label:"Anti-Foam", name:"af", maxWidth:200, labelWidth:150},
                      { view:"text", label:"Stirrer (/min)", name:"stirrer", maxWidth:200, labelWidth:150}
                  ]},

                        {rows:[
                      { view:"text",label:"pO2 (%)", name:"po2", maxWidth:200, labelWidth:150},
                      { view:"text", label:"Feed (%)", name:"feed", maxWidth:200, labelWidth:150}
                  ]}
                     ]}
                  ],

                     elementsConfig:{padding: 10}
                     }
                     },
                     switching_view({}, 1, true)
             ]
            }
            
             ,

             {cols:[    add_button(current_no_phases)

                        ,
                       
                        remove_button(current_no_phases)

          ] } ] } },

          {
            view: 'resizer'

            },
            
            output

     ] } },
  
  $init:function(config){

      // extend client config with this widget's ui

      webix.extend(config, this._ui());

      this.$ready.push(function(){

        this.$$('parameters_phase_1').bind(config.root.data)

        this.$$('recipe_name').bind(config.root.data);

        this.$$('output').bind(config.root.data);

          webix.message("Recipe has been initialized!")
      })
  }
}
// webix.IdSpace is required to isolate ids within this component
, WaltzWidgetMixin, webix.IdSpace, webix.ui.layout);//this component extends webix layout -- an empty view

//================== HELPERS/VIEWS ==================//

const add_button = function(current_no_phases){

    return { 
        view:"button", 
        icon: "wxi-plus-circle", 
        value:"Add Phase",                        
        click:function(id){

            this.getTopParentView().$$("acc").getChildViews()
            [(this.getTopParentView().$$("acc").getChildViews().length) - 1]
            .define('header','Switching Conditions')

            this.getTopParentView().$$("acc").getChildViews()
            [(this.getTopParentView().$$("acc").getChildViews().length) - 1]
            .refresh()

            // add phase and switching conditions

            $$(id).getTopParentView().$$("acc").addView(

                phase_view({},current_no_phases.get + 1)

                        )

            $$(id).getTopParentView().$$("acc").addView(

                switching_view({},current_no_phases.get + 1, true)

                                    )
            
            // update current number of phases

            current_no_phases.set = current_no_phases.get + 1;

                        }
                    }
}

const remove_button = function(current_no_phases){

    return{
        view:"button", 
        icon: "wxi-plus-circle", 
        value:"Remove Phase",                        
        click:function(id){
           if(current_no_phases.get > 1){

        // remove last phase + switching conditions

                remove_phase(current_no_phases, this)

                this.getTopParentView().$$("acc").getChildViews()
            [(this.getTopParentView().$$("acc").getChildViews().length) - 1]
            .define('header','Ending Conditions')

            this.getTopParentView().$$("acc").getChildViews()
            [(this.getTopParentView().$$("acc").getChildViews().length) - 1]
            .refresh()

           }
           

               

   }
}}

// helper to remove one phase

const remove_phase = function(current_no_phases, obj){

    // safety check if not already at first phase

    if (current_no_phases.get > 1){

    obj.getTopParentView().$$("acc").removeView(
    obj.getTopParentView().$$("acc").getChildViews()
    [(obj.getTopParentView().$$("acc").getChildViews().length) - 1])        
    
    obj.getTopParentView().$$("acc").removeView(
    obj.getTopParentView().$$("acc").getChildViews()
    [(obj.getTopParentView().$$("acc").getChildViews().length) - 1]) 
    
    current_no_phases.set = current_no_phases.get - 1;

    }
}

// helper to remove all phases but first
 
const remove_views = function(current_no_phases,obj){

    for (var j=(current_no_phases.get); j>1; j--){

        remove_phase(current_no_phases, obj)
    
    }

    /* remove last switching panel as it is added 
    when clicking new button after this function
    (remove_views) is called */

    obj.getTopParentView().$$("acc").removeView(
    obj.getTopParentView().$$("acc").getChildViews()
    [(obj.getTopParentView().$$("acc").getChildViews().length) - 1]) 

}

// function to create new or load switching view

const switching_view = function(switching, switching_no, end_conditions = false){

    var header_name;

    if (end_conditions){

        header_name = "Ending Conditions"

    }

    else{

        header_name = "Switching Conditions"

    }

    if(Object.keys(switching) == 0){

        var switching = {}
        
            
        switching["Switching " + switching_no] =    {   
                                                        "Logic":null,
                                                        "Checked":null,
                                                        "Values":null,
                                                    }

        switching["Switching " + switching_no]["Logic"] = "or"

        switching["Switching " + switching_no]["Checked"] = 

        {

            time :      0,
            weight:     0,
            exito2:     0,
            exitco2:    0,

            }
        
        switching["Switching " + switching_no]["Values"] =

        {

                time:       "",
                weight:     "",
                exit02:     "",
                exitco2:    "",

            } 
        
    }

    return {
    view:"accordionitem",
    id:"acc_item_switching_" + switching_no,
     header: header_name,
     body:
     {
         view: "tabview",
         id: "tabbar_switching_" + switching_no,
         cells: [
           {
             header: "OR Logic",
             body: {
               view: "form",
               id: "or_" + switching_no,
               elements:[
              {cols:[

                {view: "spacer"},

                  {rows:[
                      { view:"checkbox", id: 'or_check_time_' + switching_no, 
                        value: (switching["Switching " + switching_no]["Logic"] != "or") ? 0 :  
                        switching["Switching " + switching_no]["Checked"].time,
                        width: 20},
                      { view:"checkbox", id: 'or_check_weight_' + switching_no, 
                        value: (switching["Switching " + switching_no]["Logic"] != "or") ? 0 :  
                        switching["Switching " + switching_no]["Checked"].weight,
                        width: 20},
                      { view:"checkbox", id: 'or_check_exito2_' + switching_no, 
                        value: (switching["Switching " + switching_no]["Logic"] != "or") ? 0 :  
                        switching["Switching " + switching_no]["Checked"].exito2,
                        width: 20},
                      { view:"checkbox", id: 'or_check_exitco2_' + switching_no, 
                        value: (switching["Switching " + switching_no]["Logic"] != "or") ? 0 :  
                        switching["Switching " + switching_no]["Checked"].exitco2,
                        width: 20},
                       ] },

                  {rows:[
              { view:"text", label:"Time (min)", name:"time", 
                value: (switching["Switching " + switching_no]["Logic"] != "or") ? "" :  
                switching["Switching " + switching_no]["Values"].time,
                maxWidth:200, labelWidth:150},
              { view:"text", label:"Weight (kg)", name:"weight",
                value: (switching["Switching " + switching_no]["Logic"] != "or") ? "" :  
                switching["Switching " + switching_no]["Values"].weight,
                maxWidth:200, labelWidth:150},
              { view:"text", label:"Exit O2 (%)", name:"exito2",
                value: (switching["Switching " + switching_no]["Logic"] != "or") ? "" :  
                switching["Switching " + switching_no]["Values"].exito2,
                maxWidth:200, labelWidth:150},
              { view:"text", label:"Exit CO2 (%)", name:"exitco2", 
                value: (switching["Switching " + switching_no]["Logic"] != "or") ? "" :  
                switching["Switching " + switching_no]["Values"].exitco2,
                maxWidth:200, labelWidth:150},
               ] },

               {view: "spacer"},

          ]}
          ],
          elementsConfig:{padding: 10}
             }
           },
           {
             header: "AND Logic",
             body: {
               view: "form",
               id: "and_" + switching_no,
               elements:[
                {cols:[

                    {view: "spacer"},
    
                      {rows:[
                          { view:"checkbox", id: 'and_check_time_' + switching_no, 
                            value: (switching["Switching " + switching_no]["Logic"] != "and") ? 0 :  
                            switching["Switching " + switching_no]["Checked"].time,
                            width: 20},
                          { view:"checkbox", id: 'and_check_weight_' + switching_no, 
                            value: (switching["Switching " + switching_no]["Logic"] != "and") ? 0 :  
                            switching["Switching " + switching_no]["Checked"].weight,
                            width: 20},
                          { view:"checkbox", id: 'and_check_exito2_' + switching_no, 
                            value: (switching["Switching " + switching_no]["Logic"] != "and") ? 0 :  
                            switching["Switching " + switching_no]["Checked"].exito2,
                            width: 20},
                          { view:"checkbox", id: 'and_check_exitco2_' + switching_no, 
                            value: (switching["Switching " + switching_no]["Logic"] != "and") ? 0 :  
                            switching["Switching " + switching_no]["Checked"].exitco2,
                            width: 20},
                           ] },
    
                      {rows:[
                  { view:"text", label:"Time (min)", name:"time", 
                    value: (switching["Switching " + switching_no]["Logic"] != "and") ? "" :  
                    switching["Switching " + switching_no]["Values"].time,
                    maxWidth:200, labelWidth:150},
                  { view:"text", label:"Weight (kg)", name:"weight",
                    value: (switching["Switching " + switching_no]["Logic"] != "and") ? "" :  
                    switching["Switching " + switching_no]["Values"].weight,
                    maxWidth:200, labelWidth:150},
                  { view:"text", label:"Exit O2 (%)", name:"exito2",
                    value: (switching["Switching " + switching_no]["Logic"] != "and") ? "" :  
                    switching["Switching " + switching_no]["Values"].exito2,
                    maxWidth:200, labelWidth:150},
                  { view:"text", label:"Exit CO2 (%)", name:"exitco2", 
                    value: (switching["Switching " + switching_no]["Logic"] != "and") ? "" :  
                    switching["Switching " + switching_no]["Values"].exitco2,
                    maxWidth:200, labelWidth:150},
                   ] },
    
                   {view: "spacer"},
    
              ]}
              
  
          ],
          elementsConfig:{padding: 10}
             }
           }/*,
           {
             header: "Custom",
             body: {
               view: "template",
               id: "custom_" + switching_no,
               template:"Custom Logic"
             }
           }*/
         ]}
        }
    }

// function to create or load phase view

const phase_view = function(phases, phase_no){

    /*  if a new phase is created, a dummy object is made to make
        code more compact */

    if(Object.keys(phases) == 0){

        var phases = {}
            
        phases["Phase " + phase_no] = {

                temp:       "",
                pressure:   "",
                pH:         "",
                flow:       "",
                af:         "",
                stirrer:    "",
                po2:        "",
                feed:       ""

            } 
        
    }


    return {
        
            view: 'accordionitem',
            id:'acc_item_parameters_' + phase_no,
            header: "Phase " + phase_no,
            body:
            {
                view:"form", 
                id:"parameters_phase_" + phase_no,
                    elements:[
                        {cols:[
                            {rows:[
        { view:"text", label:"Temperature (°C)", name:"temp", maxWidth:200, labelWidth:150, 
        value:phases["Phase " + phase_no].temp},
        { view:"text", label:"Pressure (bar)", name:"pressure", maxWidth:200, labelWidth:150,
        value:phases["Phase " + phase_no].pressure},
 ]},
                            {rows:[
        { view:"text", label:"pH", name:"ph", maxWidth:200, labelWidth:150,
        value:phases["Phase " + phase_no].pH},
        { view:"text", label:"Air Flow (L/min)", name:"flow", maxWidth:200, labelWidth:150,
        value:phases["Phase " + phase_no].flow}
 ]},
                            {rows:[
     { view:"text", label:"Anti-Foam", name:"af", maxWidth:200, labelWidth:150,
     value:phases["Phase " + phase_no].af},
     { view:"text", label:"Stirrer (/min)", name:"stirrer", maxWidth:200, labelWidth:150,
     value:phases["Phase " + phase_no].stirrer}
 ]},
                            {rows:[
     { view:"text", label:"pO2 (%)", name:"po2", maxWidth:200, labelWidth:150,
     value:phases["Phase " + phase_no].po2},
     { view:"text", label:"Feed (%)", name:"feed", maxWidth:200, labelWidth:150,
     value:phases["Phase " + phase_no].feed}
 ]}
    ]}
 ],
    elementsConfig:{padding: 10}
        }
    }
}
