webix.protoUI({
    name:"Device Panel",
    defaults: {
        head: {template: "Device panel [#name#]"},
        position: "center",
        move: true,
        height: 640,
        width: 480,
        body: {
            view: "layout",
            rows: [
                {
                    view: "tabview",
                    cells: [
                        {
                            header: "Commands",
                            body: {
                                template: "Commands body"
                            }
                        },
                        {
                            header: "Attributes",
                            body: {
                                template: "Attributes body"
                            }
                        },
                        {
                            header: "Admin",
                            body: {
                                template: "Admin body"
                            }
                        }
                    ]
                },
                {view: "resizer"},
                {
                    template: "Log"
                },
                {
                    view: "toolbar",
                    cols: [
                        {view: "button", id: "btnClear", value: "Clear history", width: 100, align: "right"},
                        {
                            view: "button",
                            id: "btnDismiss",
                            value: "Close",
                            width: 100,
                            align: "right",
                            click: function () {
                                this.getTopParentView().close()
                            }
                        }]
                }

            ]
        },
        on:{
            onBeforeShow:function(){
                var device = TangoWebapp.getDevice();
                this.getHead().setValues({name:device.name});
            }
        }
    }
},webix.IdSpace,webix.EventSystem,webix.ui.window);