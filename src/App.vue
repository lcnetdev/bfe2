<template>
  <div id="app">
<!--     <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </div> -->
    <div v-if="isLoggedIn == false" style="position: fixed; width: 100vw; height: 100vh; top: 0; left: 0; background-color: rgba(0,0,0,0.6); z-index: 1000">
      
      <div style="border: solid 1px #a6acb7; border-radius:0.5em; margin: auto; width: 25%; background-color: white; margin-top: 10%; min-height: 25%; padding: 1em;">
          
          <span style="font-weight: bold;">Hello! Before you start...</span> <div style="margin-top: 1em;">Please enter your cataloger ID and press [Enter] key. This is usually your Windows ID.</div>

          <input @keyup="login" v-model="catInitialsForm" type="text" name="id" autofocus placeholder="Cataloger ID" style="border: solid 1px #a6acb7; font-size: 2em; margin-top: 1em; border-top-right-radius: 0.25em; border-bottom-right-radius: 0.25em; width: 98%;">

      </div>


    </div>

    <div v-if="outOfDate == true" style="position: fixed; width: 100vw; height: 100vh; top: 0; left: 0; background-color: rgba(0,0,0,0.6); z-index: 1000">
      
      <div style="border: solid 1px #a6acb7; border-radius:0.5em; margin: auto; width: 25%; background-color: white; margin-top: 10%; min-height: 25%; padding: 1em;">
          
          <div v-if="systemType=='mac'">
            <h1>Out of Date</h1>
            <div>The editor version open in your browser is out of date. Please do a hard refresh to use the latest version.</div><br>
            <div>On your keyboard press <strong>Cmd</strong> and <strong>Shift</strong> and the letter <strong>R</strong> </div>

          </div>
          <div v-if="systemType=='win'">
            <h1>Out of Date</h1>
            <div>The editor version open in your browser is out of date. Please do a hard refresh to use the latest version.</div><br>
            <div>On your keyboard press <strong>Ctrl</strong> and <strong>F5</strong> </div>

          </div>
          <div v-if="systemType=='other'">
            <h1>Out of Date</h1>
            <div>The editor version open in your browser is out of date. Please do a hard refresh to use the latest version.</div><br>


          </div>

      </div>


    </div>

    
    <router-view />
  </div>
</template>

<style>


#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>


<script>

import { mapState } from 'vuex'
import lookupUtil from "@/lib/lookupUtil"


export default {
  name: "App",
    computed: mapState({
      catInitials: 'catInitials',
      settingsDPackVoyager: 'settingsDPackVoyager',
      region: 'region',


      isLoggedIn: function(){
        if (!this.catInitials){return false}
        if (this.catInitials.trim()===''){return false}  


        return true
      },

      systemType: function(){
        if (navigator.platform.indexOf('Mac') > -1){
          return 'mac'
        }else if (navigator.platform.indexOf('Win') > -1){
          return 'win'
        }else{
          return 'other'
        }


      }


    }),
  data: function() {
    return {

      outOfDate: false,
      catInitialsForm:""

    }
  },


  methods: {

    login: function(event){

      if (event.keyCode === 13) {
        localStorage.setItem('bfeCatInitials',this.catInitialsForm)
        this.$store.dispatch("setCatInitials", { self: this, catInitials: this.catInitialsForm  }).then(() => {
          
        })  

        // this.isLoggedIn=true;

      }


    },


  },

  created: async function () {
  


    if (this.catInitials){
      // this.isLoggedIn=true;   

    }else if (localStorage.getItem('bfeCatInitials')!== null){
      // this.isLoggedIn=true;
      this.$store.dispatch("setCatInitials", { self: this, catInitials: localStorage.getItem('bfeCatInitials') }).then(() => {
        
      })   
    }else{
      // this.isLoggedIn=false;
    }

    if (localStorage.getItem('bfeSettingsDPackVoyagerNative') === 'undefined'){
      localStorage.removeItem('bfeSettingsDPackVoyagerNative')
    }
    if (localStorage.getItem('bfeSettingsDPackVoyager') === 'undefined'){
      localStorage.removeItem('bfeSettingsDPackVoyager')
    }


    if (localStorage.getItem('bfeSettingsDPackVoyager')!== null){
      console.log("SETTING setSettingsDPackVoyager",JSON.parse(localStorage.getItem('bfeSettingsDPackVoyager')))
      this.$store.dispatch("setSettingsDPackVoyager", { self: this, settingsDPackVoyager: JSON.parse(localStorage.getItem('bfeSettingsDPackVoyager')) }).then(() => {
      })   
    }


    if (localStorage.getItem('bfeSettingsDPackVoyagerNative')!== null){
      console.log("SETTING setSettingsDPackVoyager",JSON.parse(localStorage.getItem('bfeSettingsDPackVoyagerNative')))
      this.$store.dispatch("setSettingsDPackVoyagerNative", { self: this, settingsDPackVoyagerNative: JSON.parse(localStorage.getItem('bfeSettingsDPackVoyagerNative')) }).then(() => {
      })   
    }
        


    console.log('this.settingsDPackVoyager',this.settingsDPackVoyager)

    let r = await lookupUtil.checkVersionOutOfDate()
    this.outOfDate = r
    
    



  }
}
</script>
