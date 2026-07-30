# MIAU — Mapa Interactivo de Arte Urbano

[Pruebe la página AQUI](https://miau-frontend.onrender.com/#/) (puede demorar hasta 50 segundos en cargar información)

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

Las funcionalidades son las comunes en aplicaciones GIS (Geographic Information System):

- Filtros espaciales
- Capas temáticas
- Búsqueda geográfica
- Popups enriquecidos
- Leyendas dinámicas

El dataset se ubtuvo desde Google Maps y fue curado mediante un pipeline de procesamiento en base a scripts.

## Contacto

- **Nombre:** Sofia Losowski
- **GitHub:** [github.com/Sowska](github.com/Sowska)
- **Email:** losowskisofia@gmail.com

## Agradecimientos

- [OpenStreetMap](https://www.openstreetmap.org/)
- [Leaflet](https://leafletjs.com/)
- [Render](https://render.com/)
- [MongoDB Atlas](https://www.mongodb.com/atlas)
