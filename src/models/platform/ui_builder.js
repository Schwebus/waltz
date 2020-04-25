function newPanelToolbar(side) {
    return {
        view: "toolbar",
        id: `${side}_panel_toolbar`,
        cols: [
            {
                view: "icon",
                icon: "wxi-sync",
                click() {
                    OpenAjax.hub.publish(`${side}_panel_toolbar.click.refresh`, {});
                }
            }
        ]
    }
}

/**
 * Model ui_builder
 *
 * Extends {@link https://jmvc-15x.github.io/docs/classes/MVC.Model.html MVC.Model}
 * @namespace {TangoWebappPlatform}
 * @memberof TangoWebappPlatform
 */
UIBuilder = MVC.Model.extend('ui_builder',
    /** @lends  TangoWebappPlatform.UIBuilder */
    {

        attributes: {},
        default_attributes: {}
    },
    /** @lends  TangoWebappPlatform.UIBuilder.prototype */
    {
        _ui: null,
        /**
         * @constructs
         */
        init: function () {
            this._ui = {
                _top: { maxHeight: 1 },
                main: [],
                _bottom: { maxHeight: 1 }
            };
        },

        _enable_left_sidebar: function () {
            this._ui['left'] = [];
        },
        _enable_right_sidebar: function () {
            this._ui['right'] = [];
        },
        /**
         * @param item
         */
        add_left_sidebar_item: function (item) {
            if (!this._ui.hasOwnProperty('left')) this._enable_left_sidebar();
            this._ui['left'].push(item);
        },
        /**
         * @param item
         */
        set_left_item: function (item) {
            this._set_left_item = true;
            this._ui['left'] = item;
        },
        /**
         * @param item
         */
        add_right_sidebar_item: function (item) {
            if (!this._ui.hasOwnProperty('right')) this._enable_right_sidebar();
            this._ui['right'].push(item);
        },
        /**
         * @param item
         */
        set_right_item: function (item) {
            this._set_right_item = true;
            this._ui['right'] = item;
        },
        /**
         * @param item
         */
        add_mainview_item: function (item) {
            this._ui['main'].push(item);
        },
        /**
         * @param {webix.config} top_toolbar
         */
        set_top_toolbar:function(top_toolbar){
            this._ui._top = top_toolbar;
        },
        /**
         * @param {webix.config} bottom_toolbar
         */
        set_bottom_toolbar:function(bottom_toolbar){
            this._ui._bottom = bottom_toolbar;
        },
        _build: function (what) {
            if (this['_set_' + what + '_item']) return webix.extend(this._ui[what],{
                id:`${what}_panel_wrapper`
            });
            else
                return {
                    header:"",
                    collapsed:false,
                    id: `${what}_panel_wrapper`,
                    body: {
                        rows:[
                            {
                                view: "accordion",
                                id:`${what}_panel`,
                                rows: this._ui[what].map(function (el, ndx) {
                                    if (ndx > 0) {
                                        el.collapsed = true
                                    }
                                    return el;
                                })
                            },
                            //TODO provide API for this toolbar
                            newPanelToolbar(what)
                        ]
                    }
                };
        },
        /**
         *
         */
        build: function () {
            const ui = {
                view: 'accordion',
                id: 'ui',
                multi: true,
                cols: []
            };

            if (this._ui.hasOwnProperty('left')) {
                ui.cols.push(this._build('left'));
                ui.cols.push({view:"resizer"});
            }

            ui.cols.push({
                body: {
                    view: "tabview",
                    id: "main-tabview",
                    type: 'space',
                    padding: 0,
                    tabbar: {
                        height: 40,
                        popupWidth: 480,
                        tabMinWidth: TangoWebappPlatform.consts.NAME_COLUMN_WIDTH,
                        tabMoreWidth: 40,
                        bottomPadding: 5
                    },
                    cells: this._ui.main
                }
            });

            if (this._ui.hasOwnProperty('right')) {
                ui.cols.push({view:"resizer"});
                ui.cols.push(this._build('right'));
            }

            webix.html.remove(document.getElementById('ajax-loader'));

            webix.ui({
                view: 'layout',
                id: 'main',
                type: 'space',
                rows: [
                    this._ui._top,
                    ui,
                    this._ui._bottom
                ]
            });
            webix.ui.fullScreen();
        }
    }
);