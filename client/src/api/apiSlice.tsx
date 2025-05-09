import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const API_URL = "https://tree-learning-app.alwaysdata.net"

export const apiSlice = createApi({
  reducerPath: 'app_module_api', // nom du createApi
  baseQuery: fetchBaseQuery({ 
    baseUrl: API_URL, // URL de l'application Symfony
    credentials: 'include',  // dans le header passer le token et des cookies
    prepareHeaders: (headers: Headers) => {
      const accessToken = localStorage.getItem('accessToken')
      if (accessToken) {
        // Ajoute l'Authorization header si un access token est présent dans le local storage
        headers.set('Authorization', `Bearer ${accessToken}`)
      }

      console.log(accessToken)

      return headers
    },
  }),
  tagTypes: ['Auth'], // Déclare tous les tags utilisés par l'application, ajouter au fur et à mesure du développement de nouvelles fonctionnalités
  endpoints: () => ({}), // Les endpoints seront définis dans les fichiers API spécifiques
});