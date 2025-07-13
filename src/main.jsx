import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Make APIs available globally for debugging
import { userApi } from '@/api/userApi.js'
import { userProfileApi } from '@/api/userProfileApi.js'
import { supabase } from '@/api/supabaseClient.js'

window.userApi = userApi;
window.userProfileApi = userProfileApi;
window.supabase = supabase;

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
) 