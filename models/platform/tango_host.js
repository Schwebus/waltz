/**
 *
 * @type {TangoHost}
 */
TangoWebapp.TangoHost = MVC.Model.extend("tango_host",
    /*@Static */
    {
        attributes: {
            host: "string",
            port: "number",
            name: "string",
            id: "string", //host:port
            info: "string[]",
            isAlive: 'boolean'
        },
        default_attributes: {}
    },
    /*@Prototype */
    {
        rest: null,
        database: null,
        toString: function () {
            return this.id;
        },
        toUrl: function () {
            return this.host + "/" + this.port;
        },
        /**
         *
         * @event {OpenAjax} tango_webapp.device_loaded
         *
         * @param name
         * @return {Promise} device
         */
        fetchDevice: function (name) {
            return this.fetchDatabase()
                .then(function (db) {
                    return db.getDeviceInfo(name);
                })
                .then(function (info) {
                    var device = new TangoWebapp.TangoDevice({
                        info: info,
                        id: this.id + "/" + name,
                        name: name,
                        host: this
                    });
                    this.addDevice(device);
                    OpenAjax.hub.publish("tango_webapp.device_loaded", {data: device});
                    return device;
                }.bind(this));
        },
        /**
         *
         * @event {OpenAjax} tango_webapp.database_loaded
         * @return {Promise} database
         */
        fetchDatabase: function () {
            return this.rest.request().hosts(this.toUrl()).devices(this.name).get()
                .then(function (resp) {
                        //jmvc fails to set "attributes" due to already existing function in the model
                        delete resp.attributes;

                        var device = new TangoWebapp.TangoDevice(MVC.Object.extend(resp, {
                            id: this.id + "/" + this.name,
                            name: this.name,
                            host: this
                        }));

                    this.isAlive = true;
                    this.errors = [];

                        return device;
                    }.bind(this)
                ).fail(function (resp) {
                        this.isAlive = false;
                        this.add_errors(resp.errors);
                        throw resp;
                    }.bind(this)
                ).then(function (device) {
                    OpenAjax.hub.publish("tango_webapp.device_loaded", {data: device});//TODO use PlatformContext directly?
                    this.database = new TangoWebapp.TangoDatabase({
                        id: device.id,
                        device: device,
                        info: this.info
                    });
                    OpenAjax.hub.publish("tango_webapp.database_loaded", {data: this.database});
                    return this.database;
                }.bind(this));
        }
    }
);

//TODO move to separate file: compatibility
if (window['TangoHost'] === undefined)
    TangoHost = TangoWebapp.TangoHost;