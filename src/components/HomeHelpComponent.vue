<template>
  <div id="home-settings" >


    <div style="padding:1em;">
    <h1>Quick Start Video</h1>
    <p>These quick videos (no audio) show how to get started using the editor, click to expand the section:</p>
<!--     <iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/lYCWSghcQok" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    <hr> -->

    <details>
      <summary>
        The home screens.
      </summary>  
      <video controls width="75%">
        <source src="https://github.com/lcnetdev/bfe2/blob/master/manual/videos/bfe2_help_home_screens.webm?raw=true" type="video/webm"/>
      </video>
    </details>
    <details>
      <summary>
        Edit screen navigation.
      </summary>  
      <video controls width="75%">
        <source src="https://github.com/lcnetdev/bfe2/blob/master/manual/videos/bfe2_edit_general.webm?raw=true" type="video/webm"/>
      </video>
    </details>
    <details>
      <summary>
        Duplicate / Remove / Switch Properties.
      </summary>  
      <video controls width="75%">
        <source src="https://github.com/lcnetdev/bfe2/blob/master/manual/videos/bfe2_edit_dupe_remove_switch.webm?raw=true" type="video/webm"/>
      </video>
    </details>
    <details>
      <summary>
        Literal fields and custom diacritics.
      </summary>  
      <video controls width="75%">
        <source src="https://github.com/lcnetdev/bfe2/blob/master/manual/videos/bfe2_edit_literal.webm?raw=true" type="video/webm"/>
      </video>
    </details>
    <details>
      <summary>
        Simple lookup fields.
      </summary>  
      <video controls width="75%">
        <source src="https://github.com/lcnetdev/bfe2/blob/master/manual/videos/bfe2_edit_simple_lookup.webm?raw=true" type="video/webm"/>
      </video>
    </details>
    <details>
      <summary>
        Complex lookup fields (NAF, LCSH, etc.).
      </summary>  
      <video controls width="75%">
        <source src="https://github.com/lcnetdev/bfe2/blob/master/manual/videos/bfe2_edit_complex_lookup.webm?raw=true" type="video/webm"/>
      </video>
    </details>



    </div>


  </div>


</template>

<script>


import { mapState } from 'vuex'
// import uiUtils from "@/lib/uiUtils"

export default {
  name: "HomeHelpComponent",
  components: {
      // Keypress: () => import('vue-keypress')
  },
  props: {
  },
  methods: {



  },
  computed: mapState({
    profiles: 'profiles',
    profilesLoaded: 'profilesLoaded',

    // assignedId (){


    //   return uiUtils.assignID(this.structure,this.parentStructure)

    // },    
  }), 

  data: function() {
    return {


    }
  },
  created: function(){


  },
};
</script>


<style scoped>


  #home-settings, .grid{
    height: 100vh;
    width: 100%;
  }

  .grid{
    grid-template-columns: 20% 80%;
  }


  
</style>
