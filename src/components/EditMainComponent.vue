<template>

  <div class="main-component-container">
    <div v-if="nested == false" :id="profileName+'|'+profileCompoent" style="display: flex; position: relative;">

      <div style="flex:15;">   


          <template v-if="hasDynamicTemplate()" >


              <!--  -->
            
             <EditTemplateRefComponent  :ptGuid="ptGuid" :parentURI="parentURI" :structure="structure"  :parentStructureObj="parentStructureObj" :parentStructure="parentStructure" :nested="nested" :profileName="profileName" :profileCompoent="profileCompoent" :activeTemplate="activeTemplate"  ></EditTemplateRefComponent>


          </template>
          <template v-else>


           <EditMetaComponent v-if="returnLookupType(structure) == 'meta'" :ptGuid="ptGuid" :parentURI="parentURI" :nested="nested" :structure="structure" :profileName="profileName" :profileCompoent="profileCompoent" :parentStructureObj="parentStructureObj" :parentStructure="parentStructure" :activeTemplate="activeTemplate" ></EditMetaComponent>
           
           <!-- <EditAdminComponent v-else-if="returnLookupType(structure) == 'admin'" :ptGuid="ptGuid" :parentURI="parentURI" :nested="nested" :structure="structure" :profileName="profileName" :profileCompoent="profileCompoent" :parentStructureObj="parentStructureObj" :parentStructure="parentStructure" :activeTemplate="activeTemplate" ></EditAdminComponent> -->
          
           <EditLiteralComponent v-else-if="structure.type == 'literal' || structure.type == 'literal-lang'" :ptGuid="ptGuid" :parentURI="parentURI"  :nested="nested" :structure="structure" :profileName="profileName" :profileCompoent="profileCompoent" :parentStructureObj="parentStructureObj" :parentStructure="parentStructure" :activeTemplate="activeTemplate" ></EditLiteralComponent>
           <EditSimpleLookupComponent v-else-if="returnLookupType(structure) == 'simple'" :ptGuid="ptGuid" :parentURI="parentURI" :structure="structure"  :parentStructureObj="parentStructureObj" :parentStructure="parentStructure" :nested="nested"  :profileName="profileName" :profileCompoent="profileCompoent" :activeTemplate="activeTemplate" ></EditSimpleLookupComponent>
           <EditComplexLookupComponent v-else-if="returnLookupType(structure) == 'complex'" :ptGuid="ptGuid" :parentURI="parentURI" :structure="structure"  :parentStructureObj="parentStructureObj" :parentStructure="parentStructure" :nested="nested" :profileName="profileName" :profileCompoent="profileCompoent" :activeTemplate="activeTemplate"  ></EditComplexLookupComponent>          
           <EditTemplateRefComponent v-else-if="structure.valueConstraint.valueTemplateRefs.length > 0" :ptGuid="ptGuid" :parentURI="parentURI" :structure="structure"  :parentStructureObj="parentStructureObj" :parentStructure="parentStructure" :nested="nested" :profileName="profileName" :profileCompoent="profileCompoent" :activeTemplate="activeTemplate"  ></EditTemplateRefComponent>
        


          </template>





      </div>

      <div class="property-button-container" v-if="showDupeRemove()">
        
        <button tabindex="-1" class="property-button property-duplicate simptip-position-left" :data-tooltip="labels.propertyDuplicateTip" @click="duplicateProperty">{{labels.propertyDuplicateSymbol}}</button>
        <button tabindex="-1" class="property-button property-remove" @click="removeProperty">{{labels.propertyRemoveSymbol}}</button>

      </div>

      <div class="debug-toggle" style="position: relative; visibility: hidden; color:red; left: -26%;font-size: 0.85em;font-family: monospace;top: 8px; cursor: pointer; height: 0.85em;" @click="toggleDebug">debug</div>



    </div>



    <!-- This block renders the recursive componets being sent in from the TemplateRefComponent -->
    <div v-else>  



        <EditLiteralComponent v-if="structure.type == 'literal' || structure.type == 'literal-lang'" :ptGuid="ptGuid"  :parentURI="parentURI" :activeTemplate="activeTemplate" :nested="nested" :structure="structure" :profileName="profileName" :profileCompoent="profileCompoent" :parentStructureObj="parentStructureObj" :parentStructure="parentStructure" ></EditLiteralComponent>
        <EditSimpleLookupComponent v-else-if="returnLookupType(structure) == 'simple'" :ptGuid="ptGuid" :parentURI="parentURI" :activeTemplate="activeTemplate" :structure="structure" :parentStructureObj="parentStructureObj" :parentStructure="parentStructure" :nested="nested"  :profileName="profileName" :profileCompoent="profileCompoent"  ></EditSimpleLookupComponent>
        <EditComplexLookupComponent v-else-if="returnLookupType(structure) == 'complex'" :ptGuid="ptGuid" :parentURI="parentURI" :activeTemplate="activeTemplate" :structure="structure" :parentStructureObj="parentStructureObj" :parentStructure="parentStructure" :nested="nested" :profileName="profileName" :profileCompoent="profileCompoent"   ></EditComplexLookupComponent>          
        <EditTemplateRefComponent v-else-if="structure.valueConstraint.valueTemplateRefs.length > 0" :ptGuid="ptGuid" :parentURI="parentURI" :activeTemplate="activeTemplate" :structure="structure" :parentStructureObj="parentStructureObj" :parentStructure="parentStructure" :profileName="profileName" :profileCompoent="profileCompoent" :nested="nested"></EditTemplateRefComponent>



    </div>


    <div v-if="nested == false && displayDebug" style="font-family: monospace;width: 69%; background-color: whitesmoke; margin-left: 5%;">

      <code v-if="structure.xmlSource"><pre>{{prettifyXml(structure.xmlSource)}}</pre></code>
      <vue-json-pretty 
        :path="'res'"
        :highlightMouseoverNode="true"
        :collapsedOnClickBrackets="true"
        :data="structure"      
        >
      </vue-json-pretty>

    </div>




  </div>



<!--   <pre>{{JSON.stringify(structure,null,2)}}</pre>
  <h1>{{nested}}-{{nestedOrder}}-{{nestedOrderType}}</h1>
  <h1>{{nestedOrderParentType}}</h1> -->


</template>

<script>

import EditLiteralComponent from "@/components/EditLiteralComponent.vue";
import EditSimpleLookupComponent from "@/components/EditSimpleLookupComponent.vue";

import EditTemplateRefComponent from "@/components/EditTemplateRefComponent.vue";
import EditComplexLookupComponent from "@/components/EditComplexLookupComponent.vue";
import EditMetaComponent from "@/components/EditMetaComponent.vue";
// import EditAdminComponent from "@/components/EditAdminComponent.vue";






import labels from "@/lib/labels"
import config from "@/lib/config"
import uiUtils from "@/lib/uiUtils"

// 
import VueJsonPretty from 'vue-json-pretty'



export default {
  name: "EditMainComponent",
  components: {
    EditLiteralComponent,
    EditSimpleLookupComponent,
    EditTemplateRefComponent,
    EditComplexLookupComponent,
    EditMetaComponent,
    // EditAdminComponent,
    VueJsonPretty


  },  
  props: {
    structure: Object,
    parentStructure: Array,
    parentStructureObj: Object,
    nested: Boolean,
    profileCompoent: String,
    profileName: String,
    activeTemplate: Object,
    parentURI: String,
    ptGuid: String,
    dynamic: String

  },
  data: function() {
    return {
      // these are the labes that are used in the static text of compoennts
      labels: labels,
      displayDebug: false,

      // is a lookup url require a simple or complex lookup interface, and its options
      lookupType:config.lookupConfig
    }
  },
  methods: {

    prettifyXml: uiUtils.prettifyXml,


    showDupeRemove: function(){

      let noControls = [
        'http://id.loc.gov/ontologies/bibframe/hasInstance',
        'http://id.loc.gov/ontologies/bibframe/instanceOf',
        'http://id.loc.gov/ontologies/bibframe/hasItem'
      ]

      if (noControls.indexOf(this.structure.propertyURI)>-1){
        return false
      }      

      return true


    },

    hasDynamicTemplate: function(){

      if (this.structure.valueConstraint.valueTemplateRefs.filter(t=> (t.startsWith('dynamic:'))).length>0){
        return true
      }else{
        return false
      }


    },

    toggleDebug: function(){
      
      if (this.displayDebug){this.displayDebug=false}else{this.displayDebug=true}

    },

    duplicateProperty: function(){

      this.$store.dispatch("duplicateProperty", { self: this, id: this.profileCompoent, profile:this.profileName }).then(() => {
        
      })   

    },


    removeProperty: function(){


      const answer = window.confirm('Are you sure you want to remove the property?')
      if (answer) {
        this.$store.dispatch("removeProperty", { self: this, id: this.profileCompoent, profile:this.profileName }).then(() => {
          
        })         

      } else {
        
        return false

      }






    },

    // use the config data to see what type of lookup this componet should use
    returnLookupType(cStructure){

      // these meta componets are structural things, like add new instances/items. etc
      if (cStructure.propertyURI == "http://id.loc.gov/ontologies/bibframe/hasInstance"){

        return "meta"
      }
      if (cStructure.propertyURI == "http://id.loc.gov/ontologies/bibframe/instanceOf"){

        return "meta"
      }

      // we handle this structural thing elsewhere
      if (cStructure.propertyURI == "http://id.loc.gov/ontologies/bibframe/hasItem"){

        return "meta"
      }

    
      

      let type = 'simple'
      if (cStructure.valueConstraint.useValuesFrom.length==0) return null
      cStructure.valueConstraint.useValuesFrom.forEach((cs)=>{
        if (this.lookupType[cs] && this.lookupType[cs].type == 'complex'){
          type='complex'
        }
      })
      return type
    }



  }



};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>


.main-component-container:hover .debug-toggle{
  visibility: visible !important;
}

h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
