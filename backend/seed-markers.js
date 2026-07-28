'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const Marker = require('./src/models/Marker');

const markers = [
  {
    title: "Av Lafinur (Club Victoria)",
    category: "mural",
    description: "VERÓNICA CORRALES: \"Veroline\" es como firma esta artista plástica tucumana. Desde sus pinceles fluyen temáticas de cuidado del medio ambiente y la igualdad de oportunidades independientemente del sexo, credo o religión. @vero_corrales",
    author: "Verónica Corrales",
    imagePath: "https://mymaps.usercontent.google.com/hostedimage/m/*/3AAjQbR65m-7g9m9BrUN4fO62c2Ww1Y2AvH9hhSFVVBS4X9MRUIFUyCeDKQ3Tksc6l-lE-DmktcbJNynpNzgCX-MNJQBy7ygQKc5DFvTkKPx8gzX7Y56vbY-oorPqWKudoM-S8FcJn4F6AA28XY02_qiK_RQXEPChdf9B_46DcYP6gYyt1xDLG9e-maUM8vV2x8SHmj4fJxagznbE8Fc?authuser=0&fife=s16383",
    location: {
      type: "Point",
      coordinates: [-66.34563, -33.30747]
    },
    owner: new mongoose.Types.ObjectId("65a1b2c3d4e5f67890123456")
  },
  {
    title: "Av Lafinur (Zona radio Nacional)",
    category: "mural",
    description: "SOLEDAD PEREIRA: Cuidar la biodiversidad que nos rodea no solo atañe al respeto hacia la fauna y flora sino un cambio de hábitos y pensamientos. El ave naranjero está representado en el boceto. Es una artista misionera. @solepereirasol",
    author: "Soledad Pereira",
    imagePath: "https://mymaps.usercontent.google.com/hostedimage/m/*/3AAjQbR4--icLsJTrIvS-vnVrYVLfYRaLZiJMLhZp5sY06zpJm5bC3NeZ9uvlEGvGOkMl1TZ5eV8gYbrTXN7ICdrOJL15-ogkYYY-S0iSo921cVQ76BDGD3PvJvNxeOlNReesZaGjA0SZznebRsqelu3gp2DNHleliJB_1TVOYQ2CW7tsDEv-VIIrHrMweSuxgMd5f42E1CDuXj38wn8?authuser=0&fife=s16383",
    location: {
      type: "Point",
      coordinates: [-66.345234, -33.307462]
    },
    owner: new mongoose.Types.ObjectId("65a1b2c3d4e5f67890123456")
  },
  {
    title: "Chacabuco y Buenos Aires",
    category: "mural",
    description: "TATY GÓMEZ CONTRERAS: Estuve pintando por San Luis sobre diversidad y género y me gustó pensar el cuerpo como un territorio femenino lleno de herbáceas, un lugar de cuidado recíproco.",
    author: "Taty Gómez Contreras",
    imagePath: "https://mymaps.usercontent.google.com/hostedimage/m/*/3AAjQbR5ZgpYOlnSWGHjm7FjbzrcX9YHIOwAra-S47wUX2sW9hcBglBXXNrg7L9jryt81x3F2UFE5FMZt51ISYYgeCCopnQzlF4HqzqktvbvNEwI5C1ErgPbjwNxjHTz1LM5Gfai-xmJzIjTgrIaWoXH5kqt3P3sLkgI3TQPK7QHWjwosHXQWQhIwPQnL0cT0ijOdvGoYR2ACJ7AWqK4?authuser=0&fife=s16383",
    location: {
      type: "Point",
      coordinates: [-66.336926, -33.311122]
    },
    owner: new mongoose.Types.ObjectId("65a1b2c3d4e5f67890123456")
  },
  {
    title: "Chacabuco y Buenos Aires - Juana Koslay",
    category: "mural",
    description: "COLECTIVO TACUARA ARTE (SOFÍA MORELLINI Y JORGE MAXIMILIANO ARCHIRIA): En nuestro mural queremos representar la figura de Juana Koslay, mujer indígena que es parte de la identidad histórica y cultural de San Luis. @tacuara.arte",
    author: "Colectivo Tacuara Arte",
    imagePath: "https://mymaps.usercontent.google.com/hostedimage/m/*/3AAjQbR47EAukn2B8h7orWgsSxweQ9TN7uVdd9zxCQ5Uy8GlIxpiXXso210M59BOojn210Ghw0wTysxf1FxP1YqIGuh5lQ7IK-74mco64lvlpKGdfGpVqXDV0fEek_SHRhrrlMgTS2lyUcxb6o8W7RNm9ZA0sGyH8Gim02vp3PVGB8QmaMHbkuXQfwbMxdT6nOeK2oUWQwLGUhHGPhlE?authuser=0&fife=s16383",
    location: {
      type: "Point",
      coordinates: [-66.336813, -33.310656]
    },
    owner: new mongoose.Types.ObjectId("65a1b2c3d4e5f67890123456")
  },
  {
    title: "Av. J. D. Perón (antes Belgrano)",
    category: "mural",
    description: "LIDIA ROSANA GÓMEZ: Es la mejor imagen para disfrutar la ternura, pero también su dulce manera de evidenciar la desaparición de un ser tan importante para el equilibrio natural como son las abejas. trabaho@lidiarosanagomez",
    author: "Lidia Rosana Gómez",
    imagePath: "https://mymaps.usercontent.google.com/hostedimage/m/*/3AAjQbR5IyK6OIJYTQo_suuyNxMwHT2NvD1W1FuOgBkuP-a6vIkb2jjZYfQ8OTKdppxVXz58QkB5dJLk1RqQSEhXgelg6StYNCLufbvgpyU2ih3lGQujtYrPYNJQQED9uENLAQyssgB0XV5H_pllHig4--SkOw5ES9yzFDFo_hiEXcOr_cNa83QeeQCm7l2ahKJEt0s6k6cHxVhICknw?authuser=0&fife=s16383",
    location: {
      type: "Point",
      coordinates: [-66.3270698, -33.3021771]
    },
    owner: new mongoose.Types.ObjectId("65a1b2c3d4e5f67890123456")
  },
  {
    title: "Pje. Sta. Isabel y Av. Juan Gilberto Funes",
    category: "mural",
    description: "PAULA GISELA GATICA Y VIVIANA PARENTE: En este proyecto quisieron plasmar la imagen de una mujer lumínica. Mujer soñadora, segura e imponente pero sensible. Ambas comenzaron siendo trabajadoras del Plan de Inclusión.",
    author: "Paula Gisela Gatica y Viviana Parente",
    imagePath: "https://mymaps.usercontent.google.com/hostedimage/m/*/3AAjQbR6Qi-5e7igiziE5A5VHTo1jnTwWsw2q-P_EwR2W2E8MpCDGme0RfoAMq4OyOyx0e8rp2JI_HJq7kwIJLvRF_lyVtMlpDfv2jk0pCxUwK3l8mlg_tO_lIlgi1CwYsgzp3GU0CWsVVpZI_hsv8VRQjyBzBh4ijEpqmFVt6Xrt7gQmG-L2M-2ibYdH90BH86UgN7dt5E2bXvak7QQ?authuser=0&fife=s16383",
    location: {
      type: "Point",
      coordinates: [-66.3253265, -33.3080651]
    },
    owner: new mongoose.Types.ObjectId("65a1b2c3d4e5f67890123456")
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await Marker.insertMany(markers);
    console.log(`Inserted ${result.length} markers successfully`);

    await mongoose.disconnect();
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();
