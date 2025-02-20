import { createApp } from 'vue'
//import { createVuetify, type ThemeDefinition } from 'vuetify'


// Vuetify setup
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

// Import @mdi/js for Material Design SVG paths
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import '@mdi/font/css/materialdesignicons.css';

// const myCustomLightTheme: ThemeDefinition = {
//   dark: false,
//   colors: {
//     background: '#FFFFFF',
//     surface: '#FFFFFF',
//     primary: '#6200EE',
//     'primary-darken-1': '#3700B3',
//     secondary: '#03DAC6',
//     'secondary-darken-1': '#018786',
//     error: '#B00020',
//     info: '#2196F3',
//     success: '#4CAF50',
//     warning: '#FB8C00',
//   },
// }

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark', // Default to system theme
    themes: {
      light: {
        dark: false,
        colors: {
          background: '#ffffff',
          //surface: '#F5F5F5',
          surface: '#fff4e3',
          //primary: '#6200EE',
          primary: '#8e6b53',
          secondary: '#03DAC6',
          error: '#B00020',
        },
      },
      dark: {
        dark: true,
        colors: {
          background: '#121212',
          surface: '#1E1E1E',
          primary: '#BB86FC',
          secondary: '#03DAC6',
          error: '#CF6679',
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi', // Default to SVG icons
    aliases,          // Use the aliases provided by Vuetify
    sets: { mdi },    // Connect the MDI set
  },
  // icons: {
  //   defaultSet: 'mdiSvg',
  //   sets: {
  //     mdiSvg: {
  //       component: 'VIcon',
  //       props: { icon: mdiAccount },
  //     },
  //   },
  // },
  // icons: {
  //   defaultSet: 'mdi', // Use MDI as the default icon set
  //   sets: {
  //     mdi: {
  //       component: 'v-icon', // Default component for icons
  //     },
  //   },
  // },
  // theme: {
  //   defaultTheme: 'myCustomLightTheme',
  //   themes: {
  //     myCustomLightTheme,
  //   },
  // },
})

export default vuetify;
