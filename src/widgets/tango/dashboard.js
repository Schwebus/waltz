import {WaltzWidget} from "@waltz-controls/middleware";
import {kMainWindow} from "widgets/main_window";
import {kUserContext} from "controllers/user_context";
import {kChannelLog, kTopicLog} from "controllers/log";
import TableViewWidget from "./table_view";
import {
    kWidgetDashboardProfilesId,
    kWidgetDashboardProfilesPanel,
    kWidgetDashboardProfilesPanelId,
    newDashboardProfilesPanel
} from "views/tango/dashboard_widget";

const kDashboardHeader = "<span class='webix_icon mdi mdi-gauge'></span> Dashboard";
const kWidgetDashboard = 'widget:dashboard';


export const mainView = {
    header: kDashboardHeader,
    body: {
        id: kWidgetDashboard,
        view: 'multiview',
        cells: [{
            template: '<span class="webix_icon mdi mdi-spin mdi-loading" data-inline="false"></span> loading...'
        }]
    }
}

class Profile{
    constructor(id, name, type, viewId = undefined){
        this.id = id;
        this.name = name;
        this.type = type;
        this.viewId = viewId;
    }
}

function createInnerWidgetUI(type, config){
    switch (type) {
        case "table":
            return new TableViewWidget(config).ui();
        case "plot":
            return newPlotlyWidgetBody(config);
        case "list":
            return TangoWebapp.ui.newStatefulAttrsMonitorView(config);
    }
}


export default class DashboardWidget extends WaltzWidget {
    constructor() {
        super(kWidgetDashboard);
    }

    /**
     *
     * @return {Promise<UserContext>}
     */
    getUserContext(){
        return this.app.getContext(kUserContext);
    }

    config(){
        this.proxy = {
            $proxy:true,
            load:()=>{
                return this.getUserContext()
                    .then(userContext => userContext.getOrDefault(this.name, []))
            },
            save:(master, params, dataProcessor)=>{
                switch (params.operation) {
                    case "insert":
                        return this.getUserContext()
                            .then(userContext => userContext.updateExt(this.name, ext => ext.push(params.data)))
                            .then(userContext => userContext.save())
                            .then(() => this.dispatch(`Successfully saved new profile ${params.data.name}`,kTopicLog, kChannelLog));
                    case "delete":
                        return this.getUserContext()
                            .then(userContext => userContext.updateExt(this.name, ext => {
                                const index = ext.findIndex(profile => profile.id === params.id)
                                ext.splice(index,1);
                            }))
                            .then(userContext => userContext.save())
                            .then(() => this.dispatch(`Successfully deleted profile ${params.data.name}`,kTopicLog, kChannelLog));
                    default:
                        throw new Error(`Unsupported operation ${params.operation}`);
                }
            }
        }
    }

    panel(){
        return newDashboardProfilesPanel(this);
    }

    get $$main() {
        return $$(this.name);
    }

    get $$profiles(){
        return $$(kWidgetDashboardProfilesPanelId).$$(kWidgetDashboardProfilesId)
    }

    run(){
        const panel = $$(kWidgetDashboardProfilesPanel) || $$(this.app.getWidget(kMainWindow).leftPanel.addView(this.panel()));
    }

    showProfileWidget(profile){
        const view = $$(profile.viewId) || $$(profile.viewId = this.$$main.addView(createInnerWidgetUI(profile.type, {id: profile.id, app: this.app})));

        view.show();
    }

    createProfile({name,type}){
        const profile = new Profile(webix.uid(), name, type);

        this.showProfileWidget(profile);

        this.$$profiles.add(profile);
    }

    deleteProfile(id){
        const profile = this.$$profiles.getItem(id);
        this.$$profiles.remove(id);

        $$(profile.viewId).destructor()
    }
}