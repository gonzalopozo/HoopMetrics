# HoopMetrics

HoopMetrics es una plataforma SaaS para el análisis y visualización de estadísticas de la NBA, con dos componentes principales:

* **Frontend**: aplicación Next.js con Tailwind CSS y TypeScript.
* **Backend**: API REST en FastAPI + SQLModel, con base de datos PostgreSQL.

## Características principales

* **Free Tier**: 1 jugador y 1 equipo favorito, estadísticas básicas.
* **Premium Tier**: hasta 3 favoritos,  métricas y gráficos derivadas.
* **Ultimate Tier**: favoritos infinitos,  métricas y gráficos avanzadas.
* **Roles**: Free, Premium, Ultimate y Admin con panel de control.
* **Visualizaciones**: gráficos interactivos con Recharts en frontend y dashboard de administrador.
* **Pagos**: integración Stripe Elements + Payment Intents API.
* **Despliegue**: frontend y backend en Vercel; base de datos y objeto storage en DigitalOcean.

## Tecnologías

* **Frontend**: Next.js, React, TypeScript, Tailwind CSS.
* **Backend**: FastAPI, Python, SQLModel, PostgreSQL, Celery, Redis.
* **Gráficos**: Recharts
* **Autenticación y roles**: Pydantic, JWT
* **Pagos**: Stripe
* **Hosting**: Vercel, DigitalOcean Managed Databases & Spaces