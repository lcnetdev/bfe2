import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";

import Edit from "../views/Edit.vue";
import TestParseId from "../views/TestParseId.vue";
import TestParseBfdb from "../views/TestParseBfdb.vue";
import Errors from "../views/Errors.vue";





Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home
  },

  {
    path: "/TestParseId",
    name: "TestParseId",
    component: TestParseId
  },
  {
    path: "/TestParseBfdb",
    name: "TestParseBfdb",
    component: TestParseBfdb
  },
  {
    path: "/errors",
    name: "Errors",
    component: Errors
  },

  {
    path: "/edit/:recordId",
    name: "Edit",
    component: Edit

    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    //component: () =>
    //  import(/* webpackChunkName: "about" */ "../views/About.vue")
  },


  // {
  //   path: "/edit",
  //   name: "Edit",
  //   component: Edit

  //   // route level code-splitting
  //   // this generates a separate chunk (about.[hash].js) for this route
  //   // which is lazy-loaded when the route is visited.
  //   //component: () =>
  //   //  import(/* webpackChunkName: "about" */ "../views/About.vue")
  // },


  {
    path: "/settings/:action",
    name: "Home",
    component: Home
  },



  {
    path: "/:action",
    name: "Home",
    component: Home
  },
  // {
  //   path: "/allrecords",
  //   name: "Home",
  //   component: Home
  // },
  // {
  //   path: "/new",
  //   name: "Home",
  //   component: Home
  // },
  // {
  //   path: "/load",
  //   name: "Home",
  //   component: Home
  // },
  // {
  //   path: "/myrecords",
  //   name: "Home",
  //   component: Home
  // },


];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});



export default router;
