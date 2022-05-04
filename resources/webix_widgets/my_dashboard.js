/**
 * @module MyDashboard
 */
(function(){
    //this function is private to this module
    var newPlotWidget=function(){
        return {
            gravity: 3,
            template: "template"
        }
    };

    /**
     * @type {webix.protoUI}
     */
    var my_dashboard = webix.protoUI(
        {
            name: 'my_dashboard',
            /**
             * @return {webix.ui}
             * @private
             */
            _ui:function(){
                return {
                    rows:[
                        {},
                        {
                            gravity: 3,
                            cols:[
                                {},
                                //call of the functuon. It is a good idea to move parts of the UI to a dedicated functions
                                newPlotWidget(),
                                {}
                            ]
                        },
                        {}
                    ]
                }
            },
            /**
             *
             * @param config
             * @constructor
             */
            $init:function(config){
                //extend client config with this widget's ui
                webix.extend(config, this._ui());
                //add some after construction logic
                this.$ready.push(function(){
                    webix.message("My dashboard has been initialized!")
                }.bind(this));//very important to bind function to a proper this object
            }
        }
    // webix.IdSpace is required to isolate ids within this component
    , webix.IdSpace, webix.ui.layout);//this component extends webix layout -- an empty view

    //this function will be available globally i.e. exports our dashboard
    var newMyDashboard = function(config){
        return webix.extend({
            view: 'my_dashboard'
        }, config);
    }
})();
