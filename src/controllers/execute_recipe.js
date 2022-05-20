const execute_recipe = async function(recipe,rest_host,rest_port,rest_version,tango_host,tango_port){

    phases = recipe.phases
    switching = recipe.switching

    no_phases = Object.keys(phases).length

    for (var i = 1; i <= no_phases; i++){

        parameters = phases["Phase " + i]

        promises = []

        for (var j = 1; j <= Object.keys(parameters).length; j++){

            var post = webix.ajax().put("http://" + rest_host + ":"
            + rest_port + "/tango/rest/" + rest_version + "/hosts/"
            + tango_host + ";" + tango_port + "=" + "/devices/" 
            //+ "bioreactor/parameters
            + "sys/tg_test/1/attributes/"
            + String(Object.keys(parameter)[j-1]).toLowerCase()
            + "/value?=" + String(Object.values(parameter)[j-1])
            )

            promises.push(eval('const ' + 'promise_' + j + ' = ' + post + ';'))
        
        }

        await Promise.all()
        .then(function(data){

                for (var k = 0; Object.keys(data).length; k++){

                    if (data[k].quality != "ATTR_VALID"){

                        return result = 'Could not write attributes; please try again'

                    }

                }

            result = 'Phase ' + i + 'running...'

            }

         , function(data){

            result = 'Could not get server response; please try again'

         }

         )


         // test because one less switching

         if (i < no_phases){

            if (switching["Switching " + i].Logic == "or"){
                if (switching["Switching " + i].Checked.time){
                    //timer.start
                }
                if (switching["Switching " + i].Checked.weight){
                    
                }
            }

            else if (switching.Logic == "and"){

            }

            /*else{
                    CUSTOM 
            }*/

         }




    }