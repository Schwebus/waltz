const execute_recipe = async function(recipe,rest_host,rest_port,rest_version,tango_host,tango_port){
    console.log('exec started')
    phases = recipe.phases
    switching = recipe.switching

    no_phases = Object.keys(phases).length

    for (var i = 1; i <= no_phases; i++){
        console.log('phase ' + i + " started")

        parameters = phases["Phase " + i]
parameter = ['double_scalar', 'boolean_scalar']
        promises = []

        for (var j = 1; j <= Object.keys(parameters).length; j++){

            var post = webix.ajax().put("http://" + rest_host + ":"
            + rest_port + "/tango/rest/" + rest_version + "/hosts/"
            + tango_host + ";" + tango_port + "=" + "/devices/" 
            //+ "bioreactor/parameters
            + "sys/tg_test/1/attributes/" + parameter[j-1]
            //+ String(Object.keys(parameter)[j-1]).toLowerCase()
            + "/value?=" + i//String(Object.values(parameter)[j-1])
            )

            promises.push(eval('const ' + 'promise_' + j + ' = ' + post + ';'))
        
        }
console.log('promises to get current parameter values' + promises)
        await Promise.all(promises)
console.log('parameter setting promises done, testing if any return invalid quality or promise failure')
        .then(function(data){

                for (var k = 0; Object.keys(data).length; k++){

                    if (data[k].quality != "ATTR_VALID"){

                        return result = 'Could not write attributes; please try again'

                    }

                }


            }

         , function(data){

            return result = 'Could not get server response; please try again'

         }

         )

        //print its running to screen


        console.log("Phase " + i + "running")


         // test because one less switching

         if (i < no_phases){

            if (switching["Switching " + i].Logic == "or"){

                if (switching["Switching " + i].Checked.time){
                    const promise_time = new Promise( function (resolve, reject){resolve()})
                        setTimeout(promise_time,
                        switching["Switching " + i].Checked.Values.time * 60 * 1000)                    
                    }
                

                if (switching["Switching " + i].Checked.weight){
                    const promise_weight = new Promise( function (resolve, reject){
                        var finished = false

                        while (finished != true){
                            
                       // webix.ajax().get("http://localhost:8081/tango/rest/v11/hosts/tangobox;port=10000/devices/bioreactor/parameters/weight/attributes/value/value")
                        webix.ajax().get("http://localhost:8081/tango/rest/v11/hosts/tangobox;port=10000/devices/sys/tg_test/1/attributes/double_scalar/value")

                        .then(function(data){
 
                            if (
                                float(data.value) == float(switching["Switching " + i].Values.weight)
                            ||  float(data.value) == float(switching["Switching " + i].Values.weight) + 0.5
                            ||  float(data.value) == float(switching["Switching " + i].Values.weight) + 0.5
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

                if (switching["Switching " + i].Checked.exito2){
                    const promise_exito2 = new Promise( function (resolve, reject){
                        var finished = false

                        while (finished != true){

                        webix.ajax().get("http://localhost:8081/tango/rest/v11/hosts/tangobox;port=10000/devices/sys/tg_test/1/attributes/double_scalar/value")
                            //"http://localhost:8081/tango/rest/v11/hosts/tangobox;port=10000/\
                            //devices/bioreactor/parameters/exito2/attributes/value/value")
                        .then(function(data){
 
                            if (
                                float(data.value) == float(switching["Switching " + i].Values.exito2)
                            ||  float(data.value) == float(switching["Switching " + i].Values.exito2) + 0.1
                            ||  float(data.value) == float(switching["Switching " + i].Values.exito2) + 0.1
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

                if (switching["Switching " + i].Checked.exitco2){
                    const promise_exitco2 = new Promise( function (resolve, reject){
                        var finished = false

                        while (finished != true){

                        webix.ajax().get("http://localhost:8081/tango/rest/v11/hosts/tangobox;port=10000/devices/sys/tg_test/1/attributes/double_scalar/value")
                            //"http://localhost:8081/tango/rest/v11/hosts/tangobox;port=10000/\
                            //devices/bioreactor/parameters/exitco2/attributes/value/value")
                        .then(function(data){
 
                            if (
                                float(data.value) == float(switching["Switching " + i].Values.exitco2)
                            ||  float(data.value) == float(switching["Switching " + i].Values.exitco2) + 0.1
                            ||  float(data.value) == float(switching["Switching " + i].Values.exitco2) + 0.1
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
            
                Promise.race(promise_time, promise_weight, promise_exitco2, promise_exito2)
            }

            else if (switching.Logic == "and"){

                if (switching["Switching " + i].Checked.time){
                    const promise_time = new Promise( function (resolve, reject){resolve()})
                        setTimeout(promise_time,
                        switching["Switching " + i].Checked.Values.time * 60 * 1000)                    
                    }
                

                if (switching["Switching " + i].Checked.weight){
                    const promise_weight = new Promise( function (resolve, reject){
                        var finished = false

                        while (finished != true){

                        webix.ajax().get("http://localhost:8081/tango/rest/v11/hosts/tangobox;port=10000/devices/sys/tg_test/1/attributes/double_scalar/value")
                        //("http://localhost:8081/tango/rest/v11/hosts/tangobox;port=10000/devices/bioreactor/parameters/weight/attributes/value/value")
                        .then(function(data){
 
                            if (
                                float(data.value) == float(switching["Switching " + i].Values.weight)
                            ||  float(data.value) == float(switching["Switching " + i].Values.weight) + 0.5
                            ||  float(data.value) == float(switching["Switching " + i].Values.weight) + 0.5
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

                if (switching["Switching " + i].Checked.exito2){
                    const promise_exito2 = new Promise( function (resolve, reject){
                        var finished = false

                        while (finished != true){

                        webix.ajax().get("http://localhost:8081/tango/rest/v11/hosts/tangobox;port=10000/devices/sys/tg_test/1/attributes/double_scalar/value")
                            //"http://localhost:8081/tango/rest/v11/hosts/tangobox;port=10000/\
                            //devices/bioreactor/parameters/exito2/attributes/value/value")
                        .then(function(data){
 
                            if (
                                float(data.value) == float(switching["Switching " + i].Values.exito2)
                            ||  float(data.value) == float(switching["Switching " + i].Values.exito2) + 0.1
                            ||  float(data.value) == float(switching["Switching " + i].Values.exito2) + 0.1
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

                if (switching["Switching " + i].Checked.exitco2){
                    const promise_exitco2 = new Promise( function (resolve, reject){
                        var finished = false

                        while (finished != true){

                        webix.ajax().get("http://localhost:8081/tango/rest/v11/hosts/tangobox;port=10000/devices/sys/tg_test/1/attributes/double_scalar/value")
                            //"http://localhost:8081/tango/rest/v11/hosts/tangobox;port=10000/\
                            //devices/bioreactor/parameters/exitco2/attributes/value/value")
                        .then(function(data){
 
                            if (
                                float(data.value) == float(switching["Switching " + i].Values.exitco2)
                            ||  float(data.value) == float(switching["Switching " + i].Values.exitco2) + 0.1
                            ||  float(data.value) == float(switching["Switching " + i].Values.exitco2) + 0.1
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
            
                Promise.all(promise_time, promise_weight, promise_exitco2, promise_exito2)
            }

            /*else{
                    CUSTOM 
            }*/

         }




    }
    return {}
}