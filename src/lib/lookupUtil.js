import config from "./config"
// import store from "../store";
const short = require('short-uuid');
const translator = short();

const lookupUtil = {


    possibleLabelURIs: [
        'http://www.loc.gov/mads/rdf/v1#authoritativeLabel',
        'http://www.w3.org/2004/02/skos/core#prefLabel'
    ],



    lookupLibrary : {},

    // fetches the profile data from supplied URL or from the config URL if empty
    fetchSimpleLookup: async function(url, json) {
      url = url || config.profileUrl
      if (url.includes("id.loc.gov")){
        url = url.replace('http://','https://')
      }

      let options = {}
      if (json){
        options = {headers: {'Content-Type': 'application/json', 'Accept': 'application/json'}, mode: "cors"}        
      }
      // console.log('options:',options)
      try{
        let response = await fetch(url,options);
        let data = null

        if (url.endsWith('.rdf') || url.endsWith('.xml')){
          data =  await response.text()
        }else{
          data =  await response.json()
        }
        
          
        
          
        
        return  data;

      }catch(err){
        //alert("There was an error retriving the record from:",url)
        console.error(err);

        // Handle errors here
      }
    },




    // returns the literal value based on the jsonld structure
    returnValue: function(input){

        let value = []

        if (Array.isArray(input)){ 
            input.forEach((v)=>{

                if (typeof v === 'object'){
                    if (v['@value']){
                        value.push(v['@value'])
                    }else{
                        console.error('lookupUtility: lookup parse error, Was expecting a @value in this object:',v)
                    }
                }else if (typeof v === 'string' || typeof v === 'number'){
                    value.push(v)
                }else{
                    console.error('lookupUtility: lookup parse error, Was expecting some sort of value here:',v)
                }

            })
        }

        return value
    },

    // takes the raw response from the lookup server and processes
    simpleLookupProcess: function(data,parentURI){

        let dataProcessed = {

            // all the URIs will live here but also the metadata obj about the uris
            metadata : {
                uri: parentURI,
                values: {}
            }

        }
        
        if (Array.isArray(data)){
            // basic ID simple Lookup response
            // assume anything in this array is a possible value except 
            // something that has the parent URI

            data.forEach((d)=>{

                let label = null
                let labelData = null                // it has a URI and that URI is not the parent uri
                // assume it is one of the values we want
                // also skip any blank nodes
                if (d['@id'] && d['@id'] != parentURI && !d['@id'].includes('_:') ){

                    this.possibleLabelURIs.forEach((labelURI)=>{
                        // if it has this label URI and does not yet have a label
                        if (d[labelURI] && !dataProcessed[d['@id']]){
                            label = this.returnValue(d[labelURI])

                            let labelWithCode = []
                            // build the metadata for each item that will go along it with structured fields
                            let metadata = {uri:d['@id'], label: [], code: [], displayLabel: [] }
                            label.forEach((l)=>{
                                labelWithCode.push(`${l} (${d['@id'].split('/').pop()})`)
                                metadata.displayLabel.push(`${l} (${d['@id'].split('/').pop()})`)

                                metadata.label.push(l)
                                metadata.code.push(d['@id'].split('/').pop())
                                
                            })                          
                            labelData = metadata
                            label = labelWithCode
                        }
                    })
                }else if (d['http://id.loc.gov/ontologies/RecordInfo#recordStatus']){ 
                    // this is just a record info blank node, skip it
                    return false
                }else{

                    // this is the parent uri obj in the response, skip it
                    return false
                }

                if (label === null){
                    console.error('lookupUtility: Was expecting this to have a label', d)
                    return false
                }

                dataProcessed[d['@id']] = label
                dataProcessed.metadata.values[d['@id']] = labelData
            })


        }else{

            // TODO more use cases
            dataProcessed = data
        }

        return dataProcessed
    },

    loadSimpleLookup: async function(uri){
        let url = uri

        // TODO more checks here
        if (!uri.includes('.json')){
            url = url + '.json'
        }

        if (!this.lookupLibrary[url]){
            let data = await this.fetchSimpleLookup(url)
            data = this.simpleLookupProcess(data,uri)
            this.lookupLibrary[url] = data          
            return data 
        }else{
            return this.lookupLibrary[url]
        }

    },


    searchComplex: async function(searchPayload){
        console.log(searchPayload)
        let urlTemplate = searchPayload.url
        if (!Array.isArray(urlTemplate)){
            urlTemplate=[urlTemplate]
        }

        
        // if we're in lc authortities mode then check if we are doing a keyword search
        // searchtype=keyword 

        if (searchPayload.processor == 'lcAuthorities'){
          for (let idx in urlTemplate){

            if (urlTemplate[idx].includes('q=?')){
              urlTemplate[idx] = urlTemplate[idx].replace('q=?','q=')+'&searchtype=keyword'
            }
          }
          
        }
        

        let results = []
        for (let url of urlTemplate) {

            // kind of hack, change to the public endpoint if we are in dev or public mode
            if (config.returnUrls().dev){
              url = url.replace('http://preprod.id.','https://id.')
              url = url.replace('https://preprod-8230.id.loc.gov','https://id.loc.gov')
            }




            let r = await this.fetchSimpleLookup(url)
            if (searchPayload.processor == 'lcAuthorities'){
                // process the results as a LC suggest service
                
                for (let hit of r.hits){
                  results.push({
                    label: hit.suggestLabel,
                    uri: hit.uri,
                    literal:false,
                    extra: ''

                  })


                }


                // Old suggest service below

                // let labels = r[1]
                // let uris = r[3]
                // for (let i = 0; i <= labels.length; i++) {
                //   if (uris[i]!= undefined){
                //       results.push({
                //         label: labels[i],
                //         uri: uris[i],
                //         extra: ''

                //       })
                //   }
                // }
            }else if (searchPayload.processor == 'wikidataAPI'){
              console.log(r)
                for (let hit of r.search){
                  results.push({
                    label: hit.label,
                    uri: hit.concepturi,
                    literal:false,
                    extra: ''
                  })       
                }     
            }

        }

        // always add in the literal they searched for at the end
        results.push({
          label: searchPayload.searchValue,
          uri: null,
          literal:true,
          extra: ''
        }) 

        // console.log(results,"<results")
        return results

    },

    returnContext: async function(uri){

        let d = await this.fetchContextData(uri)
        d.uri = uri
        let results =  this.extractContextData(d)
        return results

    },

    fetchContextData: async function(uri){

          console.log(uri)
          if (uri.startsWith('http://id.loc.gov') && uri.match(/(authorities|vocabularies)/)) {
            var jsonuri = uri + '.madsrdf_raw.jsonld';
            console.log(uri)
            //if we are in production use preprod
            if (config.returnUrls().env == 'production'){
              jsonuri = jsonuri.replace('http://id.', 'https://preprod.id.')
              jsonuri = jsonuri.replace('https://id.', 'https://preprod.id.')
              
            }
            console.log(uri)

          }else if (uri.includes('http://www.wikidata.org/entity/')){ 
            jsonuri = uri.replace('http://www.wikidata.org/entity/','https://www.wikidata.org/wiki/Special:EntityData/')
            jsonuri = jsonuri + '.json';            
          } else {
            jsonuri = uri + '.jsonld';
          }

          jsonuri = jsonuri.replace('http://id.loc.gov','https://id.loc.gov')

          try{
            let response = await fetch(jsonuri);
            let data =  await response.json()
            return  data;

          }catch(err){
            console.error(err);

            // Handle errors here
          }


    },   

    extractContextData: function(data){
          var results = { contextValue: true, source: [], type: null, typeFull: null, variant : [], uri: data.uri, title: null, contributor:[], date:null, genreForm: null, nodeMap:{}};
          

          if (data.uri.includes('wikidata.org')){

            
            if (data.entities){
              let qid = Object.keys(data.entities)[0]



              if (data.entities[qid].labels.en){
                results.title = data.entities[qid].labels.en.value
              }
              if (data.entities[qid].descriptions.en){
                results.nodeMap['Description'] = [data.entities[qid].descriptions.en.value]
              }

              if (data.entities[qid].aliases.en){

                data.entities[qid].aliases.en.forEach((v)=>{
                  results.variant.push(v.value)
                })

              }
              // just hardcode it for now
              results.type = 'http://www.loc.gov/mads/rdf/v1#PersonalName'
              results.typeFull = 'http://www.loc.gov/mads/rdf/v1#PersonalName'
              
              // get the P31 instanceOf
              if (data.entities[qid].claims.P31){


                if (data.entities[qid].claims.P31[0].mainsnak){
                  if (data.entities[qid].claims.P31[0].mainsnak.datavalue){
                    if (data.entities[qid].claims.P31[0].mainsnak.datavalue.value){                      
                      console.log(data.entities[qid].claims.P31[0].mainsnak.datavalue.value.id)
                      results.type = this.rdfType(data.entities[qid].claims.P31[0].mainsnak.datavalue.value.id)
                    } 
                  }                  
                }
              }





              
              
            }


          }else{

            // if it is in jsonld format
            if (data['@graph']){
              data = data['@graph'];
            }
            
            var nodeMap = {};
            
            data.forEach(function(n){
              if (n['http://www.loc.gov/mads/rdf/v1#birthDate']){
                nodeMap['Birth Date'] = n['http://www.loc.gov/mads/rdf/v1#birthDate'].map(function(d){ return d['@id']})
              }        
              if (n['http://www.loc.gov/mads/rdf/v1#birthPlace']){
                nodeMap['Birth Place'] = n['http://www.loc.gov/mads/rdf/v1#birthPlace'].map(function(d){ return d['@id']})
              }  

              if (n['http://www.loc.gov/mads/rdf/v1#associatedLocale']){
                nodeMap['Associated Locale'] = n['http://www.loc.gov/mads/rdf/v1#associatedLocale'].map(function(d){ return d['@id']})
              } 
              if (n['http://www.loc.gov/mads/rdf/v1#fieldOfActivity']){
                nodeMap['Field of Activity'] = n['http://www.loc.gov/mads/rdf/v1#fieldOfActivity'].map(function(d){ return d['@id']})
              } 
              if (n['http://www.loc.gov/mads/rdf/v1#gender']){
                nodeMap['Gender'] = n['http://www.loc.gov/mads/rdf/v1#gender'].map(function(d){ return d['@id']})
              } 
              if (n['http://www.loc.gov/mads/rdf/v1#occupation']){
                nodeMap['Occupation'] = n['http://www.loc.gov/mads/rdf/v1#occupation'].map(function(d){ return d['@id']})
              } 
              if (n['http://www.loc.gov/mads/rdf/v1#associatedLanguage']){
                nodeMap['Associated Language'] = n['http://www.loc.gov/mads/rdf/v1#associatedLanguage'].map(function(d){ return d['@id']})
              } 
              if (n['http://www.loc.gov/mads/rdf/v1#deathDate']){
                nodeMap['Death Date'] = n['http://www.loc.gov/mads/rdf/v1#deathDate'].map(function(d){ return d['@id']})
              } 
              if (n['http://www.loc.gov/mads/rdf/v1#hasBroaderAuthority']){
                nodeMap['Has Broader Authority'] = n['http://www.loc.gov/mads/rdf/v1#hasBroaderAuthority'].map(function(d){ return d['@id']})
              } 
              if (n['http://www.loc.gov/mads/rdf/v1#hasNarrowerAuthority']){
                nodeMap['Has Narrower Authority'] = n['http://www.loc.gov/mads/rdf/v1#hasNarrowerAuthority'].map(function(d){ return d['@id']})
              } 
              if (n['http://www.loc.gov/mads/rdf/v1#isMemberOfMADSCollection']){
                nodeMap['MADS Collection'] = n['http://www.loc.gov/mads/rdf/v1#isMemberOfMADSCollection'].map(function(d){ return d['@id']})
              } 



            })
            // pull out the labels
            data.forEach(function(n){
              
              // loop through all the possible types of row
              Object.keys(nodeMap).forEach(function(k){
                if (!results.nodeMap[k]) { results.nodeMap[k] = [] }
                // loop through each uri we have for this type
                nodeMap[k].forEach(function(uri){


                  if (k == 'MADS Collection'){
                    if (results.nodeMap[k].indexOf(uri.split('/').slice(-1)[0].replace('collection_',''))==-1){
                      results.nodeMap[k].push(uri.split('/').slice(-1)[0].replace('collection_',''))
                    }
                  }

                  if (n['@id'] && n['@id'] == uri){
                   
                    if (n['http://www.loc.gov/mads/rdf/v1#authoritativeLabel']){
                      n['http://www.loc.gov/mads/rdf/v1#authoritativeLabel'].forEach(function(val){ 
                        if (val['@value']){
                          results.nodeMap[k].push(val['@value']);
                        }
                      })
                    }
                    if (n['http://www.w3.org/2000/01/rdf-schema#label']){
                      n['http://www.w3.org/2000/01/rdf-schema#label'].forEach(function(val){ 
                        if (val['@value']){
                          results.nodeMap[k].push(val['@value']);
                        }
                      })
                    }
                  }
                })        
              })
            })

            data.forEach((n)=>{
              
              var citation = '';
              var variant = '';
              var title = '';

              if (n['http://www.loc.gov/mads/rdf/v1#citation-source']) {
                citation = citation + n['http://www.loc.gov/mads/rdf/v1#citation-source'].map(function (v) { return v['@value'] + ' '; })
              }
              if (n['http://www.loc.gov/mads/rdf/v1#citation-note']) {
                citation = citation + n['http://www.loc.gov/mads/rdf/v1#citation-note'].map(function (v) { return v['@value'] + ' '; })
              }
              if (n['http://www.loc.gov/mads/rdf/v1#citation-status']) {
                citation = citation + n['http://www.loc.gov/mads/rdf/v1#citation-status'].map(function (v) { return v['@value'] + ' '; })
              }
              if (n['http://www.loc.gov/mads/rdf/v1#citationSource']) {
                citation = citation + n['http://www.loc.gov/mads/rdf/v1#citationSource'].map(function (v) { return v['@value'] + ' '; })
              }
              if (n['http://www.loc.gov/mads/rdf/v1#citationNote']) {
                citation = citation + n['http://www.loc.gov/mads/rdf/v1#citationNote'].map(function (v) { return v['@value'] + ' '; })
              }
              if (n['http://www.loc.gov/mads/rdf/v1#citationStatus']) {
                citation = citation + n['http://www.loc.gov/mads/rdf/v1#citationStatus'].map(function (v) { return v['@value'] + ' '; })
              }



              if (n['http://www.loc.gov/mads/rdf/v1#variantLabel']) {
                variant = variant + n['http://www.loc.gov/mads/rdf/v1#variantLabel'].map(function (v) { return v['@value'] + ' '; })
              }

              if (n['@id'] && n['@id'] == data.uri && n['http://www.loc.gov/mads/rdf/v1#authoritativeLabel']){            
                title = title + n['http://www.loc.gov/mads/rdf/v1#authoritativeLabel'].map(function (v) { return v['@value'] + ' '; })
              }

              if (n['@id'] && n['@id'] == data.uri && n['@type']){       

                  n['@type'].forEach((t)=>{
                      if (results.type===null){
                          results.type = this.rdfType(t)
                          results.typeFull = t
                      }
                  })
                
              }
              

              citation = citation.trim()
              variant = variant.trim()
              title = title.trim()
              
              if (variant != ''){ results.variant.push(variant)}
              if (citation != ''){ results.source.push(citation)}
              if (title != ''){ results.title = title }
              
              if (n['@type'] && n['@type'] == 'http://id.loc.gov/ontologies/bibframe/Title'){
                if (n['bibframe:mainTitle']){
                  results.title = n['bibframe:mainTitle']
                }
              }
              if (n['@type'] && (n['@type'] == 'http://id.loc.gov/ontologies/bibframe/Agent' || n['@type'].indexOf('http://id.loc.gov/ontologies/bibframe/Agent') > -1 )){
                if (n['bflc:name00MatchKey']){
                  results.contributor.push(n['bflc:name00MatchKey']);
                }
              }
              if (n['bibframe:creationDate'] && n['bibframe:creationDate']['@value']){
                results.date = n['bibframe:creationDate']['@value'];
              }       
              if (n['@type'] && n['@type'] == 'http://id.loc.gov/ontologies/bibframe/GenreForm'){
                if (n['bibframe:mainTitle']){
                  results.genreForm = n['rdf-schema:label'];
                }
              }
            });    


          }
          
          console.log(results)
          return results;
        },

    rdfType: function(type){
      var rdftype = null;

      if (type == 'http://www.loc.gov/mads/rdf/v1#PersonalName' || type == 'http://id.loc.gov/ontologies/bibframe/Person') {
        rdftype = 'PersonalName';
      } else if (type == 'http://id.loc.gov/ontologies/bibframe/Topic' || type == 'http://www.loc.gov/mads/rdf/v1#Topic') {
        rdftype = 'Topic';
      } else if (type == 'http://www.loc.gov/mads/rdf/v1#Place' || type == 'http://id.loc.gov/ontologies/bibframe/Place' || type == 'http://www.loc.gov/mads/rdf/v1#Geographic') {
        rdftype = 'Geographic';
      } else if (type == 'http://www.loc.gov/mads/rdf/v1#Temporal'){
        rdftype= 'Temporal'; 
      } else if (type == 'http://www.loc.gov/mads/rdf/v1#Organization' || type == 'http://www.loc.gov/mads/rdf/v1#CorporateName' || type == 'http://id.loc.gov/ontologies/bibframe/Organization') {
        rdftype = 'CorporateName';
      } else if (type == 'http://www.loc.gov/mads/rdf/v1#Family' || type == 'http://id.loc.gov/ontologies/bibframe/Family') {
        rdftype = "FamilyName";
      } else if (type == 'http://www.loc.gov/mads/rdf/v1#Meeting' || type == 'http://id.loc.gov/ontologies/bibframe/Meeting') {
        rdftype = 'ConferenceName';
      } else if (type == 'http://www.loc.gov/mads/rdf/v1#Jurisdiction' || type == 'http://id.loc.gov/ontologies/bibframe/Jurisdiction') {
        rdftype = 'Geographic';
      } else if (type == 'http://id.loc.gov/ontologies/bibframe/GenreForm' || type == 'http://www.loc.gov/mads/rdf/v1#GenreForm') {
        rdftype = 'GenreForm';
      } else if (type == 'http://id.loc.gov/ontologies/bibframe/Role') {
        rdftype = 'Role';
      }else if (type == 'http://id.loc.gov/ontologies/madsrdf/v1.html#ComplexSubject') {
        rdftype = 'ComplexSubject';
      }else if (type == 'http://www.loc.gov/mads/rdf/v1#NameTitle') {
        rdftype = 'NameTitle';
      }else if (type == 'http://www.loc.gov/mads/rdf/v1#Title') {
        rdftype = 'Title';
      }else if (type == 'http://www.loc.gov/mads/rdf/v1#ComplexSubject') {
        rdftype = 'ComplexSubject';
      }else if (type == 'Q5') {
        rdftype = 'PersonalName';
      }

      




      return rdftype;
    },


    


    fetchIdWorkSearch: async function(searchValue){

        // console.log(`https://id.loc.gov/search/?q=${searchValue}&q=cs%3Ahttp%3A%2F%2Fid.loc.gov%2Fresources%2Fworks`)

        let r = await this.fetchSimpleLookup(`https://id.loc.gov/search/?q=${searchValue}&q=cs%3Ahttp%3A%2F%2Fid.loc.gov%2Fresources%2Fworks&format=json`, true)

        let results = []
        for (let e of r){
          if (Array.isArray(e) && e[0] === 'atom:entry'){
            let id = null
            let label = null
            for (let ee of e){
              if (Array.isArray(ee) && ee[0] === 'atom:title'){ label=ee[2]}
              if (Array.isArray(ee) && ee[0] === 'atom:id'){ id=ee[2].replace('info:lc','https://id.loc.gov')}
            }
            results.push({id:id,label:label})
          }
        }



        return results

    },


    fetchRecords: async function(user){

        let utilUrl = config.returnUrls().util
        let utilPath = config.returnUrls().env

        let url
        if (user){
          url = `${utilUrl}myrecords/${utilPath}/${user}`
        }else{
          url = `${utilUrl}allrecords/${utilPath}/`
        }


        let r = await this.fetchSimpleLookup(url)

        let rSorted = [];
        for (let id in r) {
            rSorted.push(r[id]);
        }

        rSorted.sort(function(a, b) {
            return b.timestamp - a.timestamp ;
        });




        return rSorted
    },





    fetchIdXML: async function(url){

        if (url.endsWith('.rdf')===false){
          url = url + '.rdf'
        }
        let r = await this.fetchSimpleLookup(url)
        return r
    },

    fetchBfdbXML: async function(url){

        url = url.replace(/\.jsonld/,'.xml')

        let r = await this.fetchSimpleLookup(url)
        return r
    },


    // jsut checks if there is a value stored for this item, if so then it exists
    ontologyPropertyExists: async function(url){

      if (window.localStorage && window.localStorage.getItem('ontology_'+url+'.rdf')){
        return true
      }else{
        return false
      }


    },

    fetchOntology: async function(url){

        // we are going to look into the local storage to see if we have a cache version of this URI from
        // less than 24 hours ago

        let currentTS = Math.floor(Date.now() / 1000)

        if (window.localStorage && window.localStorage.getItem('ontology_'+url+'.rdf')){
          let response = JSON.parse(window.localStorage.getItem('ontology_'+url+'.rdf'))
          if (currentTS - response.ts < 86400){

            // we have a fresh catch less than 1 day old, use that instead of asking the srver
            return response.response

          }
        }

        if (url.endsWith('.rdf')===false){
          url = url + '.rdf'
        }
        let r = await this.fetchSimpleLookup(url)


        // if we got here set that localstorage for next time
        if (window.localStorage){
          let toset = {response: r, ts: currentTS}
          window.localStorage.setItem('ontology_'+url, JSON.stringify(toset))
        }



        return r
    },

    fetchAllOntology: async function(profiles){

      let allData = {}

      for (let key of Object.keys(profiles.lookup)){

        if (profiles.lookup[key].resourceURI.includes('id.loc.gov/ontologies/')){
          // console.log(profiles.lookup[key])
          let r = await this.fetchOntology(profiles.lookup[key].resourceURI) 
          allData[profiles.lookup[key].resourceURI] = r
        }

        for (let pt of profiles.lookup[key].propertyTemplates){
          if (pt.propertyURI.includes('id.loc.gov/ontologies/')){
            // console.log(pt.propertyURI)
            let r = await this.fetchOntology(pt.propertyURI) 
            allData[pt.propertyURI] = r
          }
        }


      }

      return allData

    },

    saveRecord: async function(xml, eId){



     const putMethod = {
       method: 'PUT', // Method itself
       headers: {
         'Content-type': 'application/xml', // Indicates the content 
       },
       body: xml // We send data in JSON format
     }




     let url = config.returnUrls().ldpjs +'ldp/' + eId
     fetch(url, putMethod)
     .then(response => console.log(response.text))
     .then((responseText)=>{

      console.log(responseText)
     })
     // .then(data => console.log(data)) // Manipulate the data retrieved back, if we want to do something with it
     .catch((err) => {
      console.log(err)
      alert("Error: Could not save the record!", err)
     }) // Do something with the error




    },

    loadSavedRecord: async function(id) {
     
      let url = config.returnUrls().ldpjs +'ldp/' + id

      // let options = {}
      // if (json){
      //   options = {headers: {'Content-Type': 'application/json', 'Accept': 'application/json'}, mode: "cors"}        
      // }
      // console.log('options:',options)
      try{
        let response = await fetch(url);

        let data =  await response.text()
        
        return  data;

      }catch(err){
        //alert("There was an error retriving the record from:",url)
        console.error(err);

        // Handle errors here
      }
    },


    publish: async function(xml){



      let url = config.returnUrls().publish

      
      let uuid = translator.toUUID(translator.new())
      console.log(url,uuid)

      const rawResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({name: uuid, rdfxml:xml})
      });
      const content = await rawResponse.json();

      console.log(content);

      if (content && content.publish && content.publish.status && content.publish.status == 'published'){

        return {status:true}

      }else{

        // alert("Did not post, please report this error--" + JSON.stringify(content.publish,null,2))
        return {status:false, msg: JSON.stringify(content.publish,null,2)}
      }

      


      

    },        



    checkVersionOutOfDate: async function(){

      let url = config.returnUrls().util + 'version/editor' + "?blastdacache=" + Date.now()
      let content

      try{


        const rawResponse = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          
        });
        content = await rawResponse.json();
      }catch{
        // if sometihng network goes wrong just say were not out of date
        return false

      }


      let ourVer = config.versionMajor + (config.versionMinor * 0.1) + (config.versionPatch* 0.01) 
      let curVer = content.major + (content.minor* 0.1) + (content.patch* 0.01) 
      console.log("ourVer:",ourVer,"curVer:",curVer)
      if (ourVer < curVer){
        return true
      }else{
        return false
      }


    },



    returnErrors: async function(){

      let url = config.returnUrls().util + 'error/report' + "?blastdacache=" + Date.now()
      let content

      try{


        const rawResponse = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          
        });
        content = await rawResponse.json();
      }catch{
        // if sometihng network goes wrong just say were not out of date
        return false

      }

      return content

    },


    returnError: async function(id){

      let url = config.returnUrls().util + 'error/' + id + "?blastdacache=" + Date.now()
      let content

      try{


        const rawResponse = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          
        });
        content = await rawResponse.json();
      }catch{
        // if sometihng network goes wrong just say were not out of date
        return false

      }

      return content

    }    




}



export default lookupUtil;


