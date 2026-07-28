# MIAU — Mapa Interactivo de Arte Urbano

## Tabla de Contenidos

- [Descripcion General](#descripcion-general)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Funcionalidades](#funcionalidades)
- [Contacto](#contacto)
- [Agradecimientos](#agradecimientos)

## Descripcion General

Mapa Interactivo de Arte Urbano (MIAU) es una aplicacion web que permite explorar, documentar y compartir arte urbano (murales, grafitis, esculturas) a traves de un mapa interactivo. Los visitantes pueden navegar el mapa y descubrir obras cercanas, mientras que los usuarios registrados pueden crear marcadores, subir fotos y recibir contribuciones de la comunidad.

El proyecto sigue una arquitectura MERN (MongoDB, Express, React, Node.js) con un enfoque mobile-first y una experiencia centrada en el mapa, donde el contenido geografico nunca se pierde de vista.

## Tecnologias Utilizadas

**Frontend**

- React 18
- Vite
- Tailwind CSS
- Leaflet / react-leaflet
- Zustand
- Axios

**Backend**

- Node.js
- Express 5
- MongoDB + Mongoose 9
- JWT (autenticacion)
- Multer + AWS S3 (carga de imagenes)

**Testing**

- Vitest
- React Testing Library
- Supertest

**Despliegue**

- Render (Web Service + Static Site)
- MongoDB Atlas
- AWS S3

## Funcionalidades

- Mapa interactivo con marcadores geolocalizados de arte urbano.
- Filtrado por categoria, autor y rango de fechas (en el cliente, sin llamadas extra al servidor).
- Registro e inicio de sesion con JWT.
- Creacion, edicion y eliminacion suave de marcadores.
- Carga de imagenes con vista previa y almacenamiento en S3.
- Sistema de contribuciones comunitarias (sugerencias de otros usuarios sobre marcadores existentes).
- Diseno responsive y mobile-first.
- Leyenda de categorias y panel de filtros flotante.

## Contacto

- **Nombre:** Sofia Losowski
- **GitHub:** [github.com/Sowska]
- **Email:** losowskisofia@gmail.com

## Agradecimientos

- [OpenStreetMap](https://www.openstreetmap.org/) por los tiles del mapa.
- [Leaflet](https://leafletjs.com/) por la libreria de mapas interactivos.
- [Render](https://render.com/) por el hosting.
- [MongoDB Atlas](https://www.mongodb.com/atlas) por la base de datos en la nube.
