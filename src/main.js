import { mount } from 'svelte';
import 'maplibre-gl/dist/maplibre-gl.css';
import './app.css';
import App from './App.svelte';

mount(App, { target: document.getElementById('app') });
