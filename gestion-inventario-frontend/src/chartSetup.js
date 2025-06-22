
import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Filler
} from 'chart.js';

// Registramos solo una vez los controladores y el plugin Filler
Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Filler  // habilita la opción `fill` en datasets de tipo línea
);
