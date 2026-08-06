import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "aps-design-pro/style.css";

const application = createApp(App);

application.use(createPinia());
application.use(router);
application.mount("#app");
